/*
 * story.js — キャラクター設定とストーリー式アニメーション・ムービー脚本（重厚版）
 *
 * 設計方針:
 *   「数十分級のアニメ作品」を目指し、笑い(コメディ)と涙(ペーソス)を両立させた章立てサーガ。
 *   主人公ハルの感情の縦糸 = 「亡き母の言葉」と「拾い犬モモ」「5万円」の対比。
 *   各章は［掴みの笑い → 緊張の高まり → 感情のピーク(泣き) → 決意 → 引き(クリフハンガー)］の
 *   起承転結＋幕間で構成し、再生時間と情感を稼ぐ。
 *   倍速の影響は cinema.js 側で完全除外（このムービーは常に等倍＝作品として鑑賞させる）。
 *
 * scene スキーマ（cinema.js が解釈）:
 *   char(画像) / name / color / text / bgClass(o.bg) / bgImg(o.bgImg) / title /
 *   fx('flash|shake|zoom|speed|burst') / form('dark|awaken|gold|neg|ghost') /
 *   pos('center|left|right') / kb(KenBurns) / dur(ms) / se / shock
 */
(function () {
  const C = {
    peace:  { name: 'ハル',           img: 'reel_peace.jpg',  color: '#3af0ff' },
    mosaic: { name: '謎のモザイク男', img: 'reel_mosaic.jpg', color: '#9d86c4' },
    hero:   { name: 'イエローヒーロー', img: 'reel_hero.jpg',  color: '#ffd23b' },
    doya:   { name: 'ドヤ皇帝',       img: 'reel_doya.jpg',   color: '#ff8a00' },
    legend: { name: '未来の賢者',     img: 'reel_legend.jpg', color: '#ff6ec7' },
    black:  { name: '闇のマスク',     img: 'reel_black.jpg',  color: '#ff3b3b' },
    gian:    { name: 'ガキ大将ガン太', img: 'char_gian.jpg',      color: '#ff8a00' },
    gorilla: { name: '豪腕ゴリ将軍',   img: 'char_gorilla.jpg',   color: '#b06a2a' },
    general: { name: '大元帥',         img: 'char_general.jpg',   color: '#d44' },
    gent:    { name: '紳士マスター',   img: 'char_gentleman.jpg', color: '#ffd23b' },
    cool:    { name: 'クール・ジョー', img: 'char_cool.jpg',      color: '#ffb000' },
    jono:    { name: '熱血のジョー',   img: 'char_jonouchi.jpg',  color: '#ffd23b' },
    pepper:  { name: '相棒ペッパー',   img: 'char_pepper.jpg',    color: '#9fe8ff' },
    dog:     { name: '幸運の子犬モモ', img: 'char_dog.jpg',       color: '#ffcf6e' },
    alien:   { name: '宇宙人ゼ',       img: 'char_alien.jpg',     color: '#9d86c4' },
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // シーン生成ヘルパ（bgImg 対応 ＝ SVG/写真 背景もキャラ立ち絵と併用できる）
  const sc = (ch, text, o = {}) => ({
    char: ch && C[ch].img, name: ch && C[ch].name, color: o.color || (ch && C[ch].color),
    text, bgClass: o.bg, bgImg: o.bgImg, title: o.title, fx: o.fx, form: o.form, pos: o.pos, kb: o.kb,
    dur: o.dur || 1500, se: o.se, shock: o.shock,
  });
  const t = (title, text, o = {}) => ({ title, text, bgClass: o.bg, bgImg: o.bgImg, color: o.color,
    fx: o.fx, dur: o.dur || 1500, se: o.se, shock: o.shock });
  // ナレーション（語り。立ち絵なし・字幕のみ。情景描写と時間経過に）
  const nar = (text, o = {}) => sc(null, text, o);

  // ===== オープニング（プロローグ：数分級。男の人生・夢・仲間・宿敵を提示）=====
  function opening() {
    return [
      { title: 'FORTUNE FIRE', text: '〜 5万円から、世界の頂点へ 〜', bgImg: 'bg_cosmos.svg', color: '#ff6ec7', dur: 2200, fx: 'flash', shock: true },
      nar('西暦20XX——　物価は上がり、給料は上がらない、そんな時代。', { bgImg: 'bg_city.svg', dur: 2000 }),
      nar('とある安アパートの一室に、うだつの上がらない一人の男がいた。', { bgImg: 'bg_city.svg', dur: 2000 }),
      sc('peace', 'はぁ……今月も家賃が払えるか、ギリギリだ。', { bgImg: 'bg_city.svg', kb: true, dur: 1900 }),
      { title: '所持金　¥50,000', text: '——財布の中身は、たったの5万円。', bgImg: 'bg_city.svg', color: '#ff6b6b', fx: 'shake', dur: 2100 },
      sc('peace', '自販機にコインを入れたら、ガコンって飲み込まれてさ。…今日もツイてない。', { bgImg: 'bg_city.svg', kb: true, dur: 2000 }),
      sc('dog', '（クゥ〜ン。…ハル、また晩ごはん抜くつもりだワン？）', { bgImg: 'bg_city.svg', kb: true, dur: 1900 }),
      sc('peace', 'モモ。お前にだけは、ひもじい思いはさせないよ。…ほら、オレの分も食え。', { bgImg: 'bg_city.svg', kb: true, dur: 2100 }),
      nar('——思えば数年前。彼が拾った、雨に濡れた一匹の野良犬。', { bg: 'bg-space', dur: 2000 }),
      nar('その日も彼の財布には、わずかな小銭しかなかった。だが彼は迷わず、最後の金でパンを買い、犬に分けた。', { bg: 'bg-space', dur: 2400 }),
      sc('peace', '（母さんが言ってた。「どんなに苦しくても、笑って生きなさい」って。）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2200 }),
      sc('peace', 'だからオレは、決めたんだ。', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 1500 }),
      sc('peace', 'パチンコで一億円を稼いで、働かずに自由に生きる——FIREするんだ！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 2200 }),
      sc('peace', 'そして、かつてのオレやモモみたいに凍えてる奴が、誰もいない場所を作る。それがオレの夢だ！', { bg: 'bg-aurora', fx: 'burst', shock: true, kb: true, dur: 2400 }),
      sc('pepper', '初めまして。データ分析ロボの相棒、ペッパーだ。…正直に言う。5万円で挑むやつは、初めて見た。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
      sc('pepper', '計算結果：成功確率0.0002%。普通なら、止める。…が、私の回路は、無謀な夢が嫌いじゃない。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
      sc('dog', '（無謀…。でもモモは、この人の本気を知ってる。だから、最後まで信じるワン！）', { bg: 'bg-aurora', kb: true, dur: 2100 }),
      sc('black', '……ククク。5万円で一億だと？　身の程を知れ、矮小な夢追い人よ。', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', dur: 2200 }),
      sc('black', 'その甘い夢、この闇のマスクが喰らい尽くしてくれる。せいぜい足掻くがいい。', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', dur: 2200 }),
      sc('legend', '——未来の君よ。聞こえるか。その5万円から、運命を掴み取れ。物語は、いつだって一玉から始まる。', { bgImg: 'bg_throne.svg', form: 'ghost', kb: true, dur: 2600 }),
      t('運命の一玉、放て。', '', { bg: 'bg-thunder', fx: 'burst', shock: true, dur: 1600, color: '#ffd23b' }),
    ];
  }

  // ===== リーチ帯バトル（毎回違う相手・台詞で飽きさせない）=====
  const POOL = {
    super:     ['doya', 'gian', 'gorilla', 'jono', 'alien', 'mosaic'],
    cutin_red: ['black', 'general', 'gorilla', 'alien'],
    cutin_gold:['hero', 'gent', 'cool'],
    allreel:   ['legend'],
  };
  function battle(reachId) {
    const tier = POOL[reachId] ? reachId : 'super';
    const who = pick(POOL[tier]);
    if (tier === 'cutin_gold') {
      const ally = C[who];
      const cheer = pick([
        `待たせたな！${ally.name}、参上！`,
        `その夢、無駄にはさせん。${ally.name}が力を貸そう！`,
        `諦めるにはまだ早い。さあ、共に掴むぞ——！`,
      ]);
      return [
        sc('peace', pick(['もうダメだ…！だれか——！', 'くっ…ここまでなのか…！', '足が…動かない…！']), { bg: 'bg-space', fx: 'shake', dur: 1300 }),
        t('その時！', '', { bg: 'bg-gold', fx: 'flash', shock: true, dur: 900, color: '#ffd23b' }),
        sc(who, cheer, { bg: 'bg-gold', form: 'gold', fx: 'zoom', kb: true, se: 'kakutei', dur: 1800 }),
        sc('peace', 'あんたは…！　なんで、オレなんかを…', { bg: 'bg-gold', kb: true, dur: 1400 }),
        sc(who, '夢を諦めない奴を、見捨てられるかよ。さあ、決めるぞ！', { bg: 'bg-aurora', form: 'gold', fx: 'zoom', kb: true, dur: 1800 }),
        t('黄金共闘', '勝利を掴め！', { bg: 'bg-aurora', fx: 'burst', shock: true, dur: 1400, color: '#ffd23b' }),
      ];
    }
    if (tier === 'cutin_red') {
      const en = C[who];
      return [
        t('— 強敵 襲来 —', '', { bg: 'bg-thunder', dur: 1100, color: '#ff3b3b' }),
        sc(who, `よく来た…${en.name}が相手だ。容赦はせん。`, { bg: 'bg-fire', form: 'dark', fx: 'shake', kb: true, dur: 1700 }),
        sc('peace', 'うっ…こいつ、ケタ違いに強い…！　でも、引くわけにはいかない！', { bg: 'bg-speed', fx: 'speed', dur: 1500 }),
        sc('dog', '（負けないで、ハル…！モモがついてるワン！）', { bg: 'bg-thunder', kb: true, dur: 1400 }),
        sc(who, '砕け散れェ——！', { bg: 'bg-fire', form: 'dark', fx: 'burst', se: 'cutin', dur: 1400 }),
        t('激 闘', '運命の一撃——！！', { bg: 'bg-thunder', fx: 'flash', shock: true, dur: 1300, color: '#ff3b3b' }),
      ];
    }
    if (tier === 'allreel') return legend();
    const en = C[who];
    const taunt = pick([
      `フハハ！${en.name}、いざ尋常に勝負！`,
      `おもしれぇ。${en.name}が遊んでやろう。`,
      `その覚悟、本物か試させてもらうぞ——！`,
    ]);
    return [
      t('— 強敵出現 —', '', { bg: 'bg-fire', dur: 1100, color: '#ff8a00' }),
      sc(who, taunt, { bg: 'bg-fire', fx: 'zoom', kb: true, dur: 1700 }),
      sc('peace', pick(['負けるか…伝説はオレが掴む！', '何度でも立ち上がる。それがオレのやり方だ！', 'みんなの想いも背負ってる。退けないんだ！']), { bg: 'bg-speed', fx: 'speed', dur: 1500 }),
      t('激突！', '勝負の行方は…！？', { bg: 'bg-thunder', fx: 'flash', shock: true, dur: 1200, color: '#ff8a00' }),
    ];
  }

  function legend() {
    return [
      t('— 伝 説 —', '時を超えし者が、現れる。', { bg: 'bg-legend', color: '#ff6ec7', dur: 1800 }),
      sc('legend', '50年後の君へ。よくぞここまで辿り着いた。誇りに思うぞ。', { bg: 'bg-aurora', form: 'ghost', fx: 'zoom', kb: true, se: 'kakutei', dur: 1900 }),
      sc('legend', '今、伝説の扉を開けよう——全回転、確変大当りだ！', { bg: 'bg-legend', fx: 'burst', shock: true, dur: 2000, color: '#ff6ec7' }),
    ];
  }

  function awaken(kakuhen) {
    if (kakuhen) return [
      t('覚醒 RUSH', '突入！！', { bg: 'bg-rush', fx: 'flash', shock: true, dur: 1500, se: 'kakutei', color: '#ffd23b' }),
      sc('hero', 'ここからが本番だ！連チャンで一億を駆け上がれ！', { bg: 'bg-gold', form: 'gold', fx: 'zoom', kb: true, dur: 1700 }),
    ];
    return [ t('時短 突入', 'チャンス継続！', { bg: 'bg-gold', fx: 'flash', dur: 1300, color: '#ffd23b' }) ];
  }

  // 予告ムービー（通常スピンにもふんだんに。短尺・多彩）
  function yokoku(hot) {
    const allies = ['peace', 'pepper', 'dog', 'mosaic'];
    const hots = ['hero', 'legend', 'black', 'doya', 'gent', 'cool'];
    const who = pick(hot ? hots : allies.concat(hots));
    const coolLines = ['……これは、来るぞ。', '流れが変わった——！', '気配がする…激アツだ！', 'ここからが本番だ。', '震えてきた…運命の予感だ！'];
    const calmLines = ['お、なんか起きそう？', 'チャンス…かも？', 'ふむ、どうなる…', '今日はツイてるかも。', '一玉入魂、いくぞ。', 'モモ、見ててくれよ。'];
    const form = who === 'black' ? 'dark' : who === 'legend' ? 'ghost' : who === 'hero' ? 'gold' : null;
    return [ sc(who, pick(hot ? coolLines : calmLines), {
      bg: hot ? pick(['bg-thunder', 'bg-fire', 'bg-aurora']) : pick(['bg-space', 'bg-aurora']),
      fx: hot ? pick(['flash', 'zoom', 'speed']) : null, form, kb: true, dur: hot ? 1300 : 1000,
    }) ];
  }

  function normalReach() {
    const who = pick(['doya', 'gian', 'jono', 'mosaic', 'pepper']);
    return [ sc(who, pick(['ノーマルから一発逆転だ！', 'ここで決める…！', '油断は禁物だぜ。', '揃え——！', 'まだ分からんぞ…！']),
      { bg: 'bg-fire', fx: 'zoom', kb: true, dur: 1300 }) ];
  }

  function victory(renchan) {
    return [ sc('peace', renchan >= 5 ? `${renchan}連!! 止まらない、これが伝説の力だ！`
      : renchan >= 3 ? `${renchan}連!! いける、波が来てる！` : 'よし、勝った——！',
      { bg: 'bg-gold', fx: 'zoom', dur: 1300 }) ];
  }

  // ===== プレイヤー側 人生ストーリー（目標到達ムービー）=====
  function ending(goal) {
    const amt = (goal && goal.amt) || 1e8, name = (goal && goal.name) || 'FIRE達成';
    const amtTxt = amt >= 1e12 ? (amt / 1e12) + '兆円' : amt >= 1e8 ? (amt / 1e8) + '億円' : (amt / 1e4) + '万円';
    // 1億 = FIRE（人生が変わる瞬間。感動の章）
    if (amt === 1e8) return [
      t('🎉 一億円 達成 🎉', '', { bg: 'bg-gold', fx: 'flash', shock: true, dur: 1600, color: '#ffd23b' }),
      nar('——かつて財布に5万円しかなかった男が、ついに。', { bg: 'bg-space', dur: 2000 }),
      sc('peace', 'やった…やったぞ！　オレ、FIRE達成だ……！！', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 1900 }),
      sc('peace', '（母さん。見てるかな。…ちゃんと、笑って生きてるよ。）', { bg: 'bg-aurora', kb: true, dur: 2200 }),
      sc('pepper', 'おめでとう相棒。…私の計算では、ありえない結末だった。君は、いつも計算を超える。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
      sc('dog', '（…やったね、ハル。モモ、ずっと、ずっと信じてたワン）', { bg: 'bg-aurora', kb: true, dur: 2000 }),
      { char: C.peace.img, name: C.peace.name, color: C.peace.color, text: '夜景を見ながら、ゆっくり生きるよ。…そして約束通り、凍える奴のいない場所を作る。ありがとう、みんな。', bgImg: 'bg_skytree.jpg', kb: true, dur: 2600 },
      t('🌅 FIRE 達成 🌅', '〜 だが、これは新たな人生の幕開け 〜', { bg: 'bg-aurora', fx: 'burst', shock: true, dur: 2400, color: '#ffd23b' }) ];
    // 100兆 = 真の最終エンディング
    if (amt >= 1e14) return [
      t('🌌 100兆円 🌌', '〜 世界の頂点 〜', { bg: 'bg-aurora', fx: 'flash', shock: true, dur: 1800, color: '#ff6ec7' }),
      sc('legend', '100兆。もはや国家をも超えた。君は、歴史そのものだ。', { bg: 'bg-legend', form: 'ghost', fx: 'burst', kb: true, dur: 2100 }),
      sc('peace', 'あの5万円のオレが…世界のてっぺんに。夢って、本当に叶うんだな。', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2200 }),
      sc('dog', '（モモ、誇らしいワン。…ずっと、君のそばにいられて、幸せだったワン）', { bg: 'bg-aurora', kb: true, dur: 2200 }),
      sc('black', 'フッ…見事だ。お前こそ、真の伝説だ。…あの日、夢を笑った私を、許せ。', { bg: 'bg-legend', form: 'dark', kb: true, dur: 2200 }),
      t('THE TRUE LEGEND', '〜 君の物語は永遠に語り継がれる 〜 完', { bg: 'bg-legend', fx: 'burst', shock: true, dur: 2700, color: '#ff6ec7' }) ];
    // 中間目標（5億〜10兆）
    const guest = amt >= 1e13 ? 'legend' : amt >= 1e12 ? 'hero' : amt >= 5e10 ? 'doya' : amt >= 1e10 ? 'gent' : amt >= 5e9 ? 'gorilla' : 'pepper';
    const lines = {
      legend: '10兆…時を超える私でさえ、見たことのない高みだ。',
      hero: '1兆だと!?　もう人間をやめてる領域だぜ、相棒！',
      doya: '500億…完全に格が違う。皇帝の称号、貴様に譲ろう。',
      gent: '100億の大台。…お見事、と言わせていただきましょう。',
      gorilla: 'ウホッ!?　50億…豪腕の私も、ひれ伏すしかない。',
      pepper: `総資産 ${amtTxt}。計算が追いつかない…君は規格外だ、ピピッ。`,
    };
    return [
      t(`🏆 ${amtTxt} 到達 🏆`, '〜 ' + name + ' 〜', { bg: 'bg-gold', fx: 'flash', shock: true, dur: 1700, color: '#ffd23b' }),
      sc(guest, lines[guest], { bg: amt >= 1e12 ? 'bg-aurora' : 'bg-gold', form: guest === 'legend' ? 'ghost' : guest === 'hero' ? 'gold' : null, fx: 'zoom', kb: true, dur: 1900 }),
      sc('peace', '止まらないぞ。次の景色を、この目で見るまでは！', { bg: 'bg-aurora', form: 'awaken', fx: 'burst', shock: true, kb: true, dur: 1900 }),
      t(name, '〜 さらなる高みへ 〜', { bg: 'bg-legend', dur: 1700, color: '#ff6ec7' }) ];
  }

  // ===== 壮大なストーリー（章立てサーガ）。初当りごとに1章進行。=====
  // 各章は［笑い→緊張→涙→決意→引き］＋幕間で、アニメ作品級の尺と情感に。
  const CHAPTERS = [
    '第一章 旅立ち', '第二章 仲間との出会い', '第三章 ガキ大将の試練', '第四章 闇の前哨戦',
    '第五章 黄金の援軍', '第六章 豪腕の壁', '第七章 宇宙よりの刺客', '第八章 母の面影',
    '第九章 雨夜の誓い', '第十章 決戦前夜', '第十一章 闇の素顔', '最終章 闇のマスク',
  ];
  function chapterCount() { return CHAPTERS.length; }
  function chapterTitle(i) { return CHAPTERS[Math.min(i, CHAPTERS.length - 1)]; }
  function chapter(i) {
    const head = (sub, bg, col) => t(CHAPTERS[i], sub, { bg: bg || 'bg-legend', color: col || '#ff6ec7', dur: 1800, fx: 'flash', shock: true });
    switch (i) {
      case 0: return [ head('〜 すべての始まり 〜'),
        nar('朝。安アパートに、けたたましい目覚ましの音が響く。', { bgImg: 'bg_city.svg', dur: 1700 }),
        sc('peace', 'う〜ん…あと5分……って、二度寝してる場合じゃない！今日から本気だ！', { bgImg: 'bg_city.svg', fx: 'shake', kb: true, dur: 1900 }),
        sc('dog', '（ハル、その「本気」、昨日も一昨日も聞いたワン…）', { bgImg: 'bg_city.svg', kb: true, dur: 1700 }),
        sc('peace', '聞こえてるぞモモ!?　…今日のは、本物の本気だ。財布が5万円なんだ、もう後がない！', { bgImg: 'bg_city.svg', fx: 'zoom', kb: true, dur: 2000 }),
        nar('うだつの上がらない毎日。だが、彼の胸には、消えない夢があった。', { bg: 'bg-space', dur: 1900 }),
        sc('peace', '一億円を稼いでFIREする！　そして、母さんとの約束を守るんだ！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 1900 }),
        sc('dog', '（…お母さん。ハルはね、今でも毎晩、あなたの写真に「おやすみ」を言うワン）', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        sc('peace', '（笑って生きろ、か。…分かってるよ、母さん。だから、笑える未来を、自分で掴む。）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2300 }),
        sc('doya', 'フッ、夢を見るのは自由だ。だが現実は甘くない。ドヤ皇帝が教えてやる。', { bg: 'bg-fire', fx: 'zoom', kb: true, dur: 1900 }),
        sc('peace', '上等だ。その現実、ひっくり返してやる！', { bg: 'bg-speed', fx: 'speed', dur: 1500 }),
        nar('——幕間。出発前、彼は近所の定食屋に立ち寄った。', { bgImg: 'bg_diner.svg', dur: 1800 }),
        sc('peace', '大将、いつもの……は頼めないや。今日は水だけで。…でも、必ず戻って大盛り頼むよ。', { bgImg: 'bg_diner.svg', kb: true, dur: 2200 }),
        sc('dog', '（店のおばちゃん、こっそりコロッケ一個、紙に包んでくれたワン。…世の中、捨てたもんじゃないワン）', { bgImg: 'bg_diner.svg', kb: true, dur: 2300 }),
        sc('peace', '（あったかい。…この恩、いつか倍にして返す。これも、オレが立ち上がる理由だ。）', { bgImg: 'bg_diner.svg', kb: true, dur: 2200 }),
        t('伝説は、ここから始まる。', '', { bg: 'bg-thunder', fx: 'burst', shock: true, dur: 1600, color: '#ffd23b' }) ];

      case 1: return [ head('〜 心強き仲間たち 〜', 'bg-space', '#9fe8ff'),
        sc('pepper', '改めて自己紹介を。データ分析ロボのペッパーだ。君の勝率、上げてみせる、ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1900 }),
        sc('peace', '相棒…！　心強いよ。で、ぶっちゃけ、いくら勝てる？', { bg: 'bg-space', fx: 'zoom', kb: true, dur: 1600 }),
        sc('pepper', '計算結果：このままでは3日で破産。生存確率、限りなくゼロ。…ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1800 }),
        sc('peace', 'もっと優しい嘘をついてくれ!!　夢くらい見させろ!!', { bg: 'bg-aurora', fx: 'shake', kb: true, dur: 1600 }),
        sc('pepper', '訂正する。…2.9日だ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1500 }),
        sc('peace', '余計に短くなってるじゃないか!!', { bg: 'bg-aurora', fx: 'shake', kb: true, dur: 1500 }),
        sc('dog', '（ふふっ。…でも、こうしてバカ騒ぎできるのが、いちばん幸せだワン）', { bg: 'bg-aurora', kb: true, dur: 2000 }),
        nar('——その夜。三人(？)は、コンビニの肉まん一個を分け合った。', { bg: 'bg-space', dur: 1900 }),
        sc('peace', '熱っ…！　ふぅふぅ。…なあ、いつか、腹いっぱい食えるようになろうな。みんなで。', { bg: 'bg-space', kb: true, dur: 2200 }),
        sc('pepper', '（…記録。本日の幸福度、計測不能。エラーではない。これは、温かいという感情だ。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('peace', 'みんな…ありがとう。仲間がいれば、どこまでも行ける！', { bg: 'bg-aurora', fx: 'burst', shock: true, kb: true, dur: 1900 }) ];

      case 2: return [ head('〜 腕力の試練 〜', 'bg-fire', '#ff8a00'),
        sc('gian', 'おっせえなあ新入り！　オレ様、ガキ大将ガン太の出番だ！', { bg: 'bg-fire', fx: 'zoom', kb: true, dur: 1700 }),
        sc('gian', 'お前のものはオレのもの！　お前の出玉もオレのもの！　ガハハ！', { bg: 'bg-fire', fx: 'shake', kb: true, dur: 1800 }),
        sc('peace', 'そのセリフ、どっかで聞いたぞ…！　しかも色々マズい気がする!!', { bg: 'bg-speed', fx: 'speed', dur: 1600 }),
        sc('pepper', '著作権的に危険だ相棒、深く触れるな。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1600 }),
        sc('gian', 'うるせえロボ！　とにかく玉をよこせ！', { bg: 'bg-fire', fx: 'shake', kb: true, dur: 1500 }),
        nar('だがガン太、その乱暴の裏には、寂しさが隠れていた。', { bg: 'bg-fire', dur: 1800 }),
        sc('gian', '…どうせ、オレなんか誰も相手にしねえ。だから、奪うしかねえんだよ。', { bg: 'bg-space', form: 'dark', kb: true, dur: 2100 }),
        sc('peace', 'ガン太。…奪わなくたって、一緒に打てばいいだろ。玉は分けてやる。腹も、減ってんだろ？', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        sc('gian', '……っ。な、なんだよ、その顔。調子狂うじゃねえか…！', { bg: 'bg-fire', kb: true, dur: 1800 }),
        sc('peace', '力じゃ敵わない。でも、粘りと根性なら負けない。——いくぞ、ガン太！今日は共闘だ！', { bg: 'bg-thunder', fx: 'flash', shock: true, kb: true, dur: 2000 }),
        nar('——幕間。決着のあと、二人は河原で缶コーヒーを分け合った。', { bgImg: 'bg_dawn.svg', dur: 1800 }),
        sc('gian', '…なあ。オレ、ガキの頃から「いらねえ子」って言われ続けてさ。だから、強がってた。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2300 }),
        sc('peace', 'いらない奴なんて、いないさ。…現に、お前がいないと、このコーヒー、甘すぎて飲めねえ。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2200 }),
        sc('gian', 'なんだそりゃ!!　…けっ。覚えとけよ、その夢、オレも手伝ってやる。子分じゃねえ、仲間としてな。', { bgImg: 'bg_dawn.svg', fx: 'zoom', kb: true, dur: 2300 }) ];

      case 3: return [ head('〜 忍び寄る闇 〜', 'bg-thunder', '#ff3b3b'),
        nar('勝ち進む彼の前に、ついに本物の「組織」が動き出す。', { bgImg: 'bg_hell.svg', dur: 1900 }),
        sc('general', '私は大元帥。闇のマスク様の尖兵だ。我が軍門に下れ。さもなくば——破滅だ。', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2200 }),
        sc('peace', '（こいつ…これまでの相手とは、まとう空気が違う…！）', { bg: 'bg-thunder', fx: 'shake', dur: 1700 }),
        sc('dog', '（ハル、手が…震えてるワン。怖いんだワン。…でも、それでも前を向いてる）', { bg: 'bg-thunder', kb: true, dur: 2100 }),
        sc('pepper', '相棒、勝率17%。…だが君は、いつも計算を超えてきた。データが、そう言っている。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2100 }),
        sc('peace', '怖いさ。膝も笑ってる。…でもな、ここで逃げたら、母さんに笑って報告できない。', { bg: 'bg-thunder', kb: true, dur: 2200 }),
        sc('peace', 'だったら…超えてやるさ。何度でも、何度でもな！', { bg: 'bg-thunder', fx: 'burst', shock: true, kb: true, dur: 1900 }),
        sc('general', 'ほう…良い目だ。だが、その輝きを闇に沈めるのが、私の役目よ。', { bgImg: 'bg_hell.svg', form: 'dark', kb: true, dur: 1900 }) ];

      case 4: return [ head('〜 黄金の援軍 〜', 'bg-gold', '#ffd23b'),
        sc('peace', 'ぐ…っ、もう、立ってられない…ここまで、なのか…', { bg: 'bg-space', fx: 'shake', dur: 1800 }),
        sc('dog', '（立って…！　お願い、立ってよハル…！　モモ、まだ約束、果たしてないワン…！）', { bg: 'bg-space', kb: true, dur: 2200 }),
        nar('——その時、灰色の空が、まばゆい黄金に裂けた。', { bg: 'bg-gold', fx: 'flash', shock: true, dur: 1400 }),
        sc('hero', '待たせたな！　正義のイエローヒーロー、覚醒参上ッ！', { bg: 'bg-gold', form: 'gold', fx: 'zoom', kb: true, se: 'kakutei', dur: 1900 }),
        sc('peace', 'あんたは…！　なんで、オレなんかを助けて…', { bg: 'bg-gold', kb: true, dur: 1600 }),
        sc('hero', '昔、俺も同じだった。財布は空っぽ、夢だけが財産。…誰かが手を差し伸べてくれたから、今がある。', { bg: 'bg-gold', form: 'gold', kb: true, dur: 2400 }),
        sc('hero', '夢を諦めない奴を、ほっとけるかよ。さあ、一緒に掴むぞ——黄金を！', { bg: 'bg-aurora', form: 'gold', fx: 'burst', shock: true, kb: true, dur: 2000 }),
        sc('peace', '…はい…！　ありがとう…ありがとうございます…！', { bg: 'bg-aurora', kb: true, dur: 1800 }),
        sc('pepper', '（涙腺、決壊。…私にも涙腺があれば、と初めて思った。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2000 }) ];

      case 5: return [ head('〜 立ちはだかる豪腕 〜', 'bg-fire', '#b06a2a'),
        sc('gorilla', 'ウホ……豪腕ゴリ将軍。この腕、砕けるものなら砕いてみろ。', { bg: 'bg-fire', form: 'dark', fx: 'shake', kb: true, dur: 1900 }),
        sc('peace', '（でかい…壁みたいだ。心が、ポキッと折れそうになる）', { bg: 'bg-thunder', fx: 'shake', dur: 1700 }),
        sc('gorilla', 'ウホッ。…ところでお前、なぜそんなにバナナの匂いがする？', { bg: 'bg-fire', kb: true, dur: 1700 }),
        sc('peace', 'さっきバイトでバナナ100本仕分けたからだよ!!　軍資金、稼がなきゃいけないんでね!!', { bg: 'bg-fire', fx: 'shake', kb: true, dur: 1900 }),
        sc('gorilla', 'ウホ…働き者だな。…嫌いじゃない、その生き様。', { bg: 'bg-fire', kb: true, dur: 1700 }),
        sc('pepper', '思い出せ相棒。ここまで一緒に越えてきた、仲間の顔を。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1800 }),
        sc('peace', '……そうだ。モモ、ペッパー、ガン太、ヒーロー…オレは、一人じゃない。', { bg: 'bg-aurora', kb: true, dur: 2000 }),
        sc('peace', 'だから——折れない！！　この壁、ぶち破ってやる！！', { bg: 'bg-speed', fx: 'burst', shock: true, kb: true, dur: 1900 }),
        nar('——幕間。その夜、ゴリ将軍は黙って、バナナを一房、置いていった。', { bgImg: 'bg_rooftop.svg', dur: 1900 }),
        sc('gorilla', 'ウホ。…明日も、バイトなのだろう。食え。倒れられては、壁としての沽券に関わる。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2200 }),
        sc('peace', '将軍…！　あんた、不器用すぎる優しさだな。…ありがたく、いただくよ。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2100 }),
        sc('pepper', '（記録更新。敵対者から味方への転向、本日二例目。…この男の周りでは、計算が崩壊する。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2200 }) ];

      case 6: return [ head('〜 宇宙よりの刺客 〜', 'bg-space', '#9d86c4'),
        sc('alien', 'ワレワレハ宇宙人。キミノFIRE、ジャマシニキタ。', { bg: 'bg-space', fx: 'zoom', kb: true, dur: 1700 }),
        sc('peace', '宇宙人まで来た!?　オレの夢、銀河規模で邪魔されてる!?', { bg: 'bg-space', fx: 'shake', kb: true, dur: 1700 }),
        sc('alien', '……ジツハ、ワレモFIREシタイ。母星モ、物価高。コツ、オシエテ。', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('peace', '敵じゃないんかい！！　しかも宇宙でもインフレなのか…世知辛すぎるだろ宇宙!!', { bg: 'bg-aurora', fx: 'shake', kb: true, dur: 1900 }),
        sc('pepper', '異星間でも経済の悩みは普遍。…宇宙は、思ったより世知辛い。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1800 }),
        sc('alien', 'キミ、笑ウ。ツライ時モ、笑ウ。…ナゼ？', { bg: 'bg-space', kb: true, dur: 1700 }),
        sc('peace', '母さんの教えさ。「笑って生きろ」って。…笑ってりゃ、いつか本当に笑える日が来る。', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2300 }),
        sc('alien', '……ナルホド。ソレガ、地球ノ、最強ノ、テクノロジー。', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('peace', '夢見る奴は、星が違っても、みんな仲間だ。一緒にFIREしようぜ、ゼ！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 1900 }),
        sc('alien', '……ヤクソク。母星デ、待ツ。ソノ時ハ、地球ノ「肉まん」、馳走シテ。', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('peace', '宇宙の果てまで肉まんの約束か。…いいぜ、銀河一の大盛りで待っててやる！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 1900 }) ];

      // 第八章 母の面影 — 涙の山場。母の墓前で、夢の原点に立ち返る。
      case 7: return [ head('〜 母の面影 〜', 'bg-aurora', '#ff9ec0'),
        nar('連戦の疲れが、ふいに足を止めさせた。彼は、久しぶりに母の墓を訪れていた。', { bgImg: 'bg_grave.svg', dur: 2100 }),
        sc('peace', '母さん、久しぶり。…痩せたって？　まあ、軍資金が5万円スタートだったからね。', { bgImg: 'bg_grave.svg', kb: true, dur: 2200 }),
        sc('peace', '覚えてる？　オレが子供の頃、母さん、夜なべして内職してさ。それでも、いつも笑ってた。', { bgImg: 'bg_grave.svg', kb: true, dur: 2400 }),
        sc('dog', '（ハルの手、ちょっと震えてるワン。…我慢してるんだワン、ずっと）', { bgImg: 'bg_grave.svg', kb: true, dur: 2100 }),
        nar('——あの日。幼いハルは、病室の母に、こう尋ねた。', { bg: 'bg-aurora', dur: 1900 }),
        sc('peace', '（「ねえ母さん、お金ないのに、なんでいつも笑ってるの？」って聞いたんだ。）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2300 }),
        sc('peace', '（母さんは言った。「笑ってる人の周りには、人が集まる。人が集まれば、ひとりじゃない。それが一番の財産よ」）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2700 }),
        sc('peace', '…母さん。オレ、やっと意味が分かったよ。ペッパーも、モモも、ガン太も、みんな…集まってくれた。', { bgImg: 'bg_grave.svg', kb: true, dur: 2500 }),
        sc('peace', '一億は、まだだ。でも、母さんの言う一番の財産は、もう……手に入れてたんだな。', { bgImg: 'bg_grave.svg', kb: true, dur: 2400 }),
        sc('pepper', '（…相棒の頬の水分量、急上昇。私は、何も言わず、隣に立つことを選択する。それが、最適解だ。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', '行ってくるよ、母さん。…ちゃんと、笑って勝ってくる。', { bgImg: 'bg_grave.svg', fx: 'zoom', kb: true, dur: 2100 }),
        t('夢の原点を、胸に。', '', { bg: 'bg-aurora', fx: 'flash', dur: 1700, color: '#ff9ec0' }) ];

      // 第九章 雨夜の誓い — モモを拾った雨の日の回想。原点の再確認と引き。
      case 8: return [ head('〜 雨夜の誓い 〜', 'bg-thunder', '#7fa6d8'),
        nar('決戦を前に、季節外れの冷たい雨が降った。彼は傘もささず、立ち尽くしていた。', { bgImg: 'bg_rain.svg', dur: 2100 }),
        sc('peace', 'この雨…思い出すな。モモ、お前を拾ったのも、こんな夜だった。', { bgImg: 'bg_rain.svg', kb: true, dur: 2200 }),
        sc('dog', '（覚えてるワン。段ボールの中で、もう動けなくて。…諦めかけてたワン）', { bgImg: 'bg_rain.svg', kb: true, dur: 2200 }),
        nar('——あの夜。財布には、最後の小銭。彼は迷わず、それでパンを買った。', { bgImg: 'bg_rain.svg', dur: 2100 }),
        sc('peace', '（自分が食う分か、こいつを助けるか。…一秒も、迷わなかった。)', { bgImg: 'bg_rain.svg', kb: true, dur: 2200 }),
        sc('peace', 'ずぶ濡れのお前を抱えて、オレ、声に出して誓ったんだ。「もう、ひとりにしない」って。', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('dog', '（あの言葉が、モモの全部だワン。だからモモも誓ったワン。…この人の夢、絶対に守るって）', { bgImg: 'bg_rain.svg', kb: true, dur: 2500 }),
        sc('pepper', '相棒。傘を持ってきた。…非効率だと分かっている。それでも、濡れる君を放っておけなかった。', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('peace', 'ははっ…ロボのくせに、優しすぎだろ。…ありがとな。雨も、悪くないな。仲間と見れば。', { bgImg: 'bg_rain.svg', kb: true, dur: 2300 }),
        sc('peace', '5万円のあの日から、何ひとつ、ブレてない。誰も凍えさせない——その夢のために、勝つ！', { bgImg: 'bg_rain.svg', fx: 'burst', shock: true, kb: true, dur: 2200 }),
        t('やがて、雨は上がる。', '', { bg: 'bg-thunder', dur: 1700, color: '#7fa6d8' }) ];

      // 第十章 決戦前夜 — 旧第八章の名場面（夜景・全仲間の想い）
      case 9: return [ head('〜 決戦前夜 〜', 'bg-legend'),
        { char: C.peace.img, name: C.peace.name, color: C.peace.color, text: 'こんなに遠くまで来たんだな…。5万円のオレが、こんな夜景を見てる。全部、みんなのおかげだ。', bgImg: 'bg_skytree.jpg', kb: true, dur: 2400 },
        sc('dog', '（明日、すべてが終わるんだね。…モモ、白状するワン。ずっと、言えなかったこと）', { bg: 'bg-legend', kb: true, dur: 2100 }),
        sc('dog', '（あの雨の日、ハルがパンをくれなかったら、モモは生きてなかったワン。…だから、命の恩人なんだワン）', { bg: 'bg-legend', kb: true, dur: 2500 }),
        sc('peace', 'バカ。逆だよモモ。お前がいたから、オレは独りじゃなかった。…救われたのは、オレの方だ。', { bg: 'bg-legend', kb: true, dur: 2400 }),
        sc('peace', '…って、なんでオレが泣いてんだ。明日は笑って勝つって決めたのに。', { bg: 'bg-legend', kb: true, dur: 1900 }),
        sc('gian', 'よお、湿っぽい顔すんなよ大将。…みんな、屋上に集まってんぜ。お前の景気づけだとよ。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2200 }),
        sc('peace', 'みんな……来てくれたのか。ガン太、将軍、ヒーロー、ゼまで…！', { bgImg: 'bg_rooftop.svg', fx: 'zoom', kb: true, dur: 2100 }),
        sc('hero', '言ったろ？　夢を諦めない奴は、ほっとけねえ。明日は、全員、お前の背中についてるぜ。', { bgImg: 'bg_rooftop.svg', form: 'gold', kb: true, dur: 2300 }),
        sc('pepper', '相棒。私のメモリに、君との全記録が刻まれている。…どれも、削除したくないデータばかりだ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('legend', '50年後の君よ。明日、己の伝説を信じよ。運命は——いつだって、その手の中にある。', { bg: 'bg-legend', form: 'ghost', kb: true, dur: 2300 }),
        t('そして、夜が明ける。', '', { bg: 'bg-thunder', dur: 1600, color: '#ff6ec7' }) ];

      // 第十一章 闇の素顔 — 宿敵の過去。神社で、かつての夢追い人の真実が明かされる。
      case 10: return [ head('〜 闇の素顔 〜', 'bg-thunder', '#ff3b3b'),
        nar('決戦の地へ向かう途中、ハルは古びた神社で、ひとり佇む闇のマスクと出会う。', { bgImg: 'bg_shrine.svg', dur: 2100 }),
        sc('black', '…ここは、私が最後に願掛けをした場所だ。あの日も、私は本気で夢を信じていた。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2300 }),
        sc('peace', 'あんたにも、こんな場所が…。…何があったんだ。なんで、夢を憎むようになった。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2200 }),
        nar('かつて彼もまた、5万円から頂点を目指した、ひとりの若者だった。', { bgImg: 'bg_shrine.svg', dur: 2000 }),
        sc('black', '私は、あと一歩で頂に届いた。だが、独りだった。…誰も、隣にいなかった。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2400 }),
        sc('black', '掴んだ栄光は、分かち合う者がなく、ただ冷たかった。…だから私は、夢そのものを呪った。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2500 }),
        sc('peace', '……そうか。あんたは、勝ったのに、ひとりぼっちだったのか。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2100 }),
        sc('dog', '（かわいそうだワン…。この人、ずっと、寒い場所にいたんだワン）', { bgImg: 'bg_shrine.svg', kb: true, dur: 2100 }),
        sc('peace', '闇のマスク。明日、オレはあんたを倒す。でも、あんたを否定はしない。…あんたは、オレの未来かもしれない。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2500 }),
        sc('peace', 'だから証明する。仲間と掴んだ夢は、あったかいんだって。…あんたが見れなかった景色を、見せてやる。', { bgImg: 'bg_shrine.svg', fx: 'zoom', kb: true, dur: 2500 }),
        sc('black', '……フン。減らず口を。…せいぜい、その甘い理想ごと、砕いてくれよう。', { bgImg: 'bg_shrine.svg', form: 'dark', fx: 'shake', kb: true, dur: 2100 }),
        t('交わる、二つの夢の果て。', '', { bg: 'bg-thunder', fx: 'flash', dur: 1700, color: '#ff3b3b' }) ];

      default: return [ head('〜 闇のマスク、降臨 〜', 'bg-thunder', '#ff3b3b'),
        sc('black', 'ここまで来たか、小僧。だが——伝説への扉は、この私が閉ざす！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'burst', se: 'cutin', kb: true, dur: 2100 }),
        sc('peace', '（こいつが…ラスボス。全身が震える。膝も笑ってる。…でも——）', { bg: 'bg-thunder', fx: 'shake', dur: 1800 }),
        nar('闇のマスク。その正体は、かつて夢に破れ、夢を憎むようになった、もう一人の夢追い人。', { bgImg: 'bg_hell.svg', dur: 2200 }),
        sc('black', '夢など叶わぬ。私がそうだった。だから、お前の夢も——壊させてもらう！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2100 }),
        sc('peace', 'あんたも、夢を見てたのか。…だったら、なおさら退けない。', { bg: 'bg-thunder', kb: true, dur: 1900 }),
        sc('peace', '神社で言ったよな。あんたは、勝ったのにひとりだった。…オレは、違う。後ろを見てみろ！', { bgImg: 'bg_arena.svg', fx: 'zoom', kb: true, dur: 2200 }),
        sc('black', 'なに…？　貴様の背後に、あの数の影…仲間、だと…。馬鹿な、これが…温もり、なのか…！', { bgImg: 'bg_arena.svg', form: 'dark', fx: 'shake', kb: true, dur: 2300 }),
        sc('peace', '——もう怖くない。仲間がいる。夢がある。母さんの言葉がある！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 1900 }),
        sc('dog', '（行け、ハル！　モモたちの想い、全部、その一玉に込めて——！）', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('black', 'ならば来い。貴様の覚悟、この闇で塗り潰してくれる！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 1800 }),
        sc('peace', '闇のマスク——！　お前を超えて、オレは…オレたちは、伝説になる！！', { bg: 'bg-thunder', fx: 'flash', shock: true, kb: true, dur: 2000 }),
        t('運命の、最終決戦——！！', '', { bg: 'bg-aurora', fx: 'burst', shock: true, dur: 1900, color: '#ffd23b' }) ];
    }
  }

  window.STORY = { CHARS: C, opening, battle, legend, awaken, victory, ending, yokoku, normalReach,
                   chapter, chapterTitle, chapterCount };
})();
