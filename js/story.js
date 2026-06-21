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
    // 本編（純資産 5万→1億手前で順次解放）
    '第一章 旅立ち', '第二章 仲間との出会い', '第三章 ガキ大将の試練', '第四章 闇の前哨戦',
    '第五章 黄金の援軍', '第六章 豪腕の壁', '第七章 宇宙よりの刺客', '第八章 母の面影',
    '第九章 雨夜の誓い', '第十章 決戦前夜', '第十一章 闇の素顔', '最終章 闇のマスク',
    // 裏ストーリー（FIRE=1億 以降、大富豪の物語。一定間隔で100兆まで解放）
    '裏第一章 楽園の設計図', '裏第二章 仲間たちのその後', '裏第三章 新たな刺客', '裏第四章 世界が動く',
    '裏第五章 富の孤独', '裏第六章 闇のマスク、再び', '裏第七章 経済の支配者', '裏最終章 世界の頂点',
  ];
  const MAIN_CH = 12;   // ここまでが本編。以降は裏ストーリー。
  // 各章の解放しきい値（純資産）。突破するたび解放＝再生。
  const CHAPTER_UNLOCK = [
    50000, 100000, 300000, 700000, 1500000, 3000000, 6000000, 12000000, 25000000, 45000000, 65000000, 85000000,
    5e8, 1e9, 5e9, 1e10, 5e10, 1e12, 1e13, 1e14,
  ];
  function chapterCount() { return CHAPTERS.length; }
  function chapterTitle(i) { return CHAPTERS[Math.min(i, CHAPTERS.length - 1)]; }
  function unlockAsset(i) { return CHAPTER_UNLOCK[Math.min(i, CHAPTER_UNLOCK.length - 1)]; }
  function chaptersUnlockedBy(assets) { let n = 0; for (const th of CHAPTER_UNLOCK) { if (assets >= th) n++; else break; } return n; }
  function chapter(i) {
    if (i >= MAIN_CH) return uraChapter(i - MAIN_CH);   // 裏ストーリーへ
    const head = (sub, bg, col) => t(CHAPTERS[i], sub, { bg: bg || 'bg-legend', color: col || '#ff6ec7', dur: 1800, fx: 'flash', shock: true });
    switch (i) {
      case 0: return [ head('〜 すべての始まり 〜'),
        nar('西暦20XX。物価は上がり、給料は上がらない、薄曇りの朝。', { bgImg: 'bg_city.svg', dur: 1900 }),
        nar('築四十年の安アパートに、けたたましい目覚ましの音が響く。', { bgImg: 'bg_city.svg', dur: 1800 }),
        sc('peace', 'う〜ん…あと5分……って、二度寝してる場合じゃない！今日から本気だ！', { bgImg: 'bg_city.svg', fx: 'shake', kb: true, dur: 1900 }),
        sc('dog', '（ハル、その「本気」、昨日も一昨日も聞いたワン…）', { bgImg: 'bg_city.svg', kb: true, dur: 1800 }),
        sc('peace', '聞こえてるぞモモ!?　…今日のは、本物の本気だ。財布が5万円なんだ、もう後がない！', { bgImg: 'bg_city.svg', fx: 'zoom', kb: true, dur: 2100 }),
        sc('dog', '（その5万円で、カップ麺の箱買いを我慢したのは偉かったワン。…ちょっとだけ見直したワン）', { bgImg: 'bg_city.svg', kb: true, dur: 2100 }),
        sc('peace', 'だろ？　…って、よく見てるなお前。…ま、腹が減るのはお互い様だけどな。', { bgImg: 'bg_city.svg', kb: true, dur: 1900 }),
        nar('窓の外。同じ時間に出勤していく人の群れ。彼だけが、違う道を行こうとしていた。', { bgImg: 'bg_city.svg', dur: 2100 }),
        sc('peace', 'みんな、ちゃんとした道を歩いてる。…オレだけ、地面のないとこを歩こうとしてるのかもな。', { bgImg: 'bg_city.svg', kb: true, dur: 2200 }),
        sc('dog', '（でも、地面がなくたって、モモが下で受け止めるワン。だから、思いっきり跳べばいいワン）', { bgImg: 'bg_city.svg', kb: true, dur: 2300 }),
        sc('peace', '…ありがとな、モモ。お前のその一言で、また立てる。', { bgImg: 'bg_city.svg', kb: true, dur: 1800 }),
        { title: '所持金　¥50,000', text: '——財布の中身は、たったの5万円。これが、全財産。', bgImg: 'bg_city.svg', color: '#ff6b6b', fx: 'shake', dur: 2100 },
        nar('うだつの上がらない毎日。だが、彼の胸には、消えない夢があった。', { bg: 'bg-space', dur: 1900 }),
        sc('peace', '一億円を稼いでFIREする！　働かず、自由に生きる。そして、母さんとの約束を守るんだ！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 2100 }),
        sc('peace', '夢のためなら、恥も外聞もない。…笑われたって、いいんだ。', { bg: 'bg-aurora', kb: true, dur: 1800 }),
        sc('dog', '（…お母さん。ハルはね、今でも毎晩、あなたの写真に「おやすみ」を言うワン）', { bg: 'bg-aurora', kb: true, dur: 2300 }),
        sc('peace', '（笑って生きろ、か。…分かってるよ、母さん。だから、笑える未来を、自分で掴む。）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2300 }),
        nar('——幕間。出発前、彼は近所の小さな公園で足を止めた。', { bgImg: 'bg_park.svg', dur: 1900 }),
        sc('peace', 'このベンチ、子供の頃、母さんとよく座ったんだ。…帰りはアイス一本、取り合いっこでさ。', { bgImg: 'bg_park.svg', kb: true, dur: 2300 }),
        sc('dog', '（ハルの目、ちょっと遠くを見てるワン。…大事な場所なんだワン）', { bgImg: 'bg_park.svg', kb: true, dur: 2000 }),
        sc('peace', '（待っててくれよ、母さん。…次にここに座る時は、笑い話を持って帰るから。）', { bgImg: 'bg_park.svg', kb: true, dur: 2200 }),
        nar('立ち上がった彼の前に、ひとりの男が立ちはだかる。', { bg: 'bg-fire', dur: 1700 }),
        sc('doya', 'フッ、夢を見るのは自由だ。だが現実は甘くない。ドヤ皇帝が教えてやる。', { bg: 'bg-fire', fx: 'zoom', kb: true, dur: 1900 }),
        sc('doya', '5万で一億？　寝言は寝て言え。…その身の程知らずな目、すぐに曇らせてやろう。', { bg: 'bg-fire', form: 'dark', fx: 'shake', kb: true, dur: 2100 }),
        sc('peace', '上等だ。その現実、ひっくり返してやる！', { bg: 'bg-speed', fx: 'speed', dur: 1500 }),
        sc('pepper', '（観察記録。被験者ハル、相手の格を考えず即・宣戦布告。…無謀値、計測上限を突破。ピピッ。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2200 }),
        sc('dog', '（はらはらするワン…。でも、こういう時のハルは、なぜか負けない気がするワン）', { bg: 'bg-speed', kb: true, dur: 2000 }),
        nar('——幕間。挑戦の前に、彼は近所の定食屋に立ち寄った。', { bgImg: 'bg_diner.svg', dur: 1800 }),
        sc('peace', '大将、いつもの……は頼めないや。今日は水だけで。…でも、必ず戻って大盛り頼むよ。', { bgImg: 'bg_diner.svg', kb: true, dur: 2200 }),
        sc('dog', '（店のおばちゃん、こっそりコロッケ一個、紙に包んでくれたワン。…世の中、捨てたもんじゃないワン）', { bgImg: 'bg_diner.svg', kb: true, dur: 2300 }),
        sc('peace', 'おばちゃん…！　…代金、必ず。利子つけて。…いや、笑顔も添えて返すよ。', { bgImg: 'bg_diner.svg', kb: true, dur: 2100 }),
        sc('peace', '（あったかい。…この恩、いつか倍にして返す。これも、オレが立ち上がる理由だ。）', { bgImg: 'bg_diner.svg', form: 'awaken', kb: true, dur: 2200 }),
        sc('pepper', '相棒。…非効率を承知で言う。そのコロッケ、半分やる。腹が減っては、夢も戦も、できぬ。', { bgImg: 'bg_diner.svg', kb: true, dur: 2200 }),
        sc('peace', 'ロボのくせに、お前…！　…分かった、半分こだ。これが、オレたちの最初の軍資金だな。', { bgImg: 'bg_diner.svg', fx: 'zoom', kb: true, dur: 2100 }),
        sc('dog', '（モモにも、ちょっとだけくれたワン。…三等分。三人で分けると、不思議と二倍うまいワン）', { bgImg: 'bg_diner.svg', kb: true, dur: 2300 }),
        sc('peace', 'さて。…腹も少し満ちた。財布の5万、ここからどう増やすか、だな。', { bgImg: 'bg_diner.svg', kb: true, dur: 1900 }),
        sc('pepper', '提案。全額を一度に賭けるのは愚策。…まず小さく、流れを読む。…君の心臓に悪い打ち方は、私が止める。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', '頼りになるな、相棒。…でも、ここぞって時は、オレの勘も信じてくれよ。', { bgImg: 'bg_diner.svg', kb: true, dur: 2000 }),
        sc('pepper', '…勘。最も嫌いなパラメータだ。…だが、君の勘の的中率、なぜか理論値を超えている。…要・観測。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        nar('店を出ると、空はいつのまにか晴れていた。雲の切れ間から、一筋の光。', { bgImg: 'bg_city.svg', dur: 2000 }),
        sc('peace', 'お、晴れた。…縁起がいいな。…よし、行くか。オレの、伝説の一日目だ！', { bgImg: 'bg_city.svg', fx: 'zoom', kb: true, dur: 2000 }),
        sc('dog', '（ハルの後ろ姿、いつもより、ちょっと大きく見えるワン。…がんばれ、ハル！）', { bgImg: 'bg_city.svg', kb: true, dur: 2100 }),
        t('伝説は、ここから始まる。', '', { bg: 'bg-thunder', fx: 'burst', shock: true, dur: 1600, color: '#ffd23b' }) ];

      case 1: return [ head('〜 心強き仲間たち 〜', 'bg-space', '#9fe8ff'),
        sc('pepper', '改めて自己紹介を。データ分析ロボのペッパーだ。君の勝率、上げてみせる、ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1900 }),
        sc('peace', '相棒…！　心強いよ。で、ぶっちゃけ、いくら勝てる？', { bg: 'bg-space', fx: 'zoom', kb: true, dur: 1600 }),
        sc('pepper', '計算結果：このままでは3日で破産。生存確率、限りなくゼロ。…ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1800 }),
        sc('peace', 'もっと優しい嘘をついてくれ!!　夢くらい見させろ!!', { bg: 'bg-aurora', fx: 'shake', kb: true, dur: 1600 }),
        sc('pepper', '訂正する。…2.9日だ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1500 }),
        sc('peace', '余計に短くなってるじゃないか!!', { bg: 'bg-aurora', fx: 'shake', kb: true, dur: 1500 }),
        sc('pepper', '私は正直者でな。…が、補足する。生存確率はゼロでも、奇跡確率は、ゼロではない。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2000 }),
        sc('peace', 'それを先に言え!!　…でも、なんか、お前のそういうとこ、嫌いじゃないよ。', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('dog', '（ふふっ。…でも、こうしてバカ騒ぎできるのが、いちばん幸せだワン）', { bg: 'bg-aurora', kb: true, dur: 2000 }),
        nar('——幕間。三人(？)は、夜の街をあてもなく歩いた。', { bgImg: 'bg_alley.svg', dur: 1800 }),
        sc('peace', 'なあペッパー。お前、なんでオレなんかに付いてきたんだ？　計算じゃ、止めるのが正解だろ。', { bgImg: 'bg_alley.svg', kb: true, dur: 2200 }),
        sc('pepper', '…私の前の持ち主は、夢を諦めた。データは正しかった。だが、その目は、二度と笑わなかった。', { bgImg: 'bg_alley.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('pepper', '私は学習した。…正しさだけでは、幸福は最大化されない、と。だから、君を観測したい。ピピッ。', { bgImg: 'bg_alley.svg', kb: true, dur: 2400 }),
        sc('peace', 'ペッパー…。お前、ちゃんと、夢の意味、分かってるんだな。', { bgImg: 'bg_alley.svg', kb: true, dur: 1900 }),
        sc('dog', '（このロボ、口は悪いけど、心はあったかいワン。…モモ、認めてあげるワン）', { bgImg: 'bg_alley.svg', kb: true, dur: 2100 }),
        nar('——その夜。三人(？)は、コンビニの肉まん一個を分け合った。', { bg: 'bg-space', dur: 1900 }),
        sc('peace', '熱っ…！　ふぅふぅ。…なあ、いつか、腹いっぱい食えるようになろうな。みんなで。', { bg: 'bg-space', kb: true, dur: 2200 }),
        sc('dog', '（モモの分、ちゃんと一番大きいとこくれたワン。…ハルは、いつも自分が一番小さいワン）', { bg: 'bg-space', kb: true, dur: 2300 }),
        sc('peace', 'バレたか。…いいんだよ。お前らが食ってるの見てるだけで、オレは腹いっぱいなんだ。', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        sc('pepper', '（…記録。本日の幸福度、計測不能。エラーではない。これは、温かいという感情だ。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('pepper', '相棒。…データを一つ、追加する。「君と過ごす夜は、悪くない」。…保存完了、ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('peace', 'ははっ…照れんなよ。…よし、明日も勝つぞ。いや、勝てなくても、また三人で肉まん食おう。', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        nar('——翌朝。ペッパーによる、特訓が始まった。', { bgImg: 'bg_park.svg', dur: 1700 }),
        sc('pepper', '相棒。勝利には、玉の軌道予測が不可欠だ。…まず、この百円玉を、宙に投げて、目で追え。', { bgImg: 'bg_park.svg', kb: true, dur: 2200 }),
        sc('peace', 'よし、いくぞ…！　…って、あっ、転がってった!!　待て待て、それ全財産の一部!!', { bgImg: 'bg_park.svg', fx: 'shake', kb: true, dur: 2100 }),
        sc('dog', '（モモが拾ってきたワン！　…ハル、特訓より先に、財布の管理を覚えるべきワン）', { bgImg: 'bg_park.svg', kb: true, dur: 2200 }),
        sc('pepper', '…データ更新。被験者の動体視力、平均以下。だが、諦めの悪さ、観測史上最高値。ピピッ。', { bgImg: 'bg_park.svg', kb: true, dur: 2200 }),
        sc('peace', '褒めてるのか貶してるのか分からん!!　…まあいい、その「諦めの悪さ」で勝つさ。', { bgImg: 'bg_park.svg', fx: 'zoom', kb: true, dur: 2000 }),
        sc('pepper', '結論。技術は私が補う。君は、その心臓だけ持ってこい。…それが、最適な役割分担だ。', { bgImg: 'bg_park.svg', kb: true, dur: 2200 }),
        sc('peace', '…ああ。お前が頭脳で、オレが心臓。モモが…良心、ってとこか。最強のチームだな。', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2200 }),
        sc('dog', '（良心担当、了解ワン。…ハルが調子に乗ったら、ちゃんと足を噛んで止めるワン）', { bg: 'bg-aurora', kb: true, dur: 2100 }),
        sc('peace', 'それは良心じゃなくて実力行使だろ!!　…まあ、頼むよ、ブレーキ役。', { bg: 'bg-aurora', fx: 'shake', kb: true, dur: 1900 }),
        sc('pepper', '記録。チーム名、暫定決定。…頭脳・心臓・良心の三位一体、コードネーム「FORTUNE FIRE」。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('peace', 'お、かっこいいじゃん、それ。…よし、その名前、背負って行くぞ。一億目指して。', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 2000 }),
        sc('pepper', '補足。FORTUNE＝幸運、FIRE＝経済的自由。…だが、私の辞書では、もう一つの意味が追加された。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('pepper', '…FIRE＝心の火。…君が、凍えた者の胸に灯す、あの火だ。…二重の意味、悪くない。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', 'お前…たまに詩人だな。…そうだな。金も、火も、両方掴む。…それが、オレたちの旗印だ。', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2300 }),
        sc('dog', '（モモ、この三人なら、本当にどこまでも行ける気がするワン。…根拠はないけど、確信があるワン）', { bg: 'bg-aurora', kb: true, dur: 2300 }),
        sc('peace', 'みんな…ありがとう。仲間がいれば、どこまでも行ける！', { bg: 'bg-aurora', fx: 'burst', shock: true, kb: true, dur: 1900 }),
        t('小さな食卓に、確かな絆。', '', { bg: 'bg-aurora', fx: 'flash', dur: 1600, color: '#9fe8ff' }) ];

      case 2: return [ head('〜 腕力の試練 〜', 'bg-fire', '#ff8a00'),
        nar('賑わうホール。その一角を、子分を引き連れた大男が縄張りにしていた。', { bgImg: 'bg_alley.svg', dur: 1900 }),
        sc('gian', 'おっせえなあ新入り！　オレ様、ガキ大将ガン太の出番だ！', { bg: 'bg-fire', fx: 'zoom', kb: true, dur: 1700 }),
        sc('gian', 'お前のものはオレのもの！　お前の出玉もオレのもの！　ガハハ！', { bg: 'bg-fire', fx: 'shake', kb: true, dur: 1800 }),
        sc('peace', 'そのセリフ、どっかで聞いたぞ…！　しかも色々マズい気がする!!', { bg: 'bg-speed', fx: 'speed', dur: 1600 }),
        sc('pepper', '著作権的に危険だ相棒、深く触れるな。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1600 }),
        sc('gian', 'うるせえロボ！　とにかく玉をよこせ！', { bg: 'bg-fire', fx: 'shake', kb: true, dur: 1500 }),
        sc('peace', '断る！　この玉一個一個に、オレの夢が詰まってんだ。…一個も、くれてやらない！', { bg: 'bg-speed', fx: 'zoom', kb: true, dur: 1900 }),
        sc('gian', 'ほう…逆らうのか。…おもしれえ。久しぶりだぜ、オレに歯向かう奴は。', { bg: 'bg-fire', form: 'dark', fx: 'shake', kb: true, dur: 2000 }),
        sc('dog', '（ハル、相手は体格が倍ワン…！　でも、目だけは絶対に逸らしてないワン）', { bg: 'bg-fire', kb: true, dur: 2000 }),
        nar('力と力のぶつかり合い。だがガン太、その乱暴の裏には、寂しさが隠れていた。', { bg: 'bg-fire', dur: 1900 }),
        sc('gian', '…どうせ、オレなんか誰も相手にしねえ。だから、奪うしかねえんだよ。', { bg: 'bg-space', form: 'dark', kb: true, dur: 2100 }),
        sc('gian', '怖がられて、避けられて。…それでも、誰かに見てほしくて、暴れてただけなんだ。', { bg: 'bg-space', form: 'dark', kb: true, dur: 2300 }),
        sc('peace', 'ガン太。…奪わなくたって、一緒に打てばいいだろ。玉は分けてやる。腹も、減ってんだろ？', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        sc('gian', '……っ。な、なんだよ、その顔。調子狂うじゃねえか…！', { bg: 'bg-fire', kb: true, dur: 1800 }),
        sc('peace', 'オレもさ、ずっと一人だと思ってた。…だから分かるんだ。お前、本当は寂しいだけだろ。', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        sc('gian', 'う、うるせえ！　…そんなんじゃ、ねえ……っ。（…なんで、涙が出るんだよ。）', { bg: 'bg-fire', fx: 'shake', kb: true, dur: 2200 }),
        sc('peace', '力じゃ敵わない。でも、粘りと根性なら負けない。——いくぞ、ガン太！今日は共闘だ！', { bg: 'bg-thunder', fx: 'flash', shock: true, kb: true, dur: 2000 }),
        sc('gian', 'っ……ああ！　貸せよその夢、半分担いでやる！　…ただし、見届けるだけだからな！', { bg: 'bg-thunder', fx: 'burst', shock: true, kb: true, dur: 2100 }),
        nar('——幕間。決着のあと、二人は河原で缶コーヒーを分け合った。', { bgImg: 'bg_dawn.svg', dur: 1800 }),
        sc('gian', '…なあ。オレ、ガキの頃から「いらねえ子」って言われ続けてさ。だから、強がってた。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2300 }),
        sc('peace', 'いらない奴なんて、いないさ。…現に、お前がいないと、このコーヒー、甘すぎて飲めねえ。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2200 }),
        sc('gian', 'けっ、安い缶コーヒーのくせに偉そうに語るな。…でも、まあ、悪くねえ味だ。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2100 }),
        sc('dog', '（二人とも、子供みたいな顔で笑ってるワン。…喧嘩した後の方が、仲良くなれるワン）', { bgImg: 'bg_dawn.svg', kb: true, dur: 2300 }),
        sc('pepper', '（記録。敵対者ガン太、味方へ転向。所要時間、わずか数分。…この男の交渉術、解析不能。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('gian', 'なあハル。…お前の母ちゃんの話、もっと聞かせろよ。「笑って生きろ」だっけ。…いい言葉だ。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2400 }),
        sc('peace', 'ああ。…いくらでも話すよ。母さんの自慢話なら、夜が明けても止まらないからな。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2200 }),
        sc('gian', 'なんだそりゃ!!　…けっ。覚えとけよ、その夢、オレも手伝ってやる。子分じゃねえ、仲間としてな。', { bgImg: 'bg_dawn.svg', fx: 'zoom', kb: true, dur: 2300 }),
        nar('やがて、河原に朝日が昇ってきた。二人の影が、長く伸びる。', { bgImg: 'bg_dawn.svg', dur: 2000 }),
        sc('peace', 'なあガン太。…お前の子分たち、まだ向こうで待ってるぞ。…ちゃんと、迎えに行ってやれよ。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2300 }),
        sc('gian', '…ああ。あいつらも、本当は、奪うのなんか嫌だったんだ。…オレが、変わらなきゃな。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2300 }),
        sc('peace', 'いい顔になったじゃねえか。…その顔なら、子分も付いてくるさ。…いや、仲間が、な。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2200 }),
        sc('dog', '（ガン太、さっきまで怖い顔だったのに、今はすっかり子供の笑顔ワン。…人って、変われるんだワン）', { bgImg: 'bg_dawn.svg', kb: true, dur: 2400 }),
        sc('pepper', '（朝日を浴びる二人の体温、ほぼ同値。…敵味方の境界とは、かくも曖昧なものか。…要・再定義。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', 'よし！　朝飯、奢ってやるよガン太。…と言いたいとこだが、財布が5万だからな。…割り勘で！', { bgImg: 'bg_dawn.svg', fx: 'zoom', kb: true, dur: 2200 }),
        sc('gian', 'けち!!　…まあいい、それでこそ夢追い人だ。…行こうぜ、相棒。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2000 }),
        sc('peace', 'なあガン太。…お前みたいな奴が、いてくれて、助かるよ。…粗暴だけど、根は、誰より優しい。', { bgImg: 'bg_dawn.svg', kb: true, dur: 2300 }),
        sc('gian', 'う、うるせえ!!　恥ずかしいこと言うな!!　…けっ。…まあ、お前も、悪くねえ奴だよ。', { bgImg: 'bg_dawn.svg', fx: 'shake', kb: true, dur: 2200 }),
        sc('dog', '（照れ隠しで石を蹴飛ばすガン太、可愛いワン。…ハルの仲間は、みんな不器用で、あったかいワン）', { bgImg: 'bg_dawn.svg', kb: true, dur: 2400 }),
        t('拳が結んだ、男の友情。', '', { bg: 'bg-fire', fx: 'burst', dur: 1600, color: '#ff8a00' }) ];

      case 3: return [ head('〜 忍び寄る闇 〜', 'bg-thunder', '#ff3b3b'),
        nar('小さな勝ちを重ね、ハルは少しずつ名を上げていた。だが——光が強まるほど、影もまた濃くなる。', { bgImg: 'bg_city.svg', dur: 2200 }),
        sc('peace', '最近さ、調子いいんだ。仲間も増えて。…これ、もしかして、いい流れ来てる？', { bgImg: 'bg_city.svg', kb: true, dur: 2000 }),
        sc('pepper', '相棒。…警告する。君の連勝が、ある「組織」のレーダーに引っかかった。…静かに、迫っている。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2200 }),
        sc('gian', 'おい、ハル。なんか、ホールの空気が変だぜ。…見たことねえ連中が、お前を見張ってる。', { bg: 'bg-thunder', kb: true, dur: 2100 }),
        nar('勝ち進む彼の前に、ついに本物の「組織」が動き出す。', { bgImg: 'bg_hell.svg', dur: 1900 }),
        sc('general', '私は大元帥。闇のマスク様の尖兵だ。我が軍門に下れ。さもなくば——破滅だ。', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2200 }),
        sc('peace', '（こいつ…これまでの相手とは、まとう空気が違う…！）', { bg: 'bg-thunder', fx: 'shake', dur: 1700 }),
        sc('general', '貴様の夢、確かに見えた。…だからこそ、潰し甲斐がある。希望は、深いほど折れる音が良い。', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2400 }),
        sc('dog', '（ハル、手が…震えてるワン。怖いんだワン。…でも、それでも前を向いてる）', { bg: 'bg-thunder', kb: true, dur: 2100 }),
        sc('gian', 'おい、無理すんな！　こいつ、これまでの相手とは格が違う。…一回、退こうぜ。', { bg: 'bg-thunder', fx: 'shake', kb: true, dur: 2000 }),
        sc('peace', 'いや…逃げない。逃げたら、ここまで一緒に来てくれたみんなに、顔向けできない。', { bg: 'bg-thunder', kb: true, dur: 2200 }),
        sc('pepper', '相棒、勝率17%。…だが君は、いつも計算を超えてきた。データが、そう言っている。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2100 }),
        sc('pepper', '補足。17%は、平凡な打ち手の数字だ。…君の「諦めの悪さ」係数を乗ずれば、まだ戦える。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('peace', '怖いさ。膝も笑ってる。…でもな、ここで逃げたら、母さんに笑って報告できない。', { bg: 'bg-thunder', kb: true, dur: 2200 }),
        sc('peace', '（母さん。…笑って生きろ、って言ったよな。…今は、引きつった笑いしか、できないけど。）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2400 }),
        sc('peace', '（思い出すよ。…内職で指を腫らしても、母さんは、オレの前では、絶対に笑ってた。）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2400 }),
        sc('peace', '（あれが、どれだけ強いことだったか。…今なら、痛いほど分かる。…オレも、笑ってみせる。）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2500 }),
        sc('peace', '（それでも。…笑って、前に進むよ。それが、母さんの息子の、生き方だ。）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2300 }),
        sc('peace', 'だったら…超えてやるさ。何度でも、何度でもな！', { bg: 'bg-thunder', fx: 'burst', shock: true, kb: true, dur: 1900 }),
        sc('gian', '…はぁ。聞かねえ奴だな、ったく。…分かったよ、付き合ってやる。背中は任せろ。', { bg: 'bg-thunder', kb: true, dur: 2000 }),
        sc('dog', '（ハルが前を向くなら、モモも前を向くワン。…震える足で、それでも立つのが、勇気だワン）', { bg: 'bg-thunder', kb: true, dur: 2300 }),
        sc('general', 'ほう…良い目だ。だが、その輝きを闇に沈めるのが、私の役目よ。', { bgImg: 'bg_hell.svg', form: 'dark', kb: true, dur: 1900 }),
        nar('——幕間。睨み合いの夜。ハルは外の自販機の前で、深呼吸を繰り返していた。', { bgImg: 'bg_alley.svg', dur: 2000 }),
        sc('peace', '…正直に言うと、まだ膝が震えてる。あんな圧、感じたことなかった。', { bgImg: 'bg_alley.svg', kb: true, dur: 2100 }),
        sc('pepper', '生理反応として、正常だ。…恐怖とは、命を守るための警報。それを抱えて進む者を、人は勇者と呼ぶ。', { bgImg: 'bg_alley.svg', kb: true, dur: 2500 }),
        sc('peace', 'ロボのくせに、たまにいいこと言うな。…よし。怖いまま、行くよ。それでいいんだろ？', { bgImg: 'bg_alley.svg', kb: true, dur: 2200 }),
        sc('dog', '（ホットの缶コーヒー、二つ。…一つはハルの手に、もう一つは震える手を温めるためワン）', { bgImg: 'bg_alley.svg', kb: true, dur: 2300 }),
        sc('peace', '…そういや、ガン太も来てくれてたな。あいつ、強がってるけど、ずっとオレを心配してた。', { bgImg: 'bg_alley.svg', kb: true, dur: 2300 }),
        sc('pepper', '観測事実。君の周りには、常に誰かがいる。…大元帥は、そこを理解できていない。それが、彼の弱点だ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', '…そうか。あいつは、強さで人を従えてる。…オレは、笑顔で人と繋がってる。…この差は、でかいよな。', { bgImg: 'bg_alley.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('pepper', 'その通り。…組織の数の力に、心の力で挑む。…無謀だが、君らしい。…私は、その無謀に賭ける。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', 'よし。…決めた。明日、真正面から、あの大元帥にぶつかる。…逃げも隠れも、しない。', { bgImg: 'bg_alley.svg', fx: 'zoom', kb: true, dur: 2200 }),
        sc('dog', '（コーヒー、もう冷めちゃったワン。…でも、ハルの手は、もう震えてないワン。…大丈夫ワン）', { bgImg: 'bg_alley.svg', kb: true, dur: 2300 }),
        sc('peace', '見ろよモモ、空が白んできた。…怖くたって、夜は必ず明ける。…さあ、行こうか。', { bgImg: 'bg_dawn.svg', form: 'awaken', fx: 'zoom', kb: true, dur: 2300 }),
        sc('general', '来い、夢追い人。…貴様が見せる「光」とやら、この大元帥が、とくと検分してくれる。', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2300 }),
        sc('peace', '上等だ。…オレの光、目に焼き付けな！', { bg: 'bg-speed', fx: 'speed', dur: 1600 }),
        t('恐怖を、握りしめて前へ。', '', { bg: 'bg-thunder', fx: 'flash', shock: true, dur: 1700, color: '#ff3b3b' }) ];

      case 4: return [ head('〜 黄金の援軍 〜', 'bg-gold', '#ffd23b'),
        nar('大元帥との戦いは、苛烈を極めた。じわじわと削られ、ハルの軍資金は底をつきかけていた。', { bg: 'bg-space', dur: 2200 }),
        sc('general', 'どうした、夢追い人。…貴様の「光」とやら、もう消えかけているではないか。', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2200 }),
        sc('peace', 'ぐ…っ、もう、立ってられない…ここまで、なのか…', { bg: 'bg-space', fx: 'shake', dur: 1800 }),
        sc('gian', 'ハル！　しっかりしろ！　…くそっ、オレが代わってやれりゃいいのに…！', { bg: 'bg-space', fx: 'shake', kb: true, dur: 2000 }),
        sc('pepper', '相棒…残弾、わずか。…計算上、勝機は、もう……。（…言いたくない。初めて、データが憎い。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('dog', '（立って…！　お願い、立ってよハル…！　モモ、まだ約束、果たしてないワン…！）', { bg: 'bg-space', kb: true, dur: 2200 }),
        sc('peace', '（ごめん…みんな。オレ、ここまで、みたいだ。…母さん、約束、守れなかった…。）', { bg: 'bg-space', form: 'ghost', kb: true, dur: 2400 }),
        sc('dog', '（諦めちゃダメワン！　ハルは、雨の日のモモを、諦めなかったワン！　だから、今度はモモが…！）', { bg: 'bg-space', fx: 'shake', kb: true, dur: 2400 }),
        nar('——その時、灰色の空が、まばゆい黄金に裂けた。', { bg: 'bg-gold', fx: 'flash', shock: true, dur: 1400 }),
        sc('hero', '待たせたな！　正義のイエローヒーロー、覚醒参上ッ！', { bg: 'bg-gold', form: 'gold', fx: 'zoom', kb: true, se: 'kakutei', dur: 1900 }),
        sc('general', 'なに…!?　イエローヒーロー、貴様…なぜ、こんな無名の若造に肩入れする！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2200 }),
        sc('peace', 'あんたは…！　なんで、オレなんかを助けて…', { bg: 'bg-gold', kb: true, dur: 1600 }),
        sc('hero', '昔、俺も同じだった。財布は空っぽ、夢だけが財産。…誰かが手を差し伸べてくれたから、今がある。', { bg: 'bg-gold', form: 'gold', kb: true, dur: 2400 }),
        sc('hero', 'その恩は、上には返せねえ。…だから俺は、次の夢追い人に返すと決めたのさ。それが、正義だ。', { bg: 'bg-gold', form: 'gold', kb: true, dur: 2500 }),
        sc('hero', '夢を諦めない奴を、ほっとけるかよ。さあ、一緒に掴むぞ——黄金を！', { bg: 'bg-aurora', form: 'gold', fx: 'burst', shock: true, kb: true, dur: 2000 }),
        sc('peace', '…はい…！　ありがとう…ありがとうございます…！', { bg: 'bg-aurora', kb: true, dur: 1800 }),
        sc('peace', '（諦めかけて、ごめん。…みんなの想いが、まだオレを立たせてくれる。…もう一回、立てる！）', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2400 }),
        sc('gian', 'そうだ、それでこそハルだ！　いけえ、ぶちかませ！', { bg: 'bg-gold', fx: 'shake', kb: true, dur: 1800 }),
        sc('pepper', '（涙腺、決壊。…私にも涙腺があれば、と初めて思った。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2000 }),
        sc('general', 'ぐ…っ、この、温度は…なんだ…！　無名の若造の周りに、なぜ、これほどの光が集う…!?', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2400 }),
        sc('peace', '教えてやるよ。…これが、母さんの言ってた「一番の財産」だ！　黄金、掴むぞ——！！', { bg: 'bg-gold', form: 'gold', fx: 'burst', shock: true, kb: true, dur: 2300 }),
        nar('黄金の光が、闇を押し返す。大元帥の冷たい鎧に、ひびが入っていく。', { bg: 'bg-gold', fx: 'flash', shock: true, dur: 1900 }),
        sc('general', 'ば、馬鹿な…！　数で勝るはずの我が組織が…たった一人の若造の、絆に押されるだと…！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2400 }),
        sc('peace', '一人じゃない。…ここにいる全員の力だ。…数えてみろよ、大元帥。…どっちが、本当に多いか。', { bg: 'bg-gold', form: 'gold', fx: 'zoom', kb: true, dur: 2400 }),
        sc('general', 'ぐ…ぅ…。…これが、温もりの、力か…。…覚えておこう。…見事だった、夢追い人。', { bgImg: 'bg_hell.svg', form: 'dark', kb: true, dur: 2300 }),
        sc('dog', '（勝ったワン！　あの怖い大元帥に、ハルが、みんなで、勝ったワン！）', { bg: 'bg-gold', fx: 'shake', kb: true, dur: 2000 }),
        nar('——幕間。激闘の後。屋上で、ヒーローは黙って缶ジュースを差し出した。', { bgImg: 'bg_rooftop.svg', dur: 1900 }),
        sc('hero', '一つ、忠告だ。…強くなるほど、孤独になる奴が多い。お前は、その仲間を、絶対に手放すなよ。', { bgImg: 'bg_rooftop.svg', form: 'gold', kb: true, dur: 2500 }),
        sc('peace', '…はい。…なんか、その言葉、すごく重く聞こえました。…大事にします、絶対。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2200 }),
        sc('dog', '（ヒーローさんの目、ちょっと寂しそうだったワン。…強い人にも、いろいろあるんだワン）', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2200 }),
        sc('peace', 'なあヒーロー。あんたを助けてくれた人は、今、どうしてるんだ？', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2000 }),
        sc('hero', '…もう、いない。…でも、あの人の「諦めるな」って声は、今でも、俺の胸で生きてる。', { bgImg: 'bg_rooftop.svg', form: 'gold', kb: true, dur: 2400 }),
        sc('peace', '…そっか。…じゃあ、その声、オレも受け継ぐよ。…そして、また次の誰かに、繋いでいく。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2400 }),
        sc('hero', '…ああ。それでこそ、夢は、絶えずに巡る。…良い目をしてるな、お前。…まぶしいくらいだ。', { bgImg: 'bg_rooftop.svg', form: 'gold', kb: true, dur: 2400 }),
        sc('pepper', '（記録。「恩送り」という概念。…経済合理性ゼロ。だが、人類最強のサブシステム。…解析の価値あり。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2500 }),
        sc('peace', 'よし。…大元帥との決着も、ついた。…一歩、また一歩、頂に近づいてる。…止まらないぞ。', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 2200 }),
        t('差し伸べられた、黄金の手。', '', { bg: 'bg-gold', fx: 'flash', dur: 1700, color: '#ffd23b' }) ];

      case 5: return [ head('〜 立ちはだかる豪腕 〜', 'bg-fire', '#b06a2a'),
        nar('軍資金を稼ぐため、ハルは昼間、果物市場で日雇いのバイトに精を出していた。', { bgImg: 'bg_alley.svg', dur: 2100 }),
        sc('peace', 'はぁ…はぁ…バナナ、あと50箱…！　夢への道は、まずバナナの山からだな…！', { bgImg: 'bg_alley.svg', fx: 'shake', kb: true, dur: 2100 }),
        sc('dog', '（ハル、汗だくワン。…でも、文句ひとつ言わないワン。えらいワン）', { bgImg: 'bg_alley.svg', kb: true, dur: 1900 }),
        sc('peace', '楽して稼ごうなんて思ってないさ。…汗かいた一円も、ギャンブルの一玉も、重さは同じだ。', { bgImg: 'bg_alley.svg', kb: true, dur: 2300 }),
        nar('そして夜。バイト帰りのハルの前に、巨大な影が立ちはだかった。', { bg: 'bg-fire', dur: 1900 }),
        sc('gorilla', 'ウホ……豪腕ゴリ将軍。この腕、砕けるものなら砕いてみろ。', { bg: 'bg-fire', form: 'dark', fx: 'shake', kb: true, dur: 1900 }),
        sc('peace', '（でかい…壁みたいだ。心が、ポキッと折れそうになる）', { bg: 'bg-thunder', fx: 'shake', dur: 1700 }),
        sc('gorilla', 'ウホッ。…ところでお前、なぜそんなにバナナの匂いがする？', { bg: 'bg-fire', kb: true, dur: 1700 }),
        sc('peace', 'さっきバイトでバナナ100本仕分けたからだよ!!　軍資金、稼がなきゃいけないんでね!!', { bg: 'bg-fire', fx: 'shake', kb: true, dur: 1900 }),
        sc('gorilla', 'ウホ…働き者だな。…嫌いじゃない、その生き様。…だが、戦いは別だ。手は抜かん。', { bg: 'bg-fire', form: 'dark', kb: true, dur: 2200 }),
        sc('peace', 'もちろん。…全力で来てくれ。オレも、汗の分だけ、本気でぶつかる！', { bg: 'bg-speed', fx: 'zoom', kb: true, dur: 1900 }),
        nar('豪腕の一撃は、ハルの心を、壁のように押し潰そうとした。', { bg: 'bg-thunder', dur: 1800 }),
        sc('peace', '（重い…！　これまでの相手とは、力が桁違いだ。…もう、腕が上がらない…！）', { bg: 'bg-thunder', fx: 'shake', kb: true, dur: 2200 }),
        sc('gorilla', 'ウホッ！　どうした、もう終わりか。…夢など、所詮はこの程度の重さなのか？', { bg: 'bg-fire', form: 'dark', fx: 'shake', kb: true, dur: 2200 }),
        sc('pepper', '思い出せ相棒。ここまで一緒に越えてきた、仲間の顔を。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1800 }),
        sc('peace', '……そうだ。モモ、ペッパー、ガン太、ヒーロー…オレは、一人じゃない。', { bg: 'bg-aurora', kb: true, dur: 2000 }),
        sc('peace', 'この腕は、オレ一人の腕じゃない。…みんなの想いが、束になって押し返してるんだ！', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2300 }),
        sc('peace', 'だから——折れない！！　この壁、ぶち破ってやる！！', { bg: 'bg-speed', fx: 'burst', shock: true, kb: true, dur: 1900 }),
        sc('gorilla', 'ウホォッ!?　…なんだ、この力は…！　一人の腕では、ないだと…！', { bg: 'bg-fire', form: 'dark', fx: 'shake', kb: true, dur: 2100 }),
        sc('dog', '（押してるワン！　ハル、みんなの想い、全部背負って、押し返してるワン！）', { bg: 'bg-speed', fx: 'shake', kb: true, dur: 2100 }),
        sc('gorilla', 'ウホ……見事。…力比べで、心の方が重いと知ったのは、初めてだ。…私の負けだ。', { bg: 'bg-aurora', kb: true, dur: 2300 }),
        nar('——幕間。その夜、ゴリ将軍は黙って、バナナを一房、置いていった。', { bgImg: 'bg_rooftop.svg', dur: 1900 }),
        sc('gorilla', 'ウホ。…明日も、バイトなのだろう。食え。倒れられては、壁としての沽券に関わる。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2200 }),
        sc('peace', '将軍…！　あんた、不器用すぎる優しさだな。…ありがたく、いただくよ。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2100 }),
        sc('gorilla', 'ウホ。…私もな、昔は一人で頂を目指した。だが、隣に誰もいない頂は、ただ寒かった。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2400 }),
        sc('peace', '…将軍。…あんたも、誰かに、隣にいてほしかったんだな。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2100 }),
        sc('gorilla', 'ウホ。…だからこそ、お前の隣を、見てみたくなった。…連れて行け、その頂とやらへ。', { bgImg: 'bg_rooftop.svg', fx: 'zoom', kb: true, dur: 2400 }),
        sc('dog', '（バナナ、あったかいワン。…将軍、体温で温めてから渡してくれたワン。…照れ屋さんワン）', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2300 }),
        sc('pepper', '（記録更新。敵対者から味方への転向、本日二例目。…この男の周りでは、計算が崩壊する。）', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2200 }),
        sc('gian', 'よお、将軍まで仲間かよ。…ハル、お前、敵を増やしてんのか味方を増やしてんのか分かんねえな。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2300 }),
        sc('peace', 'ははっ、両方さ。…でもな、ぶつかった相手ほど、一番の仲間になる。…不思議なもんだよな。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2300 }),
        sc('gorilla', 'ウホ。…一つ、聞かせろ。お前の言う「夢」とは、結局、何だ。…一億の、その先に何がある。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2300 }),
        sc('peace', '…誰も凍えない場所を作ることさ。昔のオレやモモみたいに、寒い夜に震えてる奴が、いない場所を。', { bgImg: 'bg_rooftop.svg', form: 'awaken', kb: true, dur: 2600 }),
        sc('gorilla', 'ウホ…。…金で、温もりを買うのではない。…温もりのために、金を使う、か。…器が違うな。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2400 }),
        sc('dog', '（将軍、感心してるワン。…ハルの夢は、お金そのものが目的じゃないんだワン。だから、人が集まるワン）', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2500 }),
        sc('peace', 'さあ、バナナ食って、寝るか。…明日も、バイトと、夢の続きだ。…仲間が増えると、毎日が賑やかだな。', { bgImg: 'bg_rooftop.svg', fx: 'zoom', kb: true, dur: 2400 }),
        t('壁は、味方になった。', '', { bg: 'bg-fire', fx: 'flash', dur: 1600, color: '#b06a2a' }) ];

      case 6: return [ head('〜 宇宙よりの刺客 〜', 'bg-space', '#9d86c4'),
        nar('その夜、ホールの天井を突き破り、奇妙な円盤が舞い降りた。', { bg: 'bg-space', fx: 'flash', shock: true, dur: 1900 }),
        sc('alien', 'ワレワレハ宇宙人。キミノFIRE、ジャマシニキタ。', { bg: 'bg-space', fx: 'zoom', kb: true, dur: 1700 }),
        sc('peace', '宇宙人まで来た!?　オレの夢、銀河規模で邪魔されてる!?', { bg: 'bg-space', fx: 'shake', kb: true, dur: 1700 }),
        sc('pepper', '警告。未確認飛行物体、ホールに着陸。…相棒、君の知名度、ついに惑星圏を突破した。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2100 }),
        sc('gian', 'お、おい、宇宙人だぞ!?　…ハルの夢、スケールでかくなりすぎだろ!!', { bg: 'bg-space', fx: 'shake', kb: true, dur: 1900 }),
        sc('alien', '……ジツハ、ワレモFIREシタイ。母星モ、物価高。コツ、オシエテ。', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('peace', '敵じゃないんかい！！　しかも宇宙でもインフレなのか…世知辛すぎるだろ宇宙!!', { bg: 'bg-aurora', fx: 'shake', kb: true, dur: 1900 }),
        sc('pepper', '異星間でも経済の悩みは普遍。…宇宙は、思ったより世知辛い。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 1800 }),
        sc('alien', '母星デハ、ミンナ、下ヲ向イテ歩ク。笑ウ者、イナイ。…キミノ星、ナゼ、笑ウ？', { bg: 'bg-space', kb: true, dur: 2200 }),
        sc('peace', 'いやいや、地球だってみんな疲れてるさ。…でもオレは、笑うって決めてるんだ。', { bg: 'bg-space', kb: true, dur: 2000 }),
        sc('alien', 'キミ、笑ウ。ツライ時モ、笑ウ。…ナゼ？', { bg: 'bg-space', kb: true, dur: 1700 }),
        sc('peace', '母さんの教えさ。「笑って生きろ」って。…笑ってりゃ、いつか本当に笑える日が来る。', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2300 }),
        sc('peace', 'それに、笑ってる奴の周りには、人が集まる。…ほら、こうしてお前も、来ただろ？', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        sc('alien', '……ナルホド。ソレガ、地球ノ、最強ノ、テクノロジー。', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('alien', '我ガ母星、超光速航法ハアル。ダガ、笑顔ノ技術ハ、ナカッタ。…ソレガ、足リナカッタモノ。', { bg: 'bg-aurora', kb: true, dur: 2500 }),
        sc('dog', '（宇宙人さん、ちょっと泣いてるワン…？　遠い星にも、寂しい人はいるんだワン）', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        sc('peace', '夢見る奴は、星が違っても、みんな仲間だ。一緒にFIREしようぜ、ゼ！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 1900 }),
        sc('alien', '……ゼ、ト、呼ンデクレタ。…名前、初メテ、モラッタ。…ウレシイ、ノ感情、学習。', { bg: 'bg-aurora', kb: true, dur: 2400 }),
        nar('——幕間。三人と一匹と一宇宙人は、屋台で食事を共にした。', { bgImg: 'bg_festival.svg', dur: 1900 }),
        sc('peace', 'ほら、これが地球の「肉まん」だ。…熱いから気をつけろよ。ふぅふぅして食え。', { bgImg: 'bg_festival.svg', kb: true, dur: 2200 }),
        sc('alien', '……アツッ!?　…ウマ…ウマイ!!　コレガ、地球ノ、ソウルフード…！', { bgImg: 'bg_festival.svg', fx: 'shake', kb: true, dur: 2100 }),
        sc('gian', 'はははっ、宇宙人が肉まんでアチアチ言ってるぞ!!　…なんか、可愛いとこあるじゃねえか。', { bgImg: 'bg_festival.svg', kb: true, dur: 2200 }),
        sc('pepper', '（記録。種族・惑星を超え、肉まん一個で結ばれる食卓。…宇宙の真理、もしや、これでは？）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('dog', '（みんなで囲む屋台、あったかいワン。…星が違っても、おいしいは一緒なんだワン）', { bgImg: 'bg_festival.svg', kb: true, dur: 2200 }),
        sc('alien', '……ヤクソク。母星デ、待ツ。ソノ時ハ、地球ノ「肉まん」、馳走シテ。', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('peace', '宇宙の果てまで肉まんの約束か。…いいぜ、銀河一の大盛りで待っててやる！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 1900 }),
        sc('alien', 'ヒトツ、聞キタイ。…キミ、一億稼イダラ、何ニ使ウ？　…母星デハ、皆、貯メ込ムバカリ。', { bgImg: 'bg_festival.svg', kb: true, dur: 2400 }),
        sc('peace', '凍えてる奴がいない場所を作るのさ。…金は、抱え込むためじゃない。誰かを温めるためにある。', { bgImg: 'bg_festival.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('alien', '……ナルホド。…ソレモ、地球ノ、最強ノテクノロジー。…母星ニ、持チ帰ル。…キミハ、賢者ダ。', { bgImg: 'bg_festival.svg', kb: true, dur: 2500 }),
        sc('pepper', '（また一人、いや一宇宙人、ハルの理念に感化された。…この男の思想、惑星間に伝播の兆し。…要・監視。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2500 }),
        sc('gian', 'なあ、宇宙人。…お前の星、遠いんだろ。…帰る前に、地球の祭り、全部回ってけよ。奢らねえけど。', { bgImg: 'bg_festival.svg', kb: true, dur: 2400 }),
        sc('alien', '……ウレシイ。…ガン太、優シイ。…地球、イイ星。…笑顔、ガ、満チテイル。', { bgImg: 'bg_festival.svg', kb: true, dur: 2300 }),
        sc('dog', '（みんな、星も種族もバラバラなのに、ひとつの輪になってるワン。…これが、ハルの作りたい世界ワン）', { bgImg: 'bg_festival.svg', kb: true, dur: 2500 }),
        sc('peace', 'なあゼ。…星に帰っても、笑うこと、忘れんなよ。…辛い時こそ、口角を上げるんだ。', { bgImg: 'bg_festival.svg', kb: true, dur: 2300 }),
        sc('alien', '……ハイ、師匠。…「笑顔」、母星ニ、輸出スル。…キット、皆ノ顔ガ、上ガル。', { bgImg: 'bg_festival.svg', kb: true, dur: 2300 }),
        sc('peace', '師匠って柄じゃないけどな。…でも、嬉しいよ。…オレの夢が、星を越えて、誰かを温めるなんて。', { bgImg: 'bg_festival.svg', form: 'awaken', fx: 'zoom', kb: true, dur: 2400 }),
        t('笑顔は、宇宙を超える。', '', { bg: 'bg-aurora', fx: 'flash', dur: 1600, color: '#9d86c4' }) ];

      // 第八章 母の面影 — 涙の山場。母の墓前で、夢の原点に立ち返る。
      case 7: return [ head('〜 母の面影 〜', 'bg-aurora', '#ff9ec0'),
        nar('連戦の疲れが、ふいに足を止めさせた。彼は、久しぶりに母の墓を訪れていた。', { bgImg: 'bg_grave.svg', dur: 2100 }),
        sc('peace', '母さん、久しぶり。…痩せたって？　まあ、軍資金が5万円スタートだったからね。', { bgImg: 'bg_grave.svg', kb: true, dur: 2200 }),
        sc('peace', '花、買ってきたよ。母さんの好きだった、黄色いやつ。…ちょっとだけ、奮発した。', { bgImg: 'bg_grave.svg', kb: true, dur: 2200 }),
        sc('peace', '覚えてる？　オレが子供の頃、母さん、夜なべして内職してさ。それでも、いつも笑ってた。', { bgImg: 'bg_grave.svg', kb: true, dur: 2400 }),
        sc('dog', '（ハルの手、ちょっと震えてるワン。…我慢してるんだワン、ずっと）', { bgImg: 'bg_grave.svg', kb: true, dur: 2100 }),
        nar('——回想。幼いハルは、病室の母の手を、ずっと握っていた。', { bgImg: 'bg_hospital.svg', dur: 2000 }),
        sc('peace', '（あの頃の母さんは、もう、立つこともできなくなってた。…それでも、笑ってたんだ。）', { bgImg: 'bg_hospital.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('peace', '（「ねえ母さん、お金ないのに、なんでいつも笑ってるの？」…オレ、子供心に、聞いたんだ。）', { bgImg: 'bg_hospital.svg', form: 'awaken', kb: true, dur: 2600 }),
        sc('peace', '（母さんは、痩せた手でオレの頭を撫でて、こう言った。）', { bgImg: 'bg_hospital.svg', form: 'awaken', kb: true, dur: 2200 }),
        sc('peace', '（「笑ってる人の周りには、人が集まる。人が集まれば、ひとりじゃない。それが一番の財産よ」）', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2700 }),
        sc('peace', '（「お金は、なくなることもある。でも、笑顔で繋がった縁は、一生、あなたを支えてくれるから」）', { bgImg: 'bg_hospital.svg', form: 'awaken', kb: true, dur: 2700 }),
        sc('peace', '（…それが、母さんが最後にくれた、たった一つの、でも、何より大きな宝物だった。）', { bgImg: 'bg_hospital.svg', form: 'ghost', kb: true, dur: 2500 }),
        nar('やがて母は逝き、ハルは独りになった。…そして、雨の夜、一匹の犬を拾った。', { bg: 'bg-aurora', dur: 2200 }),
        sc('peace', '…母さん。オレ、やっと意味が分かったよ。ペッパーも、モモも、ガン太も、みんな…集まってくれた。', { bgImg: 'bg_grave.svg', kb: true, dur: 2500 }),
        sc('peace', 'みんな、オレが笑ってたから、隣にいてくれたのかな。…だとしたら、母さんの言った通りだ。', { bgImg: 'bg_grave.svg', kb: true, dur: 2400 }),
        sc('peace', '一億は、まだだ。でも、母さんの言う一番の財産は、もう……手に入れてたんだな。', { bgImg: 'bg_grave.svg', kb: true, dur: 2400 }),
        sc('peace', '（…でも、母さん。…ごめん。…たまには、弱音、吐いてもいい？　…会いたいよ、母さん。）', { bgImg: 'bg_grave.svg', form: 'ghost', kb: true, dur: 2800 }),
        sc('dog', '（ハル…。モモ、何も言えないワン。…ただ、足元で、ぴったりくっついてるワン。それしかできないワン）', { bgImg: 'bg_grave.svg', kb: true, dur: 2600 }),
        sc('pepper', '（…相棒の頬の水分量、急上昇。私は、何も言わず、隣に立つことを選択する。それが、最適解だ。）', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        nar('——しばらく、誰も、何も言わなかった。風が、墓前の花を、そっと揺らした。', { bgImg: 'bg_grave.svg', dur: 2300 }),
        sc('peace', '……よし。…泣くのは、ここまでだ。…明日からは、また笑って進むよ。母さんの息子だからな。', { bgImg: 'bg_grave.svg', kb: true, dur: 2500 }),
        sc('peace', '行ってくるよ、母さん。…ちゃんと、笑って勝ってくる。…そして、いつか、いい報告をしに来る。', { bgImg: 'bg_grave.svg', fx: 'zoom', kb: true, dur: 2400 }),
        sc('dog', '（…ハルの笑顔が、戻ってきたワン。…お母さん、ハルは、ちゃんと笑ってますワン。安心してワン）', { bgImg: 'bg_grave.svg', kb: true, dur: 2500 }),
        nar('——帰り道。ハルは、子供の頃に母と座った、あの公園のベンチに立ち寄った。', { bgImg: 'bg_park.svg', dur: 2200 }),
        sc('peace', '不思議だな。…母さんが逝った時は、この世の全部が、灰色に見えたのに。', { bgImg: 'bg_park.svg', kb: true, dur: 2200 }),
        sc('peace', '今は、空も、木も、ちゃんと色がついて見える。…みんなが、色を取り戻してくれたんだ。', { bgImg: 'bg_park.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('pepper', '相棒。…一つ、私の結論を述べる。君の母上は、最高の投資家だった。', { bgImg: 'bg_park.svg', kb: true, dur: 2200 }),
        sc('pepper', '「笑顔」という元手で、君という、計り知れないリターンを生んだ。…私の計算式には、収まりきらない。', { bgImg: 'bg_park.svg', kb: true, dur: 2500 }),
        sc('peace', 'ふふ…ロボに、母さんを褒められるとはな。…ありがとう、ペッパー。…なんか、救われたよ。', { bgImg: 'bg_park.svg', kb: true, dur: 2300 }),
        sc('dog', '（ハル、もう大丈夫ワン。…お母さんの財産は、ちゃんとハルの中で、増え続けてるワン）', { bgImg: 'bg_park.svg', kb: true, dur: 2300 }),
        sc('peace', '（母さん。…オレ、もう、お金のためだけに走ってるんじゃないんだ。）', { bgImg: 'bg_park.svg', form: 'awaken', kb: true, dur: 2200 }),
        sc('peace', '（あなたが遺してくれた「笑顔」を、もっと多くの人に配るために。…それが、オレの本当の夢だ。）', { bgImg: 'bg_park.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('dog', '（ベンチに、ふわっと、あったかい風が吹いたワン。…お母さんが、頷いてくれた気がするワン）', { bgImg: 'bg_park.svg', kb: true, dur: 2400 }),
        sc('peace', 'さあ、行こう。…決戦は、もうすぐだ。…母さんの分も、笑って、勝ってくる。', { bgImg: 'bg_park.svg', fx: 'zoom', kb: true, dur: 2200 }),
        t('夢の原点を、胸に。', '', { bg: 'bg-aurora', fx: 'flash', dur: 1700, color: '#ff9ec0' }) ];

      // 第九章 雨夜の誓い — モモを拾った雨の日の回想。原点の再確認と引き。
      case 8: return [ head('〜 雨夜の誓い 〜', 'bg-thunder', '#7fa6d8'),
        nar('決戦を前に、季節外れの冷たい雨が降った。彼は傘もささず、立ち尽くしていた。', { bgImg: 'bg_rain.svg', dur: 2100 }),
        sc('peace', 'この雨…思い出すな。モモ、お前を拾ったのも、こんな夜だった。', { bgImg: 'bg_rain.svg', kb: true, dur: 2200 }),
        sc('dog', '（覚えてるワン。段ボールの中で、もう動けなくて。…諦めかけてたワン）', { bgImg: 'bg_rain.svg', kb: true, dur: 2200 }),
        nar('——回想。母を亡くしたばかりのハルもまた、その夜、独りで雨に打たれていた。', { bgImg: 'bg_rain.svg', dur: 2200 }),
        sc('peace', '（あの頃のオレは、どん底だった。母さんを亡くして、金もなくて、心まで、凍えてた。）', { bgImg: 'bg_rain.svg', form: 'ghost', kb: true, dur: 2500 }),
        sc('peace', '（夢なんて、もう、どうでもよかった。…そんな時だった。路地裏で、小さな鳴き声を聞いたのは。）', { bgImg: 'bg_alley.svg', form: 'ghost', kb: true, dur: 2600 }),
        nar('——濡れた段ボールの中。震える、痩せ細った一匹の子犬。財布には、最後の小銭。', { bgImg: 'bg_alley.svg', dur: 2300 }),
        sc('peace', '（自分が食う分か、こいつを助けるか。…一秒も、迷わなかった。）', { bgImg: 'bg_alley.svg', kb: true, dur: 2200 }),
        sc('peace', '（最後の金で、パンを買った。…自分でも、なんでだか、分からなかった。）', { bgImg: 'bg_alley.svg', form: 'awaken', kb: true, dur: 2400 }),
        sc('peace', '（でも、お前がパンを食って、か細い尻尾を振った時…凍えてたオレの心に、火が灯ったんだ。）', { bgImg: 'bg_alley.svg', form: 'awaken', kb: true, dur: 2700 }),
        sc('peace', 'ずぶ濡れのお前を抱えて、オレ、声に出して誓ったんだ。「もう、ひとりにしない」って。', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('peace', 'お前を助けたつもりで…本当は、オレが、お前に救われてたんだよ、モモ。', { bgImg: 'bg_rain.svg', kb: true, dur: 2300 }),
        sc('dog', '（あの言葉が、モモの全部だワン。だからモモも誓ったワン。…この人の夢、絶対に守るって）', { bgImg: 'bg_rain.svg', kb: true, dur: 2500 }),
        sc('dog', '（あの日からずっと、モモはハルの足元にいるワン。…これからも、ずっと、ずっと、だワン）', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        nar('——足音。傘をさした影が、ひとつ、近づいてくる。', { bgImg: 'bg_rain.svg', dur: 1900 }),
        sc('pepper', '相棒。傘を持ってきた。…非効率だと分かっている。それでも、濡れる君を放っておけなかった。', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('peace', 'ははっ…ロボのくせに、優しすぎだろ。…ありがとな。雨も、悪くないな。仲間と見れば。', { bgImg: 'bg_rain.svg', kb: true, dur: 2300 }),
        sc('pepper', '…私は、感情を持たないはずだった。だが、君と過ごすうち、回路に、説明のつかない反応が増えた。', { bgImg: 'bg_rain.svg', kb: true, dur: 2500 }),
        sc('pepper', '…たぶん、これが「大切」という値だ。…削除不可、上書き不可。…一生、保存しておく。ピピッ。', { bgImg: 'bg_rain.svg', kb: true, dur: 2500 }),
        sc('peace', 'ペッパー…。…お前と組めて、本当に良かったよ。…明日、勝とうな。三人で。', { bgImg: 'bg_rain.svg', kb: true, dur: 2200 }),
        sc('peace', '5万円のあの日から、何ひとつ、ブレてない。誰も凍えさせない——その夢のために、勝つ！', { bgImg: 'bg_rain.svg', fx: 'burst', shock: true, kb: true, dur: 2200 }),
        sc('pepper', '相棒。…一つ、ログを再生する。…あの雨の夜、君がモモを抱えて誓った時の、君の心拍データだ。', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('pepper', '…恐怖でも、絶望でもなかった。…静かで、強く、温かい鼓動。…あれが、君の夢の、原音だ。', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('peace', 'お前、そんなものまで記録してたのか。…ったく。…でも、ありがとな。…あの鼓動、忘れないよ。', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('dog', '（あの夜の鼓動が、今も、ハルの胸で鳴ってるワン。…それが、みんなを引き寄せた音なんだワン）', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('dog', '（…雨、小降りになってきたワン。…ハルの心の雨も、もう、上がってるワン）', { bgImg: 'bg_rain.svg', kb: true, dur: 2200 }),
        sc('peace', 'なあペッパー。…明日勝ったら、何が欲しい？　ロボにも、欲しいもの、あるか？', { bgImg: 'bg_rain.svg', kb: true, dur: 2100 }),
        sc('pepper', '…考えたことがなかった。…が、強いて言えば。…君と、モモと、もう一度、肉まんを分け合いたい。', { bgImg: 'bg_rain.svg', kb: true, dur: 2400 }),
        sc('peace', 'なんだそれ、安上がりだな!!　…でも、最高の願いだ。…叶えてやるよ。何百個でも、な。', { bgImg: 'bg_rain.svg', fx: 'zoom', kb: true, dur: 2300 }),
        sc('dog', '（モモは、ハルが笑ってる、それだけでいいワン。…それ以上の願いは、何もないワン）', { bgImg: 'bg_rain.svg', kb: true, dur: 2300 }),
        sc('peace', '…お前ら。…本当に、欲がないな。…でも、だからこそ、オレが、欲張りに勝ってやる。', { bgImg: 'bg_rain.svg', kb: true, dur: 2200 }),
        nar('傘を二人で分け合い、一匹を抱えて、三つの影が、雨上がりの街を帰っていく。', { bgImg: 'bg_rain.svg', dur: 2200 }),
        sc('peace', '帰ろう。…体を休めて、明日に備えるんだ。…最高の決戦に、するために。', { bgImg: 'bg_rain.svg', fx: 'zoom', kb: true, dur: 2100 }),
        t('やがて、雨は上がる。', '', { bg: 'bg-thunder', dur: 1700, color: '#7fa6d8' }) ];

      // 第十章 決戦前夜 — 旧第八章の名場面（夜景・全仲間の想い）
      case 9: return [ head('〜 決戦前夜 〜', 'bg-legend'),
        { char: C.peace.img, name: C.peace.name, color: C.peace.color, text: 'こんなに遠くまで来たんだな…。5万円のオレが、こんな夜景を見てる。全部、みんなのおかげだ。', bgImg: 'bg_skytree.jpg', kb: true, dur: 2400 },
        { char: C.dog.img, name: C.dog.name, color: C.dog.color, text: '（街の灯り、ひとつひとつに、誰かの暮らしがあるワン。…ハルは、その全部を、温めたいんだワン）', bgImg: 'bg_skytree.jpg', kb: true, dur: 2500 },
        sc('dog', '（明日、すべてが終わるんだね。…モモ、白状するワン。ずっと、言えなかったこと）', { bg: 'bg-legend', kb: true, dur: 2100 }),
        sc('dog', '（あの雨の日、ハルがパンをくれなかったら、モモは生きてなかったワン。…だから、命の恩人なんだワン）', { bg: 'bg-legend', kb: true, dur: 2500 }),
        sc('peace', 'バカ。逆だよモモ。お前がいたから、オレは独りじゃなかった。…救われたのは、オレの方だ。', { bg: 'bg-legend', kb: true, dur: 2400 }),
        sc('peace', 'お前がいなかったら、オレ、母さんが死んだあの夜に、夢ごと凍え死んでたかもしれない。', { bg: 'bg-legend', kb: true, dur: 2400 }),
        sc('peace', '…って、なんでオレが泣いてんだ。明日は笑って勝つって決めたのに。', { bg: 'bg-legend', kb: true, dur: 1900 }),
        sc('dog', '（泣いてもいいワン。…明日笑うために、今夜、ぜんぶ流しておけばいいワン）', { bg: 'bg-legend', kb: true, dur: 2200 }),
        sc('gian', 'よお、湿っぽい顔すんなよ大将。…みんな、屋上に集まってんぜ。お前の景気づけだとよ。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2200 }),
        sc('peace', 'みんな……来てくれたのか。ガン太、将軍、ヒーロー、ゼまで…！', { bgImg: 'bg_rooftop.svg', fx: 'zoom', kb: true, dur: 2100 }),
        sc('gorilla', 'ウホ。…バナナ、持ってきた。…景気づけだ。明日に、力が要るのだろう。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2200 }),
        sc('alien', '我モ、来タ。…肉まんノ恩、忘レナイ。…明日、キミノ星ノ笑顔、見届ケル。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2300 }),
        sc('hero', '言ったろ？　夢を諦めない奴は、ほっとけねえ。明日は、全員、お前の背中についてるぜ。', { bgImg: 'bg_rooftop.svg', form: 'gold', kb: true, dur: 2300 }),
        nar('屋上に、ささやかな宴が始まった。安い缶ジュースで乾杯し、誰もが笑っていた。', { bgImg: 'bg_rooftop.svg', dur: 2200 }),
        sc('peace', 'なあみんな。…改めて、礼を言わせてくれ。…こんなオレに、付いてきてくれて、ありがとう。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2400 }),
        sc('gorilla', 'ウホ。…礼など要らん。…お前の隣は、温かい。…それだけで、十分な報酬だ。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2300 }),
        sc('hero', 'そうだぜ。…俺たちは、お前の夢に乗っかってるだけさ。…一番のお礼は、明日、笑って勝つことだ。', { bgImg: 'bg_rooftop.svg', form: 'gold', kb: true, dur: 2400 }),
        sc('peace', '…ああ。…約束する。…笑って、勝つ。…そして、みんなで、もっとでかい祝杯をあげよう。', { bgImg: 'bg_rooftop.svg', fx: 'zoom', kb: true, dur: 2300 }),
        sc('gian', 'なあハル。…オレ、お前に出会えて、初めて「居場所」ってもんを知ったよ。…ありがとな。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2400 }),
        sc('peace', 'ガン太…。…やめろよ、また泣いちまうだろ。…でも、ありがとう。…本当に、ありがとう、みんな。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2400 }),
        sc('pepper', '相棒。私のメモリに、君との全記録が刻まれている。…どれも、削除したくないデータばかりだ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        nar('——夜空を見上げると、星の一つが、ひときわ強く輝いていた。', { bg: 'bg-legend', dur: 2000 }),
        sc('legend', '50年後の君よ。明日、己の伝説を信じよ。運命は——いつだって、その手の中にある。', { bg: 'bg-legend', form: 'ghost', kb: true, dur: 2300 }),
        sc('peace', '…ああ。…明日は、みんなで掴む。オレ一人の夢じゃない。…オレたちの、夢だ。', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2300 }),
        sc('dog', '（みんなの顔、星空に並んで見えるワン。…これが、母さんの言った「一番の財産」なんだワン）', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2400 }),
        nar('屋上の宴は、夜更けまで続いた。誰もが、明日を恐れず、ただ今この時を、笑い合った。', { bgImg: 'bg_rooftop.svg', dur: 2300 }),
        sc('alien', '地球ノ、宴。…賑ヤカ。…母星ニハ、ナイ文化。…胸ガ、温カイ。…コレモ、財産カ。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2400 }),
        sc('gorilla', 'ウホ。…明日、お前が倒れても、この腕が支える。…だから、思いきり、暴れてこい。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2300 }),
        sc('peace', 'みんな…。…こんなに大勢に背中を預けられる日が来るなんて、5万円のあの朝は、思いもしなかった。', { bgImg: 'bg_rooftop.svg', kb: true, dur: 2500 }),
        sc('peace', '勝っても負けても、オレはもう、独りじゃない。…それだけで、もう、半分勝ったようなもんだ。', { bgImg: 'bg_rooftop.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('pepper', '訂正。…君は既に、最も価値あるものを手にしている。明日勝つのは、ただの、おまけだ。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', 'はは、おまけって言うな!!　…でも、そうだな。…肩の力、抜けたよ。ありがとう、みんな。', { bgImg: 'bg_rooftop.svg', fx: 'zoom', kb: true, dur: 2200 }),
        nar('やがて、東の空が、白み始めた。長い夜が、終わろうとしていた。', { bgImg: 'bg_dawn.svg', dur: 2100 }),
        sc('peace', '…夜明けだ。…行こう。…オレたちの、決戦の日だ。', { bgImg: 'bg_dawn.svg', form: 'awaken', fx: 'zoom', kb: true, dur: 2100 }),
        t('そして、夜が明ける。', '', { bg: 'bg-thunder', dur: 1600, color: '#ff6ec7' }) ];

      // 第十一章 闇の素顔 — 宿敵の過去。神社で、かつての夢追い人の真実が明かされる。
      case 10: return [ head('〜 闇の素顔 〜', 'bg-thunder', '#ff3b3b'),
        nar('夜明け前。決戦の地へ向かう途中、ハルは古びた神社で、ひとり佇む闇のマスクと出会う。', { bgImg: 'bg_shrine.svg', dur: 2200 }),
        sc('peace', 'あんた…闇のマスク。…こんなところで、何してるんだ。', { bgImg: 'bg_shrine.svg', kb: true, dur: 1900 }),
        sc('black', '…ここは、私が最後に願掛けをした場所だ。あの日も、私は本気で夢を信じていた。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2300 }),
        sc('peace', 'あんたにも、こんな場所が…。…何があったんだ。なんで、夢を憎むようになった。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2200 }),
        nar('かつて彼もまた、わずかな金から頂点を目指した、ひとりの若者だった。', { bgImg: 'bg_shrine.svg', dur: 2000 }),
        sc('black', '私は、誰より努力した。誰より勝った。…仲間を切り捨ててでも、ただ、上だけを目指した。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2500 }),
        sc('black', '邪魔者は遠ざけ、馴れ合いを嫌い、孤高こそ強さだと信じた。…そして、あと一歩で頂に届いた。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2600 }),
        sc('black', 'だが、独りだった。…頂に立った時、隣には、誰もいなかった。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2300 }),
        sc('black', '「やったぞ」と叫んでも、返事はなかった。喜びを分かち合う者が、ひとりも、いなかったのだ。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2700 }),
        sc('black', '掴んだ栄光は、分かち合う者がなく、ただ冷たかった。…だから私は、夢そのものを呪った。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2500 }),
        sc('black', '夢は人を孤独にする。ならば、最初から夢など見るな。…私は、それを世に知らしめる者になった。', { bgImg: 'bg_shrine.svg', form: 'dark', fx: 'shake', kb: true, dur: 2600 }),
        nar('語る闇のマスクの声は、憎しみよりも、深い深い疲れに満ちていた。', { bgImg: 'bg_shrine.svg', dur: 2100 }),
        sc('black', '何度、思ったことか。…あの時、誰かと、一緒に登っていれば、と。…だが、もう、遅い。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2400 }),
        sc('black', '夢を見るな、と説いて回るたび、…本当は、自分自身に、言い聞かせていたのかもしれん。', { bgImg: 'bg_shrine.svg', form: 'dark', kb: true, dur: 2500 }),
        sc('peace', '……そうか。あんたは、勝ったのに、ひとりぼっちだったのか。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2100 }),
        sc('dog', '（かわいそうだワン…。この人、ずっと、寒い場所にいたんだワン）', { bgImg: 'bg_shrine.svg', kb: true, dur: 2100 }),
        sc('peace', '（…ゾッとした。…一歩、間違えてたら、これはオレの姿だったかもしれない。）', { bgImg: 'bg_shrine.svg', kb: true, dur: 2300 }),
        sc('peace', 'なあ。…あんたが切り捨てた仲間、本当は、隣にいたかったんじゃないか？　…あんたと一緒に。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2500 }),
        sc('black', '……っ。…黙れ。今さら、そんなこと…。', { bgImg: 'bg_shrine.svg', form: 'dark', fx: 'shake', kb: true, dur: 2000 }),
        sc('peace', '闇のマスク。明日、オレはあんたを倒す。でも、あんたを否定はしない。…あんたは、オレの未来かもしれない。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2500 }),
        sc('peace', 'だから証明する。仲間と掴んだ夢は、あったかいんだって。…あんたが見れなかった景色を、見せてやる。', { bgImg: 'bg_shrine.svg', fx: 'zoom', kb: true, dur: 2500 }),
        sc('peace', '勝って、一人で泣くんじゃない。…勝って、みんなで笑う。…それが、母さんが教えてくれた勝ち方だ。', { bgImg: 'bg_shrine.svg', form: 'awaken', kb: true, dur: 2600 }),
        sc('black', '……フン。減らず口を。…せいぜい、その甘い理想ごと、砕いてくれよう。', { bgImg: 'bg_shrine.svg', form: 'dark', fx: 'shake', kb: true, dur: 2100 }),
        nar('だが、立ち去る闇のマスクの背中は、どこか、ためらいを帯びていた。', { bgImg: 'bg_shrine.svg', dur: 2100 }),
        sc('dog', '（あの人の心の奥、ほんの少しだけ、灯りが揺れた気がするワン。…まだ、間に合うかもしれないワン）', { bgImg: 'bg_shrine.svg', kb: true, dur: 2500 }),
        nar('ハルは神社の鈴を鳴らし、静かに手を合わせた。', { bgImg: 'bg_shrine.svg', dur: 1900 }),
        sc('peace', '（神様。…勝たせてくれ、とは言わない。…ただ、最後まで、笑って打てますように。）', { bgImg: 'bg_shrine.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('peace', '（そして…あの人にも。…いつか、隣に誰かがいる温もりを、知れますように。）', { bgImg: 'bg_shrine.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('pepper', '相棒。…敵の幸せまで祈るとは。…非合理。…だが、それが君の強さの源だと、私は理解している。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', 'あいつはさ、敵だけど、敵じゃない。…道を間違えただけの、オレと同じ夢追い人なんだ。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2400 }),
        sc('dog', '（ハルは、勝つことより、誰かが笑うことを願うワン。…だから、みんなが付いてくるんだワン）', { bgImg: 'bg_shrine.svg', kb: true, dur: 2400 }),
        sc('pepper', '相棒。…観測した。…去り際の闇のマスク、振り返って、君の仲間たちを、長く見ていた。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('peace', '…そうか。…あいつ、本当は、ずっと羨ましかったのかもな。…誰かと、繋がることが。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2300 }),
        sc('peace', 'だったら、なおさら、勝って見せなきゃな。…夢は、ひとりで見るより、みんなで見た方が、美しいって。', { bgImg: 'bg_shrine.svg', form: 'awaken', kb: true, dur: 2500 }),
        sc('peace', 'さあ。…運命の場所へ、行こう。…二つの夢の、決着をつけに。', { bgImg: 'bg_shrine.svg', fx: 'zoom', kb: true, dur: 2100 }),
        t('交わる、二つの夢の果て。', '', { bg: 'bg-thunder', fx: 'flash', dur: 1700, color: '#ff3b3b' }) ];

      default: return [ head('〜 闇のマスク、降臨 〜', 'bg-thunder', '#ff3b3b'),
        nar('そして、運命の朝。決戦の舞台に、二人の夢追い人が立つ。', { bgImg: 'bg_arena.svg', dur: 2000 }),
        sc('black', 'ここまで来たか、小僧。だが——伝説への扉は、この私が閉ざす！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'burst', se: 'cutin', kb: true, dur: 2100 }),
        sc('peace', '（こいつが…ラスボス。全身が震える。膝も笑ってる。…でも——）', { bg: 'bg-thunder', fx: 'shake', dur: 1800 }),
        nar('闇のマスク。その正体は、かつて夢に破れ、夢を憎むようになった、もう一人の夢追い人。', { bgImg: 'bg_hell.svg', dur: 2200 }),
        sc('black', '夢など叶わぬ。私がそうだった。だから、お前の夢も——壊させてもらう！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2100 }),
        sc('peace', 'あんたも、夢を見てたのか。…だったら、なおさら退けない。', { bg: 'bg-thunder', kb: true, dur: 1900 }),
        nar('一進一退の死闘。闇の圧が、ハルの心を、何度も飲み込もうとする。', { bgImg: 'bg_arena.svg', dur: 2000 }),
        sc('black', 'どうした！　その笑顔も、所詮は虚勢よ。…独りで震えていろ、私のように！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2300 }),
        sc('peace', '（重い…！　心が、闇に塗り潰されそうだ…！　…でも、オレは、一人じゃ——）', { bg: 'bg-thunder', fx: 'shake', kb: true, dur: 2200 }),
        sc('dog', '（ハル！　下を見てワン！　モモ、ここにいるワン！）', { bgImg: 'bg_arena.svg', kb: true, dur: 1800 }),
        sc('gian', 'おい大将、後ろにオレがいるの忘れんなよ！　背中はがら空きにさせねえ！', { bgImg: 'bg_arena.svg', kb: true, dur: 2000 }),
        sc('gorilla', 'ウホ。…この豪腕、お前の盾になろう。…存分に、前を向け。', { bgImg: 'bg_arena.svg', kb: true, dur: 2000 }),
        sc('hero', '言ったろ？　全員、お前の背中についてるってな。…さあ、顔を上げろ、夢追い人！', { bgImg: 'bg_arena.svg', form: 'gold', kb: true, dur: 2300 }),
        sc('pepper', '相棒。…勝率は、相変わらず低い。だが、私のデータにない「奇跡」を、君は何度も起こしてきた。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', '（…そうだ。…一人じゃ、震える膝も。…みんなが支えてくれれば、こんなにも、強く立てる。）', { bg: 'bg-thunder', form: 'awaken', kb: true, dur: 2400 }),
        sc('peace', 'あんたが憎んだ「夢」は、独りで見るものだった。…でも、オレの夢は、みんなで見る夢だ！', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2400 }),
        sc('black', '…みんなで、見る夢、だと…。…そんなもの、私は、知らない…！　知りたく、なかった…！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2500 }),
        sc('dog', '（ハルの体が、光ってるワン。…仲間の想いが、全部、ハルに集まってるワン！）', { bgImg: 'bg_arena.svg', fx: 'shake', kb: true, dur: 2100 }),
        sc('peace', '神社で言ったよな。あんたは、勝ったのにひとりだった。…オレは、違う。後ろを見てみろ！', { bgImg: 'bg_arena.svg', fx: 'zoom', kb: true, dur: 2200 }),
        sc('black', 'なに…？　貴様の背後に、あの数の影…仲間、だと…。馬鹿な、これが…温もり、なのか…！', { bgImg: 'bg_arena.svg', form: 'dark', fx: 'shake', kb: true, dur: 2300 }),
        sc('black', '（…ああ。…私が、ずっと欲しくて、自分で捨ててしまったもの。…眩しい。…眩しすぎる…！）', { bgImg: 'bg_arena.svg', form: 'dark', kb: true, dur: 2500 }),
        sc('peace', '——もう怖くない。仲間がいる。夢がある。母さんの言葉がある！', { bg: 'bg-aurora', fx: 'zoom', kb: true, dur: 1900 }),
        sc('peace', '笑ってる人の周りには、人が集まる。…それが一番の財産。…あんたに、それを見せてやる！', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2400 }),
        sc('dog', '（行け、ハル！　モモたちの想い、全部、その一玉に込めて——！）', { bg: 'bg-aurora', kb: true, dur: 1900 }),
        sc('alien', '地球ノ笑顔ノ技術、今、見セテヤレ！　…ワレモ、信ジテイル！', { bgImg: 'bg_arena.svg', kb: true, dur: 2000 }),
        sc('black', 'ならば来い。貴様の覚悟、この闇で塗り潰してくれる！…だが——どうか、私を、超えてみせろ！', { bgImg: 'bg_hell.svg', form: 'dark', fx: 'shake', kb: true, dur: 2400 }),
        nar('それは、もはや戦いではなかった。…孤独だった一人の魂が、最後に縋った、祈りだった。', { bgImg: 'bg_arena.svg', dur: 2300 }),
        sc('peace', 'あんたを倒して、見せてやる。…仲間と掴んだ夢は、こんなに、あったかいんだって。', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2400 }),
        sc('peace', 'あんたが、ずっと見たかった景色を。…独りじゃ、辿り着けなかったその先を。…オレが、見せる！', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2500 }),
        sc('dog', '（みんなの想い、ハルの一玉に、全部こもってるワン。…モモの命も、母さんの言葉も、全部ワン！）', { bgImg: 'bg_arena.svg', kb: true, dur: 2500 }),
        sc('pepper', '相棒。…最後の計算結果を伝える。…君の勝率、算出不能。理由——君は、もう、数字の外にいる。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2500 }),
        sc('gian', '行け、大将！　オレたちが、ついてる！', { bgImg: 'bg_arena.svg', fx: 'shake', kb: true, dur: 1700 }),
        sc('hero', '夢を、見せてやれ！　…あいつが、見れなかった景色を！', { bgImg: 'bg_arena.svg', form: 'gold', fx: 'zoom', kb: true, dur: 2000 }),
        sc('peace', '行くぞ、みんな！　…この一玉に、オレたちの全部を込めて——！！', { bg: 'bg-thunder', fx: 'speed', shock: true, kb: true, dur: 2100 }),
        sc('black', '（…眩しい。…ああ、これが、私が捨ててしまった、温もりか。…見せてくれ。…私の、見れなかった景色を！）', { bgImg: 'bg_arena.svg', form: 'dark', kb: true, dur: 2700 }),
        sc('peace', '闇のマスク——！　お前を超えて、オレは…オレたちは、伝説になる！！', { bg: 'bg-thunder', fx: 'flash', shock: true, kb: true, dur: 2000 }),
        t('運命の、最終決戦——！！', '', { bg: 'bg-aurora', fx: 'burst', shock: true, dur: 1900, color: '#ffd23b' }) ];
    }
  }

  // ===== 裏ストーリー（FIRE=1億 以降の大富豪サーガ。純資産 数億〜100兆を持つ前提）=====
  // 資産規模に応じて世界が変わっていく後日譚。各章2-3分級へ拡張予定の土台。
  function uraChapter(j) {
    const T = CHAPTERS.slice(MAIN_CH);
    const head = (sub, bg, col) => t(T[Math.min(j, T.length - 1)], sub, { bg: bg || 'bg-aurora', color: col || '#ffd23b', dur: 2000, fx: 'flash', shock: true });
    switch (j) {
      case 0: return [ head('〜 5億の使い道 〜', 'bg-aurora'),
        nar('FIRE達成から半年。ハルの純資産は、5億を超えていた。', { bgImg: 'bg_skytree.jpg', dur: 2200 }),
        sc('peace', '5億か…。5万円で震えてた男が、よく言うよな。…でも、金は目的じゃない。', { bgImg: 'bg_skytree.jpg', kb: true, dur: 2300 }),
        sc('peace', '覚えてるか、みんな。誰も凍えさせない場所を作る——その約束、今日から動かす。', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2400 }),
        sc('pepper', '試算完了。土地・建物・10年分の運営費。…5億で「楽園」の設計図が引ける。ピピッ。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('dog', '（ハルの夢が、ただの夢じゃなくなる日が来たワン…！）', { bg: 'bg-aurora', kb: true, dur: 2000 }),
        t('楽園の、設計図。', '〜 物語は、まだ続く 〜', { bg: 'bg-legend', dur: 1900, color: '#ff6ec7' }) ];
      case 1: return [ head('〜 それぞれの道 〜', 'bg-gold'),
        nar('総資産10億。ハルの仲間たちにも、それぞれの春が訪れていた。', { bgImg: 'bg_park.svg', dur: 2100 }),
        sc('gian', 'オレぁ子供向けの道場を開いてな。「奪う」んじゃなく「守る」強さを教えてんだ。', { bgImg: 'bg_park.svg', kb: true, dur: 2300 }),
        sc('hero', '俺は財団を作った。夢を諦めかけた奴に、そっと手を貸す。…お前の背中を見て、決めたよ。', { bg: 'bg-gold', form: 'gold', kb: true, dur: 2400 }),
        sc('peace', 'みんな…それぞれの場所で、誰かを照らしてるんだな。', { bgImg: 'bg_park.svg', kb: true, dur: 2000 }),
        sc('dog', '（あの肉まん一個を分け合った夜が、こんな未来に繋がったワン）', { bg: 'bg-aurora', kb: true, dur: 2100 }),
        t('夢は、伝播する。', '', { bg: 'bg-aurora', fx: 'flash', dur: 1800, color: '#ffd23b' }) ];
      case 2: return [ head('〜 新たな刺客 〜', 'bg-fire', '#ff3b3b'),
        nar('資産50億。富は、新たな敵を呼び寄せる。', { bgImg: 'bg_alley.svg', dur: 2000 }),
        sc('general', 'フッ、成り上がりの慈善家気取りか。…私が買収で、貴様の楽園を更地にしてやろう。', { bgImg: 'bg_alley.svg', form: 'dark', fx: 'shake', kb: true, dur: 2400 }),
        sc('peace', '金で人の居場所を潰す…か。あんたは、昔のオレが一番なりたくなかった姿だ。', { bg: 'bg-thunder', kb: true, dur: 2300 }),
        sc('pepper', '相手の資産、推定80億。…数字では負けている。だが相棒、君はいつも数字を超える。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2200 }),
        sc('peace', '受けて立つ。今度は玉じゃない、覚悟と覚悟の勝負だ！', { bg: 'bg-speed', fx: 'burst', shock: true, kb: true, dur: 2000 }),
        t('富の、戦争。', '', { bg: 'bg-thunder', dur: 1800, color: '#ff3b3b' }) ];
      case 3: return [ head('〜 世界が動く 〜', 'bg-legend'),
        nar('資産100億。ハルの一挙手一投足が、市場を揺らすようになっていた。', { bgImg: 'bg_skytree.jpg', dur: 2200 }),
        sc('pepper', '速報。君が楽園構想を発表しただけで、関連株が急騰。…世界が、君を見ている。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2300 }),
        sc('peace', '100億…。数字が大きすぎて、もう実感も湧かないな。', { bgImg: 'bg_skytree.jpg', kb: true, dur: 2000 }),
        sc('legend', '未来の君よ。力を持つほど、問われるのは「何のために使うか」だ。忘れるな。', { bg: 'bg-legend', form: 'ghost', kb: true, dur: 2400 }),
        sc('peace', '分かってる。母さんの言葉も、モモとの約束も…全部、ここにある。', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2200 }),
        t('百億の、責任。', '', { bg: 'bg-legend', dur: 1800, color: '#ff6ec7' }) ];
      case 4: return [ head('〜 富の孤独 〜', 'bg-space', '#9d86c4'),
        nar('資産500億。ふと、ハルは足を止めた。あまりに、遠くまで来すぎた。', { bgImg: 'bg_skytree.jpg', dur: 2200 }),
        sc('peace', '…なあモモ。オレ、いつのまにか、雲の上にいるみたいだ。…ちょっと、こわいよ。', { bgImg: 'bg_skytree.jpg', kb: true, dur: 2400 }),
        sc('peace', '（闇のマスクが言ってた。「掴んだ栄光は、分かち合う者がなく、ただ冷たかった」って…）', { bg: 'bg-space', kb: true, dur: 2500 }),
        sc('dog', '（ハル。下を見てごらんワン。モモも、ペッパーも、みんな、ちゃんと隣にいるワン）', { bg: 'bg-aurora', kb: true, dur: 2300 }),
        sc('peace', '…そうだな。オレは、独りじゃない。あいつとは、違う。…ありがとう、モモ。', { bg: 'bg-aurora', form: 'awaken', kb: true, dur: 2200 }),
        t('高みの、孤独と温もり。', '', { bg: 'bg-aurora', fx: 'flash', dur: 1800, color: '#ffd23b' }) ];
      case 5: return [ head('〜 約束の再会 〜', 'bg-legend', '#ff6ec7'),
        nar('資産1兆。ある日、楽園の片隅に、見覚えのある影が立っていた。', { bgImg: 'bg_shrine.svg', dur: 2200 }),
        sc('black', '…久しいな、小僧。いや——ハル。見事に、約束を果たしたようだ。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2300 }),
        sc('peace', '闇のマスク…！　あんた、生きてたのか。…その顔、ずいぶん穏やかになったな。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2200 }),
        sc('black', 'お前が見せてくれた「温もり」が、忘れられなくてな。…私も、やり直すことにした。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2400 }),
        sc('peace', '……来いよ。この楽園、まだ席は空いてる。一緒に、誰かを照らそうぜ。', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2300 }),
        t('宿敵は、戦友へ。', '', { bg: 'bg-aurora', fx: 'burst', shock: true, dur: 1900, color: '#ffd23b' }) ];
      case 6: return [ head('〜 経済の支配者 〜', 'bg-gold'),
        nar('資産10兆。もはやハルの名は、一国の経済を動かす規模になっていた。', { bgImg: 'bg_skytree.jpg', dur: 2200 }),
        sc('pepper', '君の財団の支援先、累計100万人を突破。…「凍える人をなくす」が、現実になりつつある。', { bgImg: 'bg_cosmos.svg', kb: true, dur: 2400 }),
        sc('peace', '10兆…。でも数えてるのは金額じゃない。救えた「笑顔の数」だ。', { bg: 'bg-gold', form: 'awaken', kb: true, dur: 2300 }),
        sc('hero', '相棒、お前はもう、ただの大富豪じゃない。…時代そのものだ。', { bg: 'bg-gold', form: 'gold', kb: true, dur: 2100 }),
        sc('dog', '（母さんが言ってた「一番の財産」…ハルは、世界中に増やしたワン）', { bg: 'bg-aurora', kb: true, dur: 2200 }),
        t('十兆の、笑顔。', '', { bg: 'bg-legend', dur: 1800, color: '#ff6ec7' }) ];
      default: return [ head('〜 世界の頂点 〜', 'bg-legend', '#ff6ec7'),
        t('🌌 100兆円 🌌', '〜 ハルの物語、その果てへ 〜', { bg: 'bg-aurora', fx: 'flash', shock: true, dur: 2000, color: '#ff6ec7' }),
        nar('純資産100兆。人類史上、誰も立ったことのない場所に、ひとりの男が立っていた。', { bgImg: 'bg_skytree.jpg', dur: 2400 }),
        sc('legend', '100兆。もはや国家を超えた。…君は、歴史そのものだ。', { bg: 'bg-legend', form: 'ghost', fx: 'burst', kb: true, dur: 2300 }),
        sc('peace', 'あの5万円のオレが…世界のてっぺんに。…でもさ、一番の宝物は、最初から手の中にあったんだ。', { bg: 'bg-aurora', form: 'awaken', fx: 'zoom', kb: true, dur: 2600 }),
        sc('dog', '（モモ、誇らしいワン。…ずっと、君のそばにいられて、幸せだったワン）', { bg: 'bg-aurora', kb: true, dur: 2300 }),
        sc('black', 'フッ…見事だ、ハル。お前こそ、真の伝説だ。', { bgImg: 'bg_shrine.svg', kb: true, dur: 2000 }),
        t('THE TRUE LEGEND', '〜 笑って生きた男の、伝説 〜 完', { bg: 'bg-legend', fx: 'burst', shock: true, dur: 2700, color: '#ff6ec7' }) ];
    }
  }

  window.STORY = { CHARS: C, opening, battle, legend, awaken, victory, ending, yokoku, normalReach,
                   chapter, chapterTitle, chapterCount, chaptersUnlockedBy, unlockAsset };
})();
