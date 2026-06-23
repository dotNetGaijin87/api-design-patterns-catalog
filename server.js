'use strict';

const path = require('path');
const { createApp } = require('./src/core/mini-app');
const { buildCatalog } = require('./src/core/catalog');
const patterns = require('./src/core/registry');
const categories = require('./src/categories');

const app = createApp();

// Each pattern registers its routes on a router scoped to /api/<id>, so the
// pattern code only deals in relative paths ('/books').
for (const pattern of patterns) {
  pattern.register(app.scope(`/api/${pattern.meta.id}`));
}

// Drives the UI: the catalog of categories + patterns (with their demo
// requests). Built once; the metadata is static.
const catalog = buildCatalog(patterns, categories);
app.get('/api/_meta', (_req, res) => res.json(catalog));

// Serve the static UI from /public (anything not matched by a route above).
app.static(path.join(__dirname, 'public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  API Design Patterns playground`);
  console.log(`  -> http://localhost:${PORT}\n`);
});
