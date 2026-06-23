'use strict';

const { seedBooks } = require('../domain/books');
const { createStore } = require('../domain/store');
const { notFound, etag } = require('../core/http');

const store = createStore(seedBooks);

function register(r) {
  r.get('/books/:id', (req, res) => {
    const book = store.find(req.params.id);
    if (!book) return notFound(res, `'${req.params.id}' の書籍は存在しません。`);

    const tag = etag(book);
    res.set('ETag', tag);
    res.set('Cache-Control', 'no-cache');

    // ETag が一致すれば内容は変わっていないので、本文を送らず 304 を返す。
    if (req.get('If-None-Match') === tag) return res.status(304).end();

    res.json(book);
  });

  r.patch('/books/:id', (req, res) => {
    const book = store.find(req.params.id);
    if (!book) return notFound(res, `'${req.params.id}' の書籍は存在しません。`);
    const { id, ...patch } = req.body;
    Object.assign(book, patch);
    res.set('ETag', etag(book)).json(book);
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
    { label: '書籍を取得（ETagを得る）', method: 'GET', path: '/books/book-10' },
    { label: '内容を更新（PATCH）→ ETag変化', method: 'PATCH', path: '/books/book-10', body: { rating: 4.9 } }
  ],
  register
};
