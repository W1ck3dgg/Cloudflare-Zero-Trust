output "test_url" {
  description = "Public lab address; all paths are protected by Access."
  value       = "https://${var.hostname}"
}

output "access_team_domain" {
  description = "Copy into ACCESS_TEAM_DOMAIN in the ignored poc/.env file."
  value       = "https://${var.team_name}.cloudflareaccess.com"
}

output "access_audience" {
  description = "Copy into ACCESS_AUD in the ignored poc/.env file."
  value       = cloudflare_zero_trust_access_application.lab.aud
}

output "tunnel_id" {
  description = "Retrieve the connector token for this tunnel in the Cloudflare dashboard. Tokens are deliberately not output or read into Terraform state."
  value       = cloudflare_zero_trust_tunnel_cloudflared.lab.id
}
