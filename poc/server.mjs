import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createAccessVerifier, readConfig } from './access.mjs';

const stylesheet = await readFile(new URL('./style.css', import.meta.url), 'utf8');

function page(title, content, state = 'pending') {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | Zero Trust lab</title><link rel="stylesheet" href="/style.css"></head>
<body><main><header><a href="/" class="brand">ZERO TRUST / LAB 01</a><span class="tag">Proof of concept</span></header>
<section class="card ${state}"><p class="eyebrow">Cloudflare Zero Trust initiative</p><h1>${title}</h1>${content}</section>
<footer>Sample content only. Device approval is enforced by Cloudflare policy and must be tested on real devices.</footer>
</main></body></html>`;
}

export function createApp({ config = readConfig(), logger = console.log, jwksOptions } = {}) {
  const verifyAccessToken = createAccessVerifier(config.access, jwksOptions);
  return createServer({ maxHeaderSize: 24576, requestTimeout: 10000, headersTimeout: 10000 }, async (req, res) => {
    const id = randomUUID();
    let route = 'unknown';
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    res.setHeader('X-Request-ID', id);
    res.on('finish', () => logger(JSON.stringify({ id, method: req.method, route, status: res.statusCode })));
    function send(status, body, type = 'text/html; charset=utf-8') {
      res.writeHead(status, { 'Content-Type': type });
      res.end(req.method === 'HEAD' ? undefined : body);
    }
    try {
      // Use a constant base instead of trusting Host or forwarding headers.
      const path = new URL(req.url, 'http://127.0.0.1').pathname;
      route = ['/', '/protected', '/healthz', '/style.css'].includes(path) ? path : 'unknown';
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.setHeader('Allow', 'GET, HEAD');
        return send(405, 'Method not allowed.', 'text/plain; charset=utf-8');
      }
      if (path === '/healthz') return send(200, '{"status":"ok"}', 'application/json');
      if (path === '/style.css') return send(200, stylesheet, 'text/css; charset=utf-8');
      if (path === '/') {
        return send(200, page('A small experiment in safer access.', `
<p class="lead">This is our sample company tool. The experiment is to let the right person in, on an approved device.</p>
<ol><li><strong>Who are you?</strong><span>Sign in with your work Google account.</span></li>
<li><strong>Is this an approved device?</strong><span>Cloudflare checks the device rules we choose.</span></li>
<li><strong>Can you open the page?</strong><span>Only a successful check should unlock the sample resource.</span></li></ol>
<p class="notice">${config.access ? 'Cloudflare settings are loaded. Use the public test address to perform the real login and device tests.' : 'Local demo is running. Cloudflare is not connected yet, so the sample resource stays locked.'}</p>
<a class="button" href="/protected">Try opening the protected page <span aria-hidden="true">&rarr;</span></a>`));
      }
      if (path !== '/protected') return send(404, 'Not found.', 'text/plain; charset=utf-8');
      if (!verifyAccessToken) {
        return send(503, page('Cloudflare is not connected yet.', '<p class="lead">The demo works, but the protected page is locked until the Cloudflare account and application settings are connected.</p><a class="button" href="/">Back to the experiment</a>'));
      }
      try {
        // Email, cookies, forwarded headers and client-supplied posture are not authentication.
        await verifyAccessToken(req.headers['cf-access-jwt-assertion']);
      } catch {
        return send(403, page('Access denied.', '<p class="lead">This request does not contain a valid login token for this application. Open the public test address and sign in through Cloudflare.</p><p>We rejected the request. No sample resource was returned.</p>', 'denied'));
      }
      return send(200, page('You reached the protected page.', '<p class="lead">The app verified a signed Cloudflare Access token for this application.</p><div class="sample"><span>Sample internal resource</span><h2>Project notebook</h2><p>This harmless page stands in for a company tool. There is no company data here.</p></div><p class="notice">This proves token validation. Confirm the device and MFA requirements in Cloudflare logs and the test checklist before calling the PoC successful.</p>', 'verified'));
    } catch {
      send(400, 'Invalid request.', 'text/plain; charset=utf-8');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = readConfig();
  const server = createApp({ config });
  server.on('error', (error) => {
    console.error(`Demo server could not start (${error.code || 'unknown error'}).`);
    process.exitCode = 1;
  });
  server.listen(config.port, '127.0.0.1', () => {
    console.log(`Zero Trust lab: http://127.0.0.1:${config.port}`);
    console.log(config.access ? 'Access token validation enabled.' : 'Preview ready; /protected is locked until Cloudflare is configured.');
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close());
  }
}
