# Action plan

The isolated lab implementation began on 2026-10-21 at the user's request. It uses a sample application rather than a company system. Discovery and design approval remain prerequisites for a company-connected pilot.

## Phase 0 — Research and initial scope (initial material complete)

**Purpose:** build shared understanding and frame the decision.

Deliverables:

- research brief;
- draft requirements and explicit exclusions;
- stakeholder discovery questionnaire;
- phased plan and PoC gates;
- public-repository safety rules.

Exit gate:

- Walter and Presiyan review the brief and agree that the working goal is accurate.

## Phase 1 — Environment and stakeholder discovery

**Purpose:** replace assumptions with facts about users, devices, identity, applications, networks, operations, privacy, and licensing.

Actions:

1. Run a 60–90 minute discovery session with sponsor, identity, endpoint, network, security, privacy, and application owners.
2. Inventory the current remote-access path and its main pain points.
3. Identify the authoritative IdP, pilot group, MDM/EDR, supported device set, and device-compliance baseline.
4. Select one low-risk resource and document only the minimum dependencies it needs.
5. Identify DNS, route, existing-VPN, endpoint-agent, and source-IP allowlist constraints.
6. Confirm Cloudflare tenant ownership, plan/entitlements, log retention, and indicative production pricing.
7. Decide where private artifacts and secrets will live; keep this repository redacted.

Deliverables:

- completed requirements with named owners;
- current-state access/data-flow diagram in an appropriately private location;
- risk and dependency register;
- candidate resource and pilot-user decision;
- commercial/entitlement note.

Exit gate:

- all PoC entry criteria in `requirements.md` are satisfied or explicitly waived by the accountable owner.

## Phase 2 — PoC design and approval

**Purpose:** define a reversible experiment before touching the environment.

Actions:

1. Choose published-application or private-network access.
2. Select the least invasive Cloudflare One Client mode that can prove the hypothesis.
3. Define enrollment policy, IdP groups, posture checks, application/route, Access/Gateway policies, session duration, and admin roles.
4. Design the `cloudflared` connector placement and production high-availability path.
5. Write positive, negative, resilience, revocation, privacy, and rollback tests.
6. Agree success thresholds for latency, reliability, revocation, support effort, and user satisfaction.
7. Perform security/privacy change review and schedule the pilot window.

Deliverables:

- target architecture and data-flow diagram;
- policy matrix;
- implementation runbook;
- test and evidence plan;
- communications/support plan;
- rollback runbook;
- approved change record.

Exit gate:

- sponsor, technical owner, security reviewer, app owner, and operations owner approve implementation.

## Phase 3 — PoC implementation (local lab started)

Implemented: local demo application, signed Access-token validation, automated security tests, reusable Terraform configuration, mocked infrastructure tests, and a setup/test/rollback runbook. Pending: live account setup, an appropriate hostname, Google login integration, pilot enrollment, approved-device posture, and real user/device tests. See [the PoC guide](poc-guide.md).

**Purpose:** configure only what the approved experiment requires.

Suggested sequence:

1. Establish the Zero Trust organization and secure administrator access.
2. Integrate the IdP and create/verify the pilot group.
3. Configure strict device enrollment permissions.
4. Create device profile and posture checks; verify posture results before enforcing them.
5. Deploy a test `cloudflared` connector and the single application/private route.
6. Create narrowly scoped policies in audit/limited mode where available.
7. Enroll one technical tester, validate connectivity, then add the remaining pilot users.
8. Execute the test matrix and capture time-bounded evidence.
9. Invoke and verify rollback at least once.

Guardrails:

- no production-critical target;
- no full-company enrollment rule;
- no broad private CIDR when one host/application is sufficient;
- no TLS decryption unless separately approved;
- no removal of the existing VPN;
- no secrets or tenant-specific sensitive identifiers in the public repository.

## Phase 4 — Evaluation and recommendation

**Purpose:** decide based on evidence rather than a successful demo.

Actions:

1. Compare test results with agreed success criteria.
2. Review denial quality, revocation timing, logs, support tickets, latency, reliability, and user feedback.
3. Record compatibility gaps and any policy exceptions.
4. Model production architecture, staffing, licensing, migration, and residual risks.
5. Recommend one of: stop, revise and retest, limited production adoption, or phased rollout.

Deliverables:

- PoC results report;
- risk/exception register;
- total-cost and operational-impact summary;
- go/no-go recommendation.

## Phase 5 — Production planning (only after a go decision)

**Purpose:** turn a proven pilot into a managed service.

Key workstreams:

- redundant connectors and failure testing;
- least-privilege administrator roles and change control;
- managed client deployment and update rings;
- formal onboarding/offboarding and device revocation;
- SIEM/log retention and monitoring;
- help-desk runbooks and user communications;
- application migration waves with rollback;
- coexistence and eventual legacy-VPN retirement criteria;
- infrastructure as code in a private operational repository where appropriate.

## Immediate next meeting

Agenda (60 minutes):

1. Confirm the business problem and desired decision (10 min).
2. Choose the likely first access use case (10 min).
3. Review identity and device-management reality (15 min).
4. Select a candidate resource and pilot group (10 min).
5. Assign owners for network, security/privacy, operations, and commercial checks (10 min).
6. Agree outstanding actions and the Phase 1 exit gate (5 min).

