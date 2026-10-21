data "cloudflare_zone" "lab" {
  zone_id = var.zone_id
}

data "cloudflare_zero_trust_device_posture_rule" "approved_device" {
  account_id = var.account_id
  rule_id    = var.approved_device_posture_rule_id
}

resource "cloudflare_zero_trust_device_posture_rule" "gateway" {
  account_id  = var.account_id
  name        = "zt-lab-require-gateway"
  type        = "gateway"
  description = "Require this account's Cloudflare One Client connection for the lab."
}

resource "cloudflare_zero_trust_access_policy" "pilot" {
  account_id       = var.account_id
  name             = "zt-lab-approved-users-and-devices"
  decision         = "allow"
  session_duration = "1h"
  include          = [for email in sort(tolist(var.pilot_emails)) : { email = { email = email } }]
  require = [
    { login_method = { id = var.google_identity_provider_id } },
    { device_posture = { integration_uid = cloudflare_zero_trust_device_posture_rule.gateway.id } },
    { device_posture = { integration_uid = var.approved_device_posture_rule_id } }
  ]
  # Independent MFA must first be enabled in the lab organization.
  # This policy's MFA settings do not alter organization-wide defaults.
  mfa_config = {
    allowed_authenticators = ["totp", "security_key"]
    mfa_disabled           = false
    session_duration       = "1h"
  }
  lifecycle {
    precondition {
      condition = data.cloudflare_zero_trust_device_posture_rule.approved_device.enabled == true && contains(
        ["serial_number", "client_certificate", "client_certificate_v2", "intune", "workspace_one", "unique_client_id"],
        data.cloudflare_zero_trust_device_posture_rule.approved_device.type
      )
      error_message = "Use an enabled device-inventory, managed-certificate or MDM check. WARP, Gateway and OS checks alone cannot stand in for device approval."
    }
  }
}

resource "cloudflare_zero_trust_access_application" "lab" {
  account_id                  = var.account_id
  name                        = "Zero Trust lab"
  type                        = "self_hosted"
  domain                      = var.hostname
  session_duration            = "1h"
  allowed_idps                = [var.google_identity_provider_id]
  auto_redirect_to_identity   = true
  allow_authenticate_via_warp = false
  http_only_cookie_attribute  = true
  same_site_cookie_attribute  = "lax"
  app_launcher_visible        = true
  policies = [{
    id         = cloudflare_zero_trust_access_policy.pilot.id
    precedence = 1
  }]
  lifecycle {
    precondition {
      condition     = data.cloudflare_zone.lab.status == "active" && data.cloudflare_zone.lab.account.id == var.account_id && endswith(var.hostname, ".${data.cloudflare_zone.lab.name}") && length(split(".", var.hostname)) == length(split(".", data.cloudflare_zone.lab.name)) + 1
      error_message = "The hostname must be an unused first-level subdomain of an active DNS zone owned by the selected account."
    }
  }
}

resource "cloudflare_zero_trust_tunnel_cloudflared" "lab" {
  account_id = var.account_id
  name       = "zt-lab-demo"
  config_src = "cloudflare"
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "lab" {
  account_id = var.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.lab.id
  config = {
    ingress = [
      {
        hostname = var.hostname
        service  = "http://127.0.0.1:8787"
        origin_request = {
          access = {
            required  = true
            team_name = var.team_name
            aud_tag   = [cloudflare_zero_trust_access_application.lab.aud]
          }
        }
      },
      { service = "http_status:404" }
    ]
  }
}

# Publish only after the Access policy and token-verifying tunnel configuration exist.
resource "cloudflare_dns_record" "lab" {
  zone_id = var.zone_id
  name    = var.hostname
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.lab.id}.cfargotunnel.com"
  proxied = true
  ttl     = 1
  comment = "Isolated Zero Trust PoC; sample content only."
  depends_on = [
    cloudflare_zero_trust_access_application.lab,
    cloudflare_zero_trust_tunnel_cloudflared_config.lab
  ]
}
