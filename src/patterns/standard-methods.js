'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Standard Methods (List / Get / Create / Update / Delete)
// ---------------------------------------------------------------------------
//   List   GET    /books
//   Get    GET    /books/{id}
//   Create POST   /books         -> 201 + Location header
//   Update PATCH  /books/{id}    (partial update)
//   Delete DELETE /books/{id}    -> 204 No Content

let books = seedBooks();
let nextId = books.length + 1;

const BASE = '/api/standard-methods';

function register(app) {
  // List
  app.get(`${BASE}/books`, (_req, res) => {
    res.json({ books });
  });

  // Get
  app.get(`${BASE}/books/:id`, (req, res) => {
    const book = books.find((b) => b.id === req.params.id);
    if (!book) return notFound(res, req.params.id);
    res.json(book);
  });

  // Create
  app.post(`${BASE}/books`, (req, res) => {
    const id = `book-${String(nextId++).padStart(2, '0')}`;
    const book = {
      id,
      title: req.body.title || '無題',
      author: req.body.author || '著者不明',
      year: req.body.year || new Date().getFullYear(),
      category: req.body.category || '純文学',
      pages: req.body.pages || 0,
      rating: req.body.rating || 0
    };
    books.push(book);
    res.status(201).location(`${BASE}/books/${id}`).json(book);
  });

  // Update (partial)
  app.patch(`${BASE}/books/:id`, (req, res) => {
    const book = books.find((b) => b.id === req.params.id);
    if (!book) return notFound(res, req.params.id);
    // PATCH = 渡されたフィールドだけ変更する。id は不変。
    const { id, ...patch } = req.body;
    Object.assign(book, patch);
    res.json(book);
  });

  // Delete
  app.delete(`${BASE}/books/:id`, (req, res) => {
    const idx = books.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return notFound(res, req.params.id);
    books.splice(idx, 1);
    res.status(204).end();
  });

  // デモデータのリセット
  app.post(`${BASE}/_reset`, (_req, res) => {
    books = seedBooks();
    nextId = books.length + 1;
    res.json({ reset: true, count: books.length });
  });
}

function notFound(res, id) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `id '${id}' の書籍は存在しません。` } });
}

module.exports = {
  meta: {
    id: 'standard-methods',
    category: 'fundamentals',
    title: '標準メソッド（CRUD）',
    blurb: 'すべてのリソースが備えるべき5つの基本操作を、HTTPに素直にマッピングする。',
    docs:
      '独自の操作を設計する前に、まずはリソースに5つの「標準メソッド」を用意します。' +
      'List（一覧取得）・Get（単体取得）・Create（作成）・Update（更新）・Delete（削除）です。' +
      '要点は一貫性で、あるリソースの形を一度覚えれば、ほかのすべてのリソースも同じように扱えます。\n\n' +
      'HTTPの細部にも注目してください。Create は 201 を返し、新しいリソースを指す Location ' +
      'ヘッダーを付けます。Update は部分更新のために PATCH を使い（id は不変）、Delete は ' +
      '204 No Content を返します。「存在しないID」を試すと、構造化された 404 エラーのボディを確認できます。'
  },
  demos: [
    { label: '書籍を一覧取得', method: 'GET', path: `${BASE}/books` },
    { label: '書籍を1件取得', method: 'GET', path: `${BASE}/books/book-01` },
    { label: '存在しないID → 404', method: 'GET', path: `${BASE}/books/book-999` },
    {
      label: '書籍を作成 → 201',
      method: 'POST',
      path: `${BASE}/books`,
      body: { title: '門', author: '夏目漱石', year: 1910, category: '純文学', pages: 240, rating: 4.1 }
    },
    {
      label: '書籍を更新（PATCH）',
      method: 'PATCH',
      path: `${BASE}/books/book-01`,
      body: { rating: 5.0 }
    },
    { label: '書籍を削除 → 204', method: 'DELETE', path: `${BASE}/books/book-16` },
    { label: 'デモデータをリセット', method: 'POST', path: `${BASE}/_reset` }
  ],
  register
};
