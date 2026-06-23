'use strict';

const path = require('path');
const { createApp } = require('./src/lib/mini-app');
const patterns = require('./src/registry');

const app = createApp();

// Let every pattern register its own routes on the app. By convention each
// pattern owns the URL namespace /api/<pattern-id>/... so demos are isolated.
patterns.forEach((pattern) => pattern.register(app));

// Drives the UI: the catalog of patterns plus the demo requests for each.
// The frontend is entirely data-driven from this single endpoint.
app.get('/api/_meta', (_req, res) => {
  res.json(
    patterns.map((p) => ({
      ...p.meta,
      demos: p.demos
    }))
  );
});

// Serve the static UI from /public (anything not matched by a route above).
app.static(path.join(__dirname, 'public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  API Design Patterns playground`);
  console.log(`  -> http://localhost:${PORT}\n`);
});
