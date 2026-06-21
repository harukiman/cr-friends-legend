/*
 * cinema.js — ストーリー式アニメーション・ムービーエンジン（リッチ版）
 * アニメ背景＋立ち絵(Ken Burns/別形態フィルター)＋スピード線/粒子＋タイプライター字幕。
 * 人気実機級の見栄えを、写真6枚＋手続き生成エフェクトで実現する。
 * 画面タップでスキップ可。play() は完了/スキップで解決する Promise を返す。
 *
 * scene: {
 *   bgClass?: 'bg-space|bg-fire|bg-rush|bg-gold|bg-legend|bg-thunder|bg-speed|bg-aurora',
 *   bg?:      CSS背景(フォールバック),
 *   char?:    画像ファイル,  form?: 'dark|awaken|gold|neg|ghost',  pos?: 'center|left|right',
 *   kb?:      true(Ken Burns),
 *   name?:    話者名,  text?: 字幕,  title?: 大見出し,  color?: 色,
 *   fx?:      'flash|shake|zoom|speed|burst',  dur?: ms,  se?: AUDIO.SEキー,  shock?:true(白フラッシュ強)
 * }
 */
(function () {
  const $ = s => document.querySelector(s);
  const effSpeed = () => {
    const s = window.SPEED || 1;
    if ((window.SETTINGS && window.SETTINGS.fastProduction) || s >= 5 || (window.GAME && window.GAME.isAuto)) return s;
    return 1;
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms / effSpeed()));
  const A = () => window.AUDIO;

  let root, bg, fxlayer, bars, charEl, titleEl, box, nameEl, textEl, skipEl, inited = false;
  let skipFlag = false, playing = false;

  function init() {
    if (inited) return;
    root = $('#cinema'); bg = root.querySelector('.cine-bg'); fxlayer = root.querySelector('.cine-fxlayer');
    bars = root.querySelector('.cine-bars'); charEl = root.querySelector('.cine-char');
    titleEl = root.querySelector('.cine-title'); box = root.querySelector('.cine-box');
    nameEl = root.querySelector('.cine-name'); textEl = root.querySelector('.cine-text');
    skipEl = root.querySelector('.cine-skip');
    root.addEventListener('pointerdown', () => { skipFlag = true; });
    inited = true;
  }

  async function type(text, color) {
    textEl.style.color = color || '#fff';
    textEl.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (skipFlag) { textEl.textContent = text; return; }
      textEl.textContent += text[i];
      if (text[i] !== ' ' && text[i] !== '　' && A() && effSpeed() <= 3 && i % 2 === 0) A().SE.su(1);
      await sleep(30);
    }
  }

  function reflow(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function applyFx(kind) {
    if (!kind) return;
    if (kind === 'shake') reflow(root, 'cine-shake');
    else if (kind === 'flash') reflow(root, 'cine-flash');
    else if (kind === 'zoom') reflow(charEl, 'cine-zoom');
    else if (kind === 'speed') reflow(fxlayer, 'fx-speed');
    else if (kind === 'burst') reflow(fxlayer, 'fx-burst');
  }

  async function playScene(s) {
    // 背景（写真 or アニメクラス or グラデ）
    if (s.bgImg) {
      bg.className = 'cine-bg bg-photo';
      bg.style.background = `linear-gradient(rgba(5,2,15,.28),rgba(5,2,15,.42)), url('${window.ASSETS.url(s.bgImg)}') center/cover no-repeat`;
    } else if (s.bgClass) {
      bg.className = 'cine-bg ' + s.bgClass; bg.style.background = '';
    } else {
      bg.className = 'cine-bg'; bg.style.background = s.bg || 'radial-gradient(circle at 50% 40%,#1a0f3a,#05010f)';
    }
    // FXレイヤ初期化
    fxlayer.className = 'cine-fxlayer';
    // 立ち絵
    if (s.char) {
      charEl.src = window.ASSETS.url(s.char);
      charEl.style.display = 'block';
      charEl.className = 'cine-char'
        + (s.form ? ' form-' + s.form : '')
        + (s.pos ? ' pos-' + s.pos : '')
        + (s.kb ? ' kenburns' : '');
      reflow(charEl, 'in');
    } else { charEl.style.display = 'none'; }
    // 大見出し
    if (s.title) {
      titleEl.textContent = s.title; titleEl.style.color = s.color || '#ffd23b';
      titleEl.style.display = 'block'; reflow(titleEl, 'in');
    } else { titleEl.style.display = 'none'; }
    if (s.shock) reflow(root, 'cine-flash');
    if (s.fx) applyFx(s.fx);
    if (s.se && A() && A().SE[s.se]) A().SE[s.se]();
    // 字幕
    if (s.text) {
      box.style.display = 'flex';
      nameEl.textContent = s.name || ''; nameEl.style.color = s.color || '#ffd23b';
      nameEl.style.display = s.name ? 'inline-block' : 'none';
      await type(s.text, '#fff');
    } else { box.style.display = 'none'; }
    const dur = s.dur || 1400;
    const t0 = Date.now();
    while (!skipFlag && Date.now() - t0 < dur) await sleep(50);
  }

  async function play(scenes, opts = {}) {
    init();
    if (!scenes || !scenes.length) return;
    if (playing) return;
    playing = true; skipFlag = false;
    root.classList.add('show');
    bars.classList.add('in');
    skipEl.style.display = opts.skippable === false ? 'none' : 'block';
    if (opts.bgm && A()) A().startBgm(opts.bgm);
    try {
      await sleep(240);
      for (const s of scenes) { if (skipFlag) break; await playScene(s); }
    } catch (e) { console.error('cinema error:', e); }
    finally {
      bars.classList.remove('in'); root.classList.remove('show');
      root.classList.remove('cine-flash', 'cine-shake');   // 白フラッシュ等の残留を除去
      charEl.style.display = 'none'; titleEl.style.display = 'none'; box.style.display = 'none';
      charEl.className = 'cine-char';
      bg.className = 'cine-bg'; fxlayer.className = 'cine-fxlayer';
      if (opts.bgm && A()) A().stopBgm();
      skipFlag = false; playing = false;
    }
  }

  window.CINEMA = { init, play, get isPlaying() { return playing; } };
})();
