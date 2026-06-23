'use strict';

// ごく小さなインメモリ・リポジトリ。状態を変更するパターンが seedBooks() の呼び出しや
// find / splice / id 採番を各自で書き直さずに済むよう、共通化したもの。
// createStore(seedFn) でパターンごとに独立したストアを持てる。

class Store {
  constructor(seedFn) {
    this._seedFn = seedFn;
    this.reset();
  }

  // シードから作り直し、id 採番カウンタも初期化する。
  reset() {
    this.items = this._seedFn();
    this._seq = this.items.length;
    return this;
  }

  list() {
    return this.items;
  }

  find(id) {
    return this.items.find((i) => i.id === id);
  }

  add(item) {
    this.items.push(item);
    return item;
  }

  // 見つかれば削除して true、なければ false。
  remove(id) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }

  // 'book-17' のような連番 id を払い出す。
  newId(prefix = 'book-') {
    return `${prefix}${String(++this._seq).padStart(2, '0')}`;
  }

  get size() {
    return this.items.length;
  }
}

function createStore(seedFn) {
  return new Store(seedFn);
}

module.exports = { createStore, Store };
