'use strict';

const { seedBooks } = require('../domain/books');
const { createStore } = require('../domain/store');
const { notFound } = require('../core/http');

const store = createStore(seedBooks);

function register(r) {
  r.get('/books', (_req, res) => res.json({ books: store.list() }));

  r.get('/books/:id', (req, res) => {
    const book = store.find(req.params.id);
    if (!book) return notFound(res, `id '${req.params.id}' の書籍は存在しません。`);
    res.json(book);
  });

  r.post('/books', (req, res) => {
    const id = store.newId();
    const book = {
      id,
      title: req.body.title || '無題',
      author: req.body.author || '著者不明',
      year: req.body.year || new Date().getFullYear(),
      category: req.body.category || '純文学',
      pages: req.body.pages || 0,
      rating: req.body.rating || 0
    };
    store.add(book);
    res.status(201).location(`${r.base}/books/${id}`).json(book);
  });

  r.patch('/books/:id', (req, res) => {
    const book = store.find(req.params.id);
    if (!book) return notFound(res, `id '${req.params.id}' の書籍は存在しません。`);
    const { id, ...patch } = req.body; // id は不変なので除外する
    Object.assign(book, patch);
    res.json(book);
  });

  r.delete('/books/:id', (req, res) => {
    if (!store.remove(req.params.id)) return notFound(res, `id '${req.params.id}' の書籍は存在しません。`);
    res.status(204).end();
  });

  r.post('/_reset', (_req, res) => {
    store.reset();
    res.json({ reset: true, count: store.size });
  });
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
    { label: '書籍を一覧取得', method: 'GET', path: '/books' },
    { label: '書籍を1件取得', method: 'GET', path: '/books/book-01' },
    { label: '存在しないID → 404', method: 'GET', path: '/books/book-999' },
    {
      label: '書籍を作成 → 201',
      method: 'POST',
      path: '/books',
      body: { title: '門', author: '夏目漱石', year: 1910, category: '純文学', pages: 240, rating: 4.1 }
    },
    { label: '書籍を更新（PATCH）', method: 'PATCH', path: '/books/book-01', body: { rating: 5.0 } },
    { label: '書籍を削除 → 204', method: 'DELETE', path: '/books/book-16' },
    { label: 'デモデータをリセット', method: 'POST', path: '/_reset' }
  ],
  register
};
