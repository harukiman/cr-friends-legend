/*
 * audio.js — Web Audio 本格サウンドエンジン（外部音源ゼロ）
 *  - マスター: ゲイン → ソフトクリップ(波形整形) → コンプ → 出力。リード用ディレイ(エコー)。
 *  - 楽器: 2基デチューンの厚いリード、サブベース、コードパッド、キック/スネア/ハット。
 *  - 高精度ルックアヘッド・スケジューラで「曲」をループ演奏（通常/RUSH/大当り/リーチ）。
 *  - 脳汁系SE: ファンファーレ(メロディ)、上昇リーチ、確定ベル等。
 * 公開API互換: resume,setVolume,setMuted,SE,startBgm,stopBgm,setBaseBgm,stopAllBgm,isMuted
 */
(function () {
  let ctx = null, master = null, comp = null, shaper = null, delay = null, delayGain = null, leadBus = null, bgmBus = null;
  let muted = false, volume = 0.6;

  function softClip() {
    const c = ctx.createWaveShaper(), n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(x * 1.6); }
    c.curve = curve; c.oversample = '2x'; return c;
  }
  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = volume;
    shaper = softClip();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24; comp.knee.value = 24; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
    master.connect(shaper); shaper.connect(comp); comp.connect(ctx.destination);
    // BGM本体バス（大きなSE時にダッキング）
    bgmBus = ctx.createGain(); bgmBus.connect(master);
    // リード用ディレイ（エコー）
    leadBus = ctx.createGain(); leadBus.connect(master);
    delay = ctx.createDelay(1.0); delay.delayTime.value = 0.26;
    delayGain = ctx.createGain(); delayGain.gain.value = 0.28;
    leadBus.connect(delay); delay.connect(delayGain); delayGain.connect(delay); delayGain.connect(master);
  }
  function resume() { ensure(); if (ctx.state === 'suspended') ctx.resume(); }
  function setVolume(v) { volume = v; if (master) master.gain.setTargetAtTime(muted ? 0 : v, ctx.currentTime, 0.02); }
  function setMuted(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : volume, ctx.currentTime, 0.02); }
  // 大きなSEの瞬間にBGMを一時的に下げる（迫力UP）
  function duck() { if (!bgmBus) return; const t = ctx.currentTime; bgmBus.gain.cancelScheduledValues(t); bgmBus.gain.setValueAtTime(bgmBus.gain.value || 1, t); bgmBus.gain.setTargetAtTime(0.35, t, 0.02); bgmBus.gain.setTargetAtTime(1, t + 0.18, 0.3); }
  const mid = n => 440 * Math.pow(2, (n - 69) / 12);
  function haptic(p) { try { if (!muted && navigator.vibrate) navigator.vibrate(p); } catch (_) {} }

  // 厚いリード/汎用ボイス
  function voice(freq, t, dur, o = {}) {
    ensure();
    const g = ctx.createGain(), gain = o.gain == null ? 0.2 : o.gain;
    const a = o.a == null ? 0.006 : o.a, d = o.d == null ? 0.05 : o.d, s = o.s == null ? 0.7 : o.s, r = o.r == null ? 0.12 : o.r;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * s), t + a + d);
    g.gain.setValueAtTime(Math.max(0.0001, gain * s), t + Math.max(a + d, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, dur) + r);
    let node = g;
    if (o.filter) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(o.filter, t); f.frequency.exponentialRampToValueAtTime(Math.max(200, o.filterTo || o.filter), t + dur);
      f.Q.value = o.Q || 6; g.connect(f); node = f;
    }
    node.connect(o.dest || master);
    const types = o.types || [o.type || 'sawtooth'];
    const det = o.detune || 0;
    types.forEach((ty, i) => {
      const osc = ctx.createOscillator(); osc.type = ty;
      osc.frequency.setValueAtTime(freq, t);
      if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slideTo), t + dur);
      osc.detune.value = det * (i === 0 ? -1 : 1);
      osc.connect(g); osc.start(t); osc.stop(t + Math.max(a + d, dur) + r + 0.03);
    });
  }
  function noise(t, dur, o = {}) {
    ensure();
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur)), buf = ctx.createBuffer(1, len, ctx.sampleRate), dt = buf.getChannelData(0);
    for (let i = 0; i < len; i++) dt[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'highpass'; f.frequency.value = o.freq || 800; f.Q.value = o.Q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(o.gain || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || master); src.start(t); src.stop(t + dur + 0.02);
  }
  // ドラム
  function kick(t, g = 0.5) { const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(gn); gn.connect(master); o.start(t); o.stop(t + 0.2); }
  function snare(t, g = 0.3) { noise(t, 0.16, { gain: g, type: 'highpass', freq: 1800 }); voice(220, t, 0.1, { type: 'triangle', gain: g * 0.5, r: 0.05 }); }
  function hat(t, g = 0.12) { noise(t, 0.04, { gain: g, type: 'highpass', freq: 8000 }); }

  // ====== 楽曲（midi。0=休符）。16分グリッド、loopLen=ステップ数 ======
  const R = 0;
  const SONGS = {
    // 通常：明るく中毒性（Cメジャー系）
    normal: { bpm: 138, loop: 32, lead: [72,R,76,R,79,76,72,74, 76,R,79,R,81,79,76,74, 72,R,76,R,79,76,72,76, 79,81,83,81,79,76,74,72],
      bass: [48,R,R,48,55,R,48,R, 53,R,R,53,52,R,55,R, 48,R,R,48,55,R,48,R, 50,R,55,R,53,R,55,R],
      chord: { 0: [60,64,67], 8: [57,60,64], 16: [60,64,67], 24: [62,65,69] }, drum: 'rock' },
    // RUSH(確変)：疾走感（Aマイナー）
    rush: { bpm: 168, loop: 32, lead: [69,72,76,72, 69,72,77,76, 74,77,81,77, 74,77,79,81, 69,72,76,79, 81,79,76,72, 77,76,74,72, 76,79,84,R],
      bass: [45,45,57,45, 45,45,57,45, 50,50,62,50, 50,50,62,50, 45,45,57,45, 41,41,53,41, 43,43,55,43, 45,52,57,R],
      chord: { 0: [57,60,64], 8: [62,65,69], 16: [57,60,64], 24: [55,59,62] }, drum: 'drive' },
    // 大当り中：華やか勝利感
    round: { bpm: 150, loop: 32, lead: [72,76,79,84, 83,79,76,79, 81,84,88,84, 83,81,79,76, 72,76,79,84, 86,84,83,81, 79,81,83,84, 88,86,84,79],
      bass: [48,48,55,48, 53,53,55,53, 57,57,52,57, 55,55,50,55, 48,48,55,48, 53,53,55,53, 50,50,55,50, 48,55,60,R], drum: 'drive',
      chord: { 0: [60,64,67], 8: [65,69,72], 16: [57,60,64], 24: [62,65,69] } },
    // リーチ煽り：緊張
    super: { bpm: 150, loop: 16, lead: [69,R,72,R,76,R,72,R, 68,R,71,R,74,R,77,R],
      bass: [45,45,45,45, 44,44,44,44, 43,43,43,43, 45,47,48,50], chord: {}, drum: 'tense' },
    allreel: { bpm: 174, loop: 16, lead: [76,79,83,88, 86,83,79,83, 81,84,88,91, 88,84,81,88],
      bass: [52,52,64,52, 53,53,65,53, 57,57,69,57, 52,59,64,R], chord: { 0: [64,67,71], 8: [65,69,72] }, drum: 'drive' },
    jitan: { bpm: 150, loop: 16, lead: [67,71,74,71, 67,71,74,79, 72,76,79,76, 72,76,79,R],
      bass: [43,43,55,43, 48,48,55,48, 45,45,57,45, 47,47,55,R], chord: { 0: [55,59,62], 8: [60,64,67] }, drum: 'rock' },
  };
  // ====== スケジューラ（ルックアヘッド） ======
  let activeKind = null, baseKind = null, step = 0, nextStepTime = 0, schedTimer = null;
  function songOf(k) { return SONGS[k] || SONGS.normal; }
  function playStep(song, i, t) {
    const li = i % song.loop;
    const loopNum = Math.floor(i / song.loop);
    const sectionB = (loopNum % 2) === 1;        // A/Bで雰囲気を変えて反復感を軽減
    const sd = 60 / song.bpm / 4;
    const ln = song.lead[li];
    if (ln) {
      voice(mid(ln), t, sd * 1.6, { types: ['sawtooth', 'square'], detune: 8, gain: 0.16, filter: 3200, filterTo: 1600, a: 0.004, d: 0.06, s: 0.6, r: 0.14, dest: bgmBus });
      // ハモ리（長三度/五度）でメロを厚く
      const h = (li % 4 === 0) ? 7 : 4;
      voice(mid(ln + h), t, sd * 1.2, { types: ['square'], gain: 0.06, a: 0.004, d: 0.05, s: 0.5, r: 0.12, dest: bgmBus });
      // セクションBはオクターブ上のきらめきを足す
      if (sectionB && li % 2 === 0) voice(mid(ln + 12), t, sd * 0.8, { types: ['triangle'], gain: 0.05, a: 0.004, r: 0.1, dest: bgmBus });
    }
    const bn = song.bass[li];
    if (bn) {
      voice(mid(bn), t, sd * 1.1, { types: ['triangle'], gain: 0.22, a: 0.004, d: 0.04, s: 0.8, r: 0.06, dest: bgmBus });
      voice(mid(bn), t, sd * 0.5, { types: ['sawtooth'], gain: 0.05, filter: 400, a: 0.003, r: 0.04, dest: bgmBus }); // 軽い倍音
    }
    if (song.chord && song.chord[li]) song.chord[li].forEach(c => voice(mid(c), t, sd * 7, { types: ['triangle'], gain: 0.05, a: 0.02, d: 0.1, s: 0.7, r: 0.3, dest: bgmBus }));
    // ドラム
    const b = li % 8, pat = song.drum;
    const fill = li >= song.loop - 2;             // ループ末尾でスネアフィル
    if (pat === 'rock') { if (b === 0 || b === 4) kick(t); if (b === 2 || b === 6) snare(t); if (b % 2 === 1) hat(t, 0.08); }
    else if (pat === 'drive') { if (b % 2 === 0) kick(t, 0.45); if (b === 4) snare(t); hat(t, b % 2 ? 0.08 : 0.05); }
    else if (pat === 'tense') { if (b === 0) kick(t, 0.5); hat(t, 0.05); if (b === 7) snare(t, 0.2); }
    if (fill) snare(t, 0.22);
    if (fill) snare(t + sd * 0.5, 0.18);
  }
  function scheduler() {
    if (!ctx) return;
    if (!activeKind) { stopSched(); return; }    // 無音時はタイマーを止める（CPU/電池節約）
    const ahead = 0.12, stepDur = () => 60 / songOf(activeKind).bpm / 4;
    while (nextStepTime < ctx.currentTime + ahead) {
      playStep(songOf(activeKind), step, nextStepTime);
      step++; nextStepTime += stepDur();
    }
  }
  function startSched() { ensure(); if (schedTimer) return; nextStepTime = ctx.currentTime + 0.05; schedTimer = setInterval(scheduler, 25); }
  function stopSched() { if (schedTimer) { clearInterval(schedTimer); schedTimer = null; } }

  function startBgm(kind) { ensure(); if (activeKind !== kind) step = 0; activeKind = kind; startSched(); }
  function stopBgm() { if (activeKind !== baseKind) step = 0; activeKind = baseKind; if (activeKind) startSched(); }
  function setBaseBgm(kind) { ensure(); baseKind = kind || null; if (!activeKind) { activeKind = baseKind; step = 0; } if (activeKind) startSched(); }
  function stopAllBgm() { baseKind = null; activeKind = null; stopSched(); }

  // ====== SE（脳汁系） ======
  const T = () => ctx.currentTime;
  const SE = {
    fire() { ensure(); noise(T(), 0.025, { gain: 0.1, type: 'highpass', freq: 3000 }); },
    peg() { ensure(); voice(1400 + Math.random() * 600, T(), 0.02, { type: 'triangle', gain: 0.05, r: 0.02 }); },
    start() { ensure(); const t = T(); voice(880, t, 0.09, { type: 'sine', gain: 0.22 }); voice(1320, t + 0.05, 0.12, { type: 'sine', gain: 0.2 }); voice(1760, t + 0.1, 0.14, { type: 'sine', gain: 0.16 }); },
    stopReel(i = 0) { ensure(); voice(520 - i * 60, T(), 0.06, { type: 'square', gain: 0.18, r: 0.05 }); },
    tenpai() { ensure(); const t = T(); [660, 990].forEach((f, k) => voice(f, t + k * 0.02, 0.2, { types: ['sawtooth'], detune: 6, gain: 0.18 })); },
    reach() { ensure(); const t = T(); voice(300, t, 0.55, { type: 'sawtooth', gain: 0.26, slideTo: 1700, r: 0.1, dest: leadBus }); noise(t + 0.3, 0.3, { gain: 0.12, type: 'bandpass', freq: 2000 }); },
    su(step = 1) { ensure(); voice(520 + step * 150, T(), 0.1, { type: 'square', gain: 0.16 }); },
    pseudo() { ensure(); const t = T(); noise(t, 0.12, { gain: 0.3, type: 'lowpass', freq: 1200 }); voice(150, t, 0.14, { type: 'square', gain: 0.25, slideTo: 80 }); },
    cutin() { ensure(); const t = T(); noise(t, 0.26, { gain: 0.4, type: 'lowpass', freq: 2400 }); kick(t, 0.6); voice(1200, t, 0.08, { type: 'square', gain: 0.2 }); },
    holdUp() { ensure(); const t = T(); [700, 1050, 1570].forEach((f, k) => voice(f, t + k * 0.05, 0.12, { type: 'sine', gain: 0.18 })); },
    lose() { ensure(); voice(200, T(), 0.3, { type: 'sawtooth', gain: 0.16, slideTo: 110 }); },
    revive() { ensure(); const t = T(); voice(400, t, 0.45, { type: 'square', gain: 0.28, slideTo: 1800, dest: leadBus }); noise(t + 0.12, 0.3, { gain: 0.2, type: 'highpass', freq: 1500 }); },
    // 大当りファンファーレ（メロディ）
    fanfare() {
      ensure(); duck(); haptic([0, 50, 40, 90]); const t = T(), b = 0.13;
      const mel = [72, 76, 79, 84, 83, 84]; // C E G C ...
      mel.forEach((n, k) => voice(mid(n), t + k * b, b * 1.4, { types: ['square', 'sawtooth'], detune: 6, gain: 0.26, dest: leadBus }));
      [60, 64, 67].forEach(n => voice(mid(n), t + 0.5, 0.7, { type: 'triangle', gain: 0.14 }));
      [72, 76, 79].forEach(n => voice(mid(n), t + 0.78, 0.8, { types: ['square', 'sawtooth'], detune: 8, gain: 0.2, dest: leadBus }));
      kick(t, 0.6); snare(t + 0.26, 0.3); kick(t + 0.52, 0.6); noise(t + 0.5, 0.5, { gain: 0.16, type: 'highpass', freq: 3000 });
    },
    payout(f) { ensure(); voice(f || (1500 + Math.random() * 500), T(), 0.03, { type: 'square', gain: 0.1 }); },
    // 確変確定ベル（きらびやか上昇）
    kakuhen() { ensure(); duck(); haptic([0, 60, 40, 100]); const t = T(); [76, 81, 84, 88, 91].forEach((n, k) => voice(mid(n), t + k * 0.07, 0.5, { types: ['triangle', 'sine'], gain: 0.2, dest: leadBus })); },
    button() { ensure(); const t = T(); voice(880, t, 0.1, { type: 'square', gain: 0.2 }); voice(1320, t + 0.07, 0.2, { type: 'square', gain: 0.18, slideTo: 1760 }); },
    push() { ensure(); duck(); haptic(60); const t = T(); noise(t, 0.3, { gain: 0.45, type: 'lowpass', freq: 2600 }); kick(t, 0.7); voice(1500, t, 0.06, { type: 'square', gain: 0.2 }); },
    kakutei() { ensure(); duck(); haptic([0, 40, 30, 80]); const t = T(), run = [72, 76, 79, 84, 88, 91]; run.forEach((n, k) => voice(mid(n), t + k * 0.06, 0.4, { types: ['square', 'triangle'], detune: 5, gain: 0.26, dest: leadBus })); noise(t + 0.36, 0.5, { gain: 0.16, type: 'highpass', freq: 4000 }); },
    vflash() { ensure(); duck(); haptic(80); const t = T(); voice(1318, t, 0.5, { type: 'square', gain: 0.3, slideTo: 2637, dest: leadBus }); noise(t, 0.25, { gain: 0.28, type: 'highpass', freq: 2500 }); },
    tick() { ensure(); voice(900, T(), 0.025, { type: 'square', gain: 0.12, r: 0.02 }); },
    telop() { ensure(); const t = T(); voice(1800, t, 0.18, { type: 'sawtooth', gain: 0.2, slideTo: 400 }); noise(t, 0.16, { gain: 0.16, type: 'bandpass', freq: 3000 }); },
    upgrade() { ensure(); const t = T(); [67, 72, 76, 79, 84].forEach((n, k) => voice(mid(n), t + k * 0.1, 0.3, { types: ['sawtooth'], detune: 6, gain: 0.22, dest: leadBus })); },
    swarm() { ensure(); const t = T(); noise(t, 0.9, { gain: 0.2, type: 'lowpass', freq: 1500 }); voice(70, t, 0.9, { type: 'sawtooth', gain: 0.16, slideTo: 160 }); },
  };

  window.AUDIO = { resume, setVolume, setMuted, SE, startBgm, stopBgm, setBaseBgm, stopAllBgm,
                   get isMuted() { return muted; } };
})();
