/*
 * game.js — 状態機械・玉管理・確変ST・スピン進行
 * 設計: 玉発射→始動口入賞で保留生成（その場で当落と演出を確定＝先読み信頼度の根拠）。
 *        アイドル時に保留を1つ消化してスピン再生→結果反映。大当りで保留クリア。
 */
(function () {
  const C = window.CONFIG;
  const MAX_HOLD = 4;

  const START_BALLS = 0;
  const INITIAL_MONEY = 50000;        // 開始軍資金（円）— 5万円から這い上がる
  const LEND_LOT = 500;               // 1回の玉貸玉数
  const RATES = [1, 5, 30, 50, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]; // 円/玉
  // プレイヤー側の人生目標ラダー（1億FIRE→100兆、名称付き）。到達で専用エンディング。
  const MILESTONES = [
    { amt: 1e8,  key: 'oku1',   level: 1,     name: 'FIRE達成' },
    { amt: 5e8,  key: 'oku5',   level: 5,     name: 'セミリタイア富豪' },
    { amt: 1e9,  key: 'oku10',  level: 10,    name: '億万長者' },
    { amt: 5e9,  key: 'oku50',  level: 50,    name: '大富豪' },
    { amt: 1e10, key: 'oku100', level: 100,   name: '百億の帝王' },
    { amt: 5e10, key: 'oku500', level: 500,   name: '財界の支配者' },
    { amt: 1e12, key: 'cho1',   level: 1000,  name: '兆の男' },
    { amt: 1e13, key: 'cho10',  level: 5000,  name: '経済を動かす者' },
    { amt: 1e14, key: 'cho100', level: 10000, name: '世界の頂点' },
  ];
  const SPEEDS = [1, 2, 3, 5, 10, 50, 100, 300, 500, 1000];   // 倍速
  // 設定1〜6（実機準拠。高設定ほど甘い）。大当り確率の倍率と確変突入の補正。
  const SETTING_ODDS_MULT = [1.08, 1.00, 0.95, 0.90, 0.86, 0.82];
  const SETTING_KAKU_BONUS = [-0.04, 0.00, 0.02, 0.04, 0.06, 0.08];
  const SETTING_INTERVAL_MS = 10 * 60 * 1000;  // 現実時間10分ごとに設定変更

  // ===== キャッシング（借入）設定 =====
  // 通常キャッシング: リボ風。一定回転ごとに残高へ利息が乗る。全額返済(完済)で限度額UP。
  // 闇金(ウシジマ風): 初期限度も伸び幅もずっと大きいが暴利。一定ターン後からランダムで
  //   「取り立てイベント」が発生し、その時の利息分を払えなければ強制でバイトが発生する。
  //   借りると指名手配度UP。完済で限度額が爆伸び。
  //   ※借金は総資産(=純資産)から差し引かれる＝完済しないとFIREできない（ウシジマ的な圧）。
  const CASH = { base: 50000,  growth: 50000,  rate: 0.06, interval: 40 };
  const YAMI = { base: 500000, growth: 500000, rate: 0.20, minTurns: 14, maxTurns: 30, wantedBorrow: 6, wantedCollect: 4 };
  const randCollect = () => YAMI.minTurns + Math.floor(Math.random() * (YAMI.maxTurns - YAMI.minTurns + 1));

  // 実績（早期実績は報酬で序盤の資金繰りを滑らかに）
  const ACHIEVEMENTS = [
    { id: 'first_hit', name: '初大当り', desc: '初めて大当りを引く', reward: 5000, cond: s => s.bigHits >= 1 },
    { id: 'bait', name: '初バイト代', desc: 'バイトで稼ぐ', reward: 3000, cond: s => s.baitEarned },
    { id: 'ren3', name: '3連チャン', desc: '3連チャン達成', reward: 10000, cond: s => s.maxRenchan >= 3 },
    { id: 'ren10', name: '激アツ10連', desc: '10連チャン達成', reward: 100000, cond: s => s.maxRenchan >= 10 },
    { id: 'kakuhen10', name: '確変マスター', desc: '確変10回', reward: 50000, cond: s => s.kakuhenCount >= 10 },
    { id: 'rate100', name: 'ミドル級', desc: '100パチ以上で勝負', reward: 0, cond: s => s.maxRate >= 100 },
    { id: 'rate10000', name: 'ハイローラー', desc: '10000パチに到達', reward: 0, cond: s => s.maxRate >= 10000 },
    { id: 'rate100k', name: '狂気の沙汰', desc: '10万パチ以上に到達', reward: 0, cond: s => s.maxRate >= 100000 },
    { id: 'rateoku', name: '札束の暴力', desc: '1億パチに到達', reward: 0, cond: s => s.maxRate >= 100000000 },
    // 資産ラダー（100万→100兆）
    { id: 'man100', name: '資産100万', desc: '総資産100万円', reward: 0, cond: s => s.peakAssets >= 1e6 },
    { id: 'man1000', name: '資産1000万', desc: '総資産1000万円', reward: 0, cond: s => s.peakAssets >= 1e7 },
    { id: 'oku1', name: '🌅 FIRE達成', desc: '1億円でFIRE', reward: 0, cond: s => s.peakAssets >= 1e8 },
    { id: 'oku5', name: 'グランドマスター', desc: '5億円達成', reward: 0, cond: s => s.peakAssets >= 5e8 },
    { id: 'oku10', name: '伝説', desc: '10億円達成', reward: 0, cond: s => s.peakAssets >= 1e9 },
    { id: 'oku50', name: '大富豪', desc: '総資産50億円', reward: 0, cond: s => s.peakAssets >= 5e9 },
    { id: 'oku100', name: '百億の帝王', desc: '総資産100億円', reward: 0, cond: s => s.peakAssets >= 1e10 },
    { id: 'oku500', name: '財界の支配者', desc: '総資産500億円', reward: 0, cond: s => s.peakAssets >= 5e10 },
    { id: 'cho1', name: '兆の男', desc: '総資産1兆円', reward: 0, cond: s => s.peakAssets >= 1e12 },
    { id: 'cho10', name: '経済を動かす者', desc: '総資産10兆円', reward: 0, cond: s => s.peakAssets >= 1e13 },
    { id: 'cho100', name: '👑 世界の頂点', desc: '総資産100兆円', reward: 0, cond: s => s.peakAssets >= 1e14 },
  ];

  const S = {
    specKey: C.DEFAULT_SPEC,
    spec: C.SPECS[C.DEFAULT_SPEC],
    balls: START_BALLS,
    spins: 0,
    renchan: 0,
    kakuhen: false,
    jitan: false,
    stRemaining: 0,
    holds: [],          // {hit, prod, finalSyms, willKakuhen, holdDef}
    busy: false,        // スピン/大当り再生中
    firing: false,
    auto: false,
    speed: 1,           // 倍速(×1..×100)
    setting: 2,         // 設定1〜6（非表示・看破要素）
    uchikata: 'left',   // 打ち分け（left/right）。電サポ中は right が正解
    // 経済
    money: INITIAL_MONEY,   // 軍資金（円）
    rate: 1,                // 円/玉
    maxRate: 1,             // 到達最高レート
    peakAssets: INITIAL_MONEY,
    milestonesHit: {},      // FIRE到達フラグ
    achievements: {},       // 解除済み実績
    baitEarned: false,      // バイト経験フラグ
    storyChapter: 0,        // 見たストーリー章数（初当りごとに進行）
    darkFails: 0,           // 闇バイト連続失敗
    darkBlacklist: false,   // 闇バイトブラックリスト入り
    darkBailFee: 0,         // 解除に必要な示談金
    wanted: 0,              // 指名手配度0〜100（高いほど闇バイト成功率低下）
    // キャッシング（借入）
    cashDebt: 0,            // 通常キャッシング残債（元本+利息）
    cashTurns: 0,           // リボ利息計上カウンタ
    cashClears: 0,          // 通常の完済回数（限度額の伸び）
    yamiDebt: 0,            // 闇金残債
    yamiClears: 0,          // 闇金の完済回数（限度額が爆伸び）
    yamiCollectIn: 0,       // 次の取り立てイベントまでの残り回転
    pendingSpec: null,      // 演出中に選んだスペック（消化後すぐ反映）
    // 実機データカウンター用
    bigHits: 0,         // 大当り回数
    kakuhenCount: 0,    // 確変回数
    maxRenchan: 0,      // 最高連チャン
    sinceHit: 0,        // 現在ハマり（前回大当りからの回転数）
    startBalls: START_BALLS,
    history: [],        // スランプグラフ用 {n, diff}
  };

  // 総資産＝純資産（借金は差し引く）。完済しないとFIRE（資産目標）に届かない。
  function assets() { return S.money + S.balls * S.rate - S.cashDebt - S.yamiDebt; }
  function totalDebt() { return S.cashDebt + S.yamiDebt; }

  // ---- セーブ/ロード（localStorage）----
  const SAVE_KEY = 'crfl_save_v1';
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        money: S.money, rate: S.rate, maxRate: S.maxRate, specKey: S.specKey, balls: S.balls, speed: S.speed, setting: S.setting,
        peakAssets: S.peakAssets, milestonesHit: S.milestonesHit, achievements: S.achievements, baitEarned: S.baitEarned,
        storyChapter: S.storyChapter, darkBlacklist: S.darkBlacklist, darkBailFee: S.darkBailFee, wanted: S.wanted,
        bigHits: S.bigHits, kakuhenCount: S.kakuhenCount, maxRenchan: S.maxRenchan, spins: S.spins,
        cashDebt: S.cashDebt, cashTurns: S.cashTurns, cashClears: S.cashClears,
        yamiDebt: S.yamiDebt, yamiClears: S.yamiClears, yamiCollectIn: S.yamiCollectIn,
      }));
    } catch (_) {}
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!d) return false;
      const num = v => typeof v === 'number' && isFinite(v) && v >= 0;
      if (C.SPECS[d.specKey]) { S.specKey = d.specKey; S.spec = C.SPECS[d.specKey]; }
      if (num(d.money)) S.money = d.money;
      if (RATES.includes(d.rate)) S.rate = d.rate;
      if (RATES.includes(d.maxRate)) S.maxRate = d.maxRate;
      if (SPEEDS.includes(d.speed)) S.speed = d.speed;
      if (num(d.balls)) S.balls = d.balls;
      if (num(d.peakAssets)) S.peakAssets = d.peakAssets;
      if (d.milestonesHit && typeof d.milestonesHit === 'object') S.milestonesHit = d.milestonesHit;
      if (d.achievements && typeof d.achievements === 'object') S.achievements = d.achievements;
      S.baitEarned = !!d.baitEarned;
      if (num(d.storyChapter)) S.storyChapter = d.storyChapter;
      if (d.setting >= 1 && d.setting <= 6) S.setting = d.setting;
      S.darkBlacklist = !!d.darkBlacklist; if (num(d.darkBailFee)) S.darkBailFee = d.darkBailFee;
      if (num(d.wanted)) S.wanted = Math.min(100, d.wanted);
      ['cashDebt', 'cashTurns', 'cashClears', 'yamiDebt', 'yamiClears', 'yamiCollectIn'].forEach(k => { if (num(d[k])) S[k] = d[k]; });
      S.maxRate = Math.max(S.maxRate, S.rate);
      window.SPEED = S.speed;
      ['bigHits', 'kakuhenCount', 'maxRenchan', 'spins'].forEach(k => { if (num(d[k])) S[k] = d[k]; });
      S.startBalls = S.balls;
      return true;
    } catch (_) { return false; }
  }
  function resetSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
    S.money = INITIAL_MONEY; S.rate = 1; S.maxRate = 1; S.balls = 0; S.peakAssets = INITIAL_MONEY;
    S.milestonesHit = {}; S.achievements = {}; S.baitEarned = false; S.storyChapter = 0; S.speed = 1; window.SPEED = 1;
    S.darkFails = 0; S.darkBlacklist = false; S.darkBailFee = 0;
    S.cashDebt = S.cashTurns = S.cashClears = S.yamiDebt = S.yamiClears = S.yamiCollectIn = 0;
    S.bigHits = S.kakuhenCount = S.maxRenchan = S.spins = 0;
    S.kakuhen = S.jitan = false; S.stRemaining = 0; S.renchan = 0; S.holds = [];
    S.startBalls = 0; S.history = [];
    if (window.AUDIO) window.AUDIO.setBaseBgm('normal');
    refresh();
  }

  let onChange = () => {};
  let lane = null, laneCtx = null, balls2d = [], pegs = [];

  function init(opts) {
    onChange = opts.onChange || (() => {});
    const had = load();
    if (!had) rerollSetting(false);   // 初回はランダム設定
    setupLane();
    requestAnimationFrame(laneLoop);
    // 現実時間10分ごとに設定変更（実機のホール変更を模す）
    setInterval(() => rerollSetting(true), SETTING_INTERVAL_MS);
    refresh();
  }
  function refresh() { onChange(snapshot()); }
  function snapshot() {
    const A = assets();
    return {
      specKey: S.specKey, specName: S.spec.name, balls: Math.max(0, Math.floor(S.balls)),
      spins: S.spins, renchan: S.renchan, holds: S.holds.map(h => h.holdDef),
      state: S.kakuhen ? 'kakuhen' : S.jitan ? 'jitan' : 'normal',
      stRemaining: S.stRemaining,
      bigHits: S.bigHits, kakuhenCount: S.kakuhenCount, maxRenchan: S.maxRenchan, sinceHit: S.sinceHit,
      diff: Math.floor(S.balls - S.startBalls), history: S.history, spinning: S.busy,
      money: S.money, rate: S.rate, ballValue: S.balls * S.rate, assets: A,
      profit: A - INITIAL_MONEY, peakAssets: S.peakAssets,
      ...goalInfo(A), rates: RATES, speeds: SPEEDS, speed: S.speed,
      uchikata: S.uchikata, needRight: needRight(),
      storyChapter: S.storyChapter, chapterCount: (window.STORY ? window.STORY.chapterCount() : 9),
      ceiling: S.spec.ceiling || 0, ceilingRemain: S.spec.ceiling ? Math.max(0, S.spec.ceiling - S.sinceHit) : 0,
      darkBlacklist: S.darkBlacklist, darkBailFee: S.darkBailFee, darkFails: S.darkFails,
      wanted: Math.round(S.wanted),
      cashDebt: S.cashDebt, yamiDebt: S.yamiDebt, totalDebt: totalDebt(),
      pendingSpec: S.pendingSpec,
    };
  }

  // 次の人生目標と進捗（100兆まで継続）
  function goalInfo(A) {
    let ng = null, prev = 0;
    for (const g of MILESTONES) { if (A < g.amt) { ng = g; break; } prev = g.amt; }
    return {
      goalName: ng ? ng.name : '全目標制覇',
      goalNext: ng ? ng.amt : MILESTONES[MILESTONES.length - 1].amt,
      goalPrev: prev,
      goalPct: ng ? Math.max(0, Math.min(100, (A - prev) / (ng.amt - prev) * 100)) : 100,
      goalDone: !ng,
    };
  }

  function recordHistory() {
    S.history.push({ n: S.spins, diff: Math.floor(S.balls - S.startBalls) });
    if (S.history.length > 400) S.history.shift();
  }

  // スピン中 or ムービー中は台操作をロック（演出中の経済操作・状態破壊を防止）
  function locked() { return S.busy || (window.CINEMA && window.CINEMA.isPlaying); }
  function settingMult() { return SETTING_ODDS_MULT[S.setting - 1] || 1; }
  function settingKakuBonus() { return SETTING_KAKU_BONUS[S.setting - 1] || 0; }
  // 玉単価が高いレートほど少しだけ当たりにくい（控えめ・最大+25%）
  function rateMult() {
    const r = S.rate;
    if (r <= 100) return 1; if (r <= 1000) return 1.04; if (r <= 10000) return 1.08;
    if (r <= 100000) return 1.12; if (r <= 1000000) return 1.16; if (r <= 10000000) return 1.20;
    return 1.25;
  }
  function oddsMult() { return settingMult() * rateMult(); }
  function currentPHit() {
    return 1 / ((S.kakuhen ? S.spec.kakuhenOdds : S.spec.normalOdds) * oddsMult());
  }
  function rerollSetting(notify) {
    S.setting = 1 + Math.floor(Math.random() * 6);
    save();
    if (notify && window.UI && window.UI.toast) window.UI.toast('設定が変更されました（看破せよ）', 0);
  }
  function needRight() { return S.kakuhen || S.jitan; }   // 電サポ中は右打ち
  function startChance() {
    // 打ち分けが正しいときだけ始動口/電チューに入りやすい。間違うと玉が減るだけ。
    const correct = needRight() ? S.uchikata === 'right' : S.uchikata === 'left';
    const base = needRight() ? 0.88 : 0.18;
    return correct ? base : base * 0.04;
  }
  function setUchikata(d) {
    if (d !== 'left' && d !== 'right') return;
    S.uchikata = d; refresh();
  }
  // 台リセット：持玉を換金して台の状態/データをクリア（軍資金・実績・物語は維持）。新台＝新設定。
  function resetMachine() {
    if (locked()) return;
    if (S.balls > 0) { S.money += S.balls * S.rate; S.balls = 0; }
    S.kakuhen = S.jitan = false; S.stRemaining = 0; S.renchan = 0; S.holds = [];
    S.spins = 0; S.bigHits = 0; S.kakuhenCount = 0; S.maxRenchan = 0; S.sinceHit = 0;
    S.startBalls = 0; S.history = []; S.uchikata = 'left';
    rerollSetting(false);
    if (window.AUDIO) window.AUDIO.setBaseBgm('normal');
    updatePeak(); save(); refresh();
    if (window.PRODUCTION) window.PRODUCTION.msg('新しい台に移動しました（データリセット）');
  }

  // 1回転ぶんの抽選を生成（保留作成時に確定）
  function rollSpin() {
    const pHit = currentPHit();
    const hit = window.RNG.drawHit(S.spec, S.kakuhen, oddsMult());
    const willKakuhen = hit ? window.RNG.drawKakuhen(S.spec, settingKakuBonus()) : false;
    const prod = window.RNG.pickProduction(hit, pHit);
    const finalSyms = window.RNG.pickStopSymbols(prod, willKakuhen);
    return { hit, prod, finalSyms, willKakuhen, holdDef: prod.hold };
  }
  // 天井等で使う強制大当りの抽選パッケージ
  function forcedHitRoll() {
    const willKakuhen = window.RNG.drawKakuhen(S.spec, settingKakuBonus());
    const prod = window.RNG.pickProduction(true, currentPHit());
    const finalSyms = window.RNG.pickStopSymbols(prod, willKakuhen);
    return { hit: true, prod, finalSyms, willKakuhen, holdDef: prod.hold };
  }

  // ---- 発射 ----
  let fireTimer = null;
  function fireStart() {
    if (S.firing) return;
    S.firing = true;
    if (window.AUDIO) window.AUDIO.resume();
    const tick = () => {
      if (!S.firing && !S.auto) { return; }
      if (S.balls <= 0) { window.PRODUCTION.msg('玉がありません →「玉貸」で借りる(軍資金が必要)'); stopFiring(); refresh(); return; }
      const sp = window.SPEED || 1;
      if (S.holds.length >= MAX_HOLD) {
        // 保留満タンなら発射を控える（玉節約）
        fireTimer = setTimeout(tick, 200 / sp); return;
      }
      shootBall();
      fireTimer = setTimeout(tick, (S.auto ? 130 : 150) / sp);
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
    if (S.auto) S.uchikata = needRight() ? 'right' : 'left';   // オート時は打ち分け自動
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
  // 単一駆動ループ。busy で再入を防ぎ、途中例外でも finally で必ず解放する。
  function maybeConsume() { consumeLoop(); }
  async function consumeLoop() {
    if (S.busy || S.holds.length === 0) return;
    S.busy = true;
    try {
      while (S.holds.length > 0) {
        let roll = S.holds.shift();
        S.spins += 1;
        S.sinceHit += 1;
        coolWanted(0.3);   // パチンコを真面目に打つと手配度が少しずつ下がる
        accrueDebt();      // キャッシング利息・闇金の取り立てイベント処理
        if (S.kakuhen || S.jitan) S.stRemaining = Math.max(0, S.stRemaining - 1);
        // 天井（救済）: 通常で規定回転ハマったら強制大当り
        if (!roll.hit && !S.kakuhen && !S.jitan && S.spec.ceiling && S.sinceHit >= S.spec.ceiling) {
          roll = forcedHitRoll();
          if (window.PRODUCTION) window.PRODUCTION.msg('天井到達！救済大当り！');
        }
        refresh();

        const win = await window.PRODUCTION.run(roll.prod, roll.finalSyms, roll.willKakuhen);
        if (win) await doJackpot(roll.willKakuhen);
        else if ((S.kakuhen || S.jitan) && S.stRemaining <= 0) endST();
        recordHistory();
      }
    } catch (e) {
      console.error('consume error:', e);
      if (window.PRODUCTION) window.PRODUCTION.hideAll();
      if (window.AUDIO) window.AUDIO.stopBgm();
    } finally {
      S.busy = false;
      if (S.pendingSpec && !locked()) applySpec(S.pendingSpec);   // 演出中に選んだスペックを消化後すぐ反映
      refresh();
      // オート中で保留が尽きたら発射を継続して次の入賞を待つ
      if (S.auto && S.balls > 0 && S.holds.length === 0) fireStart();
    }
  }

  async function doJackpot(willKakuhen) {
    S.renchan += 1;
    S.bigHits += 1;
    if (willKakuhen) S.kakuhenCount += 1;
    S.sinceHit = 0;
    coolWanted(8);   // 大当りでさらに手配度ダウン
    if (S.renchan > S.maxRenchan) S.maxRenchan = S.renchan;
    S.holds = []; // 大当りで保留クリア（止め打ち）
    refresh();
    const spec = S.spec;
    // 壮大なストーリー：初当りごとに1章進行（連チャン中は割り込まない）
    if (S.renchan === 1 && S.storyChapter < window.STORY.chapterCount() && storyOn()) {
      await window.CINEMA.play(window.STORY.chapter(S.storyChapter), { bgm: 'super', skippable: true });
    }
    if (S.renchan === 1 && S.storyChapter < window.STORY.chapterCount()) { S.storyChapter++; save(); refresh(); }
    if (window.AUDIO) { window.AUDIO.setBaseBgm(null); window.AUDIO.startBgm('round'); }
    // ラウンド振り分け（出玉に幅）。低Rを引いたら昇格演出のチャンス。
    let rounds = window.RNG.drawRounds(spec);
    const maxR = spec.roundTable ? Math.max(...spec.roundTable.map(e => e.r)) : spec.rounds;
    if (rounds < maxR && Math.random() < 0.4) {
      const to = Math.random() < 0.5 ? maxR : Math.min(maxR, rounds + (rounds >= 7 ? 6 : 3));
      await window.PRODUCTION.playUpgrade(rounds, to); rounds = Math.max(rounds, to);
    }
    for (let r = 1; r <= rounds; r++) {
      const pay = spec.payoutPerRound;
      S.balls += pay;
      await window.PRODUCTION.playRound(r, rounds, pay, () => refresh(), { kakuhen: willKakuhen });
      refresh();
    }
    if (window.AUDIO) window.AUDIO.stopBgm(); // ラウンドBGM終了
    // 大当り後の状態
    if (willKakuhen) { S.kakuhen = true; S.jitan = false; }
    else { S.kakuhen = false; S.jitan = true; }
    S.stRemaining = spec.stCount;
    // 覚醒RUSH/時短 突入ムービー
    if (storyOn()) await window.CINEMA.play(window.STORY.awaken(willKakuhen), { skippable: true });
    if (window.AUDIO) window.AUDIO.setBaseBgm(S.kakuhen ? 'kakuhen' : 'jitan'); // 確変/時短BGM
    updatePeak();
    save();
    checkAchievements();
    await checkMilestones();   // FIRE到達チェック
    refresh();
  }

  function endST() {
    S.kakuhen = false; S.jitan = false; S.stRemaining = 0; S.renchan = 0;
    if (window.AUDIO) window.AUDIO.setBaseBgm('normal'); // 通常時も常時BGM
    window.PRODUCTION.msg('通常モードへ戻りました');
    save(); refresh();
  }

  function storyOn() { return window.SETTINGS && window.SETTINGS.story && window.CINEMA && window.STORY; }
  function updatePeak() { const a = assets(); if (a > S.peakAssets) S.peakAssets = a; }

  // FIRE マイルストーン到達でエンディング/特殊ムービー
  // ※フラグは「再生に成功してから」立てる（演出中で再生できなければ次回再挑戦＝エンディング消失を防ぐ）
  let _msBusy = false;
  async function checkMilestones() {
    if (_msBusy) return; _msBusy = true;
    try {
      for (const m of MILESTONES) {
        const a = assets();
        if (a >= m.amt && !S.milestonesHit[m.key]) {
          if (storyOn()) {
            const played = await window.CINEMA.play(window.STORY.ending(m), { bgm: 'allreel', skippable: false });
            if (!played) continue;            // 再生できなければフラグを立てず次回再挑戦
          }
          S.milestonesHit[m.key] = true; save(); refresh();
        }
      }
    } finally { _msBusy = false; }
  }

  function addBalls(n) { S.balls += n; refresh(); }

  // ---- 経済（玉貸/換金/レート）----
  function lendBalls() {
    if (locked()) return { ok: false, reason: 'busy' };
    const cost = LEND_LOT * S.rate;
    if (S.money < S.rate) return { ok: false, reason: 'nomoney' };  // 1玉も貸せない
    const lot = S.money >= cost ? LEND_LOT : Math.floor(S.money / S.rate);
    S.money -= lot * S.rate;
    S.balls += lot;
    if (window.AUDIO) window.AUDIO.SE.start();
    save(); refresh();
    return { ok: true, lot };
  }
  function cashOut() {
    if (locked() || S.balls <= 0) return;
    S.money += S.balls * S.rate;
    S.balls = 0;
    if (window.AUDIO) window.AUDIO.SE.kakutei();
    updatePeak(); save(); refresh();
    checkAchievements();
    checkMilestones();   // 換金で1億到達→エンディング
  }
  function setRate(r) {
    if (locked() || !RATES.includes(r)) return;
    if (S.balls > 0) { S.money += S.balls * S.rate; S.balls = 0; } // 一旦換金
    S.rate = r; if (r > S.maxRate) S.maxRate = r;
    S.startBalls = 0; S.history = [];
    save(); refresh(); checkAchievements();
  }
  function setSpeed(n) { if (!SPEEDS.includes(n)) return; S.speed = n; window.SPEED = n; save(); refresh(); }
  function addMoney(n, source) {
    S.money += Math.max(0, Math.floor(n));
    if (source === 'bait') { S.baitEarned = true; coolWanted(15); }  // 真面目に働くと手配度が下がる
    updatePeak(); save(); refresh(); checkMilestones(); checkAchievements();
  }

  // 実績解除チェック（再入ガード／早期実績は報酬で序盤を滑らかに）
  let _achBusy = false;
  function checkAchievements() {
    if (_achBusy) return; _achBusy = true;
    try {
      for (const a of ACHIEVEMENTS) {
        if (!S.achievements[a.id] && a.cond(S)) {
          S.achievements[a.id] = true;
          if (a.reward) S.money += a.reward;     // addMoney経由しない＝再帰回避
          if (window.UI && window.UI.toast) window.UI.toast(a.name, a.reward);
          if (window.AUDIO) window.AUDIO.SE.kakutei();
        }
      }
    } finally { _achBusy = false; save(); }
  }
  function getAchievements() { return ACHIEVEMENTS.map(a => ({ name: a.name, desc: a.desc, reward: a.reward, unlocked: !!S.achievements[a.id] })); }

  // 闇バイト用：投資（道具/準備代）と保釈金
  function spendMoney(n) { n = Math.floor(n); if (S.money < n) return false; S.money -= n; save(); refresh(); return true; }
  function payBail() { const b = Math.floor(S.money * 0.25); S.money -= b; save(); refresh(); return b; }
  // 闇バイト：成功で連続失敗リセット
  function darkWin() { S.darkFails = 0; save(); }
  // 闇バイト：失敗で保釈金25%（上限なし）＋連続3失敗でブラックリスト（示談金10〜300万）
  function darkFail() {
    const bail = Math.floor(S.money * 0.25); S.money -= bail;
    S.darkFails += 1; let blacklisted = false;
    if (S.darkFails >= 3) {
      blacklisted = true; S.darkBlacklist = true; S.darkFails = 0;
      S.darkBailFee = 100000 + Math.floor(Math.random() * 2900001); // 10〜300万
    }
    save(); refresh();
    return { bail, blacklisted, fee: S.darkBailFee };
  }
  function darkClearBlacklist() {
    if (!S.darkBlacklist) return true;
    if (S.money < S.darkBailFee) return false;
    S.money -= S.darkBailFee; S.darkBlacklist = false; S.darkBailFee = 0; save(); refresh(); return true;
  }
  // 闇バイト1回ごとに指名手配度が上昇（連続でやるほど危険）
  function darkAttempt() { S.wanted = Math.min(100, S.wanted + 5 + Math.random() * 15); save(); refresh(); }
  // 指名手配度に応じた成功率（100%で1%まで低下）
  function wantedRate(eff) { return Math.max(0.01, eff * (1 - S.wanted / 100)); }
  function coolWanted(n) { if (S.wanted > 0) { S.wanted = Math.max(0, S.wanted - n); } }
  function applySpec(key) {
    S.specKey = key; S.spec = C.SPECS[key];
    S.kakuhen = S.jitan = false; S.stRemaining = 0; S.renchan = 0; S.holds = [];
    // 台移動 = データリセット（軍資金/レート/借金は維持）
    S.spins = 0; S.bigHits = 0; S.kakuhenCount = 0; S.maxRenchan = 0; S.sinceHit = 0;
    S.startBalls = S.balls; S.history = []; S.pendingSpec = null;
    if (window.AUDIO) window.AUDIO.setBaseBgm('normal');
    save(); refresh();
  }
  // スペック変更は「すぐ反映」。演出中(locked)は予約し、消化が終わり次第 applySpec で即適用。
  function setSpec(key) {
    if (!C.SPECS[key]) return;
    if (locked()) { S.pendingSpec = key; refresh(); return; }
    applySpec(key);
  }

  // ===== キャッシング（借入）ロジック =====
  function cashLimit() { return CASH.base + S.cashClears * CASH.growth; }
  function yamiLimit() { return YAMI.base + S.yamiClears * YAMI.growth; }
  function borrowCash(amt) {
    amt = Math.floor(amt); const avail = cashLimit() - S.cashDebt;
    amt = Math.min(amt, avail); if (amt <= 0) return { ok: false };
    S.money += amt; S.cashDebt += amt; save(); refresh(); return { ok: true, amt };
  }
  function repayCash(amt) {
    amt = Math.min(Math.floor(amt), S.cashDebt, S.money); if (amt <= 0) return { ok: false };
    S.money -= amt; S.cashDebt -= amt; let cleared = false;
    if (S.cashDebt <= 0) { S.cashDebt = 0; S.cashTurns = 0; S.cashClears += 1; cleared = true; }  // 完済で限度UP
    save(); refresh(); return { ok: true, amt, cleared };
  }
  function borrowYami(amt) {
    amt = Math.floor(amt); const avail = yamiLimit() - S.yamiDebt;
    amt = Math.min(amt, avail); if (amt <= 0) return { ok: false };
    S.money += amt; S.yamiDebt += amt;
    S.wanted = Math.min(100, S.wanted + YAMI.wantedBorrow);   // 闇金は手配度UP
    if (!S.yamiCollectIn) S.yamiCollectIn = randCollect();    // 初回取り立てまでのカウント開始
    save(); refresh(); return { ok: true, amt };
  }
  function repayYami(amt) {
    amt = Math.min(Math.floor(amt), S.yamiDebt, S.money); if (amt <= 0) return { ok: false };
    S.money -= amt; S.yamiDebt -= amt; let cleared = false;
    if (S.yamiDebt <= 0) { S.yamiDebt = 0; S.yamiCollectIn = 0; S.yamiClears += 1; cleared = true; }  // 完済で限度が爆伸び
    save(); refresh(); return { ok: true, amt, cleared };
  }
  // 1回転ごと：通常リボ利息＋闇金のランダム取り立てイベント
  function accrueDebt() {
    if (S.cashDebt > 0) {
      S.cashTurns += 1;
      if (S.cashTurns >= CASH.interval) {
        S.cashTurns = 0;
        const add = Math.ceil(S.cashDebt * CASH.rate); S.cashDebt += add;
        if (window.PRODUCTION) window.PRODUCTION.msg(`💳 キャッシング利息 +¥${add.toLocaleString()}（残債 ¥${S.cashDebt.toLocaleString()}）`);
        save();
      }
    }
    if (S.yamiDebt > 0) {
      if (S.yamiCollectIn <= 0) S.yamiCollectIn = randCollect();
      S.yamiCollectIn -= 1;
      if (S.yamiCollectIn <= 0) {                       // ★取り立てイベント発生
        const due = Math.ceil(S.yamiDebt * YAMI.rate);  // 暴利の利息＝今回支払うべき額
        S.yamiDebt += due;
        S.wanted = Math.min(100, S.wanted + YAMI.wantedCollect);
        S.yamiCollectIn = randCollect();                // 次回の取り立てまで（ランダム）
        if (S.money >= due) {                            // 利息分を払える → 元本据え置き
          S.money -= due; S.yamiDebt -= due; save();
          if (window.PRODUCTION) window.PRODUCTION.msg(`🩸 闇金の取り立て！利息 ¥${due.toLocaleString()} を回収された（残債 ¥${S.yamiDebt.toLocaleString()}）`);
        } else {                                         // 払えない → 利息は元本へ上乗せ＆強制バイト
          save(); refresh();
          if (window.MINIGAMES && window.MINIGAMES.forcedCollect) window.MINIGAMES.forcedCollect(due);
          else if (window.PRODUCTION) window.PRODUCTION.msg(`🩸 闇金の取り立て！利息¥${due.toLocaleString()}が払えない…バイトで稼げ！`);
        }
      }
    }
  }
  function cashInfo() {
    return {
      cashDebt: S.cashDebt, cashLimit: cashLimit(), cashAvail: Math.max(0, cashLimit() - S.cashDebt),
      cashRate: CASH.rate, cashInterval: CASH.interval, cashClears: S.cashClears,
      yamiDebt: S.yamiDebt, yamiLimit: yamiLimit(), yamiAvail: Math.max(0, yamiLimit() - S.yamiDebt),
      yamiRate: YAMI.rate, yamiClears: S.yamiClears, yamiCollectIn: S.yamiCollectIn,
      money: S.money, totalDebt: totalDebt(),
    };
  }

  // ---- デバッグ強制再生 ----
  async function forcePlay(overrides) {
    if (S.busy) return;
    if (window.AUDIO) window.AUDIO.resume();
    S.busy = true;
    try { await forcePlayInner(overrides); }
    catch (e) { console.error('forcePlay error:', e); if (window.PRODUCTION) window.PRODUCTION.hideAll(); }
    finally { S.busy = false; refresh(); }
  }
  async function forcePlayInner(overrides) {
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
          if (dx * dx + dy * dy < 30) { b.vx = dx > 0 ? 1 : -1; b.vy *= 0.6; if (window.AUDIO && Math.random() < 0.18) window.AUDIO.SE.peg(); } });
        laneCtx.beginPath(); laneCtx.arc(b.x, b.y, 3.2, 0, 7); laneCtx.fill();
        if (b.y > H) balls2d.splice(i, 1);
      }
    }
    requestAnimationFrame(laneLoop);
  }

  window.GAME = { init, fireStart, fireStop, setAuto, setSpec, addBalls, forcePlay,
                  lendBalls, cashOut, setRate, setSpeed, addMoney, resetSave, resetMachine, save, setUchikata,
                  getAchievements, spendMoney, payBail, darkWin, darkFail, darkClearBlacklist, darkAttempt, wantedRate,
                  borrowCash, repayCash, borrowYami, repayYami, cashInfo,
                  get money() { return S.money; },
                  snapshot, get isBusy() { return S.busy; }, get isAuto() { return S.auto; } };
})();
