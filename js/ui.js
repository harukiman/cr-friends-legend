/*
 * ui.js — DOM バインディング（操作・表示・設定・デバッグ）
 */
(function () {
  const $ = s => document.querySelector(s);
  const C = window.CONFIG;

  function render(st) {
    $('#balls').textContent = st.balls;
    $('#spins').textContent = st.spins;
    $('#renchan').textContent = st.renchan;
    const badge = $('#state-badge');
    badge.className = 'badge';
    if (st.state === 'kakuhen') { badge.textContent = `確変 残${st.stRemaining}`; badge.classList.add('kakuhen'); }
    else if (st.state === 'jitan') { badge.textContent = `時短 残${st.stRemaining}`; badge.classList.add('jitan'); }
    else badge.textContent = '通常';
    // 保留
    const slots = document.querySelectorAll('.hold-slot');
    slots.forEach((el, i) => {
      const h = st.holds[i];
      if (h) { el.classList.add('on'); el.style.background = h.color; el.style.color = h.color; }
      else { el.classList.remove('on'); el.style.background = ''; el.style.color = ''; }
    });
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

  function bindControls() {
    const fire = $('#fire');
    // 押している間だけ発射
    const start = e => { e.preventDefault(); window.AUDIO.resume(); window.GAME.fireStart(); };
    const stop = e => { e.preventDefault(); window.GAME.fireStop(); };
    fire.addEventListener('pointerdown', start);
    fire.addEventListener('pointerup', stop);
    fire.addEventListener('pointerleave', stop);
    fire.addEventListener('pointercancel', stop);

    const auto = $('#auto');
    auto.addEventListener('click', () => {
      const on = !auto.classList.contains('active');
      auto.classList.toggle('active', on);
      auto.textContent = on ? 'オート ON' : 'オート OFF';
      window.AUDIO.resume();
      window.GAME.setAuto(on);
    });

    $('#volume').addEventListener('input', e => window.AUDIO.setVolume(parseFloat(e.target.value)));
    const mute = $('#mute');
    mute.addEventListener('click', () => {
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
