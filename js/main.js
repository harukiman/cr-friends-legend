/*
 * main.js — 初期化エントリ
 * 画像プリロード → 各モジュール初期化 → ゲーム開始。
 */
window.addEventListener('DOMContentLoaded', async () => {
  window.PRODUCTION.init();
  window.UI.init();

  // 画像プリロード（失敗してもゲームは動く）
  await window.ASSETS.load();
  window.REELS.init();

  window.GAME.init({ onChange: st => window.UI.render(st) });

  window.PRODUCTION.msg('「発射」を長押しで打ち出し開始！');
});
