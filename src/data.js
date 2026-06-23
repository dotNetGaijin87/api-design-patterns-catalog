'use strict';

// Seed dataset shared by every pattern demo.
//
// Fittingly, the "resource" exposed by these example APIs is the very
// bookshelf this project was distilled from: a small library of API books.
// Each pattern that mutates state gets its OWN fresh copy via seedBooks(),
// so demos never interfere with one another and can be reset at any time.

const CATEGORIES = ['Design', 'Security', 'Delivery', 'Documentation', 'Architecture', 'Protocols'];

const SEED = [
  { id: 'book-01', title: 'API Design Patterns',                    author: 'JJ Geewax',                              year: 2021, category: 'Design',        pages: 480, rating: 4.6 },
  { id: 'book-02', title: 'Patterns for API Design',                author: 'Olaf Zimmermann et al.',                 year: 2023, category: 'Design',        pages: 480, rating: 4.5 },
  { id: 'book-03', title: 'The Design of Web APIs (2nd ed.)',       author: 'Arnaud Lauret',                          year: 2024, category: 'Design',        pages: 392, rating: 4.7 },
  { id: 'book-04', title: 'Principles of Web API Design',           author: 'James Higginbotham',                     year: 2021, category: 'Design',        pages: 416, rating: 4.4 },
  { id: 'book-05', title: 'API Security in Action',                 author: 'Neil Madden',                            year: 2020, category: 'Security',      pages: 576, rating: 4.8 },
  { id: 'book-06', title: 'Secure APIs',                            author: '—',                                      year: 2025, category: 'Security',      pages: 352, rating: 4.2 },
  { id: 'book-07', title: 'Designing APIs with Swagger and OpenAPI', author: 'J. Ponelat & L. Rosenstock',            year: 2022, category: 'Documentation', pages: 374, rating: 4.5 },
  { id: 'book-08', title: 'Automating API Delivery',                author: 'Ikenna Nwaiwu',                          year: 2025, category: 'Delivery',      pages: 312, rating: 4.1 },
  { id: 'book-09', title: 'RESTful Web APIs',                       author: 'L. Richardson & M. Amundsen',            year: 2013, category: 'Architecture',  pages: 406, rating: 4.5 },
  { id: 'book-10', title: 'Build APIs You Won\'t Hate',             author: 'Phil Sturgeon',                          year: 2014, category: 'Design',        pages: 256, rating: 4.3 },
  { id: 'book-11', title: 'Designing Web APIs',                     author: 'Jin, Sahni & Shevat',                    year: 2018, category: 'Design',        pages: 234, rating: 4.2 },
  { id: 'book-12', title: 'Continuous API Management',              author: 'Medjaoui, Wilde, Mitra & Amundsen',      year: 2021, category: 'Delivery',      pages: 350, rating: 4.4 },
  { id: 'book-13', title: 'REST in Practice',                       author: 'Webber, Parastatidis & Robinson',        year: 2010, category: 'Architecture',  pages: 448, rating: 4.3 },
  { id: 'book-14', title: 'GraphQL in Action',                      author: 'Samer Buna',                             year: 2021, category: 'Protocols',     pages: 384, rating: 4.1 },
  { id: 'book-15', title: 'gRPC: Up and Running',                   author: 'K. Indrasiri & D. Kuruppu',              year: 2020, category: 'Protocols',     pages: 222, rating: 4.2 },
  { id: 'book-16', title: 'Irresistible APIs',                      author: 'Kirsten Hunter',                         year: 2016, category: 'Design',        pages: 280, rating: 4.0 }
];

// Return a deep copy so callers can mutate freely.
function seedBooks() {
  return SEED.map((b) => ({ ...b }));
}

module.exports = { seedBooks, CATEGORIES };
