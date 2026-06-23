'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Idempotency / Request Deduplication
// ---------------------------------------------------------------------------
// POST is not naturally idempotent: a retried "create" after a dropped
// response would make a duplicate. An Idempotency-Key header lets the server
// recognise a replay and return the original result instead of acting twice.

let books = seedBooks();
let nextId = books.length + 1;
let keyCache = new Map(); // Idempotency-Key -> stored response body

const BASE = '/api/idempotency';

function register(app) {
  app.post(`${BASE}/books`, (req, res) => {
    const key = req.get('Idempotency-Key');

    // Replay: we've seen this key before — return the original creation,
    // flagged so you can see it was deduplicated rather than re-created.
    if (key && keyCache.has(key)) {
      return res
        .status(200)
        .set('Idempotent-Replayed', 'true')
        .json(keyCache.get(key));
    }

    const id = `book-${String(nextId++).padStart(2, '0')}`;
    const book = {
      id,
      title: req.body.title || 'Untitled',
      author: req.body.author || 'Unknown',
      year: req.body.year || new Date().getFullYear(),
      category: req.body.category || 'Fiction',
      pages: req.body.pages || 0,
      rating: req.body.rating || 0
    };
    books.push(book);

    if (key) keyCache.set(key, book);
    res.status(201).location(`${BASE}/books/${id}`).json(book);
  });

  app.get(`${BASE}/books`, (_req, res) => {
    res.json({ totalSize: books.length, books });
  });

  app.post(`${BASE}/_reset`, (_req, res) => {
    books = seedBooks();
    nextId = books.length + 1;
    keyCache = new Map();
    res.json({ reset: true, count: books.length });
  });
}

module.exports = {
  meta: {
    id: 'idempotency',
    title: 'Idempotency Keys',
    blurb: 'Make POST safe to retry: the same Idempotency-Key returns the original result.',
    docs:
      'A client that never hears back from a POST faces a dilemma: did the create succeed? If ' +
      'it retries, it risks a duplicate. An Idempotency-Key header (a client-generated unique ' +
      'value) solves this — the server stores the result against the key and, on any replay of ' +
      'the same key, returns the original response instead of acting again.\n\n' +
      'Run "Create (key=abc-123)" — note the new id and 201 status. Run it AGAIN: same id, but ' +
      'now 200 with an Idempotent-Replayed: true header (look at the response headers). ' +
      'Then "Create (key=xyz-789)" makes a genuinely new book. Use "List" to confirm the count.'
  },
  demos: [
    {
      label: 'Create (key=abc-123)',
      method: 'POST',
      path: `${BASE}/books`,
      headers: { 'Idempotency-Key': 'abc-123' },
      body: { title: 'The Hidden Atlas', author: 'Quinn Avery', year: 2024, category: 'Fiction' }
    },
    {
      label: 'Create AGAIN (key=abc-123) → replay',
      method: 'POST',
      path: `${BASE}/books`,
      headers: { 'Idempotency-Key': 'abc-123' },
      body: { title: 'The Hidden Atlas', author: 'Quinn Avery', year: 2024, category: 'Fiction' }
    },
    {
      label: 'Create (key=xyz-789) → new book',
      method: 'POST',
      path: `${BASE}/books`,
      headers: { 'Idempotency-Key': 'xyz-789' },
      body: { title: 'Silver Harbor', author: 'Lena Voss', year: 2025, category: 'Mystery' }
    },
    { label: 'List books', method: 'GET', path: `${BASE}/books` },
    { label: 'Reset demo data', method: 'POST', path: `${BASE}/_reset` }
  ],
  register
};
