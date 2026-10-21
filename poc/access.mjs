import { createRemoteJWKSet, jwtVerify } from 'jose';

export function readConfig(env = process.env) {
  const port = Number(env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const teamDomain = (env.ACCESS_TEAM_DOMAIN || '').trim().replace(/\/$/, '');
  const audience = (env.ACCESS_AUD || '').trim();
  if (!teamDomain && !audience) return { port, access: null };
  if (!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/.test(teamDomain)) {
    throw new Error('ACCESS_TEAM_DOMAIN must be https://your-team.cloudflareaccess.com.');
  }
  if (!/^[a-f0-9]{64}$/.test(audience)) {
    throw new Error('ACCESS_AUD must be the 64-character Access application audience tag.');
  }
  return { port, access: { teamDomain, audience } };
}

export function createAccessVerifier(access, jwksOptions = {}) {
  if (!access) return null;
  // The key URL comes from validated configuration, never from the token.
  const keys = createRemoteJWKSet(
    new URL(`${access.teamDomain}/cdn-cgi/access/certs`),
    { timeoutDuration: 5000, ...jwksOptions },
  );
  return async function verifyAccessToken(token) {
    if (typeof token !== 'string' || token.length > 16384) {
      throw new Error('Missing or oversized Access token.');
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer: access.teamDomain,
      audience: access.audience,
      algorithms: ['RS256'],
      requiredClaims: ['iss', 'aud', 'exp', 'iat', 'sub'],
      maxTokenAge: '1h',
      clockTolerance: 5,
    });
    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error('Missing user identity.');
    }
    return payload;
  };
}
