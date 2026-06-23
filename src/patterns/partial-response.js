'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Partial Response (field masks)
// ---------------------------------------------------------------------------
// Let the client choose which fields come back via ?fields=id,title,author.
// Smaller payloads, less over-fetching — the REST cousin of GraphQL's
// selection sets.

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
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `No book '${req.params.id}'.` } });
    }
    res.json(pick(book, parseFields(req.query.fields)));
  });
}

module.exports = {
  meta: {
    id: 'partial-response',
    title: 'Partial Response (field masks)',
    blurb: 'Let the client request only the fields it needs with ?fields=id,title.',
    docs:
      'Mobile clients and dashboards rarely need every field of a resource. A field mask — ' +
      '?fields=id,title,author — lets the caller project exactly the columns it wants, shrinking ' +
      'payloads and avoiding over-fetching. It is the REST cousin of a GraphQL selection set.\n\n' +
      'Compare "Full objects" with "Only id + title": same endpoint, dramatically different ' +
      'payload size. Unknown field names are simply ignored rather than erroring.'
  },
  demos: [
    { label: 'Full objects (all fields)', method: 'GET', path: `${BASE}/books` },
    { label: 'Only id + title', method: 'GET', path: `${BASE}/books?fields=id,title` },
    { label: 'Title, author, rating', method: 'GET', path: `${BASE}/books?fields=title,author,rating` },
    { label: 'Single book, two fields', method: 'GET', path: `${BASE}/books/book-05?fields=title,year` }
  ],
  register
};
