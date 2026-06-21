/*
 * ui.js — DOM バインディング（操作・表示・設定・デバッグ）
 */
(function () {
  const $ = s => document.querySelector(s);
  const C = window.CONFIG;

  function render(st) {
    $('#balls').textContent = st.balls;
    const diffEl = $('#diff');
    diffEl.textContent = (st.diff >= 0 ? '+' : '') + st.diff;
    diffEl.style.color = st.diff >= 0 ? '#39d353' : '#ff6b6b';
    $('#renchan').textContent = st.renchan;
    const badge = $('#state-badge');
    badge.className = 'badge';
    if (st.state === 'kakuhen') { badge.textContent = `確変 残${st.stRemaining}`; badge.classList.add('kakuhen'); }
    else if (st.state === 'jitan') { badge.textContent = `時短 残${st.stRemaining}`; badge.classList.add('jitan'); }
    else badge.textContent = '通常';

    // データカウンター
    $('#dc-bighits').textContent = st.bigHits;
    $('#dc-kakuhen').textContent = st.kakuhenCount;
    $('#dc-maxren').textContent = st.maxRenchan;
    $('#dc-spins').textContent = st.spins;
    $('#dc-since').textContent = st.sinceHit;
    $('#dc-prob').textContent = st.bigHits > 0 ? '1/' + Math.round(st.spins / st.bigHits) : '1/---';

    // 電サポ中(確変/時短)は右打ち＋FEVER枠＋RUSH背景
    const denkou = st.state === 'kakuhen' || st.state === 'jitan';
    $('#migiuchi').classList.toggle('hidden', !denkou);
    const cab = $('#cabinet'); if (cab) cab.classList.toggle('fever', st.state === 'kakuhen');
    const scr = $('#screen'); if (scr) scr.classList.toggle('rush', denkou);

    // 変動中ランプ
    const cur = $('#hold-current');
    if (cur) { cur.classList.toggle('on', !!st.spinning); cur.style.color = '#3af0ff'; }

    // 保留（先読み昇格は色変化でポップ）
    const slots = document.querySelectorAll('.hold-slot');
    slots.forEach((el, i) => {
      const h = st.holds[i];
      const newColor = h ? h.color : '';
      if (el._color !== newColor) {
        if (h && el._color && el._color !== '#e8e8e8') {
          el.classList.remove('promote'); void el.offsetWidth; el.classList.add('promote');
        }
        el._color = newColor;
      }
      if (h) { el.classList.add('on'); el.style.background = ''; el.style.color = h.color; }
      else { el.classList.remove('on'); el.style.color = ''; }
    });

    drawSlump(st.history);
  }

  // スランプグラフ（差玉の推移）
  let slumpCtx = null;
  function drawSlump(history) {
    const cv = document.getElementById('slump');
    if (!cv) return;
    slumpCtx = slumpCtx || cv.getContext('2d');
    const ctx = slumpCtx, W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const data = history && history.length ? history : [{ n: 0, diff: 0 }];
    let max = 1000, min = -1000;
    for (const p of data) { if (p.diff > max) max = p.diff; if (p.diff < min) min = p.diff; }
    const pad = (max - min) * 0.12 || 200; max += pad; min -= pad;
    const x = i => (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - 2)) + 1;
    const y = v => H - ((v - min) / (max - min)) * (H - 2) - 1;
    // 1000玉ごとのグリッド
    ctx.strokeStyle = '#16223a'; ctx.lineWidth = 1; ctx.beginPath();
    const startG = Math.ceil(min / 1000) * 1000;
    for (let g = startG; g <= max; g += 1000) { const gy = y(g); ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke();
    // 0ライン強調
    ctx.strokeStyle = '#3a5378'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, y(0)); ctx.lineTo(W, y(0)); ctx.stroke();
    // 大当りマーカー（差玉が急上昇した点に縦線）
    ctx.strokeStyle = 'rgba(255,210,59,.35)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i < data.length; i++) {
      if (data[i].diff - data[i - 1].diff > 200) { const mx = x(i); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); }
    }
    ctx.stroke();
    // エリア塗り
    ctx.beginPath();
    data.forEach((p, i) => { const px = x(i), py = y(p.diff); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.lineTo(x(data.length - 1), y(min)); ctx.lineTo(x(0), y(min)); ctx.closePath();
    ctx.fillStyle = 'rgba(25,230,160,.13)'; ctx.fill();
    // ライン
    ctx.strokeStyle = '#19e6a0'; ctx.lineWidth = 1.6; ctx.beginPath();
    data.forEach((p, i) => { const px = x(i), py = y(p.diff); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke();
    // 末端ドット
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

  function buildReliabilityInfo() {
    const R = C.PRODUCTIONS.reach.filter(r => r.kind !== 'none')
      .map(r => `${r.label}=${Math.round(r.reliability * 100)}%`).join(' / ');
    const H = C.PRODUCTIONS.hold.map(h => `${h.label}=${Math.round(h.reliability * 100)}%`).join(' / ');
    $('#reliability').innerHTML =
      `<b>リーチ信頼度</b>: ${R}<br><b>保留信頼度</b>: ${H}<br>` +
      `※ 信頼度は通常時(1/319)基準の設計値。低スペックほど自然に上昇します。`;
  }

  function buildDebug() {
    const box = $('#debug-buttons');
    const defs = [
      { t: '青保留', o: { holdId: 'blue', hit: false } },
      { t: '赤保留', o: { holdId: 'red', hit: false } },
      { t: 'SU5予告', o: { suStep: 5, hit: false } },
      { t: 'ノーマル', o: { reachId: 'normal', hit: false } },
      { t: 'スーパー(ドヤ)', o: { reachId: 'super', hit: false } },
      { t: '激熱(黒塗り)', o: { reachId: 'cutin_red', hit: false } },
      { t: '金(ヒーロー)', o: { reachId: 'cutin_gold', hit: false } },
      { t: '全回転(50年後)', o: { reachId: 'allreel', hit: false } },
      { t: '★大当り(通常)', o: { reachId: 'super', hit: true, kakuhen: false } },
      { t: '★確変大当り', o: { reachId: 'cutin_gold', hit: true, kakuhen: true } },
      { t: '★復活→当り', o: { reachId: 'cutin_red', hit: true, revival: true, kakuhen: true } },
      { t: '★全回転当り', o: { reachId: 'allreel', hit: true, kakuhen: true } },
    ];
    defs.forEach(d => {
      const b = document.createElement('button');
      b.textContent = d.t;
      b.addEventListener('click', () => window.GAME.forcePlay(d.o));
      box.appendChild(b);
    });
  }

  // オープニングを初回ジェスチャで一度だけ再生
  let opSeen = false;
  async function maybeOpening() {
    if (opSeen) return false;
    opSeen = true;
    if (window.SETTINGS && window.SETTINGS.story && window.CINEMA && window.STORY) {
      await window.CINEMA.play(window.STORY.opening(), { bgm: 'super', skippable: true });
      return true;
    }
    return false;
  }

  function bindControls() {
    const fire = $('#fire');
    // 押している間だけ発射
    const start = async e => {
      e.preventDefault(); window.AUDIO.resume();
      if (window.CINEMA && window.CINEMA.isPlaying) return;  // ムービー中は発射しない
      if (await maybeOpening()) return;        // 初回はOP再生のみ
      if (e.pointerId != null && fire.setPointerCapture) {
        try { fire.setPointerCapture(e.pointerId); } catch (_) {}
      }
      window.GAME.fireStart();
    };
    const stop = e => { if (e) e.preventDefault(); window.GAME.fireStop(); };
    fire.addEventListener('pointerdown', start);
    fire.addEventListener('pointerup', stop);
    fire.addEventListener('pointercancel', stop);
    // キーボード操作（アクセシビリティ）: Enter/Space 押下中だけ発射
    fire.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); window.AUDIO.resume(); window.GAME.fireStart(); }
    });
    fire.addEventListener('keyup', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.GAME.fireStop(); }
    });
    fire.addEventListener('blur', () => window.GAME.fireStop());

    const auto = $('#auto');
    auto.addEventListener('click', async () => {
      window.AUDIO.resume();
      if (window.CINEMA && window.CINEMA.isPlaying) return;  // ムービー中は操作しない
      if (await maybeOpening()) return;
      const on = !auto.classList.contains('active');
      auto.classList.toggle('active', on);
      auto.textContent = on ? 'オート ON' : 'オート OFF';
      window.GAME.setAuto(on);
    });

    // ムービー ON/OFF
    const story = $('#toggle-story');
    story.addEventListener('click', () => {
      const on = !window.SETTINGS.story;
      window.SETTINGS.story = on;
      story.classList.toggle('active', on);
      story.textContent = on ? '🎬 ムービー ON' : '🎬 ムービー OFF';
    });
    // OP再生
    $('#replay-op').addEventListener('click', async () => {
      window.AUDIO.resume();
      if (window.CINEMA && window.STORY) await window.CINEMA.play(window.STORY.opening(), { bgm: 'super', skippable: true });
    });

    $('#volume').addEventListener('input', e => window.AUDIO.setVolume(parseFloat(e.target.value)));
    const mute = $('#mute');
    mute.addEventListener('click', () => {
      window.AUDIO.resume();
      const m = !window.AUDIO.isMuted;
      window.AUDIO.setMuted(m);
      mute.textContent = m ? '🔇' : '🔊';
    });

    $('#reset').addEventListener('click', () => window.GAME.addBalls(500));

    const td = $('#toggle-debug');
    td.addEventListener('click', () => {
      const dbg = $('#debug');
      const hidden = dbg.classList.toggle('hidden');
      td.textContent = hidden ? 'デバッグ ▼' : 'デバッグ ▲';
    });
  }

  window.UI = { render, init() { buildSpecSelect(); buildReliabilityInfo(); buildDebug(); bindControls(); } };
})();
