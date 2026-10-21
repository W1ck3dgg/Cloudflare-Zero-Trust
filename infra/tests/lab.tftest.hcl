# These use a mocked provider: no Cloudflare account, token or API requests are used.
mock_provider "cloudflare" {
  mock_data "cloudflare_zone" {
    defaults = {
      name    = "example.com"
      status  = "active"
      account = { id = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }
    }
  }
  mock_data "cloudflare_zero_trust_device_posture_rule" {
    defaults = { type = "intune", enabled = true }
  }
}

variables {
  account_id                      = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  zone_id                         = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  team_name                       = "test-team"
  hostname                        = "zt-lab.example.com"
  google_identity_provider_id     = "11111111-1111-4111-8111-111111111111"
  pilot_emails                    = ["tester@example.com"]
  approved_device_posture_rule_id = "22222222-2222-4222-8222-222222222222"
}

run "access_requires_identity_device_and_mfa" {
  command = apply

  assert {
    condition     = cloudflare_zero_trust_access_policy.pilot.decision == "allow" && length(cloudflare_zero_trust_access_policy.pilot.include) == 1 && length(cloudflare_zero_trust_access_policy.pilot.require) == 3
    error_message = "Only named users satisfying all three Require rules may pass."
  }
  assert {
    condition     = cloudflare_zero_trust_access_policy.pilot.mfa_config.mfa_disabled == false
    error_message = "MFA must remain enabled for the pilot policy."
  }
  assert {
    condition     = cloudflare_zero_trust_access_application.lab.allow_authenticate_via_warp == false && length(cloudflare_zero_trust_access_application.lab.allowed_idps) == 1
    error_message = "Work login cannot be bypassed using WARP authentication."
  }
  assert {
    condition     = cloudflare_zero_trust_tunnel_cloudflared_config.lab.config.ingress[0].origin_request.access.required == true && cloudflare_zero_trust_tunnel_cloudflared_config.lab.config.ingress[1].service == "http_status:404"
    error_message = "The connector must require Access and reject unmatched ingress."
  }
  assert {
    condition     = cloudflare_zero_trust_tunnel_cloudflared_config.lab.config.ingress[0].service == "http://127.0.0.1:8787" && cloudflare_dns_record.lab.proxied == true
    error_message = "Only the local sample app may be exposed through the proxied lab hostname."
  }
}

run "reject_domain_wide_email_rule" {
  command = plan
  variables { pilot_emails = ["*@example.com"] }
  expect_failures = [var.pilot_emails]
}

run "reject_missing_device_requirement" {
  command = plan
  variables { approved_device_posture_rule_id = "" }
  expect_failures = [var.approved_device_posture_rule_id]
}

run "reject_client_presence_as_device_approval" {
  command = plan
  override_data {
    target = data.cloudflare_zero_trust_device_posture_rule.approved_device
    values = { type = "warp", enabled = true }
  }
  expect_failures = [cloudflare_zero_trust_access_policy.pilot]
}

run "reject_unrelated_or_multilevel_hostname" {
  command = plan
  variables { hostname = "zt-lab.other.example.com" }
  expect_failures = [cloudflare_zero_trust_access_application.lab]
}
