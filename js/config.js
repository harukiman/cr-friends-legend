/*
 * config.js — ゲーム設計の心臓部
 * スペック定義（甘デジ / ライトミドル / ミドル）と
 * 演出の信頼度テーブル（当り時／ハズレ時の出現重み）をここに集約する。
 *
 * 設計思想:
 *   各演出の「信頼度(%)」は production.js が直接決めるのではなく、
 *   「当り抽選の結果(hit/miss)」を先に確定 → その結果に応じて
 *   演出を重み付き抽選する、という順序で生成する。
 *   こうすると信頼度 = P(hit | 演出) が
 *      weightHit*P(hit) / (weightHit*P(hit) + weightMiss*P(miss))
 *   で理論計算でき、test/sim.mjs のモンテカルロで検証できる。
 */

const SYMBOLS = [
  { id: 'peace',  img: 'reel_peace.jpg',  label: 'ピース',     rank: 1 },
  { id: 'mosaic', img: 'reel_mosaic.jpg', label: 'モザイク',   rank: 2 },
  { id: 'doya',   img: 'reel_doya.jpg',   label: 'ドヤ',       rank: 3 },
  { id: 'hero',   img: 'reel_hero.jpg',   label: 'ヒーロー',   rank: 4 },
  { id: 'black',  img: 'reel_black.jpg',  label: '黒塗り',     rank: 5 },
  { id: 'legend', img: 'reel_legend.jpg', label: '50年後',     rank: 6 },
];

// 確変図柄（奇数役物の代わり）。揃うと確変、それ以外は通常当り。
const KAKUHEN_SYMBOLS = ['doya', 'black', 'legend'];

/*
 * スペック定義
 *  - normalOdds : 通常時の大当り確率分母 (1/N)
 *  - kakuhenOdds: 確変(高確)時の大当り確率分母
 *  - kakuhenRate: 大当り後に確変へ突入する割合
 *  - stCount    : 確変/時短の継続回転数 (0=次回まで等は簡略化)
 *  - rounds     : 1回の大当りラウンド数
 *  - payoutPerRound: 1ラウンドあたりの出玉(概算)
 *  - reachRate  : ハズレ時にリーチへ発展する割合(演出頻度の素)
 */
const SPECS = {
  amadeji: {
    name: '甘デジ', normalOdds: 99, kakuhenOdds: 99 / 3.3,
    kakuhenRate: 0.65, stCount: 100, rounds: 4, payoutPerRound: 75,
    reachRate: 0.18,
  },
  light: {
    name: 'ライトミドル', normalOdds: 199, kakuhenOdds: 199 / 3.3,
    kakuhenRate: 0.65, stCount: 80, rounds: 7, payoutPerRound: 65,
    reachRate: 0.14,
  },
  middle: {
    name: 'ミドル', normalOdds: 319, kakuhenOdds: 65,
    kakuhenRate: 0.80, stCount: 120, rounds: 10, payoutPerRound: 150,
    reachRate: 0.11,
  },
};

/*
 * 演出テーブル（信頼度を厳密に成立させるモデル）
 *
 *  各カテゴリは排他の「段階」を持つ。
 *   - hitWeight   : 「当り回転」がその演出を選ぶ相対重み（当りの見え方を設計）
 *   - reliability : 狙いの信頼度 P(hit|演出)。これが READMEの値であり最終目標。
 *   - filler:true : 「何も起きない」基準段階。ハズレ時の余り確率を全て吸収する。
 *
 *  rng.js は当りの基準確率 pHit を使い、非fillerのハズレ確率を
 *      m_i = (pHit/pMiss) * h_i * (1-r_i)/r_i      (h_i = hitWeight正規化値)
 *  で算出する。これにより各演出の信頼度は「正規化や他項目に依存せず」
 *  厳密に r_i に一致する（証明: P(i)=pHit*h_i/r_i, P(hit&i)=pHit*h_i ⇒ r=r_i）。
 *  低スペックほど同じ演出の信頼度が自然に上がる＝実機と同じ挙動。
 */
const PRODUCTIONS = {
  // 保留先読み（次回転以降の信頼度示唆）
  hold: [
    { id: 'white',  label: '白', color: '#e8e8e8', hitWeight: 40,   reliability: 0.03, filler: true },
    { id: 'blue',   label: '青', color: '#3aa0ff', hitWeight: 30,   reliability: 0.05 },
    { id: 'green',  label: '緑', color: '#39d353', hitWeight: 18,   reliability: 0.15 },
    { id: 'red',    label: '赤', color: '#ff3b3b', hitWeight: 9,    reliability: 0.40 },
    { id: 'gold',   label: '金', color: '#ffd23b', hitWeight: 2.5,  reliability: 0.80 },
    { id: 'rainbow',label: '虹', color: '#ff6ec7', hitWeight: 0.5,  reliability: 1.00 },
  ],

  // ステップアップ予告（STEP到達数）
  su: [
    { id: 'step1', label: 'STEP1',     step: 1, hitWeight: 35, reliability: 0.02, filler: true },
    { id: 'step2', label: 'STEP2',     step: 2, hitWeight: 30, reliability: 0.07 },
    { id: 'step3', label: 'STEP3',     step: 3, hitWeight: 20, reliability: 0.25 },
    { id: 'step4', label: 'STEP4',     step: 4, hitWeight: 11, reliability: 0.55 },
    { id: 'step5', label: 'STEP5(虹)', step: 5, hitWeight: 4,  reliability: 0.92 },
  ],

  // リーチ（発展先）。none=リーチなしハズレ（filler / 当りは選べない）。
  reach: [
    { id: 'none',   label: 'リーチなし', kind: 'none', hitWeight: 0, reliability: 0.00, filler: true },
    { id: 'normal', label: 'ノーマルリーチ', kind: 'normal', hitWeight: 55, reliability: 0.07 },
    { id: 'super',  label: 'スーパーリーチ(ドヤ)', kind: 'super', img: 'reel_doya.jpg',
      hitWeight: 30, reliability: 0.30, sound: 'super' },
    { id: 'cutin_red', label: '激熱カットイン(黒塗り)', kind: 'cutin', img: 'reel_black.jpg',
      hitWeight: 9, reliability: 0.70, sound: 'cutin' },
    { id: 'cutin_gold', label: '金カットイン(ヒーロー)', kind: 'cutin', img: 'reel_hero.jpg',
      hitWeight: 4, reliability: 0.90, sound: 'cutin' },
    { id: 'allreel', label: '全回転リーチ(50年後)', kind: 'allreel', img: 'reel_legend.jpg',
      hitWeight: 2, reliability: 0.98, sound: 'allreel' },
  ],

  // 擬似連（回数）。0=なし(filler)。
  pseudo: [
    { id: 'p0', count: 0, hitWeight: 45, reliability: 0.03, filler: true },
    { id: 'p2', count: 2, hitWeight: 33, reliability: 0.10 },
    { id: 'p3', count: 3, hitWeight: 17, reliability: 0.30 },
    { id: 'p4', count: 4, hitWeight: 5,  reliability: 0.60 },
  ],
};

// 復活演出（テンパイハズレ後に当りへ戻す）：当り時のみ稀に発動
const REVIVAL_RATE = 0.12; // 当りなのに一旦ハズレ目→復活、の割合

const DEFAULT_SPEC = 'middle';

// Node(test) と ブラウザの両対応エクスポート
const CONFIG = { SYMBOLS, KAKUHEN_SYMBOLS, SPECS, PRODUCTIONS, REVIVAL_RATE, DEFAULT_SPEC };
if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
if (typeof window !== 'undefined') window.CONFIG = CONFIG;
