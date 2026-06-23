'use strict';

const { seedBooks, CATEGORIES } = require('../data');

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------
// Let clients narrow a collection with query parameters. Filters are ANDed
// together and an echo of the applied filters is returned so the response is
// self-describing.
// Source: "API Design Patterns" (Geewax), ch. 22.

const books = seedBooks();
const BASE = '/api/filtering';

function register(app) {
  app.get(`${BASE}/books`, (req, res) => {
    const { author, category, minYear, maxYear, q } = req.query;

    const applied = {};
    let result = books;

    if (author) {
      applied.author = author;
      result = result.filter((b) => b.author.toLowerCase().includes(author.toLowerCase()));
    }
    if (category) {
      applied.category = category;
      result = result.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    }
    if (minYear) {
      applied.minYear = Number(minYear);
      result = result.filter((b) => b.year >= Number(minYear));
    }
    if (maxYear) {
      applied.maxYear = Number(maxYear);
      result = result.filter((b) => b.year <= Number(maxYear));
    }
    if (q) {
      applied.q = q;
      result = result.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()));
    }

    res.json({ filter: applied, totalSize: result.length, books: result });
  });
}

module.exports = {
  meta: {
    id: 'filtering',
    title: 'Filtering',
    blurb: 'Narrow a collection with query parameters that combine with AND.',
    source: 'API Design Patterns (Geewax), ch. 22',
    docs:
      'Filtering lets a client ask for the subset of a collection it cares about. Each ' +
      'parameter is a separate, well-named field (author, category, minYear, q for a title ' +
      'search) and multiple filters are combined with AND.\n\n' +
      'The response echoes the filters it actually applied under "filter", so a response is ' +
      'self-describing and easy to debug. Available categories: ' + CATEGORIES.join(', ') + '.'
  },
  demos: [
    { label: 'Category = Design', method: 'GET', path: `${BASE}/books?category=Design` },
    { label: 'Security books since 2020', method: 'GET', path: `${BASE}/books?category=Security&minYear=2020` },
    { label: 'Title contains "Web"', method: 'GET', path: `${BASE}/books?q=Web` },
    { label: 'By author (Amundsen)', method: 'GET', path: `${BASE}/books?author=Amundsen` },
    { label: 'No filters (everything)', method: 'GET', path: `${BASE}/books` }
  ],
  register
};
