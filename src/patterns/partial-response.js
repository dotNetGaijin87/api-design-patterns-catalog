'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Partial Response (field masks)
// ---------------------------------------------------------------------------
// ?fields=id,title,author のように、返すフィールドをクライアントに選ばせる。
// ペイロードを小さくし over-fetching を避ける、GraphQL の選択セットに相当する手法。

const books = seedBooks();
const BASE = '/api/partial-response';

function pick(obj, fields) {
  if (!fields || fields.length === 0) return obj;
  const out = {};
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(obj, f)) out[f] = obj[f];
  }
  return out;
}

function parseFields(raw) {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function register(app) {
  app.get(`${BASE}/books`, (req, res) => {
    const fields = parseFields(req.query.fields);
    res.json({ fields: fields.length ? fields : 'all', books: books.map((b) => pick(b, fields)) });
  });

  app.get(`${BASE}/books/:id`, (req, res) => {
    const book = books.find((b) => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `'${req.params.id}' の書籍は存在しません。` } });
    }
    res.json(pick(book, parseFields(req.query.fields)));
  });
}

module.exports = {
  meta: {
    id: 'partial-response',
    category: 'data-transfer',
    title: '部分レスポンス（フィールドマスク）',
    blurb: '?fields=id,title のように、必要なフィールドだけを要求できるようにする。',
    docs:
      'モバイルクライアントやダッシュボードが、リソースの全フィールドを必要とすることはまれです。' +
      'フィールドマスク（?fields=id,title,author）を使うと、呼び出し側は欲しい項目だけを射影でき、' +
      'ペイロードを小さくして over-fetching を避けられます。これは GraphQL の選択セットに相当する ' +
      'REST の手法です。\n\n' +
      '「全フィールド」と「id + title のみ」を比べてみてください。同じエンドポイントでもペイロードの' +
      '大きさが大きく変わります。未知のフィールド名はエラーにせず、単に無視されます。'
  },
  demos: [
    { label: '全フィールド', method: 'GET', path: `${BASE}/books` },
    { label: 'id + title のみ', method: 'GET', path: `${BASE}/books?fields=id,title` },
    { label: 'title, author, rating', method: 'GET', path: `${BASE}/books?fields=title,author,rating` },
    { label: '1件・2フィールドのみ', method: 'GET', path: `${BASE}/books/book-05?fields=title,year` }
  ],
  register
};
