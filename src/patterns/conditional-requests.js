'use strict';

const crypto = require('crypto');
const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Conditional Requests (ETag / If-None-Match -> 304 Not Modified)
// ---------------------------------------------------------------------------
// レスポンスに ETag（内容の指紋）を付ける。クライアントが次回 If-None-Match に
// その ETag を載せて再取得し、内容が変わっていなければサーバーは 304 Not Modified を
// 本文なしで返す。帯域を大きく節約できる。

const books = seedBooks();
const BASE = '/api/conditional-requests';

// 内容から強い ETag を計算する（リソースが変わればハッシュも変わる）。
const etagFor = (obj) => '"' + crypto.createHash('sha1').update(JSON.stringify(obj)).digest('base64').slice(0, 16) + '"';

function register(app) {
  app.get(`${BASE}/books/:id`, (req, res) => {
    const book = books.find((b) => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `'${req.params.id}' の書籍は存在しません。` } });
    }

    const etag = etagFor(book);
    res.set('ETag', etag);
    res.set('Cache-Control', 'no-cache'); // キャッシュ可だが利用前に再検証する

    // クライアントが持つ ETag が最新と一致すれば、本文を送らず 304 を返す。
    const ifNoneMatch = req.get('If-None-Match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end();
    }

    res.json(book);
  });

  // PATCH で内容を変えると ETag も変わる。古い If-None-Match では 304 にならず
  // 200 で新しい内容が返る、という再検証の挙動を試せる。
  app.patch(`${BASE}/books/:id`, (req, res) => {
    const book = books.find((b) => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `'${req.params.id}' の書籍は存在しません。` } });
    }
    const { id, ...patch } = req.body;
    Object.assign(book, patch);
    res.set('ETag', etagFor(book)).json(book);
  });
}

module.exports = {
  meta: {
    id: 'conditional-requests',
    category: 'data-transfer',
    title: '条件付きリクエスト（ETag / 304）',
    blurb: 'ETag と If-None-Match で「変更なし」を検出し、304 で本文の転送を省く。',
    docs:
      'リソースを取得すると、サーバーはその内容の指紋である ETag をレスポンスヘッダーに付けます。' +
      'クライアントは次回、If-None-Match ヘッダーにその ETag を載せて再取得します。内容が変わって' +
      'いなければ、サーバーは本文を送らず 304 Not Modified を返します。ステータス行とヘッダーだけの' +
      'やり取りで済むため、帯域を大きく節約できます（同種の仕組みに Last-Modified / ' +
      'If-Modified-Since もあります）。\n\n' +
      'まず「書籍を取得」を実行し、レスポンスヘッダーの ETag を確認してください。すると現れる' +
      '「If-None-Match で再取得 → 304」ボタンで再リクエストすると、本文なしの 304 が返ります。' +
      '「内容を更新（PATCH）」で中身を変えると ETag も変わるため、古い ETag では再び 200 で' +
      '最新の内容が返ります。'
  },
  demos: [
    { label: '書籍を取得（ETagを得る）', method: 'GET', path: `${BASE}/books/book-10` },
    { label: '内容を更新（PATCH）→ ETag変化', method: 'PATCH', path: `${BASE}/books/book-10`, body: { rating: 4.9 } }
  ],
  register
};
