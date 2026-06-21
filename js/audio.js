/*
 * audio.js — Web Audio API による効果音/BGM 合成（外部音源ゼロ＝著作権フリー）
 * パチンコにありがちな熱い音をオシレータ＋エンベロープで生成する。
 * 初回ユーザー操作で resume() を呼ぶこと（ブラウザの自動再生制限対策）。
 */
(function () {
  let ctx = null;
  let master = null;
  let bgmStop = null;       // 現在鳴っているBGMの停止関数
  let muted = false;
  let volume = 0.6;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  function resume() { ensure(); if (ctx.state === 'suspended') ctx.resume(); }
  function setVolume(v) { volume = v; if (master) master.gain.value = muted ? 0 : v; }
  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : volume; }

  // 基本トーン生成
  function tone({ freq = 440, type = 'sine', dur = 0.2, when = 0, gain = 0.3,
                  attack = 0.005, release = 0.08, slideTo = null, dest = null }) {
    ensure();
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    osc.connect(g).connect(dest || master);
    osc.start(t0);
    osc.stop(t0 + dur + release + 0.02);
    return osc;
  }

  // ノイズバースト（インパクト/拍手系）
  function noise({ dur = 0.2, when = 0, gain = 0.3, lp = 4000, hp = 200 }) {
    ensure();
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = lp;
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(hpf).connect(lpf).connect(g).connect(master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  // ---- 効果音プリセット ----
  const SE = {
    // 発射音（短いtick）
    fire() { tone({ freq: 900, type: 'square', dur: 0.03, gain: 0.12, release: 0.02 }); },

    // 釘・玉のヒット
    peg() { tone({ freq: 1400 + Math.random() * 600, type: 'triangle', dur: 0.02, gain: 0.06, release: 0.02 }); },

    // 始動口入賞「ポロンッ」
    start() {
      tone({ freq: 880, type: 'sine', dur: 0.08, gain: 0.25 });
      tone({ freq: 1320, type: 'sine', dur: 0.12, gain: 0.2, when: 0.05 });
    },

    // 図柄停止音「ピタッ」
    stopReel(i = 0) { tone({ freq: 520 - i * 60, type: 'square', dur: 0.06, gain: 0.18 }); },

    // テンパイ音
    tenpai() {
      tone({ freq: 660, type: 'sawtooth', dur: 0.18, gain: 0.2 });
      tone({ freq: 990, type: 'sawtooth', dur: 0.18, gain: 0.15, when: 0.02 });
    },

    // リーチ突入「ヒュゥゥン↑」上昇スイープ
    reach() { tone({ freq: 300, type: 'sawtooth', dur: 0.5, gain: 0.28, slideTo: 1600, release: 0.1 }); },

    // 予告ステップアップ音（step毎に高く）
    su(step = 1) { tone({ freq: 500 + step * 180, type: 'square', dur: 0.1, gain: 0.22 }); },

    // 擬似連の「ガコッ」
    pseudo() { noise({ dur: 0.12, gain: 0.3, lp: 1200, hp: 80 }); tone({ freq: 160, type: 'square', dur: 0.12, gain: 0.25 }); },

    // カットイン「ドンッ！」
    cutin() {
      noise({ dur: 0.25, gain: 0.45, lp: 2200, hp: 60 });
      tone({ freq: 90, type: 'sine', dur: 0.3, gain: 0.5, slideTo: 50 });
      tone({ freq: 1200, type: 'square', dur: 0.08, gain: 0.2, when: 0.0 });
    },

    // 保留変化音（色が上がった）
    holdUp() {
      tone({ freq: 700, type: 'sine', dur: 0.08, gain: 0.2 });
      tone({ freq: 1050, type: 'sine', dur: 0.1, gain: 0.18, when: 0.06 });
      tone({ freq: 1570, type: 'sine', dur: 0.12, gain: 0.16, when: 0.12 });
    },

    // ハズレ「ブーッ」
    lose() { tone({ freq: 200, type: 'sawtooth', dur: 0.3, gain: 0.18, slideTo: 120 }); },

    // 復活「キュイーン！」
    revive() {
      tone({ freq: 400, type: 'square', dur: 0.4, gain: 0.3, slideTo: 1800 });
      noise({ dur: 0.3, gain: 0.25, lp: 6000, hp: 1000, when: 0.1 });
    },

    // 大当りファンファーレ（王道の勝利音：上昇アルペジオ＋メジャーコード）
    fanfare() {
      const base = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      base.forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.18, gain: 0.3, when: i * 0.1 }));
      // 締めのコード
      [523.25, 659.25, 783.99].forEach(f => tone({ freq: f, type: 'sawtooth', dur: 0.6, gain: 0.22, when: 0.45 }));
      [1046.5, 1318.5].forEach(f => tone({ freq: f, type: 'square', dur: 0.5, gain: 0.2, when: 0.6 }));
      noise({ dur: 0.5, gain: 0.18, lp: 8000, hp: 2000, when: 0.45 }); // キラキラ
    },

    // ラウンド中の払い出し連打
    payout() { tone({ freq: 1500 + Math.random() * 400, type: 'square', dur: 0.03, gain: 0.12 }); },

    // 確変確定音
    kakuhen() {
      [659.25, 880, 1108.7, 1318.5].forEach((f, i) =>
        tone({ freq: f, type: 'sawtooth', dur: 0.15, gain: 0.28, when: i * 0.08 }));
    },
  };

  // ---- BGM（ループ）----
  // スーパーリーチ等のテンションBGM。stop()返却で止める。
  function startBgm(kind = 'super') {
    stopBgm();
    ensure();
    let stopped = false;
    const tempo = kind === 'allreel' ? 0.14 : 0.18;
    // 緊張感のあるアルペジオ進行
    const scales = {
      super:   [220, 261.63, 329.63, 392, 329.63, 261.63],
      allreel: [261.63, 329.63, 392, 523.25, 659.25, 523.25, 392, 329.63],
    };
    const seq = scales[kind] || scales.super;
    let i = 0;
    const tick = () => {
      if (stopped) return;
      const f = seq[i % seq.length];
      tone({ freq: f, type: 'square', dur: tempo * 0.9, gain: 0.16 });
      tone({ freq: f / 2, type: 'triangle', dur: tempo * 0.9, gain: 0.1 });
      i++;
      bgmTimer = setTimeout(tick, tempo * 1000);
    };
    let bgmTimer = setTimeout(tick, 0);
    bgmStop = () => { stopped = true; clearTimeout(bgmTimer); };
    return bgmStop;
  }
  function stopBgm() { if (bgmStop) { bgmStop(); bgmStop = null; } }

  window.AUDIO = { resume, setVolume, setMuted, SE, startBgm, stopBgm,
                   get isMuted() { return muted; } };
})();
