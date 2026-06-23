'use strict';

// 状態を変更するパターンが共有する、ごく小さなインメモリ・リポジトリ。
// createStore(seedFn) でパターンごとに独立したストアを持てる。

class Store {
  constructor(seedFn) {
    this._seedFn = seedFn;
    this.reset();
  }

  reset() {
    this.items = this._seedFn();
    this._seq = this.items.length; // id 採番用カウンタ
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

  remove(id) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }

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
