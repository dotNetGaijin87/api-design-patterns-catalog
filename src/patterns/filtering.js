'use strict';

const { seedBooks, CATEGORIES } = require('../data');

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------
// クエリパラメータでコレクションを絞り込む。条件は AND で結合し、適用したフィルタを
// レスポンスに echo して自己説明的にする。

const books = seedBooks();
const BASE = '/api/filtering';

function register(app) {
  app.get(`${BASE}/books`, (req, res) => {
    const { author, category, minYear, maxYear, q } = req.query;

    const applied = {};
    let result = books;

    if (author) {
      applied.author = author;
      result = result.filter((b) => b.author.includes(author));
    }
    if (category) {
      applied.category = category;
      result = result.filter((b) => b.category === category);
    }
    if (minYear) {
      applied.minYear = Number(minYear);
      result = result.filter((b) => b.year >= Number(minYear));
    }
    if (maxYear) {
      applied.maxYear = Number(maxYear);
      result = result.filter((b) => b.year <= Number(maxYear));
    }
    if (q) {
      applied.q = q;
      result = result.filter((b) => b.title.includes(q));
    }

    res.json({ filter: applied, totalSize: result.length, books: result });
  });
}

module.exports = {
  meta: {
    id: 'filtering',
    category: 'data-transfer',
    title: 'フィルタリング',
    blurb: 'クエリパラメータでコレクションを絞り込む（条件は AND で結合）。',
    docs:
      'フィルタリングは、クライアントが関心のある部分集合だけを要求できるようにする仕組みです。' +
      '各パラメータは意味の明確な独立したフィールド（author、category、minYear、タイトル検索の q）で、' +
      '複数を指定すると AND で結合されます。\n\n' +
      'レスポンスには実際に適用されたフィルタが filter として echo されるため、レスポンス自体が' +
      '自己説明的でデバッグしやすくなります。利用可能なジャンル: ' + CATEGORIES.join('、') + '。'
  },
  demos: [
    { label: 'ジャンル＝ミステリー', method: 'GET', path: `${BASE}/books?category=ミステリー` },
    { label: '2015年以降の純文学', method: 'GET', path: `${BASE}/books?category=純文学&minYear=2015` },
    { label: 'タイトルに「人間」を含む', method: 'GET', path: `${BASE}/books?q=人間` },
    { label: '著者で絞り込み（村上）', method: 'GET', path: `${BASE}/books?author=村上` },
    { label: 'フィルタなし（全件）', method: 'GET', path: `${BASE}/books` }
  ],
  register
};
