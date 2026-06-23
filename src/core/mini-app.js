'use strict';

// A tiny, zero-dependency, Express-flavoured app built on Node's http module.
//
// It implements just enough of the Express surface that the pattern modules
// use — get/post/patch/delete, :params, req.query / req.body / req.get, and a
// chainable res.status().location().set().json() — so the project runs with a
// bare `node server.js` and no npm install. app.scope(base) returns a router
// whose routes are all mounted under `base`, which lets each pattern register
// relative paths ('/books') without repeating its '/api/<id>' prefix.
// This is deliberately NOT a general web framework.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createApp() {
  const routes = []; // { method, segments, handler }
  let staticDir = null;

  function add(method, pattern, handler) {
    routes.push({ method, segments: pattern.split('/').filter(Boolean), handler });
  }

  // Match a request path against a route pattern, capturing :params.
  function match(routeSegs, urlSegs) {
    if (routeSegs.length !== urlSegs.length) return null;
    const params = {};
    for (let i = 0; i < routeSegs.length; i++) {
      const r = routeSegs[i];
      if (r.startsWith(':')) {
        params[r.slice(1)] = decodeURIComponent(urlSegs[i]);
      } else if (r !== urlSegs[i]) {
        return null;
      }
    }
    return params;
  }

  const server = http.createServer((rawReq, rawRes) => {
    const parsed = new URL(rawReq.url, 'http://localhost');
    const urlSegs = parsed.pathname.split('/').filter(Boolean);

    // Collect the body, then dispatch.
    let raw = '';
    rawReq.on('data', (chunk) => (raw += chunk));
    rawReq.on('end', () => {
      const req = buildReq(rawReq, parsed, raw);
      const res = buildRes(rawRes);

      for (const route of routes) {
        if (route.method !== rawReq.method) continue;
        const params = match(route.segments, urlSegs);
        if (!params) continue;
        req.params = params;
        try {
          return route.handler(req, res);
        } catch (err) {
          return res.status(500).json({ error: { code: 'INTERNAL', message: String(err && err.message) } });
        }
      }

      // Fall through to static files for GET requests.
      if (rawReq.method === 'GET' && staticDir && serveStatic(staticDir, parsed.pathname, res)) return;

      res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${rawReq.method} ${parsed.pathname}` } });
    });
  });

  const app = {
    get: (p, h) => add('GET', p, h),
    post: (p, h) => add('POST', p, h),
    put: (p, h) => add('PUT', p, h),
    patch: (p, h) => add('PATCH', p, h),
    delete: (p, h) => add('DELETE', p, h),
    // A router scoped to `base`: every route it registers is prefixed with it.
    scope: (base) => ({
      base,
      get: (p, h) => add('GET', base + p, h),
      post: (p, h) => add('POST', base + p, h),
      put: (p, h) => add('PUT', base + p, h),
      patch: (p, h) => add('PATCH', base + p, h),
      delete: (p, h) => add('DELETE', base + p, h)
    }),
    static: (dir) => { staticDir = dir; },
    listen: (port, cb) => {
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`\n  Port ${port} is already in use.`);
          console.error(`  Pick another with:  PORT=5050 npm start\n`);
          process.exit(1);
        }
        throw err;
      });
      server.listen(port, cb);
    }
  };
  return app;
}

function buildReq(rawReq, parsed, raw) {
  const query = {};
  for (const [k, v] of parsed.searchParams.entries()) query[k] = v;

  let body = {};
  if (raw) {
    try { body = JSON.parse(raw); } catch { body = {}; }
  }

  return {
    method: rawReq.method,
    path: parsed.pathname,
    query,
    body,
    params: {},
    get: (name) => rawReq.headers[String(name).toLowerCase()]
  };
}

function buildRes(rawRes) {
  let statusCode = 200;
  const res = {
    status(code) { statusCode = code; return res; },
    set(name, value) { rawRes.setHeader(name, value); return res; },
    location(url) { rawRes.setHeader('Location', url); return res; },
    json(obj) {
      rawRes.statusCode = statusCode;
      rawRes.setHeader('Content-Type', 'application/json; charset=utf-8');
      rawRes.end(JSON.stringify(obj));
      return res;
    },
    send(text) {
      rawRes.statusCode = statusCode;
      rawRes.end(text == null ? '' : Buffer.isBuffer(text) ? text : String(text));
      return res;
    },
    end() { rawRes.statusCode = statusCode; rawRes.end(); return res; }
  };
  return res;
}

function serveStatic(dir, urlPath, res) {
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const full = path.join(dir, rel);
  // Guard against path traversal outside the static dir.
  if (!full.startsWith(path.resolve(dir))) return false;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return false;

  const type = MIME[path.extname(full).toLowerCase()] || 'application/octet-stream';
  res.set('Content-Type', type).status(200);
  res.send(fs.readFileSync(full));
  return true;
}

module.exports = { createApp };
