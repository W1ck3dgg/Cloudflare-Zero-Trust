# Research brief

Last reviewed: 2026-10-20

## Executive summary

Cloudflare Zero Trust can provide VPN-like access, but the important difference is the trust model. A traditional VPN commonly places an authenticated device onto a network. Cloudflare's Zero Trust Network Access model can evaluate the user, device posture, requested application, and policy before granting narrowly scoped access.

The proposal is technically credible for reducing device-related access risk, provided that "approved device" is defined and backed by reliable signals. Installing the Cloudflare One Client alone does not prove that a device is corporate-owned or healthy. The design needs an identity source, controlled enrollment, device posture rules, endpoint management or another source of device truth, and an operational process for exceptions and revocation.

The recommended first experiment is a small, reversible PoC for one low-risk internal resource. Full Internet filtering, TLS decryption, Data Loss Prevention, broad SaaS control, and company-wide VPN replacement should remain out of the initial PoC unless discovery identifies one of them as essential.

## What the main components do

| Component | Role in this initiative |
| --- | --- |
| Cloudflare Access | Authenticates a user and evaluates access policy for an application or private resource. |
| Cloudflare One Client (formerly WARP) | Connects a device to Cloudflare, routes selected traffic, and supplies device posture signals. |
| Cloudflare Tunnel (`cloudflared`) | Creates an outbound-only connection from a private environment to Cloudflare; no inbound firewall opening is normally required. |
| Cloudflare Gateway | Applies DNS, network, and HTTP traffic policies. It is useful for Secure Web Gateway controls but is not required for every narrow Access use case. |
| Identity provider (IdP) | Supplies user identity, MFA, and preferably group membership. One-time PIN exists, but an enterprise IdP is the stronger production baseline. |
| Device posture | Tests properties such as OS/version, disk encryption, firewall, certificate, client presence, or data supplied by an endpoint-management/security integration. |

## Two access patterns to distinguish

### 1. Published web application

Cloudflare Access protects a hostname and `cloudflared` connects Cloudflare to the origin. A browser can be sufficient for basic identity-only access. Strong device assurance normally requires the Cloudflare One Client or another supported posture signal.

### 2. Private network access

The Cloudflare One Client routes selected private IPs or hostnames to Cloudflare, and `cloudflared` exposes the relevant private route from the origin network. This is closer to a traditional remote-access VPN and supports non-HTTP services. Gateway network policies can restrict access using identity and posture.

The PoC use case must select one pattern rather than combining both by default.

## Recommended PoC hypothesis

> A named pilot user who authenticates with company MFA from an enrolled device that meets the agreed posture baseline can reach one approved internal resource, while an unenrolled, non-compliant, or unauthorized device cannot.

Suggested starting architecture:

1. Existing enterprise IdP and MFA.
2. Strict enrollment rule limited to a pilot group.
3. Cloudflare One Client in the least invasive mode that supports the chosen test.
4. One `cloudflared` tunnel with a test connector/replica in a non-critical environment.
5. One application or private route.
6. An allow policy requiring both pilot-group identity and defined device posture.
7. Logs, a break-glass/rollback path, and a test matrix that includes expected denial cases.

## Why scope should stay narrow

- **Traffic modes differ materially.** Traffic and DNS mode enables full routing and filtering. Posture-only mode collects posture without routing. Traffic-only and local-proxy modes serve different coexistence needs. The correct choice depends on whether the PoC is testing private access, Internet filtering, or only device assurance.
- **TLS inspection is a separate change.** HTTP policy inspection requires a trusted root certificate and may break certificate-pinned, mTLS, self-signed, ESNI, or ECH traffic. A Do Not Inspect policy restores compatibility but removes HTTP logging/filtering, DLP, and antivirus inspection for that traffic.
- **Policy order matters.** Gateway evaluates policy stages and precedence, with first-match behavior inside a stage and special priority for Do Not Inspect. A broad rule can unintentionally shadow a narrow rule.
- **Posture is not instantaneous.** Cloudflare documents polling/cache delays, and ongoing Gateway sessions are not terminated merely because a later posture check fails. Revocation expectations must be tested rather than assumed.
- **Client support has boundaries.** Supported OS versions and hardware requirements change. Windows 11, current supported macOS, and supported Linux distributions are safer pilot choices than legacy or server operating systems.
- **Logs are plan-dependent.** Cloudflare's current documentation lists 24-hour Access, DNS, network, and HTTP log retention on the Free plan, while device posture logs are retained for 30 days. The evaluation window and evidence collection must account for this.
- **Public repository risk.** Architecture material can reveal attack surface. This repository should contain reusable, redacted documentation only; tenant-specific configuration and secrets need a private operational location.

## Benefits to validate

- application-level least privilege instead of broad network access;
- identity, MFA, and device posture evaluated together;
- outbound-only origin connectivity with `cloudflared`;
- faster removal of access through IdP groups and device enrollment controls;
- clearer access and posture audit evidence;
- reduced exposure of internal services to the public Internet;
- acceptable user experience and latency compared with the current approach.

## Risks and questions to validate

| Risk or unknown | Why it matters | Validation approach |
| --- | --- | --- |
| "Approved device" has no authoritative definition | Enrollment alone could allow personal or unmanaged devices. | Agree ownership/compliance criteria and identify MDM/EDR/certificate source. |
| Identity lifecycle is incomplete | Disabled or departed users could retain unintended paths. | Test group removal, account disablement, session duration, and revocation. |
| Split tunnel or DNS conflict | Existing VPN, internal DNS, local subnets, or security tools may conflict. | Inventory routes/DNS/VPN software and test from office, home, and mobile networks. |
| Client failure blocks work | Routing software becomes a dependency. | Define emergency disable/bypass, support owner, and rollback time objective. |
| Connector is a single point of failure | A single `cloudflared` instance can interrupt access. | Use a non-critical target for the PoC and design replicas before production. |
| Inspection affects privacy or applications | TLS inspection changes visibility and trust behavior. | Exclude it from the first PoC unless essential; perform privacy/legal review before enabling. |
| Licensing or retention is insufficient | The PoC may rely on features or evidence unavailable on the intended plan. | Confirm entitlements in the actual tenant and obtain current written pricing before production recommendation. |
| Administrators are over-privileged | A control-plane compromise could change access policy. | Require SSO/MFA, least-privilege roles, change review, and audit logging. |

## Preliminary conclusion

Proceed to structured discovery. If the organization can name an authoritative IdP, define an approved-device baseline, select one low-risk resource, provide a test connector location, and accept a reversible pilot, the idea is suitable for a PoC. If device ownership cannot be established or no operational owner is available, the PoC should pause because it would not prove the stated security objective.

## Primary sources

All sources were checked on 2026-10-20.

- [Cloudflare: Replace your VPN learning path](https://developers.cloudflare.com/learning-paths/replace-vpn/concepts/)
- [Cloudflare: Designing ZTNA access policies](https://developers.cloudflare.com/reference-architecture/design-guides/designing-ztna-access-policies/)
- [Cloudflare: First-time Cloudflare One Client setup](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/set-up/)
- [Cloudflare: Client modes](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/configure/modes/)
- [Cloudflare: Device enrollment permissions](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/deployment/device-enrollment/)
- [Cloudflare: Device posture checks](https://developers.cloudflare.com/cloudflare-one/reusable-components/posture-checks/)
- [Cloudflare: Private networks](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/private-net/)
- [Cloudflare: TLS decryption](https://developers.cloudflare.com/cloudflare-one/traffic-controls/http-policies/tls-decryption/)
- [Cloudflare: Zero Trust logs and retention](https://developers.cloudflare.com/cloudflare-one/insights/logs/)
- [Cloudflare: Cloudflare One Client lifecycle and OS support](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/download/support-lifecycle/)
- [Cloudflare: Account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/)
- [Cloudflare: Zero Trust and SASE plans](https://www.cloudflare.com/plans/zero-trust-services/)

