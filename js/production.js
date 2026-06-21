/*
 * production.js — 演出シーケンス・エンジン
 * rng が生成した演出パッケージと最終停止目を受け取り、
 * 予告→擬似連→リーチ→カットイン→結果 を時間制御で再生する。
 * run() は演出完了で解決する Promise を返す（game.js が結果処理を継ぐ）。
 */
(function () {
  const $ = sel => document.querySelector(sel);
  // 演出速度: 「演出も倍速」ON / 倍速×5以上 / オート中 は倍率適用、それ以外は×1で堪能。
  const effSpeed = () => {
    const s = window.SPEED || 1;
    if ((window.SETTINGS && window.SETTINGS.fastProduction) || s >= 5 || (window.GAME && window.GAME.isAuto)) return s;
    return 1;
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms / effSpeed()));
  const A = () => window.AUDIO;

  let screen, flash, swarm, cutin, su, reach, telop, button, kakutei, vflash, result, confetti, message;
  function init() {
    screen = $('#screen'); flash = $('#fx-flash'); swarm = $('#fx-swarm'); cutin = $('#fx-cutin');
    su = $('#fx-su'); reach = $('#fx-reach'); telop = $('#fx-telop'); button = $('#fx-button');
    kakutei = $('#fx-kakutei'); vflash = $('#fx-vflash'); result = $('#fx-result');
    confetti = $('#fx-confetti'); message = $('#fx-message');
  }

  function show(el) { el.classList.add('show'); }
  function hide(el) { el.classList.remove('show'); }
  function hideAll() {
    [flash, swarm, cutin, su, reach, telop, button, kakutei, vflash, result, confetti, $('#fx-round')].forEach(el => el && hide(el));
    screen.classList.remove('rainbow');
    cutin.querySelector('img').src = '';
    swarm.innerHTML = ''; confetti.innerHTML = '';
  }
  function msg(t) { message.textContent = t || ''; }

  function flashBoom() { flash.classList.remove('boom'); void flash.offsetWidth; flash.classList.add('boom'); }
  function shake() { screen.classList.remove('shake'); void screen.offsetWidth; screen.classList.add('shake'); }
  function shakeHard() { const c = document.getElementById('cabinet') || screen; c.classList.remove('shake-hard'); void c.offsetWidth; c.classList.add('shake-hard'); }

  // SU予告（step段階だけ表示）
  async function playSU(step) {
    if (step < 2) return;
    show(su);
    const labels = ['', '', 'チャンス！', '激アツ！？', '超激アツ!!', '虹 確定級!!!'];
    for (let s = 2; s <= step; s++) {
      su.querySelector('.su-text').textContent = 'STEP ' + s;
      su.querySelector('.su-text').style.color = s >= 5 ? '#ff6ec7' : s >= 4 ? '#ffd23b' : '#fff';
      if (A()) A().SE.su(s);
      await sleep(360);
    }
    su.querySelector('.su-text').textContent = labels[step] || '';
    await sleep(420);
    hide(su);
  }

  // 擬似連
  async function playPseudo(count) {
    if (!count) return;
    for (let n = 2; n <= count; n++) {
      show(reach);
      reach.querySelector('.reach-text').textContent = '擬似連 ' + n + '!';
      reach.querySelector('.reach-text').style.color = '#39d353';
      if (A()) A().SE.pseudo();
      flashBoom();
      window.REELS.startAll();
      await sleep(520);
      hide(reach);
    }
    reach.querySelector('.reach-text').style.color = '';
  }

  // リーチ本体（kind に応じた熱演出）
  async function playReach(reachDef, finalSyms) {
    if (A()) A().SE.tenpai();
    show(reach);
    reach.querySelector('.reach-text').textContent = 'リーチ!!';
    if (A()) A().SE.reach();
    await sleep(700);
    hide(reach);

    const kind = reachDef.kind;
    const storyOn2 = window.SETTINGS && window.SETTINGS.story && window.CINEMA && window.STORY;
    if (kind === 'normal') {
      msg('ノーマルリーチ…');
      if (storyOn2) await window.CINEMA.play(window.STORY.normalReach(), { bgm: 'super' });
      await sleep(700);
      return;
    }

    // スーパー以上は BGM 起動
    if (A()) A().startBgm(kind === 'allreel' ? 'allreel' : 'super');

    const storyOn = window.SETTINGS && window.SETTINGS.story && window.CINEMA && window.STORY;
    if (kind === 'super') {
      msg('スーパーリーチ発展！');
      await playTelop('チャンス！', '#1380ff');
      if (storyOn) await window.CINEMA.play(window.STORY.battle('super'), { bgm: 'super' });
      await cutInImage(reachDef.img, reachDef.label, 1100, '#3af0ff');
      await sleep(600);
    } else if (kind === 'cutin') {
      const gold = reachDef.id === 'cutin_gold';
      msg(gold ? '金カットイン!!!' : '激熱カットイン!!');
      await playSwarm();                                   // 群予告
      await playTelop(gold ? '激アツ確定級!!' : '激熱!!', gold ? '#d4a800' : '#c00');
      if (storyOn) await window.CINEMA.play(window.STORY.battle(reachDef.id), { bgm: 'super' });
      shake();
      await cutInImage(reachDef.img, reachDef.label, 1300, gold ? '#ffd23b' : '#ff3b3b');
      await sleep(600);
    } else if (kind === 'allreel') {
      msg('全回転リーチ……当確!?');
      screen.classList.add('rainbow');
      await playSwarm();
      await playTelop('当 確 !?', '#b3008f');
      if (storyOn) await window.CINEMA.play(window.STORY.legend(), { bgm: 'allreel' });
      await cutInImage(reachDef.img, '伝説の全回転', 1800, '#ff6ec7');
      await sleep(800);
    }
    if (A()) A().stopBgm();
  }

  // 群予告（ザワッと影が湧く）
  async function playSwarm() {
    swarm.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('span');
      d.className = 'swarm-dot';
      d.style.left = Math.random() * 100 + '%';
      d.style.animationDuration = (0.7 + Math.random() * 0.5) + 's';
      d.style.animationDelay = (Math.random() * 0.3) + 's';
      swarm.appendChild(d);
    }
    show(swarm);
    if (A()) A().SE.swarm();
    await sleep(900);
    hide(swarm); swarm.innerHTML = '';
  }

  // テロップ（激熱！等）
  async function playTelop(text, color) {
    telop.querySelector('.telop-text').textContent = text;
    if (color) telop.querySelector('.telop-text').style.background =
      `linear-gradient(90deg,rgba(0,0,0,0),${color} 20%,${color} 80%,rgba(0,0,0,0))`;
    show(telop);
    if (A()) A().SE.telop();
    await sleep(650);
    hide(telop);
  }

  // チャンスボタン（押下 or 自動でドンッ）
  async function playButton(label) {
    button.querySelector('.push-btn').textContent = label || 'PUSH!';
    show(button);
    if (A()) A().SE.button();
    let pressed = false;
    const btn = button.querySelector('.push-btn');
    const onPress = () => { pressed = true; };
    btn.addEventListener('pointerdown', onPress, { once: true });
    const t0 = Date.now(), wait = 1200 / effSpeed();
    while (!pressed && Date.now() - t0 < wait) await sleep(60);
    btn.removeEventListener('pointerdown', onPress);
    if (A()) A().SE.push();
    flashBoom(); shake();
    hide(button);
  }

  // 確定演出（虹＋確定テロップ＋確定音＋台全体シェイク）
  async function playKakutei() {
    screen.classList.add('rainbow');
    show(kakutei);
    if (A()) A().SE.kakutei();
    flashBoom(); shakeHard();
    await sleep(300); flashBoom();
    await sleep(900);
    hide(kakutei);
  }

  // V入賞
  async function playVConfirm() {
    show(vflash);
    if (A()) A().SE.vflash();
    flashBoom(); shakeHard();
    await sleep(700);
    hide(vflash);
  }

  // 昇格演出（ラウンド数アップ）
  async function playUpgrade(fromR, toR) {
    show(reach);
    const rt = reach.querySelector('.reach-text');
    rt.style.color = '#3af0ff';
    rt.textContent = fromR + 'R...';
    await sleep(500);
    if (A()) A().SE.upgrade();
    rt.style.color = '#ffd23b';
    rt.textContent = '▲ ' + toR + 'R 昇格!!';
    flashBoom();
    await sleep(800);
    rt.style.color = '';
    hide(reach);
  }

  // 紙吹雪（一定時間後に自動消去）
  function playConfetti(dur = 1800) {
    confetti.innerHTML = '';
    const colors = ['#ff3b3b', '#ffd23b', '#3af0ff', '#39d353', '#ff6ec7', '#fff'];
    for (let i = 0; i < 44; i++) {
      const s = document.createElement('span');
      s.className = 'confetti-piece';
      s.style.left = Math.random() * 100 + '%';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = (Math.random() * 0.5) + 's';
      s.style.animationDuration = (0.9 + Math.random() * 0.9) + 's';
      confetti.appendChild(s);
    }
    show(confetti);
    setTimeout(() => { hide(confetti); confetti.innerHTML = ''; }, dur);
  }

  // 当り確定までの煽りシーケンス
  async function playWinSequence(prod, kakuhen) {
    const k = prod.reach || {};
    const premium = kakuhen || k.id === 'cutin_gold' || k.id === 'allreel' || Math.random() < 0.5;
    // スーパー以上はチャンスボタンで決める
    if (k.kind === 'super' || k.kind === 'cutin' || k.kind === 'allreel') {
      await playButton(premium ? '激アツ PUSH!!' : 'PUSH!');
    }
    if (premium) await playKakutei();      // 確定演出
    await showResult(true, kakuhen);
    playConfetti(1800);
    await sleep(300);
  }

  // カットイン画像表示
  async function cutInImage(imgFile, label, dur, color) {
    const im = cutin.querySelector('img');
    im.src = window.ASSETS.url(imgFile);
    cutin.querySelector('.cutin-label').textContent = label || '';
    cutin.querySelector('.cutin-label').style.color = color || '#ffd23b';
    if (A()) A().SE.cutin();
    flashBoom(); shakeHard();
    show(cutin);
    await sleep(dur);
    hide(cutin);
  }

  // 結果表示
  async function showResult(win, kakuhen) {
    result.classList.remove('win', 'lose');
    result.classList.add(win ? 'win' : 'lose');
    result.querySelector('.result-text').textContent = win
      ? (kakuhen ? '🎉 確変 大当り 🎉' : '🎊 大当り 🎊')
      : 'ハズレ…';
    show(result);
    if (win) { flashBoom(); shakeHard(); if (A()) (kakuhen ? A().SE.kakuhen() : A().SE.fanfare()); }
    else if (A()) A().SE.lose();
    await sleep(win ? 1600 : 800);
    hide(result);
  }

  /*
   * 1回転の完全再生
   *  prod        : rng.pickProduction の結果
   *  finalSyms   : rng.pickStopSymbols の結果（[s0,s1,s2]）
   *  willKakuhen : 当り時に確変図柄で揃えるか（演出のため）
   */
  async function run(prod, finalSyms, willKakuhen) {
    hideAll(); msg('');
    window.REELS.clearTenpai();
    window.REELS.startAll();
    if (A()) A().SE.start();
    await sleep(450);

    await playSU(prod.su.step);
    await playPseudo(prod.pseudo.count);

    // 予告ムービー（通常スピンにもふんだんに。高倍速時は冷遇スキップ）
    const storyReady = window.SETTINGS && window.SETTINGS.story && window.CINEMA && window.STORY;
    if (storyReady) {
      const hot = prod.hit || prod.su.step >= 3 || ['red', 'gold', 'rainbow'].includes(prod.hold.id)
        || (prod.reach && prod.reach.kind !== 'none' && prod.reach.kind !== 'normal');
      const fast = (window.SPEED || 1) >= 5;
      const chance = hot ? 0.9 : (fast ? 0 : 0.1);
      if (Math.random() < chance) await window.CINEMA.play(window.STORY.yokoku(hot), {});
    }

    // 左→右 停止
    window.REELS.stop(0, finalSyms[0]);
    await sleep(380);
    const tenpai = finalSyms[0].id === finalSyms[2].id;
    window.REELS.stop(2, finalSyms[2], { tenpai });
    await sleep(420);

    if (tenpai && prod.reach.kind !== 'none') {
      await playReach(prod.reach, finalSyms);
    }

    // 中央停止（復活演出を挟む場合あり）
    if (prod.hit && prod.revival) {
      // 一旦ハズレ目で止める
      let fake = window.CONFIG.SYMBOLS.find(s => s.id !== finalSyms[1].id);
      window.REELS.stop(1, fake);
      msg('…ハズレ？');
      await showResultQuick('ハズレ…', false);
      await sleep(300);
      // 復活！
      if (A()) A().SE.revive();
      flashBoom(); shake(); msg('復活ァァ！！');
      await sleep(400);
      window.REELS.stop(1, finalSyms[1], { tenpai: true });
    } else {
      window.REELS.stop(1, finalSyms[1], { tenpai });
    }
    await sleep(450);

    const win = window.REELS.isAllMatch(finalSyms);
    if (win) await playWinSequence(prod, willKakuhen);
    else await showResult(false, false);
    hideAll(); msg('');
    return win;
  }

  async function showResultQuick(text, win) {
    result.classList.remove('win', 'lose');
    result.classList.add(win ? 'win' : 'lose');
    result.querySelector('.result-text').textContent = text;
    show(result); await sleep(600); hide(result);
  }

  // ラウンド中の出玉演出（液晶に大きくラウンド/出玉カウンター）
  let roundFx, roundTotalPayout = 0;
  async function playRound(roundNo, total, payout, onBall, opts = {}) {
    roundFx = roundFx || $('#fx-round');
    if (roundNo === 1) { roundTotalPayout = 0; await playVConfirm(); }
    if (roundNo === 1 || roundNo === total) playConfetti(1400);
    show(roundFx);
    roundFx.querySelector('.round-head').textContent =
      `${opts.kakuhen ? '確変' : ''}BONUS  ${roundNo} / ${total}R`;
    // ラウンドpip
    const pips = roundFx.querySelector('.round-pips');
    pips.innerHTML = '';
    for (let r = 1; r <= total; r++) {
      const s = document.createElement('span');
      s.className = 'pip' + (r <= roundNo ? ' on' : '');
      pips.appendChild(s);
    }
    // 出玉カウントアップ（イーズアウト＋上昇ピッチで気持ちよく）
    const payEl = roundFx.querySelector('.round-payout');
    const startVal = roundTotalPayout, steps = 10;
    for (let k = 1; k <= steps; k++) {
      const e = 1 - Math.pow(1 - k / steps, 2);
      payEl.innerHTML = `${Math.round(startVal + payout * e)}<small>玉</small>`;
      if (A()) A().SE.payout(1400 + k * 130);
      if (onBall) onBall();
      await sleep(45);
    }
    roundTotalPayout = startVal + payout;
    await sleep(160);
    if (roundNo === total) { hide(roundFx); playConfetti(1600); }
  }

  window.PRODUCTION = { init, run, playRound, playUpgrade, playKakutei, playConfetti,
                        cutInImage, showResult, hideAll, msg };
})();
