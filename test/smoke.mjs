/*
 * smoke.mjs — ブラウザJSを最小DOM/AudioスタブでNode実行する煙テスト。
 * 目的: ReferenceError・undefined参照・演出シーケンスの例外を自動検出する。
 *   - 全モジュール読込 → DOMContentLoaded → 強制スピン(当り/ハズレ/復活/全回転)
 *   - 発射→入賞→消化フローを回し、未捕捉例外が無いことを確認。
 * 実行: node test/smoke.mjs
 */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
let errors = [];
const onErr = (where, e) => errors.push(`${where}: ${e && e.stack ? e.stack.split('\n')[0] : e}`);

// ---- 最小DOMスタブ ----
function makeEl(tag = 'div') {
  const cls = new Set();
  const el = {
    tagName: tag, _children: [], dataset: {}, style: {}, textContent: '', innerHTML: '',
    value: '', selected: false, width: 320, height: 90, offsetWidth: 100,
    classList: {
      add: (...c) => c.forEach(x => cls.add(x)),
      remove: (...c) => c.forEach(x => cls.delete(x)),
      toggle: (c, f) => { const has = cls.has(c); const on = f === undefined ? !has : f; on ? cls.add(c) : cls.delete(c); return !on ? true : false; },
      contains: c => cls.has(c),
    },
    addEventListener: () => {}, removeEventListener: () => {},
    appendChild: ch => { el._children.push(ch); return ch; },
    setAttribute: () => {}, getAttribute: () => null,
    getContext: () => fakeCtx,
    querySelector: sel => el._q ? el._q(sel) : makeEl(),
    querySelectorAll: () => [],
  };
  return el;
}
const fakeCtx = new Proxy({}, { get: (_, p) => (p === 'canvas' ? { width: 320, height: 90 } : () => {}) });

const cache = new Map();
function reel(i) {
  const r = makeEl('div'); const img = makeEl('img'); img.dataset = {};
  r._q = sel => (sel === 'img' ? img : makeEl());
  return r;
}
const reels = [reel(0), reel(1), reel(2)];
const holds = [makeEl(), makeEl(), makeEl(), makeEl()];

function get(sel) {
  if (cache.has(sel)) return cache.get(sel);
  let el = makeEl();
  // 子要素を持つ複合FX
  el._q = inner => {
    const k = sel + ' ' + inner;
    if (!cache.has(k)) cache.set(k, makeEl());
    return cache.get(k);
  };
  cache.set(sel, el);
  return el;
}

const document = {
  querySelector: sel => {
    if (sel === '#lane') return get('#lane');
    return get(sel);
  },
  querySelectorAll: sel => {
    if (sel === '#reels .reel') return reels;
    if (sel === '.hold-slot') return holds;
    return [];
  },
  getElementById: id => get('#' + id),
  createElement: tag => makeEl(tag),
  addEventListener: (ev, cb) => { if (ev === 'DOMContentLoaded') document._domready = cb; },
};

// ---- Audio / Image / timers スタブ ----
class FakeImage { set src(v) { this._src = v; if (this.onload) setTimeout(() => this.onload(), 0); } get src() { return this._src; } }
class FakeAC {
  constructor() { this.currentTime = 0; this.state = 'running'; this.sampleRate = 44100;
    this.destination = {}; }
  createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect: () => {} }) }; }
  createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect: () => {} }), start() {}, stop() {} }; }
  createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
  createBufferSource() { return { buffer: null, connect: () => ({ connect: () => ({ connect: () => ({ connect: () => {} }) }) }), start() {}, stop() {} }; }
  createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect: () => ({ connect: () => ({ connect: () => {} }) }) }; }
  resume() {}
}

// setTimeout を高速化（遅延無視）して演出を即時進行
const realTO = setTimeout;
const fastTO = (cb) => realTO(cb, 0);

const sandbox = {
  console, Math, Date, JSON, Array, Object, Number, String, Boolean, Float32Array, Image: FakeImage,
  AudioContext: FakeAC, webkitAudioContext: FakeAC,
  setTimeout: fastTO, clearTimeout, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, // ループは1回も回さない
  Promise, document,
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
sandbox.addEventListener = (ev, cb) => { if (ev === 'DOMContentLoaded') sandbox._domready = cb; };
vm.createContext(sandbox);

// ---- モジュール読込 ----
const files = ['js/config.js','js/assets.js','js/audio.js','js/rng.js','js/reels.js',
               'js/production.js','js/game.js','js/ui.js','js/main.js'];
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f }); }
  catch (e) { onErr('load ' + f, e); }
}

// 未捕捉Promise拒否を捕捉
process.on('unhandledRejection', e => onErr('unhandledRejection', e));

async function main() {
  // DOMContentLoaded 発火
  try { await sandbox._domready(); } catch (e) { onErr('domready', e); }

  // 各種強制スピンを順に流す（例外検出が目的）
  const scenarios = [
    { name: 'miss-normal', o: { reachId: 'normal', hit: false } },
    { name: 'miss-super',  o: { reachId: 'super', hit: false } },
    { name: 'miss-cutin',  o: { reachId: 'cutin_red', hit: false } },
    { name: 'hit-normal',  o: { reachId: 'super', hit: true, kakuhen: false } },
    { name: 'hit-kakuhen', o: { reachId: 'cutin_gold', hit: true, kakuhen: true } },
    { name: 'hit-revival', o: { reachId: 'cutin_red', hit: true, revival: true, kakuhen: true } },
    { name: 'hit-allreel', o: { reachId: 'allreel', hit: true, kakuhen: true } },
  ];
  for (const s of scenarios) {
    try { await sandbox.window.GAME.forcePlay(s.o); console.log('  [ok] ' + s.name); }
    catch (e) { onErr('forcePlay ' + s.name, e); console.log('  [ERR] ' + s.name); }
  }

  // 発射→入賞→消化フローを少し回す
  try {
    sandbox.window.GAME.fireStart();
    await new Promise(r => realTO(r, 400));
    sandbox.window.GAME.fireStop();
    await new Promise(r => realTO(r, 200));
    console.log('  [ok] fire-flow  snapshot=', JSON.stringify(sandbox.window.GAME.snapshot()));
  } catch (e) { onErr('fire-flow', e); }

  await new Promise(r => realTO(r, 100));

  console.log('\n=== smoke 結果 ===');
  if (errors.length === 0) { console.log('例外なし PASS ✅'); process.exit(0); }
  else { errors.forEach(e => console.log('  ❌ ' + e)); process.exit(1); }
}
main();
