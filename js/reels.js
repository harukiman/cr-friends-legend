/*
 * reels.js — デジタル図柄（3列）の回転・停止制御
 * DOM の .reel img を高速で差し替えて回転を表現し、停止で目標図柄を確定。
 */
(function () {
  const SYMS = window.CONFIG.SYMBOLS;
  let els = [];     // {wrap, img, timer, idx}
  let spinning = [false, false, false];

  function init() {
    els = [...document.querySelectorAll('#reels .reel')].map((wrap, i) => ({
      wrap, img: wrap.querySelector('img'), timer: null, idx: i,
    }));
    // 初期表示
    els.forEach((e, i) => setSymbol(i, SYMS[i % SYMS.length]));
  }

  function setSymbol(i, sym) {
    els[i].img.src = window.ASSETS.url(sym.img);
    els[i].img.dataset.sym = sym.id;
  }

  function startAll() {
    els.forEach((_, i) => startOne(i));
  }
  function startOne(i) {
    if (spinning[i]) return;
    spinning[i] = true;
    els[i].wrap.classList.add('spinning');
    els[i].wrap.classList.remove('tenpai', 'stopped');
    let k = Math.floor(Math.random() * SYMS.length);
    els[i].timer = setInterval(() => {
      k = (k + 1) % SYMS.length;
      setSymbol(i, SYMS[k]);
    }, 60);
  }

  // i列を sym で停止。tenpai=テンパイ強調。
  function stop(i, sym, { tenpai = false } = {}) {
    if (els[i].timer) { clearInterval(els[i].timer); els[i].timer = null; }
    spinning[i] = false;
    els[i].wrap.classList.remove('spinning');
    setSymbol(i, sym);
    els[i].wrap.classList.add('stopped');
    if (tenpai) { els[0].wrap.classList.add('tenpai'); els[2].wrap.classList.add('tenpai'); }
    if (window.AUDIO) window.AUDIO.SE.stopReel(i);
  }

  function clearTenpai() {
    els.forEach(e => e.wrap.classList.remove('tenpai'));
  }

  // 揃っているか
  function isAllMatch(syms) { return syms[0].id === syms[1].id && syms[1].id === syms[2].id; }
  function isTenpai(syms) { return syms[0].id === syms[2].id; }

  window.REELS = { init, startAll, startOne, stop, clearTenpai, setSymbol, isAllMatch, isTenpai,
                   get count() { return SYMS.length; } };
})();
