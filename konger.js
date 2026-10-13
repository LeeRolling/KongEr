/* 空耳生成器 —— 中文 -> 英文谐音（"funny mud go pee" 那种）
   依赖 pinyin-data.js（汉字 -> 无声调拼音） */
(function () {
  'use strict';

  var SYL_RAW = [
    "a:ah|ai:eye,I|an:on,un|ang:ong|ao:ow",
    "ba:bah,bub|bai:bye,buy|ban:bun,barn|bang:bong|bao:bow|bei:bay,bae|ben:bun|beng:bung|bi:bee|bian:bee-en|biao:bee-ow|bie:bee-eh|bin:bean|bing:bing|bo:bore,boh|bu:boo",
    "ca:tsah|cai:tsigh|can:tsun|cang:tsong|cao:tsow|ce:tsuh|cen:tsun|ceng:tsung|cha:chah|chai:chigh|chan:chun|chang:chong|chao:chow|che:chuh|chen:chun|cheng:chung|chi:cheese,chir|chong:chong|chou:cho|chu:chew|chuan:chwan|chuang:chwong|chui:chway|chun:chwun|chuo:chwaw|ci:tsuh|cong:tsong|cou:tso|cu:tsoo|cuan:tswan|cui:tsway|cun:tswun|cuo:tswaw",
    "da:duh,dah|dai:die,dye|dan:dun|dang:dong|dao:dow|de:duh|dei:day|deng:dung|di:dee|dian:dee-en|diao:dee-ow|die:dee-eh|ding:ding|diu:dee-oh|dong:dong|dou:dough,doe|du:doo|duan:dwan|dui:dway|dun:dwun|duo:dwaw",
    "e:uh|ei:ay|en:un|eng:ung|er:are,err",
    "fa:fah|fan:fun|fang:funny,fong|fei:fay|fen:fun|feng:fung|fo:foh|fou:foe|fu:foo",
    "ga:gah|gai:guy|gan:gun|gang:gong|gao:gow|ge:guh|gei:gay|gen:gun|geng:gung|gong:gong|gou:go|gu:goo|gua:gwah|guai:gwhy|guan:gwan|guang:gwong|gui:gway|gun:gwun|guo:gwaw,guar",
    "ha:hah|hai:high,hi|han:hun|hang:hong|hao:how|he:her,huh|hei:hay|hen:hun|heng:hung|hong:hong|hou:hoe|hu:who|hua:hwah|huai:why|huan:hwan|huang:hwong|hui:way,hway|hun:hwun|huo:hwaw,wore",
    "ji:gee|jia:jah,jar|jian:jee-en|jiang:jee-ong|jiao:jee-ow|jie:jee-eh|jin:jean|jing:jing|jiong:jee-ong|jiu:joe,juice|ju:jew|juan:jwen|jue:jweh|jun:jwin",
    "ka:kah|kai:kite|kan:kun|kang:kong|kao:cow|ke:kuh|ken:ken|keng:kung|kong:kong|kou:ko|ku:koo|kua:kwah|kuai:kwhy|kuan:kwan|kuang:kwong|kui:kway|kun:kwun|kuo:kwaw",
    "la:lah|lai:lie,lye|lan:lun|lang:long|lao:lao,loud|le:luh|lei:lay|leng:lung|li:lee|lia:lee-ah|lian:lee-en|liang:lee-ong|liao:lee-ow|lie:lee-eh|lin:lin|ling:ling|liu:leo|lo:loh|long:long|lou:low|lu:loo|luan:lwan|lun:lwun|luo:lwaw|lv:lew|lve:lweh",
    "ma:mud,ma|mai:my|man:mun|mang:mong|mao:mow|me:muh|mei:may|men:men,mun|meng:mung|mi:me|mian:me-en|miao:me-ow|mie:me-eh|min:min|ming:ming|miu:me-oh|mo:more,moh|mou:moe|mu:moo",
    "na:nah|nai:nigh|nan:nun|nang:nong|nao:now|ne:nuh|nei:nay|nen:nun|neng:nung|ni:need,knee|nian:nee-en|niang:nee-ong|niao:nee-ow|nie:nee-eh|nin:neen|ning:ning|niu:new|nong:nong|nou:no|nu:noo|nuan:nwan|nuo:nwaw|nv:new|nve:nweh",
    "o:oh|ou:oh,owe",
    "pa:pah|pai:pie|pan:pun|pang:pong|pao:pow|pei:pay|pen:pen|peng:pung|pi:pee|pian:pee-en|piao:pee-ow|pie:pee-eh|pin:pin|ping:ping|po:pour,poh|pou:po|pu:poo",
    "qi:chee|qia:chah|qian:chee-en|qiang:chee-ong|qiao:chee-ow|qie:chee-eh|qin:chin|qing:ching|qiong:chee-ong|qiu:chew|qu:chew|quan:chwen|que:chweh|qun:chwin",
    "ran:run|rang:rong|rao:row|re:ruh|ren:wren,run|reng:rung|ri:ree|rong:rong|rou:row|ru:roo|ruan:rwan|rui:ray|run:rwun|ruo:rwaw",
    "sa:sah|sai:sigh|san:sun|sang:song|sao:sow|se:suh|sen:sen|seng:sung|sha:sad,shah|shai:shy|shan:shun|shang:shong|shao:show|she:shuh|shei:shay|shen:shen|sheng:shung|shi:sure,she|shou:show,sho|shu:shoe,shoo|shua:shwah|shuai:shwye|shuan:shwan|shuang:shwong|shui:shway|shun:shwun|shuo:shwaw,shwar|si:sir,see|song:song|sou:so|su:soo|suan:swan|sui:sway|sun:swun|suo:swaw",
    "ta:tar,tah|tai:tie|tan:tun|tang:tong|tao:tow|te:tuh|teng:tung|ti:tea|tian:tee-en|tiao:tee-ow|tie:tee-eh|ting:ting|tong:tong|tou:toe|tu:too|tuan:twan|tui:tway|tun:twun|tuo:twaw",
    "wa:wah|wai:why|wan:wan|wang:wong|wei:way|wen:when|weng:wung|wo:wall,war|wu:woo",
    "xi:she|xia:shah|xian:shee-en|xiang:shee-ong|xiao:show|xie:shee-eh|xin:shin|xing:shing|xiong:shee-ong|xiu:she-oh|xu:shoo|xuan:shwen|xue:shweh|xun:shwin",
    "ya:yah|yan:yen|yang:young|yao:yo|ye:yeh|yi:ee|yin:in|ying:ying|yo:yoh|yong:yong|you:yo|yu:yoo|yuan:ywen|yue:yweh|yun:ywin",
    "za:dzah|zai:dzai|zan:dzun|zang:dzong|zao:dzow|ze:dzuh|zei:dzay|zen:dzun|zeng:dzung|zha:jah|zhai:jai|zhan:jun|zhang:jong|zhao:jow|zhe:juh|zhei:jay|zhen:jen|zheng:jung|zhi:juh|zhong:jong|zhou:joe|zhu:jew,drew|zhua:jwah|zhuai:jwai|zhuan:jwan|zhuang:jwong|zhui:jway|zhun:jwun|zhuo:jwaw|zi:dzuh|zong:dzong|zou:dzoe|zu:dzoo|zuan:dzwan|zui:dzway|zun:dzwun|zuo:dzwaw"
  ].join("|");

  var SYL = {};
  SYL_RAW.split("|").forEach(function (item) {
    var i = item.indexOf(":");
    if (i < 0) { return; }
    SYL[item.slice(0, i)] = item.slice(i + 1).split(",");
  });

  var PHRASES = {
    "放你妈的狗屁": "funny mud go pee",
    "你就是傻逼": "need juice sad bee",
    "你是猪吗": "knee she drew mud",
    "关你屁事": "gwan knee pee's",
    "你有病吧": "knee yo bing bah",
    "我爱你": "wall eye knee",
    "兄弟你太菜了": "shiong dee knee tie tsigh luh",
    "多喝热水": "dwaw her ruh shway",
    "呵呵呵呵呵呵": "he he he he he he",
    "呵呵呵呵呵": "he he he he he",
    "对不起": "dway boo chee",
    "谢谢你": "shee-eh shee-eh knee",
    "牛逼": "new bee",
    "卧槽": "war tsow",
    "笑死我了": "show sir war luh"
  };

  var EXTRA_RAW = "de:duh,the|shi:sure,she,'s|bu:boo,buh|you:yo,yoh|zai:dzai,sigh|le:luh,ler|wo:wall,war,wore|ni:need,knee,nee|ta:tar,tah|ha:hah,ha|hen:hun,hen|zhen:jen,jun|shuo:shwaw,shwar|ge:guh,gah|ma:mud,ma,mah|he:her,huh|ji:gee,jee|hao:how|ren:wren,run|dao:dow,dau|jiao:jee-ow,jow|xiao:show,shee-ow|zhe:juh,jer|zhi:juh,jer|chi:cheese,chir|shi2:x|guo:gwaw,guar|hui:way,hway|hui2:x|kuai:kwhy,kwai|shui:shway,shwey|tai:tie,tye|cai:tsigh,tsigh|dui:dway,dwee|shen:shen,shun|sheng:shung,shung|cheng:chung,chung|zhu:jew,drew|chu:chew,choo";
  EXTRA_RAW.split("|").forEach(function (item) {
    var i = item.indexOf(":");
    if (i < 0) { return; }
    var k = item.slice(0, i), add = item.slice(i + 1).split(",");
    if (k.slice(-1) === "2") { return; }
    if (!SYL[k]) { return; }
    add.forEach(function (w) { if (SYL[k].indexOf(w) < 0) { SYL[k].push(w); } });
  });

  var RULES = [
    [/^zh/, "j"], [/^ch/, "ch"], [/^sh/, "sh"], [/^z/, "dz"], [/^c/, "ts"],
    [/^q/, "ch"], [/^x/, "sh"], [/^j/, "j"], [/^r/, "r"],
    [/iang$/, "ee-ong"], [/uang$/, "wong"], [/ang$/, "ong"], [/eng$/, "ung"],
    [/ing$/, "ing"], [/ong$/, "ong"], [/ian$/, "ee-en"], [/uan$/, "wan"],
    [/iao$/, "ee-ow"], [/uai$/, "why"], [/ai$/, "eye"], [/ei$/, "ay"],
    [/ao$/, "ow"], [/ou$/, "oh"], [/an$/, "un"], [/en$/, "un"], [/in$/, "in"],
    [/un$/, "wun"], [/er$/, "are"], [/iu$/, "ee-oh"], [/ui$/, "way"],
    [/uo$/, "waw"], [/ua$/, "wah"], [/ue$/, "weh"], [/v/, "ew"],
    [/u$/, "oo"], [/i$/, "ee"], [/o$/, "oh"], [/e$/, "uh"], [/a$/, "ah"]
  ];

  function fallback(py) {
    var o = py;
    for (var i = 0; i < RULES.length; i++) { o = o.replace(RULES[i][0], RULES[i][1]); }
    return o;
  }

  function isPunct(ch) {
    var c = ch.charCodeAt(0);
    if (c >= 0x20 && c <= 0x2f) { return true; }
    if (c >= 0x3a && c <= 0x40) { return true; }
    if (c >= 0x5b && c <= 0x60) { return true; }
    if (c >= 0x7b && c <= 0x7e) { return true; }
    if (c >= 0x2000 && c <= 0x206f) { return true; }
    if (c >= 0x3000 && c <= 0x303f) { return true; }
    if (c >= 0xff01 && c <= 0xff65) { return true; }
    return false;
  }

  function makeRng(seed) {
    var s = ((seed || 1) >>> 0) ^ 0x9e3779b9;
    s = (s * 1664525 + 1013904223) >>> 0;
    s = (s * 1664525 + 1013904223) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function charMap() {
    return (typeof window !== "undefined" && window.CHAR2PINYIN) ? window.CHAR2PINYIN : {};
  }

  function convert(text, seed) {
    var C2P = charMap();
    var t = String(text).trim();
    var rng = makeRng(seed === undefined ? 1 : seed);
    var detail = [];

    if (PHRASES[t] && (seed === undefined || seed === 1)) {
      PHRASES[t].split(" ").forEach(function (w) { detail.push({ ch: "", py: "", en: w }); });
      return { text: PHRASES[t], detail: detail, exact: true };
    }

    var words = [];
    var prevWord = false;
    for (var i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      if (isPunct(ch)) { words.push(ch); detail.push({ ch: ch, py: "", en: ch }); prevWord = false; continue; }
      var py = C2P[ch];
      if (!py) { words.push(ch); detail.push({ ch: ch, py: "", en: ch }); prevWord = false; continue; }
      var list = SYL[py] || [fallback(py)];
      if (!prevWord) {
        var clipped = [];
        for (var q = 0; q < list.length; q++) { if (list[q].charAt(0) !== "'") { clipped.push(list[q]); } }
        if (clipped.length) { list = clipped; }
      }
      var w = list[Math.floor(rng() * list.length) % list.length];
      words.push(w);
      detail.push({ ch: ch, py: py, en: w });
      prevWord = true;
    }

    var out = "";
    for (var j = 0; j < words.length; j++) {
      var w2 = words[j];
      if (j > 0 && !isPunct(w2) && !isPunct(words[j - 1]) && w2.charAt(0) !== "'") { out += " "; }
      out += w2;
    }
    out = out.replace(/\s+/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
    return { text: out, detail: detail, exact: false };
  }

  var api = {
    convert: convert,
    exactPhrases: Object.keys(PHRASES),
    syllableTable: SYL,
    stats: function () { return { syllables: Object.keys(SYL).length, chars: Object.keys(charMap()).length }; }
  };
  if (typeof window !== "undefined") { window.Konger = api; }
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
})();
