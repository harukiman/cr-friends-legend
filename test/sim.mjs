/*
 * sim.mjs — モンテカルロ監査
 *   1) 各スペックの実測大当り確率が定義値の ±約3% 以内か
 *   2) 確変中の分母切替が効いているか
 *   3) 各演出の実測信頼度 P(hit|演出) が config.reliability と整合するか
 *
 * 実行: node test/sim.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CONFIG = require('../js/config.js');
const RNG = require('../js/rng.js');

const N = 2_000_000;
let failures = 0;
function check(name, ok, detail) {
  const tag = ok ? 'PASS' : 'FAIL';
  if (!ok) failures++;
  console.log(`  [${tag}] ${name}${detail ? '  ' + detail : ''}`);
}

console.log('=== 1) 大当り確率監査 (N=%s/spec) ===', N.toLocaleString());
for (const key of Object.keys(CONFIG.SPECS)) {
  const spec = CONFIG.SPECS[key];
  // 通常時
  let hits = 0;
  for (let i = 0; i < N; i++) if (RNG.drawHit(spec, false)) hits++;
  const odds = N / hits;
  const want = spec.normalOdds;
  const ok = Math.abs(odds - want) / want < 0.03;
  check(`${spec.name} 通常`, ok, `実測 1/${odds.toFixed(1)} (定義 1/${want})`);

  // 確変時
  let kh = 0;
  for (let i = 0; i < N; i++) if (RNG.drawHit(spec, true)) kh++;
  const khOdds = N / kh;
  const okk = Math.abs(khOdds - spec.kakuhenOdds) / spec.kakuhenOdds < 0.03;
  check(`${spec.name} 確変`, okk, `実測 1/${khOdds.toFixed(1)} (定義 1/${spec.kakuhenOdds.toFixed(1)})`);
}

console.log('\n=== 2) 確変突入率監査 ===');
for (const key of Object.keys(CONFIG.SPECS)) {
  const spec = CONFIG.SPECS[key];
  let k = 0;
  for (let i = 0; i < N; i++) if (RNG.drawKakuhen(spec)) k++;
  const rate = k / N;
  const ok = Math.abs(rate - spec.kakuhenRate) < 0.01;
  check(`${spec.name} 確変突入`, ok, `実測 ${(rate * 100).toFixed(1)}% (定義 ${(spec.kakuhenRate * 100).toFixed(0)}%)`);
}

console.log('\n=== 3) 演出信頼度監査 (ミドル基準) ===');
// ミドルの通常時 P(hit) を基準に、各演出が出た時の実測当り率を集計
const spec = CONFIG.SPECS.middle;
const pHit = 1 / spec.normalOdds;
const counters = {}; // catId -> { itemId -> {hit, total} }
const cats = ['hold', 'su', 'reach', 'pseudo'];
for (const c of cats) counters[c] = {};

const M = 6_000_000; // 演出は当り基準で集計するため多めに
for (let i = 0; i < M; i++) {
  const hit = Math.random() < pHit;
  const prod = RNG.pickProduction(hit, pHit);
  const map = { hold: prod.hold, su: prod.su, reach: prod.reach, pseudo: prod.pseudo };
  for (const c of cats) {
    const id = map[c].id;
    const slot = (counters[c][id] ||= { hit: 0, total: 0 });
    slot.total++; if (hit) slot.hit++;
  }
}

for (const c of cats) {
  console.log(` --- ${c} ---`);
  const items = CONFIG.PRODUCTIONS[c];
  for (const it of items) {
    const s = counters[c][it.id];
    if (!s || s.total < 50) { console.log(`  [skip] ${it.id} (出現${s ? s.total : 0}回)`); continue; }
    const rel = s.hit / s.total;
    const want = (it.reliability != null) ? it.reliability : null;
    if (want == null) { console.log(`  [info] ${it.id}: 実測信頼度 ${(rel * 100).toFixed(1)}%`); continue; }
    // 信頼度は順序が正しいことが最重要。絶対値は ±50%相対 or ±5pt 以内を緩く許容
    const ok = Math.abs(rel - want) <= Math.max(0.05, want * 0.5);
    check(`${c}/${it.id}`, ok, `実測 ${(rel * 100).toFixed(1)}% (目安 ${(want * 100).toFixed(0)}%) 出現${s.total}`);
  }
}

console.log('\n=== 4) 信頼度の単調性監査 (上位演出ほど高信頼度) ===');
function monotonic(catId, orderIds) {
  let prev = -1, ok = true, seq = [];
  for (const id of orderIds) {
    const s = counters[catId][id];
    if (!s || s.total < 50) continue;
    const rel = s.hit / s.total;
    seq.push(`${id}:${(rel * 100).toFixed(1)}%`);
    if (rel < prev - 0.01) ok = false; // 多少のノイズ許容
    prev = rel;
  }
  check(`${catId} 単調増加`, ok, seq.join(' < '));
}
monotonic('hold', ['white', 'blue', 'green', 'red', 'gold', 'rainbow']);
monotonic('su', ['step1', 'step2', 'step3', 'step4', 'step5']);
monotonic('reach', ['none', 'normal', 'super', 'cutin_red', 'cutin_gold', 'allreel']);
monotonic('pseudo', ['p0', 'p2', 'p3', 'p4']);

console.log('\n=== 結果 ===');
if (failures === 0) { console.log('全監査 PASS ✅'); process.exit(0); }
else { console.log(`${failures} 件 FAIL ❌`); process.exit(1); }
