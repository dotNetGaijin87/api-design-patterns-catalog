'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Pagination (opaque cursor / page tokens)
// ---------------------------------------------------------------------------
// 無制限のリストは返さない。1ページ分と不透明な nextPageToken を返し、クライアントは
// それを送り返して次ページを取得する。

const books = seedBooks();
const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;
const BASE = '/api/pagination';

// トークンは「次のインデックス」をエンコードしているだけだが、base64url の不透明な値なので
// クライアントは中身を解釈せず、不透明な文字列として扱わなければならない。
const encodeToken = (index) => Buffer.from(String(index)).toString('base64url');
const decodeToken = (token) => {
  const n = parseInt(Buffer.from(token, 'base64url').toString('utf8'), 10);
  return Number.isInteger(n) && n >= 0 ? n : 0;
};

function register(app) {
  app.get(`${BASE}/books`, (req, res) => {
    let pageSize = parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE;
    pageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);

    const start = req.query.pageToken ? decodeToken(req.query.pageToken) : 0;
    const slice = books.slice(start, start + pageSize);
    const nextIndex = start + pageSize;

    res.json({
      books: slice,
      nextPageToken: nextIndex < books.length ? encodeToken(nextIndex) : null,
      totalSize: books.length
    });
  });
}

module.exports = {
  meta: {
    id: 'pagination',
    category: 'data-transfer',
    title: 'ページネーション',
    blurb: '一度に1ページずつ返し、次ページ用の不透明なトークンを添える。',
    docs:
      'List 系のエンドポイントは、無制限のコレクションをそのまま返すべきではありません。' +
      '固定サイズの1ページと nextPageToken を返し、クライアントはそのトークンを ?pageToken=... ' +
      'で送り返して次のページを取得します。トークンが null になるまでこれを繰り返します。\n\n' +
      'ここでのトークンは、base64url でエンコードされた不透明なカーソルです。?offset=10 のような' +
      '素の値ではなく不透明に保つことで、サーバーは将来 offset・キーセット・スナップショットなど' +
      'ページング方式を変えても、既存クライアントを壊さずに済みます。\n\n' +
      '最初のデモを実行し、表示される「次のページ →」ボタンでカーソルをたどってみてください。'
  },
  demos: [
    { label: '最初のページ（pageSize=5）', method: 'GET', path: `${BASE}/books?pageSize=5` },
    { label: '小さなページ（pageSize=2）', method: 'GET', path: `${BASE}/books?pageSize=2` }
  ],
  register
};
