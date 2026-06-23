'use strict';

// 各パターンの相対パスのデモを、その名前空間 '/api/<id>' を前置して絶対パスに直す。
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
