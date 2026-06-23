'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Pagination (opaque cursor / page tokens)
// ---------------------------------------------------------------------------
// Never return an unbounded list. Hand back a page plus an opaque
// nextPageToken; the client sends it back to fetch the following page.
// Opaque tokens (vs. raw offsets) let the server change its paging strategy
// later without breaking clients.
// Source: "API Design Patterns" (Geewax), ch. 21.

const books = seedBooks();
const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;
const BASE = '/api/pagination';

// The token simply encodes the next index — but because it is base64url'd and
// opaque, clients must treat it as a magic string, not arithmetic.
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
    title: 'Pagination',
    blurb: 'Return one bounded page at a time with an opaque token for the next one.',
    source: 'API Design Patterns (Geewax), ch. 21',
    docs:
      'A List endpoint should never stream an unbounded collection. Return a fixed-size page ' +
      'and a nextPageToken. The client passes that token back via ?pageToken=... to get the ' +
      'next page, and keeps going until the token comes back null.\n\n' +
      'The token here is an opaque, base64url-encoded cursor. Keeping it opaque (rather than a ' +
      'plain ?offset=10) means the server can switch paging strategies — offset, keyset, ' +
      'snapshot — without ever breaking existing clients.\n\n' +
      'Run the first demo, then use the "Next page →" button that appears to walk the cursor.'
  },
  demos: [
    { label: 'First page (pageSize=5)', method: 'GET', path: `${BASE}/books?pageSize=5` },
    { label: 'Tiny pages (pageSize=2)', method: 'GET', path: `${BASE}/books?pageSize=2` }
  ],
  register
};
