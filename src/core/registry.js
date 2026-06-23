'use strict';

const fs = require('fs');
const path = require('path');
const categories = require('../categories');

// patterns/ を自動検出する。並び順はカテゴリの定義順 → 同一カテゴリ内はファイル名順。
const dir = path.join(__dirname, '..', 'patterns');
const categoryOrder = new Map(categories.map((c, i) => [c.id, i]));

const patterns = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => require(path.join(dir, f)))
  .sort((a, b) => {
    const ca = categoryOrder.get(a.meta.category) ?? Number.MAX_SAFE_INTEGER;
    const cb = categoryOrder.get(b.meta.category) ?? Number.MAX_SAFE_INTEGER;
    return ca - cb || a.meta.id.localeCompare(b.meta.id);
  });

module.exports = patterns;
