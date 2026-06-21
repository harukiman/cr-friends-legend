/*
 * ui.js — DOM バインディング（操作・表示・経済・バイト・設定）
 */
(function () {
  const $ = s => document.querySelector(s);
  const C = window.CONFIG;
  const yen = n => '¥' + Math.floor(n).toLocaleString();
  const oku = n => n >= 1e8 ? (n / 1e8).toFixed(2) + '億' : n >= 1e4 ? Math.floor(n / 1e4) + '万' : Math.floor(n) + '';
  const RATE_LABEL = r => r + 'パチ(¥' + r + '/玉)';

  function render(st) {
    // 台情報
    $('#balls').textContent = st.balls;
    const diffEl = $('#diff');
    diffEl.textContent = (st.diff >= 0 ? '+' : '') + st.diff;
    diffEl.style.color = st.diff >= 0 ? '#39d353' : '#ff6b6b';
    $('#renchan').textContent = st.renchan;
    const badge = $('#state-badge'); badge.className = 'badge';
    if (st.state === 'kakuhen') { badge.textContent = `確変 残${st.stRemaining}`; badge.classList.add('kakuhen'); }
    else if (st.state === 'jitan') { badge.textContent = `時短 残${st.stRemaining}`; badge.classList.add('jitan'); }
    else badge.textContent = '通常';

    // 軍資金バー（増加時にポップ）
    const me = $('#bk-money'); const newM = yen(st.money);
    if (me._val != null && st.money > me._val) { me.classList.remove('bk-pop'); void me.offsetWidth; me.classList.add('bk-pop'); }
    me._val = st.money; me.textContent = newM;
    $('#bk-value').textContent = yen(st.ballValue);
    const p = $('#bk-profit'); p.textContent = (st.profit >= 0 ? '+' : '') + yen(st.profit); p.style.color = st.profit >= 0 ? '#39d353' : '#ff6b6b';
    $('#fg-pct').textContent = st.goalPct.toFixed(st.goalPct < 10 ? 2 : 1) + '%';
    $('#fg-detail').textContent = `(資産 ¥${oku(st.assets)} / 1億)`;
    $('#fg-fill').style.width = Math.min(100, st.goalPct) + '%';

    // データカウンター
    $('#dc-bighits').textContent = st.bigHits;
    $('#dc-kakuhen').textContent = st.kakuhenCount;
    $('#dc-maxren').textContent = st.maxRenchan;
    $('#dc-spins').textContent = st.spins;
    $('#dc-since').textContent = st.sinceHit;
    $('#dc-prob').textContent = st.bigHits > 0 ? '1/' + Math.round(st.spins / st.bigHits) : '1/---';

    // 電サポ/右打ち/RUSH
    const denkou = st.state === 'kakuhen' || st.state === 'jitan';
    $('#migiuchi').classList.toggle('hidden', !denkou);
    const cab = $('#cabinet'); if (cab) cab.classList.toggle('fever', st.state === 'kakuhen');
    const scr = $('#screen'); if (scr) scr.classList.toggle('rush', denkou);

    // 打ち分け
    const ul = $('#uchi-left'), ur = $('#uchi-right');
    ul.classList.toggle('active', st.uchikata === 'left');
    ur.classList.toggle('active', st.uchikata === 'right');
    // 必要な打ち方と違うときだけ点滅（通常時の左は既定なので常時点滅させない）
    ur.classList.toggle('need', st.needRight && st.uchikata !== 'right');
    ul.classList.toggle('need', !st.needRight && st.uchikata === 'right');

    // レート/倍速/玉貸
    const rs = $('#rate-select'); if (rs && +rs.value !== st.rate) rs.value = st.rate;
    const ss = $('#speed-select'); if (ss && +ss.value !== st.speed) ss.value = st.speed;
    $('#lend').textContent = '玉貸 ' + yen(500 * st.rate);

    // 変動中ランプ
    const cur = $('#hold-current'); if (cur) { cur.classList.toggle('on', !!st.spinning); cur.style.color = '#3af0ff'; }

    // 保留
    document.querySelectorAll('.hold-slot').forEach((el, i) => {
      const h = st.holds[i]; const nc = h ? h.color : '';
      if (el._color !== nc) {
        if (h && el._color && el._color !== '#e8e8e8') { el.classList.remove('promote'); void el.offsetWidth; el.classList.add('promote'); }
        el._color = nc;
      }
      if (h) { el.classList.add('on'); el.style.color = h.color; } else { el.classList.remove('on'); el.style.color = ''; }
    });

    drawSlump(st.history);
  }

  let slumpCtx = null;
  function drawSlump(history) {
    const cv = document.getElementById('slump'); if (!cv) return;
    slumpCtx = slumpCtx || cv.getContext('2d');
    const ctx = slumpCtx, W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const data = history && history.length ? history : [{ n: 0, diff: 0 }];
    let max = 1000, min = -1000;
    for (const pt of data) { if (pt.diff > max) max = pt.diff; if (pt.diff < min) min = pt.diff; }
    const pad = (max - min) * 0.12 || 200; max += pad; min -= pad;
    const x = i => (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - 2)) + 1;
    const y = v => H - ((v - min) / (max - min)) * (H - 2) - 1;
    ctx.strokeStyle = '#16223a'; ctx.lineWidth = 1; ctx.beginPath();
    for (let g = Math.ceil(min / 1000) * 1000; g <= max; g += 1000) { const gy = y(g); ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke();
    ctx.strokeStyle = '#3a5378'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, y(0)); ctx.lineTo(W, y(0)); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,210,59,.35)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i < data.length; i++) if (data[i].diff - data[i - 1].diff > 200) { const mx = x(i); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); }
    ctx.stroke();
    ctx.beginPath(); data.forEach((pt, i) => { const px = x(i), py = y(pt.diff); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.lineTo(x(data.length - 1), y(min)); ctx.lineTo(x(0), y(min)); ctx.closePath();
    ctx.fillStyle = 'rgba(25,230,160,.13)'; ctx.fill();
    ctx.strokeStyle = '#19e6a0'; ctx.lineWidth = 1.6; ctx.beginPath();
    data.forEach((pt, i) => { const px = x(i), py = y(pt.diff); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke();
    const last = data[data.length - 1];
    ctx.fillStyle = last.diff >= 0 ? '#39d353' : '#ff6b6b';
    ctx.beginPath(); ctx.arc(x(data.length - 1), y(last.diff), 2.6, 0, 7); ctx.fill();
  }

  function buildSpecSelect() {
    const sel = $('#spec-select');
    Object.entries(C.SPECS).forEach(([key, sp]) => {
      const o = document.createElement('option');
      o.value = key; o.textContent = `${sp.name} (1/${sp.normalOdds})`;
      if (key === C.DEFAULT_SPEC) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => window.GAME.setSpec(sel.value));
  }
  function buildRateSelect() {
    const sel = $('#rate-select');
    (window.GAME.snapshot().rates || [1, 5, 100, 1000, 10000]).forEach(r => {
      const o = document.createElement('option'); o.value = r; o.textContent = RATE_LABEL(r); sel.appendChild(o);
    });
    sel.value = window.GAME.snapshot().rate;
    sel.addEventListener('change', () => window.GAME.setRate(+sel.value));
  }
  function buildSpeedSelect() {
    const sel = $('#speed-select');
    (window.GAME.snapshot().speeds || [1, 2, 3, 5, 10, 50, 100]).forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = '×' + s; sel.appendChild(o);
    });
    sel.value = window.GAME.snapshot().speed;
    sel.addEventListener('change', () => window.GAME.setSpeed(+sel.value));
  }
  function buildReliabilityInfo() {
    const R = C.PRODUCTIONS.reach.filter(r => r.kind !== 'none').map(r => `${r.label}=${Math.round(r.reliability * 100)}%`).join(' / ');
    $('#reliability').innerHTML = `<b>遊び方</b>: レート選択→「玉貸」で玉を借り、長押しで発射。電サポ中は「右打ち」！ 当りで軍資金を増やし1億円(FIRE)を目指せ。軍資金は自動保存。<br><b>リーチ信頼度</b>: ${R}`;
  }

  // 音量・ミュートの保存/復元
  const AKEY = 'crfl_audio';
  function saveAudio() { try { localStorage.setItem(AKEY, JSON.stringify({ v: parseFloat($('#volume').value), m: window.AUDIO.isMuted })); } catch (_) {} }
  function loadAudio() {
    try {
      const d = JSON.parse(localStorage.getItem(AKEY) || 'null'); if (!d) return;
      if (typeof d.v === 'number' && isFinite(d.v)) { $('#volume').value = d.v; window.AUDIO.setVolume(d.v); }
      if (d.m) { window.AUDIO.setMuted(true); $('#mute').textContent = '🔇'; }
    } catch (_) {}
  }

  // 永続フラグ（初回OP/チュートリアル/演出倍速）
  const OPKEY = 'crfl_op', TUTKEY = 'crfl_tut', FPKEY = 'crfl_fastprod';
  let opSeen = false, baseStarted = false;
  function loadFlags() {
    try { opSeen = localStorage.getItem(OPKEY) === '1'; } catch (_) {}
    try { if (localStorage.getItem(FPKEY) === '1') { window.SETTINGS.fastProduction = true; const b = $('#toggle-fastprod'); b.classList.add('active'); b.textContent = '⏩ 演出も倍速 ON'; } } catch (_) {}
  }
  function ensureBaseBgm() { if (baseStarted) return; baseStarted = true; if (window.AUDIO) window.AUDIO.setBaseBgm('normal'); }

  async function maybeOpening() {
    if (opSeen) return false;
    opSeen = true; try { localStorage.setItem(OPKEY, '1'); } catch (_) {}
    ensureBaseBgm();
    if (window.SETTINGS && window.SETTINGS.story && window.CINEMA && window.STORY) {
      await window.CINEMA.play(window.STORY.opening(), { bgm: 'super', skippable: true });
    }
    if (localStorage.getItem(TUTKEY) !== '1') { showTutorial(); try { localStorage.setItem(TUTKEY, '1'); } catch (_) {} }
    return true;
  }

  // ===== トースト（実績解除） =====
  function toast(name, reward) {
    const wrap = $('#toast-wrap'); if (!wrap) return;
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = `🏆 実績解除：<b>${name}</b>${reward ? ` <b>+¥${reward.toLocaleString()}</b>` : ''}`;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ===== 実績パネル =====
  function openAch() {
    const m = $('#ach-modal'), body = $('#ach-body');
    body.innerHTML = '';
    (window.GAME.getAchievements() || []).forEach(a => {
      const d = document.createElement('div'); d.className = 'ach-item' + (a.unlocked ? '' : ' locked');
      d.innerHTML = `<div><div class="ach-name">${a.unlocked ? '🏆' : '🔒'} ${a.name}</div><div class="ach-desc">${a.desc}</div></div>${a.reward ? `<div class="ach-rw">+¥${a.reward.toLocaleString()}</div>` : ''}`;
      body.appendChild(d);
    });
    m.classList.remove('hidden');
  }

  // ===== チュートリアル =====
  function showTutorial() {
    const m = $('#tutorial'), body = $('#tut-body');
    body.innerHTML = '';
    const steps = [
      'まず<b>レート</b>を選び、<b>「玉貸」</b>で軍資金を玉に替える（電サポ中以外は左打ち）。',
      '<b>発射ボタンを長押し</b>で打ち出し。始動口入賞でデジタル図柄が回転、揃えば<b>大当り</b>！',
      '<b>確変/時短(電サポ)中は「右打ち」</b>に切替！　右打ちしないと玉が入りません。',
      '玉が増えたら<b>「換金」</b>で軍資金に。資金が尽きたら<b>「💼バイト」</b>で稼ごう（高給バイトや闇バイトも）。',
      '<b>倍速</b>で待ち時間を短縮（演出は通常速度。設定で演出も倍速可）。',
      '当りで資金を増やし<b>1億円(FIRE)</b>を目指せ！　5億・10億の特殊エンディングも。進捗は自動保存。',
    ];
    steps.forEach((s, i) => { const d = document.createElement('div'); d.className = 'tut-step'; d.innerHTML = `<div class="tut-no">${i + 1}</div><div class="tut-txt">${s}</div>`; body.appendChild(d); });
    const ok = document.createElement('button'); ok.className = 'mg-btn'; ok.textContent = 'はじめる！'; ok.addEventListener('click', () => m.classList.add('hidden'));
    body.appendChild(ok);
    m.classList.remove('hidden');
  }

  function bindControls() {
    const fire = $('#fire');
    const start = async e => {
      e.preventDefault(); window.AUDIO.resume(); ensureBaseBgm();
      if (window.CINEMA && window.CINEMA.isPlaying) return;
      if (await maybeOpening()) return;
      if (e.pointerId != null && fire.setPointerCapture) { try { fire.setPointerCapture(e.pointerId); } catch (_) {} }
      window.GAME.fireStart();
    };
    const stop = e => { if (e) e.preventDefault(); window.GAME.fireStop(); };
    fire.addEventListener('pointerdown', start);
    fire.addEventListener('pointerup', stop);
    fire.addEventListener('pointercancel', stop);
    fire.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); window.AUDIO.resume(); if (!(window.CINEMA && window.CINEMA.isPlaying)) window.GAME.fireStart(); } });
    fire.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.GAME.fireStop(); } });
    fire.addEventListener('blur', () => window.GAME.fireStop());

    const auto = $('#auto');
    auto.addEventListener('click', async () => {
      window.AUDIO.resume(); ensureBaseBgm();
      if (window.CINEMA && window.CINEMA.isPlaying) return;
      if (await maybeOpening()) return;
      const on = !auto.classList.contains('active');
      auto.classList.toggle('active', on);
      auto.textContent = on ? 'オート ON' : 'オート OFF';
      window.GAME.setAuto(on);
    });

    // 打ち分け
    $('#uchi-left').addEventListener('click', () => { window.AUDIO.resume(); window.GAME.setUchikata('left'); });
    $('#uchi-right').addEventListener('click', () => { window.AUDIO.resume(); window.GAME.setUchikata('right'); });

    // 玉貸・換金・バイト
    $('#lend').addEventListener('click', () => {
      window.AUDIO.resume();
      const r = window.GAME.lendBalls();
      if (!r.ok && r.reason === 'nomoney') window.PRODUCTION.msg('軍資金が足りません →「💼バイト」で稼ごう！');
    });
    $('#cashout').addEventListener('click', () => { window.AUDIO.resume(); window.GAME.cashOut(); });
    $('#bait').addEventListener('click', () => {
      window.AUDIO.resume();
      if (window.GAME.isBusy || (window.CINEMA && window.CINEMA.isPlaying)) { window.PRODUCTION.msg('演出中はバイトに行けません'); return; }
      window.MINIGAMES.open();
    });
    $('#minigame .mg-close').addEventListener('click', () => window.MINIGAMES.close());

    // 音
    $('#volume').addEventListener('input', e => { window.AUDIO.setVolume(parseFloat(e.target.value)); saveAudio(); });
    const mute = $('#mute');
    mute.addEventListener('click', () => { window.AUDIO.resume(); const m = !window.AUDIO.isMuted; window.AUDIO.setMuted(m); mute.textContent = m ? '🔇' : '🔊'; saveAudio(); });

    // ムービー
    const story = $('#toggle-story');
    story.addEventListener('click', () => { const on = !window.SETTINGS.story; window.SETTINGS.story = on; story.classList.toggle('active', on); story.textContent = on ? '🎬 ムービー ON' : '🎬 ムービー OFF'; });
    $('#replay-op').addEventListener('click', async () => { window.AUDIO.resume(); ensureBaseBgm(); if (window.CINEMA && window.STORY && !window.CINEMA.isPlaying) await window.CINEMA.play(window.STORY.opening(), { bgm: 'super', skippable: true }); });
    $('#replay-tut').addEventListener('click', () => showTutorial());

    // 演出も倍速トグル
    const fp = $('#toggle-fastprod');
    fp.addEventListener('click', () => {
      const on = !window.SETTINGS.fastProduction; window.SETTINGS.fastProduction = on;
      fp.classList.toggle('active', on); fp.textContent = on ? '⏩ 演出も倍速 ON' : '⏩ 演出も倍速 OFF';
      try { localStorage.setItem(FPKEY, on ? '1' : '0'); } catch (_) {}
    });

    // UIクリックの触感（軽いtick）
    ['#shop', '#shop2', '#uchi', '#panel'].forEach(sel => {
      const e = $(sel); if (e) e.addEventListener('click', ev => { if (ev.target.closest('button,select') && window.AUDIO && window.AUDIO.SE.tick) window.AUDIO.SE.tick(); }, true);
    });

    // 実績パネル
    $('#achievements').addEventListener('click', openAch);
    $('#ach-close').addEventListener('click', () => $('#ach-modal').classList.add('hidden'));
    $('#tut-close').addEventListener('click', () => $('#tutorial').classList.add('hidden'));

    // データ削除（確認必須。それ以外で進捗はリセットされない）
    $('#data-delete').addEventListener('click', () => {
      if (confirm('進捗データを削除しますか？\n軍資金・FIRE進捗・実績がすべて初期化されます。')) {
        window.GAME.resetSave();
        window.PRODUCTION.msg('データを初期化しました');
      }
    });
  }

  window.UI = { render, toast, init() { buildSpecSelect(); buildRateSelect(); buildSpeedSelect(); buildReliabilityInfo(); bindControls(); loadAudio(); loadFlags(); } };
})();
