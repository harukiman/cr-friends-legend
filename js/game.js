/*
 * game.js — 状態機械・玉管理・確変ST・スピン進行
 * 設計: 玉発射→始動口入賞で保留生成（その場で当落と演出を確定＝先読み信頼度の根拠）。
 *        アイドル時に保留を1つ消化してスピン再生→結果反映。大当りで保留クリア。
 */
(function () {
  const C = window.CONFIG;
  const MAX_HOLD = 4;

  const S = {
    specKey: C.DEFAULT_SPEC,
    spec: C.SPECS[C.DEFAULT_SPEC],
    balls: 500,
    spins: 0,
    renchan: 0,
    kakuhen: false,
    jitan: false,
    stRemaining: 0,
    holds: [],          // {hit, prod, finalSyms, willKakuhen, holdDef}
    busy: false,        // スピン/大当り再生中
    firing: false,
    auto: false,
  };

  let onChange = () => {};
  let lane = null, laneCtx = null, balls2d = [], pegs = [];

  function init(opts) {
    onChange = opts.onChange || (() => {});
    setupLane();
    requestAnimationFrame(laneLoop);
    refresh();
  }
  function refresh() { onChange(snapshot()); }
  function snapshot() {
    return {
      specKey: S.specKey, specName: S.spec.name, balls: Math.max(0, Math.floor(S.balls)),
      spins: S.spins, renchan: S.renchan, holds: S.holds.map(h => h.holdDef),
      state: S.kakuhen ? 'kakuhen' : S.jitan ? 'jitan' : 'normal',
      stRemaining: S.stRemaining,
    };
  }

  function currentPHit() {
    return 1 / (S.kakuhen ? S.spec.kakuhenOdds : S.spec.normalOdds);
  }
  function startChance() {
    // 電サポ中(確変/時短)は玉が減らず連チャンしやすい
    return (S.kakuhen || S.jitan) ? 0.85 : 0.16;
  }

  // 1回転ぶんの抽選を生成（保留作成時に確定）
  function rollSpin() {
    const pHit = currentPHit();
    const hit = window.RNG.drawHit(S.spec, S.kakuhen);
    const willKakuhen = hit ? window.RNG.drawKakuhen(S.spec) : false;
    const prod = window.RNG.pickProduction(hit, pHit);
    const finalSyms = window.RNG.pickStopSymbols(prod, willKakuhen);
    return { hit, prod, finalSyms, willKakuhen, holdDef: prod.hold };
  }

  // ---- 発射 ----
  let fireTimer = null;
  function fireStart() {
    if (S.firing) return;
    S.firing = true;
    if (window.AUDIO) window.AUDIO.resume();
    const tick = () => {
      if (!S.firing && !S.auto) { return; }
      if (S.balls <= 0) { PRODUCTION.msg('玉が無くなりました（玉追加で補給）'); stopFiring(); refresh(); return; }
      if (S.holds.length >= MAX_HOLD) {
        // 保留満タンなら発射を控える（玉節約）
        fireTimer = setTimeout(tick, 200); return;
      }
      shootBall();
      fireTimer = setTimeout(tick, S.auto ? 130 : 150);
    };
    tick();
  }
  function fireStop() { S.firing = false; if (!S.auto) stopFiring(); }
  function stopFiring() { if (fireTimer) { clearTimeout(fireTimer); fireTimer = null; } }
  function setAuto(on) {
    S.auto = on;
    if (on) fireStart(); else { S.firing = false; stopFiring(); }
    refresh();
  }

  function shootBall() {
    S.balls -= 1;
    spawnBall();
    if (window.AUDIO) window.AUDIO.SE.fire();
    if (Math.random() < startChance()) registerStart();
    refresh();
    maybeConsume();
  }

  // 始動口入賞
  function registerStart() {
    if (window.AUDIO) window.AUDIO.SE.start();
    S.balls += 3; // 賞球
    if (S.holds.length < MAX_HOLD) {
      const roll = rollSpin();
      S.holds.push(roll);
      if (window.AUDIO && roll.holdDef.id !== 'white') window.AUDIO.SE.holdUp();
      refresh();
    }
  }

  // ---- 消化 ----
  async function maybeConsume() {
    if (S.busy || S.holds.length === 0) return;
    S.busy = true;
    const roll = S.holds.shift();
    S.spins += 1;
    if (S.kakuhen || S.jitan) {
      S.stRemaining = Math.max(0, S.stRemaining - 1);
    }
    refresh();

    const win = await window.PRODUCTION.run(roll.prod, roll.finalSyms, roll.willKakuhen);

    if (win) {
      await doJackpot(roll.willKakuhen);
    } else {
      // ST 終了判定
      if ((S.kakuhen || S.jitan) && S.stRemaining <= 0) endST();
    }
    S.busy = false;
    refresh();

    // 続けて保留があれば消化、なければ発射継続で次の入賞を待つ
    if (S.holds.length > 0) maybeConsume();
    else if (S.auto && S.balls > 0) fireStart();
  }

  async function doJackpot(willKakuhen) {
    S.renchan += 1;
    S.holds = []; // 大当りで保留クリア（止め打ち）
    refresh();
    const spec = S.spec;
    for (let r = 1; r <= spec.rounds; r++) {
      const pay = spec.payoutPerRound;
      S.balls += pay;
      await window.PRODUCTION.playRound(r, spec.rounds, pay, () => { S.balls += 0; refresh(); });
      refresh();
    }
    // 大当り後の状態
    if (willKakuhen) { S.kakuhen = true; S.jitan = false; }
    else { S.kakuhen = false; S.jitan = true; }
    S.stRemaining = spec.stCount;
    refresh();
  }

  function endST() {
    S.kakuhen = false; S.jitan = false; S.stRemaining = 0; S.renchan = 0;
    window.PRODUCTION.msg('通常モードへ戻りました');
    refresh();
  }

  function addBalls(n) { S.balls += n; refresh(); }
  function setSpec(key) {
    if (!C.SPECS[key] || S.busy) return;
    S.specKey = key; S.spec = C.SPECS[key];
    S.kakuhen = S.jitan = false; S.stRemaining = 0; S.renchan = 0; S.holds = [];
    refresh();
  }

  // ---- デバッグ強制再生 ----
  async function forcePlay(overrides) {
    if (S.busy) return;
    if (window.AUDIO) window.AUDIO.resume();
    S.busy = true;
    const hit = overrides.hit ?? false;
    const pHit = currentPHit();
    const prod = window.RNG.pickProduction(hit, pHit);
    // 指定リーチ等で上書き
    if (overrides.reachId) prod.reach = C.PRODUCTIONS.reach.find(r => r.id === overrides.reachId) || prod.reach;
    if (overrides.holdId) prod.hold = C.PRODUCTIONS.hold.find(r => r.id === overrides.holdId) || prod.hold;
    if (overrides.suStep) prod.su = C.PRODUCTIONS.su.find(r => r.step === overrides.suStep) || prod.su;
    if (overrides.revival != null) prod.revival = overrides.revival && hit;
    prod.hit = hit;
    const willKakuhen = hit ? (overrides.kakuhen ?? true) : false;
    // リーチを見せたいので tenpai 形に
    let finalSyms;
    if (hit) finalSyms = window.RNG.pickStopSymbols({ ...prod, hit: true }, willKakuhen);
    else {
      const syms = C.SYMBOLS, a = syms[0], mid = syms[1];
      finalSyms = [a, mid, a]; // 強制テンパイハズレ
    }
    await window.PRODUCTION.run(prod, finalSyms, willKakuhen);
    if (hit) await doJackpot(willKakuhen);
    S.busy = false;
    refresh();
  }

  // ---- 玉レーン描画 ----
  function setupLane() {
    lane = document.getElementById('lane');
    if (!lane) return;
    laneCtx = lane.getContext('2d');
    // 釘配置
    pegs = [];
    const cols = 7, rows = 4;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        pegs.push({ x: 30 + c * 40 + (r % 2 ? 20 : 0), y: 18 + r * 16 });
  }
  function spawnBall() {
    if (!lane) return;
    balls2d.push({ x: lane.width / 2 + (Math.random() * 40 - 20), y: 2, vy: 1.2, vx: (Math.random() * 1.2 - 0.6) });
  }
  function laneLoop() {
    if (laneCtx) {
      const W = lane.width, H = lane.height;
      laneCtx.clearRect(0, 0, W, H);
      // 釘
      laneCtx.fillStyle = '#5b4a7a';
      pegs.forEach(p => { laneCtx.beginPath(); laneCtx.arc(p.x, p.y, 2.2, 0, 7); laneCtx.fill(); });
      // 始動口
      laneCtx.fillStyle = '#ff6ec7';
      laneCtx.fillRect(W / 2 - 16, H - 12, 32, 8);
      // 玉
      laneCtx.fillStyle = '#e9eefc';
      for (let i = balls2d.length - 1; i >= 0; i--) {
        const b = balls2d[i];
        b.vy += 0.18; b.y += b.vy; b.x += b.vx;
        pegs.forEach(p => { const dx = b.x - p.x, dy = b.y - p.y;
          if (dx * dx + dy * dy < 30) { b.vx = dx > 0 ? 1 : -1; b.vy *= 0.6; if (window.AUDIO) {} } });
        laneCtx.beginPath(); laneCtx.arc(b.x, b.y, 3.2, 0, 7); laneCtx.fill();
        if (b.y > H) balls2d.splice(i, 1);
      }
    }
    requestAnimationFrame(laneLoop);
  }

  window.GAME = { init, fireStart, fireStop, setAuto, setSpec, addBalls, forcePlay,
                  snapshot, get isBusy() { return S.busy; } };
})();
