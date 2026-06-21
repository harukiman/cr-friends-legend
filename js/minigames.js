/*
 * minigames.js — 軍資金を稼ぐ「バイト」ミニゲーム集（職業テーマ・モーダル実行）
 *   1) 🍣 寿司職人  2) 🏪 レジ打ち  3) 📦 仕分け  4) 🧹 皿洗い
 * 報酬は GAME.addMoney(円,'bait') で軍資金に加算。
 */
(function () {
  const $ = s => document.querySelector(s);
  const A = () => window.AUDIO;
  let modal, body, titleEl, timers = [];

  function init() { modal = $('#minigame'); body = modal.querySelector('.mg-body'); titleEl = modal.querySelector('.mg-title'); }
  function clearTimers() { timers.forEach(t => { clearInterval(t); clearTimeout(t); }); timers = []; }
  function open() { init(); if (A()) A().resume(); modal.classList.remove('hidden'); menu(); }
  function close() { clearTimers(); modal.classList.add('hidden'); body.innerHTML = ''; }
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const after = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

  // 資金到達で上位バイト解放（上位ほど高単価）
  const BAIT = [
    { t: '🧹 皿洗い',        d: '5秒ひたすら連打', req: 0,        pay: 35,    fn: p => gameDish(p) },
    { t: '📦 仕分け(2色)',   d: '青左・赤右へ仕分け', req: 0,       pay: 130,   fn: p => gameSort(2, p) },
    { t: '🏪 レジ打ち',      d: '合計を暗算3択', req: 0,          pay: 400,   fn: p => gameRegi(1, p) },
    { t: '🍣 寿司職人',      d: 'シャリをタイミングで握る', req: 0, pay: 600,   fn: p => gameSushi(1, p) },
    { t: '🍳 ホテル厨房(記憶)', d: '光る順を覚えて再現', req: 100000,  pay: 12000, fn: p => gameKitchen(p) },
    { t: '🍣 高級寿司(高難度)', d: '小さい的を高速で', req: 500000,   pay: 9000,  fn: p => gameSushi(2, p) },
    { t: '🏢 経理(高難度暗算)', d: '大きい数を素早く', req: 2000000,  pay: 8000,  fn: p => gameRegi(2, p) },
    { t: '🏗 倉庫(3色仕分け)', d: '青左・黄中・赤右', req: 10000000, pay: 4000,  fn: p => gameSort(3, p) },
    { t: '📈 投資アシスタント(予測)', d: 'チャートの上下を当てる', req: 50000000, pay: 60000, fn: p => gameTrade(p) },
  ];
  function menu() {
    clearTimers(); titleEl.textContent = '💼 バイトを選ぶ';
    body.innerHTML = '';
    body.appendChild(el('p', 'mg-intro', '稼ぐほど高給バイトが解放！　うまくやるほど高評価＝高報酬。'));
    const money = window.GAME ? window.GAME.money : 0;
    const list = el('div', 'mg-list');
    BAIT.forEach(g => {
      const open = money >= g.req;
      const b = el('button', 'mg-game-btn', `<b>${g.t}</b><small>${open ? g.d : '🔒 ¥' + g.req.toLocaleString() + '到達で解放'}</small>`);
      if (!open) { b.disabled = true; b.style.opacity = .5; }
      else b.addEventListener('click', () => { if (A()) A().SE.button(); g.fn(g.pay); });
      list.appendChild(b);
    });
    body.appendChild(list);
    // 闇バイト入口（ハイリスク）
    const dark = el('button', 'mg-game-btn dark', '<b>🕶 闇バイト…</b><small>超高額。但し失敗で保釈金。自己責任で…</small>');
    dark.addEventListener('click', () => { if (A()) A().SE.swarm(); darkMenu(); });
    body.appendChild(dark);
  }

  // ===== 闇バイト（風刺・高リスク高リターン）=====
  const DARK = [
    { t: '📦 受け子', d: '荷物を受け取るだけ…？', base: 200000, danger: '受け渡し現場で張り込みが…！' },
    { t: '🏧 出し子', d: 'ATMで下ろすだけ…？', base: 450000, danger: '防犯カメラと警備員が…！' },
    { t: '📞 かけ子', d: '電話をかけるだけ…？', base: 800000, danger: '逆探知され通報が…！' },
  ];
  const TIERS = [
    { label: '手ぶらで決行', cost: 0, rate: 0.30 },
    { label: '準備 ¥30,000', cost: 30000, rate: 0.55 },
    { label: '入念 ¥100,000', cost: 100000, rate: 0.75 },
    { label: '完璧 ¥300,000', cost: 300000, rate: 0.90 },
  ];
  function darkMenu() {
    clearTimers(); titleEl.textContent = '🕶 闇バイト';
    body.innerHTML = '';
    body.appendChild(el('p', 'mg-warn', '⚠ これはゲームの演出です。現実の闇バイトは重大犯罪。絶対にやってはいけません。'));
    const list = el('div', 'mg-list');
    DARK.forEach(j => { const b = el('button', 'mg-game-btn dark', `<b>${j.t}</b><small>${j.d} 成功報酬 ¥${j.base.toLocaleString()}〜</small>`); b.addEventListener('click', () => darkSetup(j)); list.appendChild(b); });
    body.appendChild(list);
    const back = el('button', 'mg-btn', '◀ 戻る'); back.addEventListener('click', menu); body.appendChild(back);
  }
  function darkSetup(job) {
    clearTimers(); titleEl.textContent = job.t;
    body.innerHTML = '';
    body.appendChild(el('div', 'mg-info', '準備にいくら賭ける？（高いほど成功率UP）'));
    body.appendChild(el('p', 'mg-warn', '失敗すると保釈金として所持金の25%(上限¥100万)を没収。'));
    const list = el('div', 'mg-list');
    TIERS.forEach(tier => {
      const afford = window.GAME.money >= tier.cost;
      const b = el('button', 'mg-game-btn', `<b>${tier.label}</b><small>成功率 約${Math.round(tier.rate * 100)}%</small>`);
      if (!afford) { b.disabled = true; b.style.opacity = .5; }
      b.addEventListener('click', () => { if (window.GAME.spendMoney(tier.cost)) darkExecute(job, tier.rate); });
      list.appendChild(b);
    });
    body.appendChild(list);
    const back = el('button', 'mg-btn', '◀ 戻る'); back.addEventListener('click', darkMenu); body.appendChild(back);
  }
  // スキル無し：表示成功率でそのまま抽選（ドキドキの待ち時間→結果）
  function darkExecute(job, rate) {
    clearTimers(); titleEl.textContent = job.t + ' 決行中…';
    body.innerHTML = '';
    body.appendChild(el('div', 'mg-info', `成功率 ${Math.round(rate * 100)}% で抽選中…`));
    body.appendChild(el('div', 'mg-warn', '🕶 結果やいかに——'));
    if (A()) A().SE.swarm();
    after(1300, () => { const success = Math.random() < rate; darkResult(job, success); });
  }
  function darkResult(job, success) {
    clearTimers(); body.innerHTML = '';
    if (success) {
      const reward = Math.floor(job.base * (1 + Math.random() * 0.6));
      window.GAME.addMoney(reward, 'dark');
      if (A()) A().SE.kakutei();
      body.appendChild(el('div', 'mg-result', `😎 成功…バレずに完了。<br><span class="mg-reward">報酬 +¥${reward.toLocaleString()}</span><br><small style="color:#9d86c4">※ゲームの中だけ。現実では絶対にダメ。</small>`));
    } else {
      const bail = window.GAME.payBail();
      if (A()) { A().SE.lose(); A().SE.cutin(); }
      body.appendChild(el('div', 'mg-result arrested', `🚓 御用だ！！ 逮捕——<br><span class="mg-reward" style="color:#ff6b6b">保釈金 -¥${bail.toLocaleString()}</span><br><small style="color:#9d86c4">だから言ったでしょ。犯罪はダメ、絶対。</small>`));
    }
    const row = el('div', 'mg-btnrow');
    const again = el('button', 'mg-btn', '闇バイト一覧'); again.addEventListener('click', darkMenu);
    const cl = el('button', 'mg-btn', '足を洗う(閉じる)'); cl.addEventListener('click', close);
    row.append(again, cl); body.appendChild(row);
  }

  function finish(reward, label, rank) {
    clearTimers();
    reward = Math.max(0, Math.floor(reward));
    if (window.GAME) window.GAME.addMoney(reward, 'bait');
    if (A()) A().SE.kakutei();
    body.innerHTML = '';
    body.appendChild(el('div', 'mg-result', `${label}<br>${rank ? '<span class="mg-rank">' + rank + '</span><br>' : ''}<span class="mg-reward">バイト代 +¥${reward.toLocaleString()}</span>`));
    const row = el('div', 'mg-btnrow');
    const again = el('button', 'mg-btn', 'もう一度'); again.addEventListener('click', menu);
    const cl = el('button', 'mg-btn', '閉じる'); cl.addEventListener('click', close);
    row.appendChild(again); row.appendChild(cl); body.appendChild(row);
  }
  const rankOf = (score, max) => { const r = score / max; return r >= 1 ? '店長賞 SSS' : r >= .8 ? '評価 S' : r >= .6 ? '評価 A' : r >= .35 ? '評価 B' : '評価 C'; };

  // 1) 🍣 寿司職人（タイミング×コンボ）
  function gameSushi(diff = 1, pay = 600) {
    clearTimers(); titleEl.textContent = diff >= 2 ? '🍣 高級寿司' : '🍣 寿司職人';
    let round = 0, hits = 0, combo = 0, best = 0; const N = diff >= 2 ? 8 : 6;
    body.innerHTML = '';
    const info = el('div', 'mg-info', `${N}貫握れ！`);
    const combEl = el('div', 'mg-combo', '');
    const bar = el('div', 'mg-bar'); const zone = el('div', 'mg-zone'); const cur = el('div', 'mg-cursor');
    bar.appendChild(zone); bar.appendChild(cur);
    const btn = el('button', 'mg-btn wide', '🍚 握る！');
    body.append(info, combEl, bar, btn);
    let pos = 0, dir = 1, speed = 2, iv = null;
    function round_() {
      if (round >= N) { const reward = hits * pay + best * Math.floor(pay / 4); return finish(reward, `${hits}/${N}貫成功・最大${best}コンボ`, rankOf(hits, N)); }
      round++;
      const minW = diff >= 2 ? 8 : 14, baseW = diff >= 2 ? 20 : 26, sp0 = diff >= 2 ? 2.6 : 1.8, spk = diff >= 2 ? 0.7 : 0.5;
      const zw = Math.max(minW, baseW - round * 1.5), zl = 10 + Math.random() * (78 - zw);
      zone.style.left = zl + '%'; zone.style.width = zw + '%';
      pos = 0; dir = 1; speed = sp0 + round * spk; cur._zl = zl; cur._zw = zw;
      info.textContent = `${round}/${N}貫目`; btn.disabled = false;
      clearInterval(iv); iv = setInterval(() => { pos += dir * speed; if (pos >= 100) { pos = 100; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; } cur.style.left = pos + '%'; }, 16); timers.push(iv);
    }
    btn.addEventListener('click', () => {
      if (btn.disabled) return; btn.disabled = true; clearInterval(iv);
      const ok = pos >= cur._zl && pos <= cur._zl + cur._zw;
      if (ok) { hits++; combo++; best = Math.max(best, combo); if (A()) A().SE.holdUp(); } else { combo = 0; if (A()) A().SE.lose(); }
      info.textContent = ok ? 'ナイス握り！🍣' : 'シャリが崩れた…'; combEl.textContent = combo > 1 ? `🔥${combo} コンボ！` : '';
      after(450, round_);
    });
    round_();
  }

  // 2) 🏪 レジ打ち（暗算×3択）
  function gameRegi(diff = 1, pay = 400) {
    clearTimers(); titleEl.textContent = diff >= 2 ? '🏢 経理(高難度暗算)' : '🏪 レジ打ち';
    let q = 0, correct = 0, time = diff >= 2 ? 22.0 : 25.0; const N = 8;
    body.innerHTML = '';
    const info = el('div', 'mg-info', '');
    const recpt = el('div', 'mg-receipt', '');
    const opts = el('div', 'mg-opts', '');
    body.append(info, recpt, opts);
    function next() {
      if (q >= N) return done();
      q++;
      const n = (diff >= 2 ? 3 : 2) + Math.floor(Math.random() * 3);
      const items = []; let sum = 0;
      const names = ['🍙おにぎり', '🥤お茶', '🍫チョコ', '🍜カップ麺', '🍞パン', '🍌バナナ'];
      const unit = diff >= 2 ? 1000 : 100;
      for (let i = 0; i < n; i++) { const price = (Math.floor(Math.random() * 9) + 1) * (Math.random() < .5 ? 10 : unit) + (Math.floor(Math.random() * 9) + 1) * 10; sum += price; items.push(`${names[Math.floor(Math.random() * names.length)]} ¥${price}`); }
      recpt.innerHTML = `お客さんのカゴ：<br>${items.join('<br>')}<hr>合計はいくら？`;
      const ans = [sum, sum + (Math.random() < .5 ? 10 : -10) * (1 + Math.floor(Math.random() * 5)), sum + (Math.random() < .5 ? 100 : -20)].map(v => Math.max(10, v));
      // shuffle
      for (let i = ans.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ans[i], ans[j]] = [ans[j], ans[i]]; }
      opts.innerHTML = ''; info.textContent = `${q}/${N}問　残${time.toFixed(0)}秒　正解 ${correct}`;
      ans.forEach(v => { const b = el('button', 'mg-opt', `¥${v.toLocaleString()}`); b.addEventListener('click', () => { if (v === sum) { correct++; if (A()) A().SE.holdUp(); } else if (A()) A().SE.lose(); next(); }); opts.appendChild(b); });
    }
    function done() { finish(correct * pay, `${correct}/${N}問 正解！`, rankOf(correct, N)); }
    const iv = setInterval(() => { time -= 0.1; if (time <= 0) { clearInterval(iv); return done(); } info.textContent = `${q}/${N}問　残${time.toFixed(0)}秒　正解 ${correct}`; }, 100); timers.push(iv);
    next();
  }

  // 3) 📦 仕分けバイト（色で左右）
  function gameSort(lanes = 2, pay = 130) {
    clearTimers(); titleEl.textContent = lanes >= 3 ? '🏗 倉庫(3色仕分け)' : '📦 仕分けバイト';
    let time = 20.0, sorted = 0, miss = 0, cur = null;
    const COLORS = lanes >= 3
      ? [{ k: 'blue', c: '#2a7fff', side: 'L' }, { k: 'yellow', c: '#ffd23b', side: 'M' }, { k: 'red', c: '#ff3b3b', side: 'R' }]
      : [{ k: 'blue', c: '#2a7fff', side: 'L' }, { k: 'red', c: '#ff3b3b', side: 'R' }];
    body.innerHTML = '';
    const info = el('div', 'mg-info', lanes >= 3 ? '青左・黄中・赤右' : '青→左 / 赤→右');
    const stage = el('div', 'mg-sort', '<div class="mg-pkg"></div>');
    const pkg = stage.querySelector('.mg-pkg');
    const row = el('div', 'mg-btnrow');
    const btns = [];
    if (lanes >= 3) { btns.push(['◀ 青', 'L'], ['● 黄', 'M'], ['赤 ▶', 'R']); }
    else { btns.push(['◀ 青(左)', 'L'], ['赤(右) ▶', 'R']); }
    btns.forEach(([label, side]) => { const b = el('button', 'mg-btn', label); b.addEventListener('click', () => judge(side)); row.appendChild(b); });
    body.append(info, stage, row);
    const spd = lanes >= 3 ? 90 : 120;
    function spawn() { cur = COLORS[Math.floor(Math.random() * COLORS.length)]; pkg.style.display = 'block'; pkg.style.background = cur.c; pkg.textContent = '📦'; pkg.classList.remove('drop'); void pkg.offsetWidth; pkg.classList.add('drop'); }
    function judge(side) { if (!cur) return; const ok = side === cur.side; if (ok) { sorted++; if (A()) A().SE.push(); } else { miss++; if (A()) A().SE.lose(); } cur = null; pkg.style.display = 'none'; after(spd, spawn); }
    const iv = setInterval(() => { time -= 0.1; if (time <= 0) { clearInterval(iv); return finish(Math.max(0, sorted * pay - miss * Math.floor(pay / 3)), `仕分け ${sorted}個・ミス${miss}`, rankOf(sorted, lanes >= 3 ? 32 : 28)); } info.textContent = `残${time.toFixed(0)}秒　仕分 ${sorted}　ミス ${miss}`; }, 100); timers.push(iv);
    spawn();
  }

  // 🍳 ホテル厨房（サイモン風：光る順を記憶して再現）
  function gameKitchen(pay = 12000) {
    clearTimers(); titleEl.textContent = '🍳 ホテル厨房(記憶)';
    let level = 1, cleared = 0; const MAX = 6;
    body.innerHTML = '';
    const info = el('div', 'mg-info', '光る順を覚えて同じ順にタップ！');
    const grid = el('div', 'mg-grid');
    const cells = [];
    const PAL = ['#ff3b3b', '#39d353', '#2a7fff', '#ffd23b'];
    for (let i = 0; i < 4; i++) { const c = el('button', 'mg-pad', ''); c.style.background = PAL[i]; c.style.opacity = .5; cells.push(c); grid.appendChild(c); }
    body.append(info, grid);
    let seq = [], input = [], playing = false;
    function flash(i) { cells[i].style.opacity = 1; if (A()) A().SE.su(i + 1); after(300, () => { cells[i].style.opacity = .5; }); }
    async function showSeq() {
      playing = true; input = [];
      for (const i of seq) { await new Promise(r => after(550, r)); flash(i); }
      playing = false; info.textContent = `あなたの番！ (Lv${level})`;
    }
    function nextLevel() {
      if (cleared >= MAX) return finish(cleared * pay, `${cleared}ステージ クリア！`, rankOf(cleared, MAX));
      level = cleared + 1; seq.push(Math.floor(Math.random() * 4)); info.textContent = `Lv${level}：順番を覚えて…`;
      after(500, showSeq);
    }
    cells.forEach((c, i) => c.addEventListener('pointerdown', () => {
      if (playing) return; flash(i); input.push(i);
      const k = input.length - 1;
      if (input[k] !== seq[k]) { if (A()) A().SE.lose(); return finish(cleared * pay, `Lv${level}で失敗… ${cleared}クリア`, rankOf(cleared, MAX)); }
      if (input.length === seq.length) { cleared++; if (A()) A().SE.holdUp(); after(600, nextLevel); }
    }));
    nextLevel();
  }

  // 📈 投資アシスタント（チャートの上下を予測）
  function gameTrade(pay = 60000) {
    clearTimers(); titleEl.textContent = '📈 投資アシスタント';
    let round = 0, correct = 0, price = 1000; const N = 8; const hist = [price];
    body.innerHTML = '';
    const info = el('div', 'mg-info', '次は上がる？下がる？');
    const cv = el('canvas', 'mg-chart'); cv.width = 280; cv.height = 120;
    const row = el('div', 'mg-btnrow');
    const up = el('button', 'mg-btn', '📈 上がる'); const dn = el('button', 'mg-btn', '📉 下がる');
    row.append(up, dn); body.append(info, cv, row);
    const ctx = cv.getContext('2d');
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const mx = Math.max(...hist), mn = Math.min(...hist), rng = (mx - mn) || 1;
      ctx.strokeStyle = '#19e6a0'; ctx.lineWidth = 2; ctx.beginPath();
      hist.forEach((v, i) => { const x = i / Math.max(1, N) * cv.width, y = cv.height - (v - mn) / rng * (cv.height - 10) - 5; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    function guess(dir) {
      if (round >= N) return;
      round++;
      const move = (Math.random() - 0.45) * 200; const ndir = move >= 0 ? 'up' : 'down';
      price = Math.max(50, Math.round(price + move)); hist.push(price);
      if (dir === ndir) { correct++; if (A()) A().SE.holdUp(); } else if (A()) A().SE.lose();
      info.textContent = `${round}/${N}　的中 ${correct}　現在 ¥${price}`;
      draw();
      if (round >= N) after(500, () => finish(correct * pay, `的中 ${correct}/${N}`, rankOf(correct, N)));
    }
    up.addEventListener('click', () => guess('up')); dn.addEventListener('click', () => guess('down'));
    draw();
  }

  // 4) 🧹 皿洗い（連打×コンボメーター）
  function gameDish(pay = 35) {
    clearTimers(); titleEl.textContent = '🧹 皿洗い';
    let taps = 0, time = 5.0;
    body.innerHTML = '';
    const info = el('div', 'mg-info', '5.0秒　洗った皿 0');
    const meter = el('div', 'mg-meter', '<span></span>'); const fill = meter.querySelector('span');
    const dish = el('button', 'mg-taiko', '🍽️<br>洗う！');
    body.append(info, meter, dish);
    const tap = () => { taps++; info.textContent = `${time.toFixed(1)}秒　洗った皿 ${taps}`; fill.style.width = Math.min(100, (taps % 25) / 25 * 100) + '%'; dish.classList.remove('hit'); void dish.offsetWidth; dish.classList.add('hit'); if (A()) A().SE.peg(); };
    dish.addEventListener('pointerdown', tap);
    const iv = setInterval(() => { time -= 0.1; if (time <= 0) { clearInterval(iv); return finish(taps * pay, `${taps}枚 ピカピカ！`, rankOf(taps, 60)); } info.textContent = `${time.toFixed(1)}秒　洗った皿 ${taps}`; }, 100); timers.push(iv);
  }

  window.MINIGAMES = { init, open, close };
})();
