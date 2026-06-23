'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Standard Methods (List / Get / Create / Update / Delete)
// ---------------------------------------------------------------------------
// The five "standard methods" are the predictable CRUD verbs every resource
// should support before reaching for anything custom. Map them onto HTTP:
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
      title: req.body.title || 'Untitled',
      author: req.body.author || 'Unknown',
      year: req.body.year || new Date().getFullYear(),
      category: req.body.category || 'Fiction',
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
    // PATCH = only the supplied fields change; id is immutable.
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

  // Reset the demo data.
  app.post(`${BASE}/_reset`, (_req, res) => {
    books = seedBooks();
    nextId = books.length + 1;
    res.json({ reset: true, count: books.length });
  });
}

function notFound(res, id) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No book with id '${id}'.` } });
}

module.exports = {
  meta: {
    id: 'standard-methods',
    title: 'Standard Methods (CRUD)',
    blurb: 'The five predictable verbs every resource should support, mapped cleanly onto HTTP.',
    docs:
      'Before designing anything custom, give a resource the five "standard methods": List, ' +
      'Get, Create, Update, Delete. Consistency is the point — once a client learns the shape ' +
      'of one resource, every other resource behaves the same way.\n\n' +
      'Note the HTTP details that matter: Create returns 201 with a Location header pointing at ' +
      'the new resource; Update uses PATCH for partial changes (the id stays immutable); Delete ' +
      'returns 204 No Content. Try "Get (missing id)" to see a structured 404 error body.'
  },
  demos: [
    { label: 'List all books', method: 'GET', path: `${BASE}/books` },
    { label: 'Get one book', method: 'GET', path: `${BASE}/books/book-01` },
    { label: 'Get (missing id) → 404', method: 'GET', path: `${BASE}/books/book-999` },
    {
      label: 'Create a book → 201',
      method: 'POST',
      path: `${BASE}/books`,
      body: { title: 'The Hidden Atlas', author: 'Quinn Avery', year: 2024, category: 'Fiction', pages: 320, rating: 4.0 }
    },
    {
      label: 'Update a book (PATCH)',
      method: 'PATCH',
      path: `${BASE}/books/book-01`,
      body: { rating: 5.0 }
    },
    { label: 'Delete a book → 204', method: 'DELETE', path: `${BASE}/books/book-16` },
    { label: 'Reset demo data', method: 'POST', path: `${BASE}/_reset` }
  ],
  register
};
