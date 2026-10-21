import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import { customFetch, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createAccessVerifier, readConfig } from './access.mjs';
import { createApp } from './server.mjs';

const access = { teamDomain: 'https://test-team.cloudflareaccess.com', audience: 'a'.repeat(64) };
let privateKey, otherKey, jwksOptions, verifier, server, base, preview, previewBase;
const logs = [];

async function token({ key = privateKey, issuer = access.teamDomain, audience = access.audience, expires = '5m', issuedAt, claims = {}, algorithm = 'RS256' } = {}) {
  let jwt = new SignJWT({ email: 'tester@example.com', ...claims })
    .setProtectedHeader({ alg: algorithm, kid: 'test-key' })
    .setIssuer(issuer).setAudience(audience).setSubject('test-user')
    .setIssuedAt(issuedAt).setExpirationTime(expires);
  return jwt.sign(key);
}

before(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true });
  privateKey = pair.privateKey;
  const publicJwk = await exportJWK(pair.publicKey);
  ({ privateKey: otherKey } = await generateKeyPair('RS256'));
  jwksOptions = {
    [customFetch]: async (url) => {
      assert.equal(String(url), `${access.teamDomain}/cdn-cgi/access/certs`);
      return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: 'test-key', alg: 'RS256', use: 'sig' }] }), {
        headers: { 'content-type': 'application/json' },
      });
    },
  };
  verifier = createAccessVerifier(access, jwksOptions);
  server = createApp({ config: { access }, jwksOptions, logger: (entry) => logs.push(entry) });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  preview = createApp({ config: { access: null }, logger: () => {} });
  preview.listen(0, '127.0.0.1');
  await once(preview, 'listening');
  previewBase = `http://127.0.0.1:${preview.address().port}`;
});

after(async () => {
  await Promise.all([server, preview].filter(Boolean).map((app) => new Promise((resolve) => app.close(resolve))));
});

test('preview is loopback-only and the sample resource stays locked', async () => {
  assert.equal(preview.address().address, '127.0.0.1');
  const home = await fetch(previewBase);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Cloudflare is not connected yet/);
  const protectedPage = await fetch(`${previewBase}/protected`);
  assert.equal(protectedPage.status, 503);
  assert.doesNotMatch(await protectedPage.text(), /Project notebook/);
});

test('configuration rejects partial settings, non-Cloudflare issuers, paths, and invalid ports', () => {
  assert.equal(readConfig({}).access, null);
  assert.throws(() => readConfig({ ACCESS_TEAM_DOMAIN: access.teamDomain }), /ACCESS_AUD/);
  assert.throws(() => readConfig({ ACCESS_AUD: access.audience }), /ACCESS_TEAM_DOMAIN/);
  for (const domain of ['http://test-team.cloudflareaccess.com', 'https://localhost', `${access.teamDomain}/attacker`, `${access.teamDomain}.example.com`]) {
    assert.throws(() => readConfig({ ACCESS_TEAM_DOMAIN: domain, ACCESS_AUD: access.audience }));
  }
  for (const port of ['0', '65536', 'NaN', '1.5']) assert.throws(() => readConfig({ PORT: port }));
});

test('a genuine RSA signature for the configured issuer and audience is accepted', async () => {
  assert.equal((await verifier(await token())).sub, 'test-user');
  const response = await fetch(`${base}/protected`, { headers: { 'cf-access-jwt-assertion': await token() } });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Project notebook/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('forged signatures, wrong issuer/audience, expired and future tokens are rejected', async () => {
  const now = Math.floor(Date.now() / 1000);
  for (const options of [
    { key: otherKey }, { issuer: 'https://attacker.cloudflareaccess.com' },
    { audience: 'b'.repeat(64) }, { expires: now - 30 },
    { issuedAt: now + 300 }, { claims: { nbf: now + 300 } },
    { issuedAt: now - 3700, expires: now + 60 },
  ]) {
    const jwt = await token(options);
    await assert.rejects(verifier(jwt));
    const response = await fetch(`${base}/protected`, { headers: { 'cf-access-jwt-assertion': jwt } });
    assert.equal(response.status, 403);
    assert.doesNotMatch(await response.text(), /Project notebook/);
  }
});

test('unsigned and malformed tokens never grant access', async () => {
  const unsigned = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ iss: access.teamDomain, aud: [access.audience], sub: 'attacker', exp: 9999999999 })).toString('base64url')}.`;
  for (const jwt of ['bad-token', unsigned, 'x'.repeat(16385)]) await assert.rejects(verifier(jwt));
});

test('missing expiry is rejected even with a valid signature', async () => {
  const jwt = await new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(access.teamDomain).setAudience(access.audience).setSubject('test-user').setIssuedAt().sign(privateKey);
  await assert.rejects(verifier(jwt));
});

test('spoofed email, posture, cookie, or forwarding headers do not authenticate', async () => {
  const response = await fetch(`${base}/protected?email=tester@example.com`, { headers: {
    'cf-access-authenticated-user-email': 'tester@example.com',
    'x-device-posture': 'passed', 'x-forwarded-for': '127.0.0.1',
    cookie: 'CF_Authorization=forged',
  } });
  assert.equal(response.status, 403);
});

test('JWKS network failure fails closed', async () => {
  const unavailable = createAccessVerifier(access, { [customFetch]: async () => { throw new Error('offline'); } });
  await assert.rejects(unavailable(await token()));
});

test('HEAD checks authentication and unsupported methods fail', async () => {
  const head = await fetch(`${base}/protected`, { method: 'HEAD' });
  assert.equal(head.status, 403);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(`${base}/protected`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
});

test('logs never include tokens, email addresses, query strings, or headers', async () => {
  const secretToken = await token();
  await fetch(`${base}/protected?private=value`, { headers: { 'cf-access-jwt-assertion': secretToken } });
  const output = logs.join('\n');
  for (const secret of [secretToken, 'tester@example.com', 'private=value', 'cf-access-jwt-assertion']) {
    assert.equal(output.includes(secret), false);
  }
});
