'use strict';

const { seedBooks, CATEGORIES } = require('../data');

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------
// Let clients narrow a collection with query parameters. Filters are ANDed
// together and an echo of the applied filters is returned so the response is
// self-describing.

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
    docs:
      'Filtering lets a client ask for the subset of a collection it cares about. Each ' +
      'parameter is a separate, well-named field (author, category, minYear, q for a title ' +
      'search) and multiple filters are combined with AND.\n\n' +
      'The response echoes the filters it actually applied under "filter", so a response is ' +
      'self-describing and easy to debug. Available categories: ' + CATEGORIES.join(', ') + '.'
  },
  demos: [
    { label: 'Category = Fantasy', method: 'GET', path: `${BASE}/books?category=Fantasy` },
    { label: 'Sci-Fi since 2023', method: 'GET', path: `${BASE}/books?category=Sci-Fi&minYear=2023` },
    { label: 'Title contains "Tide"', method: 'GET', path: `${BASE}/books?q=Tide` },
    { label: 'By author (Vale)', method: 'GET', path: `${BASE}/books?author=Vale` },
    { label: 'No filters (everything)', method: 'GET', path: `${BASE}/books` }
  ],
  register
};
