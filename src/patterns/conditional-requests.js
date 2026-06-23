'use strict';

const { seedBooks } = require('../domain/books');
const { createStore } = require('../domain/store');
const { notFound, etag } = require('../core/http');

const store = createStore(seedBooks);
const lastModified = new Map(); // id -> Date

function lmOf(id) {
  if (!lastModified.has(id)) lastModified.set(id, new Date());
  return lastModified.get(id);
}

function register(r) {
  r.get('/books/:id', (req, res) => {
    const book = store.find(req.params.id);
    if (!book) return notFound(res, `'${req.params.id}' の書籍は存在しません。`);

    const tag = etag(book);
    const lm = lmOf(book.id);
    res.set('ETag', tag);
    res.set('Last-Modified', lm.toUTCString());
    res.set('Cache-Control', 'no-cache');

    // エンティティタグによる前提条件。存在すれば時刻ベースより優先する。
    const inm = req.get('If-None-Match');
    if (inm !== undefined) {
      if (inm === tag) return res.status(304).end();
      return res.json(book);
    }

    // 時刻による前提条件。前回以降に変わっていなければ 304。
    const ims = req.get('If-Modified-Since');
    if (ims) {
      const since = Date.parse(ims);
      if (!Number.isNaN(since) && Math.floor(lm.getTime() / 1000) <= Math.floor(since / 1000)) {
        return res.status(304).end();
      }
    }

    res.json(book);
  });

  r.patch('/books/:id', (req, res) => {
    const book = store.find(req.params.id);
    if (!book) return notFound(res, `'${req.params.id}' の書籍は存在しません。`);
    const { id, ...patch } = req.body;
    Object.assign(book, patch);
    lastModified.set(book.id, new Date());
    res.set('ETag', etag(book)).set('Last-Modified', lmOf(book.id).toUTCString()).json(book);
  });
}

module.exports = {
  meta: {
    id: 'conditional-requests',
    category: 'data-transfer',
    title: '条件付きリクエスト（ETag / 304）',
    blurb: 'ETag や Last-Modified で「変更なし」を検出し、304 で本文の転送を省く。',
    docs:
      '条件付きリクエストは、リソースが変わっていないときに本文の再取得を省くための仕組みです。' +
      'クライアントは「手元のコピーが最新かどうか」をサーバーに問い合わせ、変わっていなければ ' +
      '304 Not Modified（本文なし）、変わっていれば 200 OK と最新の内容を受け取ります。\n\n' +
      '前提条件には2種類あります。時刻ベースは、レスポンスの Last-Modified を控えておき、次回 ' +
      'If-Modified-Since にその時刻を載せて送る方式です。エンティティタグ（ETag）ベースは、内容を' +
      '表す不透明な値 ETag を控えておき、次回 If-None-Match にその値を載せて送る方式です。ETag は' +
      '内容のハッシュで、バイト単位で厳密な strong ETag と、意味的に同等な weak ETag があります。' +
      '本文が不要で更新の有無だけ確認したいときは HEAD でも行えます。\n\n' +
      '「書籍を取得」を実行すると、レスポンスヘッダーに ETag と Last-Modified が付きます。すると現れる' +
      '「If-None-Match で再取得」または「If-Modified-Since で再取得」を実行すると、本文なしの 304 が' +
      '返ります。「内容を更新（PATCH）」で中身を変えると ETag と Last-Modified が変わるため、古い値では' +
      '再び 200 で最新の内容が返ります。'
  },
  demos: [
    { label: '書籍を取得（ETag / Last-Modified を得る）', method: 'GET', path: '/books/book-10' },
    { label: '内容を更新（PATCH）→ 値が変わる', method: 'PATCH', path: '/books/book-10', body: { rating: 4.9 } }
  ],
  register
};
