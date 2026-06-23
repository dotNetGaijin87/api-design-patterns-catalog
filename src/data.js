'use strict';

// Seed dataset shared by every pattern demo.
//
// The example resource is a small catalog of (fictional) books — a familiar,
// neutral domain for showing CRUD, paging, filtering, and the rest. Each
// pattern that mutates state gets its OWN fresh copy via seedBooks(), so demos
// never interfere with one another and can be reset at any time.

const CATEGORIES = ['Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'History', 'Cookbook'];

const SEED = [
  { id: 'book-01', title: 'The Glass Forest',        author: 'Mara Quinn',     year: 2019, category: 'Fantasy',  pages: 412, rating: 4.4 },
  { id: 'book-02', title: 'Tideborn',                author: 'E. R. Vale',     year: 2021, category: 'Fantasy',  pages: 380, rating: 4.2 },
  { id: 'book-03', title: 'Quantum Tea',             author: 'Priya Anand',    year: 2023, category: 'Sci-Fi',   pages: 336, rating: 4.6 },
  { id: 'book-04', title: 'The Lantern Office',      author: 'Tom Bradbury',   year: 2018, category: 'Mystery',  pages: 290, rating: 4.1 },
  { id: 'book-05', title: 'Salt and Cedar',          author: 'Nina Hollis',    year: 2020, category: 'Fiction',  pages: 354, rating: 4.7 },
  { id: 'book-06', title: 'Northwind',               author: 'Karl Sefton',    year: 2016, category: 'Fiction',  pages: 268, rating: 4.0 },
  { id: 'book-07', title: 'The Last Cartographer',   author: 'Lucia Mendez',   year: 2022, category: 'Fiction',  pages: 402, rating: 4.5 },
  { id: 'book-08', title: 'Echoes of Mars',          author: 'D. K. Rao',      year: 2024, category: 'Sci-Fi',   pages: 318, rating: 4.3 },
  { id: 'book-09', title: 'The Copper Door',         author: 'Hannah Pike',    year: 2015, category: 'Mystery',  pages: 276, rating: 4.2 },
  { id: 'book-10', title: 'Midnight Orchard',        author: 'S. Okafor',      year: 2021, category: 'Fiction',  pages: 360, rating: 4.4 },
  { id: 'book-11', title: 'The Paper Astronomer',    author: 'Owen Frost',     year: 2017, category: 'Sci-Fi',   pages: 344, rating: 4.1 },
  { id: 'book-12', title: 'Brambleheart',           author: 'J. M. Cole',     year: 2013, category: 'Fantasy',  pages: 298, rating: 4.0 },
  { id: 'book-13', title: 'The Quiet Tide',          author: 'Ana Beltran',    year: 2025, category: 'Fiction',  pages: 312, rating: 4.6 },
  { id: 'book-14', title: 'Ironwood Hollow',         author: 'Greg Mallory',   year: 2012, category: 'Fantasy',  pages: 430, rating: 4.2 },
  { id: 'book-15', title: 'The Saffron Notebook',    author: 'Leila Nadir',    year: 2020, category: 'Mystery',  pages: 284, rating: 4.3 },
  { id: 'book-16', title: 'Weeknight Feasts',        author: 'Rosa Lindqvist', year: 2023, category: 'Cookbook', pages: 240, rating: 4.5 }
];

// Return a deep copy so callers can mutate freely.
function seedBooks() {
  return SEED.map((b) => ({ ...b }));
}

module.exports = { seedBooks, CATEGORIES };
