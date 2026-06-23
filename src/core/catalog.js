'use strict';

// /api/_meta のペイロードを組み立てる。各パターンの相対パスのデモを、その名前空間
// '/api/<id>' を前置して絶対パスに直し、UI がそのまま fetch できるようにする。

function buildCatalog(patterns, categories) {
  return {
    categories,
    patterns: patterns.map((p) => ({
      ...p.meta,
      demos: p.demos.map((d) => ({ ...d, path: `/api/${p.meta.id}${d.path}` }))
    }))
  };
}

module.exports = { buildCatalog };
