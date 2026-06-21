/*
 * production.js — 演出シーケンス・エンジン
 * rng が生成した演出パッケージと最終停止目を受け取り、
 * 予告→擬似連→リーチ→カットイン→結果 を時間制御で再生する。
 * run() は演出完了で解決する Promise を返す（game.js が結果処理を継ぐ）。
 */
(function () {
  const $ = sel => document.querySelector(sel);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const A = () => window.AUDIO;

  let screen, flash, cutin, su, reach, result, message;
  function init() {
    screen = $('#screen'); flash = $('#fx-flash'); cutin = $('#fx-cutin');
    su = $('#fx-su'); reach = $('#fx-reach'); result = $('#fx-result'); message = $('#fx-message');
  }

  function show(el) { el.classList.add('show'); }
  function hide(el) { el.classList.remove('show'); }
  function hideAll() { [flash, cutin, su, reach, result].forEach(hide);
    screen.classList.remove('rainbow'); cutin.querySelector('img').src = ''; }
  function msg(t) { message.textContent = t || ''; }

  function flashBoom() { flash.classList.remove('boom'); void flash.offsetWidth; flash.classList.add('boom'); }
  function shake() { screen.classList.remove('shake'); void screen.offsetWidth; screen.classList.add('shake'); }

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
    if (kind === 'normal') {
      msg('ノーマルリーチ…');
      await sleep(900);
      return;
    }

    // スーパー以上は BGM 起動
    if (A()) A().startBgm(kind === 'allreel' ? 'allreel' : 'super');

    if (kind === 'super') {
      msg('スーパーリーチ発展！');
      await cutInImage(reachDef.img, reachDef.label, 1100, '#3af0ff');
      await sleep(700);
    } else if (kind === 'cutin') {
      const gold = reachDef.id === 'cutin_gold';
      msg(gold ? '金カットイン!!!' : '激熱カットイン!!');
      shake();
      await cutInImage(reachDef.img, reachDef.label, 1300, gold ? '#ffd23b' : '#ff3b3b');
      await sleep(700);
    } else if (kind === 'allreel') {
      msg('全回転リーチ……当確!?');
      screen.classList.add('rainbow');
      await cutInImage(reachDef.img, '伝説の全回転', 1800, '#ff6ec7');
      await sleep(900);
    }
    if (A()) A().stopBgm();
  }

  // カットイン画像表示
  async function cutInImage(imgFile, label, dur, color) {
    const im = cutin.querySelector('img');
    im.src = window.ASSETS.url(imgFile);
    cutin.querySelector('.cutin-label').textContent = label || '';
    cutin.querySelector('.cutin-label').style.color = color || '#ffd23b';
    if (A()) A().SE.cutin();
    flashBoom();
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
    if (win) { flashBoom(); shake(); if (A()) (kakuhen ? A().SE.kakuhen() : A().SE.fanfare()); }
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
    await sleep(500);

    const win = window.REELS.isAllMatch(finalSyms);
    await showResult(win, win && willKakuhen);
    hideAll(); msg('');
    return win;
  }

  async function showResultQuick(text, win) {
    result.classList.remove('win', 'lose');
    result.classList.add(win ? 'win' : 'lose');
    result.querySelector('.result-text').textContent = text;
    show(result); await sleep(600); hide(result);
  }

  // ラウンド中の出玉演出
  async function playRound(roundNo, total, payout, onBall) {
    msg(`大当り ${roundNo}/${total}R  獲得 ${payout}玉`);
    for (let k = 0; k < 6; k++) {
      if (A()) A().SE.payout();
      if (onBall) onBall();
      await sleep(70);
    }
  }

  window.PRODUCTION = { init, run, playRound, cutInImage, showResult, hideAll, msg };
})();
