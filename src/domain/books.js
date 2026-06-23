'use strict';

// 全パターンのデモが共有するシードデータ（架空ではなく実在の日本の書籍カタログ）。
// 状態を変更するパターンは createStore(seedBooks) で自分専用のコピーを持つ。

const CATEGORIES = ['純文学', 'ミステリー', 'SF', 'ファンタジー', '歴史'];

const SEED = [
  { id: 'book-01', title: '吾輩は猫である', author: '夏目漱石',     year: 1905, category: '純文学',       pages: 470, rating: 4.2 },
  { id: 'book-02', title: 'こころ',         author: '夏目漱石',     year: 1914, category: '純文学',       pages: 280, rating: 4.5 },
  { id: 'book-03', title: '羅生門',         author: '芥川龍之介',   year: 1915, category: '純文学',       pages: 120, rating: 4.3 },
  { id: 'book-04', title: '雪国',           author: '川端康成',     year: 1948, category: '純文学',       pages: 180, rating: 4.4 },
  { id: 'book-05', title: '人間失格',       author: '太宰治',       year: 1948, category: '純文学',       pages: 160, rating: 4.6 },
  { id: 'book-06', title: '銀河鉄道の夜',   author: '宮沢賢治',     year: 1934, category: 'ファンタジー', pages: 200, rating: 4.5 },
  { id: 'book-07', title: '日本沈没',       author: '小松左京',     year: 1973, category: 'SF',           pages: 520, rating: 4.1 },
  { id: 'book-08', title: '燃えよ剣',       author: '司馬遼太郎',   year: 1964, category: '歴史',         pages: 600, rating: 4.4 },
  { id: 'book-09', title: 'ノルウェイの森', author: '村上春樹',     year: 1987, category: '純文学',       pages: 400, rating: 4.3 },
  { id: 'book-10', title: '白夜行',         author: '東野圭吾',     year: 1999, category: 'ミステリー',   pages: 860, rating: 4.7 },
  { id: 'book-11', title: '海辺のカフカ',   author: '村上春樹',     year: 2002, category: 'ファンタジー', pages: 640, rating: 4.4 },
  { id: 'book-12', title: '容疑者Xの献身',  author: '東野圭吾',     year: 2005, category: 'ミステリー',   pages: 390, rating: 4.6 },
  { id: 'book-13', title: '新世界より',     author: '貴志祐介',     year: 2008, category: 'SF',           pages: 1000, rating: 4.5 },
  { id: 'book-14', title: '火花',           author: '又吉直樹',     year: 2015, category: '純文学',       pages: 150, rating: 4.0 },
  { id: 'book-15', title: 'コンビニ人間',   author: '村田沙耶香',   year: 2016, category: '純文学',       pages: 170, rating: 4.4 },
  { id: 'book-16', title: '蜜蜂と遠雷',     author: '恩田陸',       year: 2016, category: '純文学',       pages: 510, rating: 4.6 }
];

function seedBooks() {
  return SEED.map((b) => ({ ...b }));
}

module.exports = { seedBooks, CATEGORIES };
