/*
 * rng.js — 抽選エンジン（ブラウザ / Node 共通）
 *
 * 抽選の順序が信頼度の正しさを保証する:
 *   1) drawHit() で当落を先に確定（確変フラグで分母を切替）
 *   2) pickProduction() で当落に応じた重みで演出を抽選
 *   3) pickKakuhen() で当り後の確変突入を判定
 * これにより「信頼度 = P(hit|演出)」が config の重みから理論計算でき、
 * test/sim.mjs のモンテカルロで検証可能。
 */
(function (root, factory) {
  const CONFIG = (typeof require !== 'undefined') ? require('./config.js') : root.CONFIG;
  const RNG = factory(CONFIG);
  if (typeof module !== 'undefined' && module.exports) module.exports = RNG;
  if (typeof window !== 'undefined') window.RNG = RNG;
})(typeof self !== 'undefined' ? self : this, function (CONFIG) {

  // 差し替え可能な乱数源（テストでシード固定するため）
  let _rand = Math.random;
  function setRandom(fn) { _rand = fn; }

  // mulberry32: 軽量シード付きPRNG（再現テスト用）
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 当落抽選。kakuhen=true なら高確分母を使う。mult=設定補正(小さいほど甘い)。
  function drawHit(spec, kakuhen, mult = 1) {
    const odds = (kakuhen ? spec.kakuhenOdds : spec.normalOdds) * mult;
    return _rand() < (1 / odds);
  }

  // 確変突入判定。bonus=設定補正。
  function drawKakuhen(spec, bonus = 0) {
    return _rand() < Math.max(0, Math.min(1, spec.kakuhenRate + bonus));
  }

  // 確率配列から1件抽選（probs は合計1想定、誤差は末尾吸収）
  function pickByProb(items, probs) {
    let r = _rand();
    for (let i = 0; i < items.length; i++) {
      r -= probs[i];
      if (r < 0) return items[i];
    }
    return items[items.length - 1];
  }

  /*
   * カテゴリ1つを当落と基準確率から抽選。
   *   hit  : 当り回転は hitWeight 正規化で選ぶ（当りの見え方）
   *   miss : 非fillerは m_i=(pHit/pMiss)*h_i*(1-r_i)/r_i、fillerが残りを吸収
   * 戻り値の信頼度は理論上ちょうど reliability に一致する。
   */
  function pickCategory(items, hit, pHit) {
    const pMiss = 1 - pHit;
    let HW = 0;
    for (const it of items) HW += (it.hitWeight || 0);

    if (hit) {
      // hitWeight 総和0（テーブル誤編集）の保険: filler/先頭を返す
      if (HW <= 0) return items.find(it => it.filler) || items[0];
      // hitWeight=0 の段階（reach none 等）は当りでは選ばれない
      const probs = items.map(it => (it.hitWeight || 0) / HW);
      return pickByProb(items, probs);
    }

    // miss: 非filler確率を算出し、filler が残余を取る
    const probs = new Array(items.length).fill(0);
    let fillerIdx = -1, sumNonFiller = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.filler) { fillerIdx = i; continue; }
      const r = it.reliability;
      if (!r || r <= 0) { probs[i] = 0; continue; }      // reliability0→ミス側に出さない
      if (r >= 1) { probs[i] = 0; continue; }            // 信頼度100%→ミスでは絶対出ない
      const h = (it.hitWeight || 0) / HW;
      const m = (pHit / pMiss) * h * (1 - r) / r;
      probs[i] = m;
      sumNonFiller += m;
    }
    if (fillerIdx >= 0) probs[fillerIdx] = Math.max(0, 1 - sumNonFiller);
    return pickByProb(items, probs);
  }

  // 1回転ぶんの演出パッケージを生成（pHit=その回転の基準当り確率）
  function pickProduction(hit, pHit) {
    const P = CONFIG.PRODUCTIONS;
    const hold   = pickCategory(P.hold,   hit, pHit);
    const su     = pickCategory(P.su,     hit, pHit);
    const pseudo = pickCategory(P.pseudo, hit, pHit);
    let reach    = pickCategory(P.reach,  hit, pHit);

    // 当りなのに reach=none は矛盾 → 最低ノーマルリーチへ引き上げ（保険）
    if (hit && reach.kind === 'none') {
      reach = P.reach.find(r => r.kind === 'normal');
    }
    // 復活: 当りの一部で「一旦ハズレ目→復活」フラグ
    const revival = hit && (_rand() < CONFIG.REVIVAL_RATE);

    return { hold, su, pseudo, reach, revival, hit };
  }

  // 図柄の停止目を決める（演出と当落から最終ライン3つ）
  function pickStopSymbols(prod, kakuhenWanted) {
    const syms = CONFIG.SYMBOLS;
    const pickRandom = () => syms[Math.floor(_rand() * syms.length)];

    if (prod.hit) {
      // 当り: 確変希望なら確変図柄から、なければ全図柄から1つ選んで3つ揃え
      let pool = syms;
      if (kakuhenWanted) pool = syms.filter(s => CONFIG.KAKUHEN_SYMBOLS.includes(s.id));
      else               pool = syms.filter(s => !CONFIG.KAKUHEN_SYMBOLS.includes(s.id));
      if (pool.length === 0) pool = syms;
      const s = pool[Math.floor(_rand() * pool.length)];
      return [s, s, s];
    }

    // ハズレ: reach有無で形を変える
    const a = pickRandom();
    if (prod.reach && prod.reach.kind !== 'none') {
      // テンパイハズレ: 両端同じ、中央だけ別
      let mid = pickRandom();
      let guard = 0;
      while (mid.id === a.id && guard++ < 20) mid = pickRandom();
      return [a, mid, a];
    }
    // 完全バラ目
    let b = pickRandom(), c = pickRandom(), guard = 0;
    while (a.id === b.id && b.id === c.id && guard++ < 20) c = pickRandom();
    return [a, b, c];
  }

  return {
    setRandom, mulberry32, drawHit, drawKakuhen,
    pickCategory, pickProduction, pickStopSymbols,
  };
});
