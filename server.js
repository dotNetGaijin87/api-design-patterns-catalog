'use strict';

const path = require('path');
const { createApp } = require('./src/core/mini-app');
const { buildCatalog } = require('./src/core/catalog');
const patterns = require('./src/core/registry');
const categories = require('./src/categories');

const app = createApp();

// 各パターンは /api/<id> にスコープしたルーターに登録するので、相対パスだけ扱えばよい。
for (const pattern of patterns) {
  pattern.register(app.scope(`/api/${pattern.meta.id}`));
}

const catalog = buildCatalog(patterns, categories);
app.get('/api/_meta', (_req, res) => res.json(catalog));

app.static(path.join(__dirname, 'public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  API Design Patterns playground`);
  console.log(`  -> http://localhost:${PORT}\n`);
});
