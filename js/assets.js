/*
 * assets.js — 画像プリローダ
 * SYMBOLS の img と、演出で使う画像を assets/img/ から読み込む。
 */
(function () {
  const cache = {};
  const BASE = 'assets/img/';

  function load() {
    const files = new Set();
    (window.CONFIG.SYMBOLS || []).forEach(s => files.add(s.img));
    // 演出で参照される画像も収集
    Object.values(window.CONFIG.PRODUCTIONS).forEach(arr =>
      arr.forEach(it => { if (it.img) files.add(it.img); }));

    const list = [...files];
    return Promise.all(list.map(f => new Promise(res => {
      const img = new Image();
      img.onload = () => { cache[f] = img; res(); };
      img.onerror = () => { console.warn('画像読込失敗:', f); res(); };
      img.src = BASE + f;
    })));
  }

  function get(file) { return cache[file] || null; }
  function url(file) { return BASE + file; }

  window.ASSETS = { load, get, url };
})();
