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
  // ストーリー/オープニング等のムービーは「アニメーション作品」として、
  // 倍速・演出倍速・オートの一切から完全に除外し、常に等倍(×1)で再生する。
  // （早送りしたい人は画面タップのスキップを使う設計）
  const effSpeed = () => 1;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const A = () => window.AUDIO;

  let root, bg, fxlayer, bars, charEl, titleEl, box, nameEl, textEl, skipEl, skipFill, inited = false;
  let skipFlag = false, advanceFlag = false, playing = false;
  const HOLD_MS = 1000;   // この時間ボタンを押し続けると全スキップ
  let holdTimer = null;

  function init() {
    if (inited) return;
    root = $('#cinema'); bg = root.querySelector('.cine-bg'); fxlayer = root.querySelector('.cine-fxlayer');
    bars = root.querySelector('.cine-bars'); charEl = root.querySelector('.cine-char');
    titleEl = root.querySelector('.cine-title'); box = root.querySelector('.cine-box');
    nameEl = root.querySelector('.cine-name'); textEl = root.querySelector('.cine-text');
    skipEl = root.querySelector('.cine-skip'); skipFill = root.querySelector('.cine-skip-fill');
    // 画面タップ＝「テキスト送り」（動かさずに短くタップした時だけ。スクロールでは送らない）
    let ps = null;
    root.addEventListener('pointerdown', e => { ps = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    root.addEventListener('pointerup', e => {
      if (!ps) return;
      const dx = Math.abs(e.clientX - ps.x), dy = Math.abs(e.clientY - ps.y), dt = Date.now() - ps.t;
      ps = null;
      if (dx < 12 && dy < 12 && dt < 500) advanceFlag = true;   // 送り（スキップではない）
    });
    root.addEventListener('pointercancel', () => { ps = null; });
    // スキップボタン＝「長押し」でゲージが満タンになったら全スキップ
    const startHold = e => {
      e.stopPropagation();                    // 画面送りを発火させない
      if (skipEl.style.display === 'none') return;
      cancelHold();
      if (skipFill) { void skipFill.offsetWidth; skipFill.classList.add('on'); }
      holdTimer = setTimeout(() => { skipFlag = true; cancelHold(); }, HOLD_MS);
    };
    const cancelHold = () => {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      if (skipFill) skipFill.classList.remove('on');
    };
    skipEl.addEventListener('pointerdown', startHold);
    skipEl.addEventListener('pointerup', e => { e.stopPropagation(); cancelHold(); });
    skipEl.addEventListener('pointerleave', cancelHold);
    skipEl.addEventListener('pointercancel', cancelHold);
    inited = true;
  }

  async function type(text, color) {
    textEl.style.color = color || '#fff';
    textEl.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (skipFlag || advanceFlag) { textEl.textContent = text; advanceFlag = false; return; }   // 送り＝即全文表示
      textEl.textContent += text[i];
      if (text[i] !== ' ' && text[i] !== '　' && A() && effSpeed() <= 3 && i % 2 === 0) A().SE.su(1);
      await sleep(30);
    }
  }

  function reflow(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function applyFx(kind) {
    if (!kind) return;
    if (kind === 'shake') { reflow(root, 'cine-shake'); if (A()) A().SE.pseudo(); }
    else if (kind === 'flash') { reflow(root, 'cine-flash'); if (A()) A().SE.telop(); }
    else if (kind === 'zoom') { reflow(charEl, 'cine-zoom'); }
    else if (kind === 'speed') { reflow(fxlayer, 'fx-speed'); }
    else if (kind === 'burst') { reflow(root, 'cine-shake'); reflow(fxlayer, 'fx-burst'); if (A()) A().SE.cutin(); }
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
    const dur = (s.dur || 1400) / effSpeed();   // 倍速時はシーン表示も短縮
    const t0 = Date.now();
    while (!skipFlag && !advanceFlag && Date.now() - t0 < dur) await sleep(40);
    advanceFlag = false;   // 送りでこのシーンの残り待機を打ち切って次へ
  }

  async function play(scenes, opts = {}) {
    init();
    if (!scenes || !scenes.length) return false;
    if (playing) return false;             // 多重再生は再生せず false
    playing = true; skipFlag = false; advanceFlag = false;
    root.classList.add('show');
    bars.classList.add('in');
    if (skipFill) skipFill.classList.remove('on');
    skipEl.style.display = opts.skippable === false ? 'none' : 'flex';
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
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      if (skipFill) skipFill.classList.remove('on');
      skipFlag = false; advanceFlag = false; playing = false;
    }
    return true;
  }

  window.CINEMA = { init, play, get isPlaying() { return playing; } };
})();
