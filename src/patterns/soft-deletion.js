'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Soft Deletion
// ---------------------------------------------------------------------------
// 削除はしばしば後悔を伴う。行を消す代わりに「削除済み」とマークする（トゥームストーン）:
// List では既定で隠し、?showDeleted=true で取得可能にし、:undelete で復元できるようにする。

let books = seedBooks().map((b) => ({ ...b, deleted: false }));
const BASE = '/api/soft-deletion';

function register(app) {
  // List は、明示的に要求されない限りトゥームストーンを隠す。
  app.get(`${BASE}/books`, (req, res) => {
    const showDeleted = req.query.showDeleted === 'true';
    const visible = books.filter((b) => showDeleted || !b.deleted);
    res.json({ showDeleted, totalSize: visible.length, books: visible });
  });

  // ソフトデリート: フラグを立て、時刻を記録し、トゥームストーン（200）を返す。
  app.delete(`${BASE}/books/:id`, (req, res) => {
    const book = books.find((b) => b.id === req.params.id);
    if (!book) return notFound(res, req.params.id);
    book.deleted = true;
    book.deleteTime = new Date().toISOString();
    res.json(book);
  });

  // 復元: ソフトデリートが存在する理由そのものの操作。AIP のカスタムメソッドはコロンを使う:
  // POST /books/{id}:undelete。末尾セグメント全体を受け取り、自前で動詞を切り出す。
  app.post(`${BASE}/books/:resource`, (req, res) => {
    const [id, verb] = req.params.resource.split(':');
    if (verb !== 'undelete') {
      return res.status(400).json({ error: { code: 'BAD_VERB', message: `未知のカスタムメソッド ':${verb || ''}' です。` } });
    }
    const book = books.find((b) => b.id === id);
    if (!book) return notFound(res, id);
    book.deleted = false;
    delete book.deleteTime;
    res.json(book);
  });

  app.post(`${BASE}/_reset`, (_req, res) => {
    books = seedBooks().map((b) => ({ ...b, deleted: false }));
    res.json({ reset: true, count: books.length });
  });
}

function notFound(res, id) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `id '${id}' の書籍は存在しません。` } });
}

module.exports = {
  meta: {
    id: 'soft-deletion',
    category: 'lifecycle',
    title: 'ソフトデリート（論理削除）',
    blurb: 'リソースを消さずにトゥームストーン化する。既定では非表示、復元も可能。',
    docs:
      '物理削除は取り返しがつきません。ソフトデリートはリソースを「削除済み」としてマーク' +
      '（トゥームストーン）するだけで、実際には残します。List は既定でそれを隠し、' +
      '?showDeleted=true で deleteTime とともに表示し、:undelete カスタムメソッドで復元できます。\n\n' +
      'デモを順番に実行してください。一覧（16件）→ book-09 を削除（トゥームストーンが返る）→ ' +
      '再度一覧（15件・非表示）→ showDeleted=true で一覧（再び16件・1件が deleted:true）→ ' +
      'book-09 を復元 → 一覧（16件に戻る）。削除が 204 ではなく 200 でリソースを返す点に注目して' +
      'ください。トゥームストーンはまだ存在しています。'
  },
  demos: [
    { label: '1. 一覧（既定）', method: 'GET', path: `${BASE}/books` },
    { label: '2. book-09 を削除', method: 'DELETE', path: `${BASE}/books/book-09` },
    { label: '3. 一覧（book-09 は非表示）', method: 'GET', path: `${BASE}/books` },
    { label: '4. 一覧（showDeleted=true）', method: 'GET', path: `${BASE}/books?showDeleted=true` },
    { label: '5. book-09 を復元', method: 'POST', path: `${BASE}/books/book-09:undelete` },
    { label: 'デモデータをリセット', method: 'POST', path: `${BASE}/_reset` }
  ],
  register
};
