# Cloudflare Zero Trust Initiative

Research and planning repository for evaluating Cloudflare Zero Trust as a controlled-access, VPN-style solution for company systems.

## Status

**Phase 0 — research and requirements discovery.** No production configuration has been changed, and the proof of concept (PoC) has not started.

The working recommendation is to evaluate a deliberately small Zero Trust Network Access (ZTNA) pilot:

- a small pilot group;
- company-approved devices;
- the existing identity provider and MFA;
- one low-risk internal application or private service;
- explicit device posture requirements;
- documented rollback and support procedures.

This lets us test the core proposition — only an approved user on an approved, healthy device can reach a protected resource — without attempting a company-wide VPN replacement or full Secure Access Service Edge (SASE) deployment.

## Project documents

- [Research brief](docs/research.md) — plain-language explanation, findings, constraints, and recommendation.
- [Requirements scope](docs/requirements.md) — objectives, functional and non-functional requirements, boundaries, and acceptance criteria.
- [Discovery questionnaire](docs/discovery-questionnaire.md) — information to collect from Walter, IT, security, and application owners.
- [Action plan](docs/action-plan.md) — phase gates from discovery through a later PoC and rollout decision.

## Proposed decision path

1. Validate the problem and current environment.
2. Agree the pilot use case, participants, data handling, and success measures.
3. Review architecture, privacy, licensing, operational ownership, and rollback.
4. Approve a written PoC design.
5. Only then implement and evaluate the PoC.

## Repository safety

This is intended to be a public repository. Do not commit:

- API tokens, service tokens, tunnel credentials, certificates, or private keys;
- Cloudflare account IDs, tunnel IDs, team names, internal domains, IP ranges, hostnames, or network diagrams that expose the environment;
- user/device exports, logs, screenshots, email addresses, or other personal data;
- Terraform state, local variable files, `.env` files, or generated diagnostic bundles.

Use redacted examples and placeholders such as `<ACCOUNT_ID>` and `app.internal.example` in public documentation. Store operational secrets in an approved secrets manager.

## Ownership

- Proposition: Walter Heck
- Research and PoC lead: Presiyan Penev
- IT/security, identity, network, endpoint, privacy, and application owners: to be confirmed during discovery

## Licensing

No open-source license has been selected. Public visibility does not by itself grant permission to reuse the repository's contents.

