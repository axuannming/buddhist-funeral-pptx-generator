// Sources for [Presenter]'s part of the SSHD2056 Buddhist funeral deck (A 經書 version).
// Slide text and layout live in build.js; speaker notes are read from script/講稿.md.

const DATE = "2026年11月2日瀏覽";

const URL = {
  ddmFuneral: "https://ddmtv.ddm.org.tw/Upload/UserFilesPath/file/201612/20161203.pdf",
  ddmChaodu: "https://ddmtv.ddm.org.tw/Upload/UserFilesPath/file/201612/20161205.pdf",
  ddmFoshi: "https://ddmtv.ddm.org.tw/Upload/UserFilesPath/file/201711/20171103.pdf",
  guodong: "https://buddhism.lib.ntu.edu.tw/FULLTEXT/JR-BJ012/bj012218898.pdf",
  lordWilson: "https://www.lordwilson-heritagetrust.org.hk/filemanager/archive/project_doc/27-9-84/3.pdf",
  sphc: "https://hospicecare.org.hk/uploadedFile/Memorial_donation_booklet.pdf",
  dizang: "https://cbetaonline.dila.edu.tw/zh/T0412_002",
  jingang: "https://cbetaonline.dila.edu.tw/zh/T0235_001",
  fahua: "https://cbetaonline.dila.edu.tw/zh/T0262_003",
};

// Short form used in slide footnotes; the full entry is in BIB (P16).
const SHORT = {
  W01: "聖嚴法師〈佛教徒應該如何舉行喪葬儀式？〉",
  W02: "聖嚴法師〈佛教相信超度亡靈的功用嗎？〉",
  W03: "法鼓山〈如何做佛事〉",
  W04: "釋果東〈臨終儀軌─佛化奠祭禮儀〉",
  W05: "彭淑敏、陳鮮叡、陳顯揚《逝者善終、生者善別》",
  W06: "善寧會〈喪禮悼念捐款—租用捐款箱〉",
  W07: "實叉難陀譯《地藏菩薩本願經》卷下〈利益存亡品第七〉",
  W08: "鳩摩羅什譯《金剛般若波羅蜜經》",
  W09: "鳩摩羅什譯《妙法蓮華經》卷3〈化城喻品第七〉",
};

// P16 bibliography, grouped as on the slide.
const BIB = [
  { head: "課堂講義", items: [
    ["L7", "香港專上學院：〈佛教：人性論與人倫觀〉，《SSHD2056 Lecture 7》講義。原頁截圖見 E01–E06。"],
    ["L8", "香港專上學院：〈佛教：人生意義觀與死亡意義觀〉，《SSHD2056 Lecture 8》講義。原頁截圖見 E07–E14。"],
    ["", "香港專上學院：《SSHD2056 小組報告指引》。"],
  ] },
  { head: "佛經", items: [
    ["W07", `實叉難陀譯：《地藏菩薩本願經》卷下〈利益存亡品第七〉，CBETA，T13, no. 412, p. 784b10，${URL.dizang}。`],
    ["W08", `鳩摩羅什譯：《金剛般若波羅蜜經》，CBETA，T08, no. 235, p. 749a12–13，${URL.jingang}。`],
    ["W09", `鳩摩羅什譯：《妙法蓮華經》卷3〈化城喻品第七〉，CBETA，T09, no. 262, p. 24c21–22，${URL.fahua}。`],
  ] },
  { head: "論文・研究報告", items: [
    ["W04", `釋果東：〈臨終儀軌─佛化奠祭禮儀〉，《第四屆佛法與臨終關懷研討會─死亡，您準備好了嗎？》，頁39–48，臺灣大學佛學數位圖書館，${URL.guodong}。`],
    ["W05", `彭淑敏、陳鮮叡、陳顯揚：《逝者善終、生者善別：圖解香港華人喪葬禮俗研究報告》（香港：衞奕信勳爵文物信託資助、香港樹仁大學，2018年），${URL.lordWilson}。`],
  ] },
  { head: "網上資料", items: [
    ["W01", `聖嚴法師：〈佛教徒應該如何舉行喪葬儀式？〉，法鼓山網站，${URL.ddmFuneral}。`],
    ["W02", `聖嚴法師：〈佛教相信超度亡靈的功用嗎？〉，法鼓山網站，${URL.ddmChaodu}。`],
    ["W03", `法鼓山：〈如何做佛事〉，摘自《法鼓山的方向》（法鼓文化），法鼓山網站，${URL.ddmFoshi}。`],
    ["W06", `善寧會：〈喪禮悼念捐款—租用捐款箱〉，《悼念捐款計劃》小冊子，善寧會網站，${URL.sphc}。`],
  ] },
];

// Lecture evidence pages: highlighted renders in build/ev/<lec>_pNN.png (scripts/render_ev.py).
const EV = {
  E01: { lec: "L7", topic: "切入框架；學習重點", pages: [[3, "如何切入思想家複雜的理論"], [4, "學習重點：苦、緣起性空、戒定慧"]] },
  E02: { lec: "L7", topic: "三法印；因與緣", pages: [[10, "三法印：無常、無我、涅槃寂靜"], [11, "十二因緣：主要條件為因，輔助條件為緣"]] },
  E03: { lec: "L7", topic: "八苦與我執；緣起性空", pages: [[13, "八苦；苦←執着←我執"], [18, "緣起、性空"]] },
  E04: { lec: "L7", topic: "戒定慧；五戒", pages: [[37, "戒定慧：放下我執、自利心"], [39, "五戒：不殺生"]] },
  E05: { lec: "L7", topic: "般若；慈悲", pages: [[41, "般若：不執著世間一切法"], [45, "慈悲；儒家差等之愛與眾生平等"]] },
  E06: { lec: "L7", topic: "報眾生恩；菩薩道", pages: [[46, "報眾生恩；菩薩道；自利與利他結合"]] },
  E07: { lec: "L8", topic: "各家生死觀；目睹死亡而出家", pages: [[4, "各家各派的生死觀"], [5, "佛祖目睹死亡而出家"]] },
  E08: { lec: "L8", topic: "心識離體；中陰", pages: [[12, "外呼吸中斷，其後心識離體"], [13, "中有／中陰"]] },
  E09: { lec: "L8", topic: "投生六道的因素", pages: [[17, "投生六道主因"], [18, "投生的決定性因素：隨念等"]] },
  E10: { lec: "L8", topic: "業力輪迴；一滴水", pages: [[21, "輪迴中流轉的是業力"], [22, "一滴水與業力大海"]] },
  E11: { lec: "L8", topic: "只留下業；無常", pages: [[24, "死後唯一留存的只有業"], [26, "無常＝壞滅"]] },
  E12: { lec: "L8", topic: "簡樸最佳；無我", pages: [[29, "知足常樂，簡樸最佳"], [33, "只否定了有一永恆的我"]] },
  E13: { lec: "L8", topic: "人身難得；以死觀生", pages: [[40, "人身難得，把握光陰"], [41, "以死觀生；如實觀"]] },
  E14: { lec: "L8", topic: "凡夫畏果；淨土", pages: [[42, "凡夫畏果，菩薩畏因；聖嚴法師"], [43, "淨土並非終極解脫"]] },
};

// Web evidence pages. `use` lists the main slides that quote each line.
const WEB = {
  W01: { src: SHORT.W01, site: "法鼓山網站（PDF 短文）", url: URL.ddmFuneral, quotes: [
    { q: "如果親友致送奠儀，除了由於家屬貧苦而留著喪葬費用及生活所需外，最好悉數移做供奉三寶、弘法利生及公益慈善等的用途，將此功德迴向亡者，超生離苦，蓮品高昇。", key: "悉數移做", use: ["P8", "P12", "P14"] },
    { q: "不論是火葬或土葬，凡有儀式，均以念佛、誦經、迴向代替由家屬輪番舉哀及哭泣、音樂等的鋪張。", key: "輪番舉哀", use: ["P6", "P13", "P14"] },
    { q: "且特別不允許在喪葬期間，以殺生的葷腥招待親友，更不可以酒肉葷腥來祭祀亡者。", key: "酒肉葷腥", use: ["P13", "P14"] },
    { q: "佛教徒當以佛事代替哭泣。", key: "以佛事代替哭泣", use: ["P15"] },
  ] },
  W02: { src: SHORT.W02, site: "法鼓山網站（PDF 短文）", url: URL.ddmChaodu, quotes: [
    { q: "不過，超度的功用，也有一定的限度，超度只是一種次要的力量，而不是主要的力量。", key: "次要的力量", use: ["P6", "P9", "P15"] },
    { q: "所以修善的主要時間是在各人的生前，若在死後，由活人超度死人，雖以修善的功德迴向給死人，《地藏經》中說，死人也僅得到七分之一的利益，其餘的六分，乃屬活人所得。", key: "七分之一", use: ["P11"] },
    { q: "因此，正信的佛教，超度工作的主體不是僧尼，而是亡者的家屬。", key: "主體不是僧尼", use: ["P6"] },
    { q: "至於一般的人，死了之後尚有四十九日的緩衝期間，等待業緣的成熟，再決定輪迴的去向。", key: "緩衝期間", use: ["P4", "P9", "P13", "P14"] },
    { q: "過了四十九日之後，已經隨著亡者自己的業力而去投生，那時再做超度的功德，只能增加他的福力，或減少他的苦難，但已不能改變他已經投生的處所了。", key: "過了四十九日", use: ["P9", "P14", "P15"] },
  ] },
  W03: { src: SHORT.W03 + "（摘自《法鼓山的方向》，法鼓文化）", site: "法鼓山網站（PDF 短文）", url: URL.ddmFoshi, quotes: [
    { q: "因此亡者眷屬等，應發心在四十九日內，吃素念佛、淨守五戒（不殺生、不偷盜、不邪淫、不妄語、不飲酒及不食五辛），並持續為亡者誦經、念佛或做諸超薦、印經、布施、供養等佛事，功德迴向亡者，如此冥陽同霑法益，均蒙其利。", key: "吃素念佛", use: ["P8"] },
    { q: "綜合而言，若亡者親屬，能為亡者修福布施、供養三寶、救濟貧窮、利益社會，乃至等施一切眾生，使之離苦得樂，都是促成亡者超生離苦，往生佛國的助緣。", key: "助緣", use: ["P9", "P10", "P12", "P16"] },
  ] },
  W04: { src: SHORT.W04 + "，《第四屆佛法與臨終關懷研討會─死亡，您準備好了嗎？》，頁39–48", site: "臺灣大學佛學數位圖書館（PDF 論文）", url: URL.guodong, quotes: [
    { q: "人生的結束，……乃是一件莊嚴的佛事。", where: "頁39（文中標為聖嚴法師法語）", key: "莊嚴的佛事", use: ["P6"] },
    { q: "7. 不燒（錫箔、冥紙、往生錢、蓮花座、靈厝）。", where: "頁42", key: "冥紙", use: ["P6", "P14"] },
    { q: "不要以牲禮、酒肉來祭祀往生者。", where: "頁42", key: "牲禮", use: ["P6"] },
    { q: "5. 紀念往生者，造福生者，冥陽兩利，圓滿真正的孝道。", where: "頁42", key: "圓滿真正的孝道", use: ["P10"] },
    { q: "1. 往生助念：(1) 原則：約 8-12 小時（家屬亦可自行念佛 24 小時）", where: "頁43", key: "往生助念", use: ["P13", "P14"] },
    { q: "※頭七是往生當天起七天；不是第七天那一天。", where: "頁45", key: "頭七", use: ["P13", "P14"] },
    { q: "4. 誦念：（誦經、持咒、開示、迴向）", where: "頁46", key: "誦念", use: ["P8"] },
  ] },
  W05: { src: SHORT.W05 + "（2018）", site: "衞奕信勳爵文物信託網站（PDF 報告）", url: URL.lordWilson, quotes: [
    { q: "華人重孝，《論語・為政》：『生，事之以禮；死，葬之以禮，祭之以禮』", where: "頁5", key: "葬之以禮", use: ["P5", "P6"] },
    { q: "可同時找到道教、佛教及民間信仰等多種禮儀", where: "頁5", key: "多種禮儀", use: ["P6"] },
    { q: "如以佛教禮儀辦理喪禮的家庭，在喪禮中也會出現如燒衣紙或破地獄等道教儀式。", where: "頁7", key: "破地獄", use: ["P5", "P6", "P15", "P16"] },
    { q: "打齋首要的目的在於救濟逝者，化解生前罪孽惡行，解脫死後痛苦毒難。", where: "頁59", key: "救濟逝者", use: ["P5", "P6"] },
    { q: "豬頭、雞、魚、香爐、燒酒和白飯等，統稱為三牲祭品", where: "頁82", key: "三牲祭品", use: ["P6"] },
    { q: "金銀衣紙及紮作……喪家憑藉寄望逝者在另一世界如常生活", where: "頁84", key: "如常生活", use: ["P6"] },
  ] },
  W06: { src: SHORT.W06 + "，《悼念捐款計劃》小冊子", site: "善寧會網站（PDF 小冊子）", url: URL.sphc, quotes: [
    { q: "為各家屬或有心人免費提供捐款箱（按金＄100），設置在各喪禮場地，讓帛金能夠轉化為悼念捐款。", key: "悼念捐款", use: ["P8", "P12", "P15"] },
  ] },
  W07: { src: SHORT.W07, site: "CBETA 線上閱讀", note: "＊截圖於2026年11月2日開啟 CBETA 線上閱讀截取，紅框為引用的經文；已核對原文及行號。", url: URL.dizang, where: "T13, no. 412, p. 784b10", quotes: [
    { q: "七分之中，而乃獲一，六分功德，生者自利。", where: "p. 784b10", key: "七分之中", use: ["P9", "P11", "P16"] },
  ] },
  W08: { src: SHORT.W08, site: "CBETA 線上閱讀", note: "＊截圖於2026年11月2日開啟 CBETA 線上閱讀截取，紅框為引用的經文；已核對原文及行號。", url: URL.jingang, where: "T08, no. 235, p. 749a12–13", quotes: [
    { q: "菩薩於法應無所住行於布施", where: "p. 749a12–13", key: "應無所住", use: ["P11"] },
  ] },
  W09: { src: SHORT.W09, site: "CBETA 線上閱讀", note: "＊截圖於2026年11月2日開啟 CBETA 線上閱讀截取，紅框為引用的經文；已核對原文及行號。", url: URL.fahua, where: "T09, no. 262, p. 24c21–22", quotes: [
    { q: "願以此功德，普及於一切，我等與眾生，皆共成佛道。", where: "p. 24c21–22", key: "願以此功德", use: ["P8", "P10"] },
  ] },
};

module.exports = { DATE, URL, SHORT, BIB, EV, WEB };
