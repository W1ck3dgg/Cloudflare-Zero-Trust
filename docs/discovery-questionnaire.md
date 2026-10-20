# Discovery questionnaire

Use this in the first working session with Walter and the relevant IT/security owners. Answers can be recorded in a private working document if they reveal internal systems, identities, or network details.

## Outcome and sponsorship

1. Which concrete risk or incident is driving the initiative?
2. Is the primary goal private application access, whole-network VPN replacement, Internet filtering, or device compliance enforcement?
3. What result would make Walter say the PoC was worthwhile?
4. Who owns the final go/no-go decision, budget, security review, and operational service?
5. What is the desired decision date, without treating this as urgent production work?

## Users and identity

1. How many total users and how many pilot users are expected?
2. Which users are employees, contractors, administrators, or third parties?
3. Which IdP is authoritative (for example Microsoft Entra ID, Okta, or Google Workspace)?
4. Is MFA enforced? Which methods are allowed?
5. Are access groups already maintained in the IdP?
6. How quickly are leavers disabled and group changes propagated?
7. Is SCIM or another automated lifecycle mechanism available?
8. What emergency/break-glass identity is permitted and how is its use reviewed?

## Devices

1. Are devices corporate-owned, BYOD, or mixed?
2. Which Windows, macOS, Linux, iOS, Android, and ChromeOS versions are present?
3. Which MDM/UEM and EDR products are authoritative?
4. Can IT deploy the client and certificates centrally?
5. What defines a compliant device: encryption, firewall, supported OS, patch age, EDR health, certificate, serial number, or another signal?
6. Can users uninstall, disconnect, or leave the organization in the client?
7. Are local administrator rights common?
8. Which existing VPN, DNS, proxy, firewall, or endpoint networking agents may conflict?

## Target resource and network

1. Which single low-risk application/service is the best pilot candidate?
2. Is it HTTP/S or a private protocol such as SSH, RDP, database, or SMB?
3. Where is it hosted and who owns it?
4. What data classification applies?
5. What private hostname/IP, port, and dependent services are required?
6. Can a `cloudflared` connector run near the resource, and on which supported platform?
7. Are redundant connector hosts available later?
8. Are there overlapping private IP ranges, private DNS zones, fixed source-IP allowlists, or routing constraints?
9. Must the current VPN coexist during evaluation?

## Policy, logging, and privacy

1. What should be explicitly allowed and explicitly denied?
2. What session lifetime and re-authentication behavior are acceptable?
3. How quickly must user/device revocation take effect?
4. Which logs must be retained, for how long, and in which SIEM?
5. Who may view device posture and traffic metadata?
6. Is TLS decryption prohibited, allowed after review, or desired? (Recommended initial answer: out of scope.)
7. Are there GDPR, works-council, customer-contract, or other monitoring constraints?
8. Which admin roles need read, policy-write, device-management, and tunnel-management permissions?

## Operations and resilience

1. Who supports enrollment and access failures?
2. What hours and response target apply?
3. What is the rollback/recovery time objective?
4. How will users report problems if access is blocked?
5. Which office/home/mobile network conditions must be tested?
6. How will client and connector updates be managed?
7. What happens if Cloudflare, the IdP, the client, or the tunnel is unavailable?
8. Who reviews policy changes and audit logs?

## Commercial and governance

1. Does a Cloudflare account and Zero Trust organization already exist?
2. Which plan and entitlements are active in the actual tenant?
3. Are required features included for both PoC and expected production scale?
4. What current VPN/licensing cost could be displaced?
5. Does procurement require a data-processing agreement, security assessment, or vendor review?
6. Where will private configuration, secrets, and environment diagrams be stored?

