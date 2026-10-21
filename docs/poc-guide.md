# Our first working experiment

We are using a harmless sample web page to learn how Cloudflare protects access. It contains no company data.

The experiment asks: **can an approved person open this page from an approved device, while another person or device is blocked?**

## What is ready

- A sample app that runs on this computer at `http://127.0.0.1:8787`.
- An introduction page explaining the experiment.
- A protected page that stays locked until real Cloudflare settings are connected.
- Verification of Cloudflare's signed login tokens, including their signature, issuer, expiry, and intended application.
- Reusable configuration for one Cloudflare Access application, one tunnel, one test address, exact test users, MFA, and device checks.
- Automated checks for forged/expired logins and unsafe configuration.
- A live test checklist for the tests that must be done using real accounts and devices.

## What we do next

1. Review **Zero Trust Free** activation with the sponsor. The account is created; billing/overage authorization was deferred at the user's request. No activation should be assumed.
2. Agree a test address. Do not change the company's domain nameservers for this experiment. The included configuration expects an existing active Cloudflare DNS zone and one unused subdomain; if none is available, choose another test-hosting route before deploying.
3. Connect Google as the login provider and allow only the named testers.
4. Enroll the test devices and choose the device check, initially a specific lab-device inventory or existing management compliance signal.
5. Connect the demo to Cloudflare and try opening the test address.

We can recreate the configuration in a company Cloudflare account later. That requires new account-specific values, Google integration, tunnel credentials, and device registrations; switching is not an automatic account merge.

## Try the local page

From the project folder, with Node.js 22.14+ and pnpm available:

```powershell
pnpm install --frozen-lockfile
pnpm start
```

Open `http://127.0.0.1:8787`. Click **Try opening the protected page**. Until Cloudflare is connected, the correct result is **Cloudflare is not connected yet**.

This is useful progress, but it does not yet prove Google sign-in, MFA, or device approval. Those need the real tests in [the live checklist](poc-test-checklist.md).

Technical setup is recorded in the [operator runbook](poc-runbook.md), so you do not need to memorize it.
