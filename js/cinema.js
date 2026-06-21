/*
 * cinema.js — シネマティック・ムービー再生エンジン
 * シーン配列を受け取り、レターボックス＋立ち絵スライドイン＋タイプライター字幕で再生。
 * 画面タップでスキップ可。play() は完了/スキップで解決する Promise を返す。
 *
 * scene: {
 *   bg?:   CSS背景(グラデ等),  char?: 画像ファイル(assets/img),
 *   name?: 話者名,            text?: 字幕(タイプライター),
 *   title?:大見出し,          color?:字幕/名前の色,
 *   dur?:  表示ミリ秒,         fx?: 'shake'|'flash'|'zoom',
 *   se?:   AUDIO.SE のキー
 * }
 */
(function () {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const A = () => window.AUDIO;

  let root, bg, bars, charEl, titleEl, box, nameEl, textEl, skipEl, inited = false;
  let skipFlag = false;
  let playing = false;

  function init() {
    if (inited) return;
    root = $('#cinema'); bg = root.querySelector('.cine-bg'); bars = root.querySelector('.cine-bars');
    charEl = root.querySelector('.cine-char'); titleEl = root.querySelector('.cine-title');
    box = root.querySelector('.cine-box'); nameEl = root.querySelector('.cine-name');
    textEl = root.querySelector('.cine-text'); skipEl = root.querySelector('.cine-skip');
    root.addEventListener('pointerdown', () => { skipFlag = true; });
    inited = true;
  }

  // タイプライター（skip対応）
  async function type(text, color) {
    textEl.style.color = color || '#fff';
    textEl.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (skipFlag) { textEl.textContent = text; return; }
      textEl.textContent += text[i];
      if (text[i] !== ' ' && text[i] !== '　' && A()) A().SE.su(1);
      await sleep(34);
    }
  }

  function fx(kind) {
    if (kind === 'shake') { root.classList.remove('cine-shake'); void root.offsetWidth; root.classList.add('cine-shake'); }
    else if (kind === 'flash') { root.classList.remove('cine-flash'); void root.offsetWidth; root.classList.add('cine-flash'); }
    else if (kind === 'zoom') { charEl.classList.remove('cine-zoom'); void charEl.offsetWidth; charEl.classList.add('cine-zoom'); }
  }

  async function playScene(s) {
    // 背景
    bg.style.background = s.bg || 'radial-gradient(circle at 50% 40%,#1a0f3a,#05010f)';
    // 立ち絵
    if (s.char) {
      charEl.src = window.ASSETS.url(s.char);
      charEl.style.display = 'block';
      charEl.classList.remove('in'); void charEl.offsetWidth; charEl.classList.add('in');
    } else { charEl.style.display = 'none'; }
    // 大見出し
    if (s.title) { titleEl.textContent = s.title; titleEl.style.color = s.color || '#ffd23b';
      titleEl.classList.remove('in'); void titleEl.offsetWidth; titleEl.classList.add('in'); titleEl.style.display = 'block'; }
    else { titleEl.style.display = 'none'; }
    if (s.fx) fx(s.fx);
    if (s.se && A()) A().SE[s.se] && A().SE[s.se]();
    // 字幕
    if (s.text) {
      box.style.display = 'flex';
      nameEl.textContent = s.name || '';
      nameEl.style.color = s.color || '#ffd23b';
      nameEl.style.display = s.name ? 'inline-block' : 'none';
      await type(s.text, '#fff');
    } else { box.style.display = 'none'; }

    // 表示維持（skipで即終了）
    const dur = s.dur || 1200;
    const t0 = Date.now();
    while (!skipFlag && Date.now() - t0 < dur) await sleep(50);
  }

  // メイン再生（再入防止ロック＋例外時も必ず後始末）
  async function play(scenes, opts = {}) {
    init();
    if (!scenes || !scenes.length) return;
    if (playing) return;                // 多重再生を防止
    playing = true;
    skipFlag = false;
    root.classList.add('show');
    bars.classList.add('in');           // レターボックス展開
    skipEl.style.display = opts.skippable === false ? 'none' : 'block';
    if (opts.bgm && A()) A().startBgm(opts.bgm);
    try {
      await sleep(260);
      for (const s of scenes) {
        if (skipFlag) break;
        await playScene(s);
      }
    } catch (e) {
      console.error('cinema error:', e);
    } finally {
      bars.classList.remove('in');
      root.classList.remove('show');
      charEl.style.display = 'none'; titleEl.style.display = 'none'; box.style.display = 'none';
      if (opts.bgm && A()) A().stopBgm();
      skipFlag = false;
      playing = false;
    }
  }

  window.CINEMA = { init, play, get isPlaying() { return playing; } };
})();
