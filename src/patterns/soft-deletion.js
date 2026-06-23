'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Soft Deletion
// ---------------------------------------------------------------------------
// Deletes are often regrettable. Instead of erasing the row, mark it
// deleted (a "tombstone"): hide it from List by default, keep it retrievable
// with ?showDeleted=true, and allow an :undelete to bring it back.

let books = seedBooks().map((b) => ({ ...b, deleted: false }));
const BASE = '/api/soft-deletion';

function register(app) {
  // List hides tombstoned rows unless explicitly asked for them.
  app.get(`${BASE}/books`, (req, res) => {
    const showDeleted = req.query.showDeleted === 'true';
    const visible = books.filter((b) => showDeleted || !b.deleted);
    res.json({ showDeleted, totalSize: visible.length, books: visible });
  });

  // Soft delete: flip the flag, stamp the time, return the tombstone (200).
  app.delete(`${BASE}/books/:id`, (req, res) => {
    const book = books.find((b) => b.id === req.params.id);
    if (!book) return notFound(res, req.params.id);
    book.deleted = true;
    book.deleteTime = new Date().toISOString();
    res.json(book);
  });

  // Undelete: the affordance soft deletion exists to enable. AIP custom
  // methods use a colon: POST /books/{id}:undelete. We capture the whole
  // trailing segment and split off the verb ourselves.
  app.post(`${BASE}/books/:resource`, (req, res) => {
    const [id, verb] = req.params.resource.split(':');
    if (verb !== 'undelete') {
      return res.status(400).json({ error: { code: 'BAD_VERB', message: `Unknown custom method ':${verb || ''}'.` } });
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
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No book with id '${id}'.` } });
}

module.exports = {
  meta: {
    id: 'soft-deletion',
    title: 'Soft Deletion',
    blurb: 'Tombstone resources instead of erasing them — hide by default, allow undelete.',
    docs:
      'Hard deletes are unforgiving. Soft deletion marks a resource as deleted (a "tombstone") ' +
      'rather than removing it: List hides it by default, ?showDeleted=true reveals it with its ' +
      'deleteTime, and an :undelete custom method restores it.\n\n' +
      'Walk the demos in order: List (16 books) → Delete book-09 (returns the tombstone) → ' +
      'List again (now 15, it\'s hidden) → List showDeleted=true (16 again, one marked ' +
      'deleted:true) → Undelete book-09 → List (back to 16). Note that delete returns 200 with ' +
      'the resource, not 204 — the tombstone still exists.'
  },
  demos: [
    { label: '1. List (default)', method: 'GET', path: `${BASE}/books` },
    { label: '2. Delete book-09', method: 'DELETE', path: `${BASE}/books/book-09` },
    { label: '3. List (book-09 hidden)', method: 'GET', path: `${BASE}/books` },
    { label: '4. List showDeleted=true', method: 'GET', path: `${BASE}/books?showDeleted=true` },
    { label: '5. Undelete book-09', method: 'POST', path: `${BASE}/books/book-09:undelete` },
    { label: 'Reset demo data', method: 'POST', path: `${BASE}/_reset` }
  ],
  register
};
