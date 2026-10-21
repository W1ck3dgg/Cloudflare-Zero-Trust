variable "account_id" {
  description = "Cloudflare account for the isolated lab."
  type        = string
  validation {
    condition     = can(regex("^[a-f0-9]{32}$", var.account_id))
    error_message = "Use the 32-character Cloudflare account ID."
  }
}

variable "zone_id" {
  description = "An existing active DNS zone in this account; no nameserver changes are performed."
  type        = string
  validation {
    condition     = can(regex("^[a-f0-9]{32}$", var.zone_id))
    error_message = "Use the 32-character ID of an existing active zone."
  }
}

variable "team_name" {
  description = "The existing Zero Trust team slug, without .cloudflareaccess.com."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$", var.team_name))
    error_message = "Use the existing team slug, not a URL."
  }
}

variable "hostname" {
  description = "One unused first-level subdomain in the active zone, for example zt-lab.example.com."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?){2,}$", var.hostname))
    error_message = "Use one hostname without a wildcard, scheme, port, or path."
  }
}

variable "google_identity_provider_id" {
  description = "An existing Google or Google Workspace login integration in this Cloudflare account."
  type        = string
  validation {
    condition     = can(regex("^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$", var.google_identity_provider_id))
    error_message = "Use the UUID of the Google login integration in Cloudflare."
  }
}

variable "pilot_emails" {
  description = "Exact work email addresses for one to ten testers. No domain-wide allow rule."
  type        = set(string)
  validation {
    condition     = length(var.pilot_emails) >= 1 && length(var.pilot_emails) <= 10 && alltrue([for email in var.pilot_emails : can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", email)) && !strcontains(email, "*")])
    error_message = "Supply between one and ten exact email addresses."
  }
}

variable "approved_device_posture_rule_id" {
  description = "Existing managed-device check, such as MDM compliance or a lab device serial-number allowlist. Client enrollment or OS alone is insufficient."
  type        = string
  validation {
    condition     = can(regex("^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$", var.approved_device_posture_rule_id))
    error_message = "A real approved-device posture rule UUID is mandatory."
  }
}
