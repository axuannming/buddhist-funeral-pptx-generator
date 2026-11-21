// Builds [Presenter]'s part of the SSHD2056 Buddhist funeral deck in the A 經書 (thread-bound book) style.
// Everything is placed on a 1920×1080 grid: X() turns grid pixels into inches, PT() turns pixel font sizes into points.
// Speaker notes come from script/講稿.md; sources and evidence mapping from data.js. Old Lotus Ochre build: v1/.
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("./scripts/apply_theme.js");
const D = require("./data.js");

const OUT = process.argv[2] || "deck.pptx";
const EVDIR = path.join(__dirname, "ev");
const SCRIPT = path.join(__dirname, "..", "script", "speaker_script_individual.md");

const X = (v) => v / 144;
const PT = (v) => v / 2;

const INK = "1D1D1F", PAPER = "F3F2EE", INDIGO = "24324B", GREY = "5E5B55", RULE = "9A9996", NOTE = "34322E", FOOT = "3E3C38", TINT = "E2E5EA";
// CANVA=1 builds a copy for importing into Canva: Canva has Noto fonts, drops vertical text direction and page-number fields
const CANVA = !!process.env.CANVA;
const MING = CANVA ? "Noto Serif TC" : "PMingLiU", KAI = CANVA ? "Noto Serif TC" : "DFKai-SB", HEI = CANVA ? "Noto Sans TC" : "Microsoft JhengHei";
const STUDENT = "負責同學：[Presenter]（[ID Redacted]）";
const S = D.SHORT;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in = 1920 x 1080 grid
pres.theme = { headFontFace: MING, bodyFontFace: MING };
pres.author = "[Presenter]";
pres.title = "SSHD2056 佛教葬禮｜[Presenter] 部分";
pres.subject = "佛教喪禮：生死觀、特別之處、流程、布施行善・功德迴向、總結";

// ---------- slide order, links ----------
const MAIN = Array.from({ length: 17 }, (_, i) => "P" + (i + 1));
const EVIDS = Object.keys(D.EV);
const WEBIDS = Object.keys(D.WEB);
const HAS_EV = fs.existsSync(EVDIR);
const ORDER = HAS_EV ? [...MAIN, "IDX", ...EVIDS, ...WEBIDS] : [...MAIN];
const NUM = Object.fromEntries(ORDER.map((id, i) => [id, i + 1]));
const SECTION = (id) => (["P1", "P2"].includes(id) ? "開場" : /^P[3-7]$/.test(id) ? "緒論" : /^P(8|9|10|11|12)$/.test(id) ? "儀式六" : /^P1[3-7]$/.test(id) ? "結論" : "附錄：引用證據");
const TITLE = { P3: "從苦出發", P4: "死亡是一個過程", P5: "以死觀生", P6: "特別之處", P7: "三法印", P8: "布施迴向", P9: "業是因，善是緣", P10: "由孝親到眾生", P11: "練習放手", P12: "布施迴向的意義", P13: "總結", P14: "從苦到放下", P15: "本組評價", P16: "討論問題" };
const USES = {}; // evidence id -> main slides that cite it
["開場", "緒論", "儀式六", "結論", "附錄：引用證據"].forEach((title) => pres.addSection({ title }));

// speaker notes: one "## Pn｜…" section per slide in the script file; {{…}} (skippable) shows as 〔可略：…〕
const SPEAK = {};
fs.readFileSync(SCRIPT, "utf8").split(/^## /m).slice(1).forEach((sec) => {
  const m = sec.match(/^P(\d+)｜[^\n]*\n([\s\S]*)$/);
  if (m) SPEAK["P" + m[1]] = m[2].trim().replace(/\{\{/g, "〔可略：").replace(/\}\}/g, "〕");
});

// ---------- text ----------
// Width estimate for the overflow check: CJK, full-width punctuation and circled numbers take a full em.
const wide = (c) => c >= 0x2e80 || (c >= 0x2460 && c <= 0x24ff) || (c >= 0x2500 && c <= 0x257f) || (c >= 0xff00 && c <= 0xffef) || c === 0x2014 || c === 0x2026 || c === 0x2192 || c === 0x2190;
const textW = (str, px, cs = 0) => [...str].reduce((w, ch) => w + (wide(ch.codePointAt(0)) ? px : px * 0.47) + cs, 0);
const WARN = [];
let CUR = "";

// "…決定{1}，…" → a superscript ① in indigo
function marks(str, ro) {
  const out = [];
  String(str).split(/(\{\d+\})/).forEach((part) => {
    if (!part) return;
    const m = part.match(/^\{(\d+)\}$/);
    if (m) out.push({ text: String.fromCodePoint(0x245f + Number(m[1])), options: { ...ro, superscript: true, color: INDIGO, hyperlink: undefined } });
    else out.push({ text: part, options: { ...ro } });
  });
  return out;
}

// content: string or array of segments { t, c, s, f, cs, link, url, br }; o: grid box + type settings
function T(slide, content, o) {
  const s = o.s || 26;
  const base = { fontFace: o.f || MING, fontSize: PT(s), color: o.c || INK, lang: "zh-HK" };
  if (o.cs) base.charSpacing = PT(o.cs);
  let segs = (Array.isArray(content) ? content : [content]).map((g) => (typeof g === "string" ? { t: g } : g));
  const stack = o.vert && CANVA; // one character per line instead of vertical text
  if (stack) segs = segs.map((g, i) => ({ ...g, t: [...g.t].join("\n") + (i < segs.length - 1 ? "\n" : "") }));
  const runs = [];
  segs.forEach((g) => {
    const ro = { ...base };
    if (g.c) ro.color = g.c;
    if (g.s) ro.fontSize = PT(g.s);
    if (g.f) ro.fontFace = g.f;
    if (g.cs !== undefined) ro.charSpacing = PT(g.cs);
    // slide links point at this deck's page numbers, which are wrong once pages are merged into the group deck in Canva
    if (g.link && !CANVA) ro.hyperlink = { slide: NUM[g.link], tooltip: g.tip || "跳到 " + g.link };
    if (g.url) ro.hyperlink = { url: g.url, tooltip: "打開來源" };
    const rs = marks(g.t, ro);
    if (g.br && rs.length) rs[rs.length - 1].options.breakLine = true;
    runs.push(...rs);
  });
  const lh = o.lh || (stack ? s + (o.cs || 0) : o.vert ? 0 : Math.round(s * 1.5));
  slide.addText(runs, {
    x: X(o.x), y: X(o.y), w: X(o.w), h: X(o.h), margin: 0, isTextBox: true, fit: "none",
    valign: o.valign || "top", align: o.align || (stack ? "center" : "left"), ...(o.vert && !stack ? { vert: o.vert } : {}),
    ...(lh ? { lineSpacing: PT(lh) } : {}), ...(o.para ? { paraSpaceAfter: PT(o.para) } : {}),
    fontFace: base.fontFace, fontSize: base.fontSize, color: base.color,
  });
  if (o.check === false) return;
  if (o.vert) {
    const need = [...segs.map((g) => g.t).join("")].length * (s + (o.cs || 0));
    if (need > o.h + 2) WARN.push(`${CUR}: vertical "${segs[0].t.slice(0, 8)}" needs ${Math.round(need)}px, box ${o.h}px`);
    return;
  }
  let lines = 0, cur = 0;
  const paras = [];
  segs.forEach((g) => {
    cur += textW(g.t.replace(/\{\d+\}/g, "①"), g.s || s, g.cs ?? o.cs ?? 0);
    if (g.br) { paras.push(cur); cur = 0; }
  });
  paras.push(cur);
  paras.forEach((w) => (lines += Math.max(1, Math.ceil(w / (o.w * 0.97)))));
  const need = lines * (lh || s * 1.25) + (o.para || 0) * (paras.length - 1);
  if (need > o.h + 2) WARN.push(`${CUR}: "${segs.map((g) => g.t).join("").slice(0, 14)}…" needs ${Math.round(need)}px (${lines} lines), box ${o.h}px`);
}

// ---------- rules and frames ----------
const hl = (slide, x1, x2, y, c = INK, w = 0.5) => slide.addShape("line", { x: X(x1), y: X(y), w: X(x2 - x1), h: 0, line: { color: c, width: w } });
const vl = (slide, x, y1, y2, c = INK, w = 0.5) => slide.addShape("line", { x: X(x), y: X(y1), w: 0, h: X(y2 - y1), line: { color: c, width: w } });
function box(slide, x, y, w, h, o = {}) {
  slide.addShape("rect", {
    x: X(x), y: X(y), w: X(w), h: X(h),
    ...(o.fill ? { fill: { color: o.fill } } : {}),
    line: { color: o.c || INK, width: o.w || 0.5, ...(o.dash ? { dashType: o.dash } : {}) },
  });
}
// 版框: thick outer rule, thin inner rule
function frame(slide, x = 80, y = 56, w = 1760, h = 908) {
  box(slide, x, y, w, h, { w: 1.5 });
  box(slide, x + 7, y + 7, w - 14, h - 14);
}
// 版心: book title, 魚尾, section name and the page number (a live field, so it stays right after merging decks)
function banxin(slide, sec) {
  vl(slide, 1712, 63, 957);
  vl(slide, 1718, 63, 957);
  T(slide, "佛教葬禮", { x: 1745, y: 96, w: 60, h: 200, s: 34, cs: 7.5, vert: "eaVert", valign: "middle" });
  slide.addShape("custGeom", {
    x: X(1746), y: X(336), w: X(58), h: X(46), fill: { color: INK },
    points: [{ x: 0, y: 0 }, { x: X(58), y: 0 }, { x: X(58), y: X(46) }, { x: X(29), y: X(26) }, { x: 0, y: X(46) }, { close: true }],
  });
  T(slide, sec, { x: 1750, y: 408, w: 50, h: 440, s: 28, cs: 6.7, c: GREY, vert: "eaVert", valign: "middle" });
  if (!CANVA) slide.slideNumber = { x: X(1720), y: X(884), w: X(110), h: X(50), fontFace: MING, fontSize: PT(30), color: INK, align: "center", valign: "middle", margin: 0 };
}
// below the frame: evidence links on the left, student on the right
function footer(slide, ev, extra) {
  const segs = [...(extra || [])];
  if (ev.length) {
    segs.push({ t: extra ? "　證據頁：" : "證據頁：" });
    ev.forEach((e, i) => {
      segs.push({ t: e, c: INDIGO, link: e, tip: "跳到證據頁 " + e });
      if (i < ev.length - 1) segs.push({ t: "、" });
    });
  }
  if (segs.length) T(slide, segs, { x: 84, y: 974, w: 1400, h: 36, s: 18, c: FOOT, valign: "middle", check: false });
  T(slide, STUDENT, { x: 1440, y: 974, w: 396, h: 36, s: 18, c: FOOT, align: "right", valign: "middle", check: false });
}
// in-frame notes ①②③…, split into two columns
function notes(slide, list, o = {}) {
  const top = o.top || 818;
  hl(slide, 140, 520, top);
  const cols = o.cols || [{ x: 140, w: 750 }, { x: 930, w: 756 }];
  const per = Math.ceil(list.length / cols.length);
  cols.forEach((c, ci) => {
    const items = list.slice(ci * per, (ci + 1) * per);
    if (!items.length) return;
    slide.addText(items.map((t, i) => ({
      text: t,
      options: { bullet: { characterCode: (0x2460 + ci * per + i).toString(16).toUpperCase(), indent: 11 }, ...(i < items.length - 1 ? { breakLine: true } : {}) },
    })), { x: X(c.x), y: X(top + 12), w: X(c.w), h: X(950 - top - 12), margin: 0, fontFace: MING, fontSize: 8.5, color: NOTE, lineSpacing: 12.75, valign: "top", lang: "zh-HK", fit: "none" });
    const lines = items.reduce((n, t) => n + Math.ceil((textW(t, 17) + 22) / (c.w * 0.97)), 0);
    if (lines * 25.5 > 950 - top - 12) WARN.push(`${CUR}: notes column ${ci + 1} needs ${lines} lines`);
  });
}
function page(id, sec, ev, extra) {
  CUR = id;
  const slide = pres.addSlide({ sectionTitle: SECTION(id) });
  slide.background = { color: PAPER };
  frame(slide);
  if (sec) banxin(slide, sec);
  footer(slide, ev, extra);
  ev.forEach((e) => { USES[e] = USES[e] || []; if (!USES[e].includes(id)) USES[e].push(id); });
  if (SPEAK[id]) slide.addNotes(SPEAK[id]);
  return slide;
}
// title, optional lead and sub-lead, then the rule; returns the rule's y
function header(slide, title, lead, sub, right = 1690) {
  T(slide, title, { x: 140, y: 88, w: right - 150, h: 116, s: 84, cs: 5, lh: 116 });
  if (lead) T(slide, lead, { x: 142, y: 212, w: right - 142, h: 46, s: 31, lh: 44 });
  if (sub) T(slide, sub, { x: 142, y: 264, w: right - 142, h: 40, s: 25, c: GREY, lh: 36 });
  const y = sub ? 318 : lead ? 278 : 214;
  hl(slide, 130, right, y);
  return y;
}
// 科判: the bracket outline of sutra commentaries — root (vertical) ┬ rows of [label, keyword, explanation]
function kepan(slide, root, rows, o) {
  const rh = o.rowH, rs = o.rootSize || 60;
  const cys = rows.map((_, i) => o.top + rh / 2 + i * rh);
  const mid = (cys[0] + cys[cys.length - 1]) / 2;
  const len = [...root].length * (rs + 8);
  T(slide, root, { x: 146, y: mid - len / 2, w: rs + 24, h: len + 8, s: rs, cs: 8, vert: "eaVert", valign: "middle" });
  const bx = 146 + rs + 24 + 30;
  hl(slide, 146 + rs + 30, bx, mid);
  vl(slide, bx, cys[0], cys[cys.length - 1]);
  rows.forEach(([lab, kw, text], i) => {
    const cy = cys[i];
    hl(slide, bx, bx + 28, cy);
    T(slide, lab, { x: bx + 46, y: cy - 60, w: 190, h: 34, s: 24, cs: 4, c: INDIGO, lh: 34 });
    T(slide, kw, { x: bx + 46, y: cy - 24, w: 220, h: 82, s: 64, lh: 80 });
    T(slide, text, { x: bx + 280, y: cy - rh / 2 + 8, w: 1680 - (bx + 280), h: rh - 16, s: 26, lh: 40, valign: "middle" });
  });
}

// ======================= MAIN SLIDES =======================
async function build() {
  // ---------- P1 內封 ----------
  {
    CUR = "P1";
    const s = pres.addSlide({ sectionTitle: SECTION("P1") });
    s.background = { color: PAPER };
    frame(s, 520, 110, 880, 820);
    vl(s, 1250, 117, 923, RULE);
    vl(s, 790, 117, 923, RULE);
    T(s, "SSHD2056", { x: 1257, y: 146, w: 136, h: 36, s: 22, f: HEI, c: GREY, cs: 1, align: "center", valign: "middle", check: false });
    T(s, "探索中國傳統思想的生死、人性與人倫觀", { x: 1290, y: 206, w: 64, h: 690, s: 30, cs: 5, vert: "eaVert", valign: "middle" });
    T(s, "佛教葬禮", { x: 925, y: 160, w: 200, h: 740, s: 150, cs: 30, vert: "eaVert", valign: "middle" });
    T(s, "以死觀生", { x: 690, y: 176, w: 74, h: 320, s: 52, cs: 10, c: INDIGO, vert: "eaVert", valign: "middle" });
    T(s, "從喪禮儀式看佛教的生死觀", { x: 594, y: 176, w: 50, h: 520, s: 30, cs: 5, vert: "eaVert", valign: "middle" });
    T(s, [
      { t: "小組成員", s: 20, c: GREY, cs: 4, br: true },
      { t: "[Presenter]（[ID Redacted]）", br: true }, { t: "[Member A]（[ID Redacted]）", br: true }, { t: "[Member B]（[ID Redacted]）", br: true }, { t: "[Member C]（[ID Redacted]）" },
    ], { x: 140, y: 694, w: 360, h: 236, s: 24, f: HEI, lh: 44 });
    footer(s, [], [{ t: "注：「以死觀生」語出 L8 頁41（" }, { t: "E13", c: INDIGO, link: "E13" }, { t: "）。" }]);
    s.addNotes(SPEAK.P1);
  }

  // ---------- P2 目次 ----------
  {
    const s = page("P2", "目次", [], [{ t: "注：本組整理；報告次序依佛化喪禮的流程（釋果東，頁41–45，" }, { t: "W04", c: INDIGO, link: "W04" }, { t: "）。" }]);
    const R0 = 1520, CW = 231;
    for (let i = 0; i < 6; i++) vl(s, R0 - CW * i, 63, 957, RULE);
    T(s, "目次", { x: 1551, y: 104, w: 110, h: 290, s: 104, cs: 33, vert: "eaVert", valign: "middle" });
    T(s, "依喪禮的時間次序報告", { x: 1588, y: 430, w: 36, h: 320, s: 26, cs: 4.7, c: GREY, vert: "eaVert", valign: "middle" });
    const cols = [
      ["緒論", "佛教的生死觀", "生死觀・喪禮特色・三法印", "[Presenter]"],
      ["儀式一・二", "臨終・靈堂", "臨終助念・設靈堂", "[Member A]"],
      ["儀式三", "誦經念佛", "以念佛、誦經代替哭泣", "[Member B]"],
      ["儀式四・五", "出殯・做七", "佛化奠祭・每七日一次至第四十九日", "[Member C]"],
      ["儀式六", "布施行善", "帛金轉做善款・功德迴向", "[Presenter]"],
      ["結論", "總結・評價・討論", "儀式背後的生死觀", "[Presenter]／全組"],
    ];
    cols.forEach(([lab, title, sub, who], i) => {
      const R = R0 - CW * i, L = i === 5 ? 87 : R - CW, cx = R - 70;
      T(s, lab, { x: cx - 18, y: 104, w: 36, h: 160, s: 26, cs: 3, c: INDIGO, vert: "eaVert", valign: "middle" });
      T(s, title, { x: cx - 36, y: 284, w: 72, h: 520, s: 54, cs: 5.4, vert: "eaVert", valign: "middle" });
      T(s, sub, { x: R - 164, y: 284, w: 34, h: 540, s: 25, cs: 3, c: GREY, vert: "eaVert", valign: "middle" });
      T(s, [{ t: "報告", s: 17, c: GREY, cs: 5, br: true }, { t: who, f: HEI, c: INDIGO }], { x: L + 4, y: 842, w: R - L - 8, h: 80, s: 26, align: "center", lh: 38, check: false });
    });
  }

  // ---------- P3 從苦出發（科判） ----------
  {
    const s = page("P3", "緒論　生死觀", ["E01", "E02", "E03", "E04", "E07", "E13"]);
    header(s, "佛教生死觀：從苦出發", "借講義的切入框架{1}來看：佛教看見甚麼問題？成因是甚麼？如何解決？");
    kepan(s, "佛教生死觀", [
      ["問題", "苦", "佛陀因目睹死亡而出家{2}。佛教說人生有八苦：生、老、病、死都是苦，與所愛的人分離也是苦{3}。"],
      ["成因", "執着", "以為有一個永恆不變的「我」，於是緊抓身體、親人和財物不放，稱為我執{3}。其實萬物由條件組合而成，條件散去便消失，沒有永恆不變的東西：緣起性空{4}。"],
      ["出路", "放下", "守戒律、令心安定、修智慧，就能放下我執{5}；最終達到涅槃：滅除一切煩惱與生死輪迴{6}。"],
    ], { top: 296, rowH: 142, rootSize: 58 });
    T(s, "所以佛教以死觀生{7}：死亡雖然可怕，也是學會放下的機會。", { x: 140, y: 740, w: 1540, h: 46, s: 29, c: INDIGO });
    notes(s, ["L7 頁3（切入框架）、頁4（學習重點：苦、緣起性空、戒定慧）。", "L8 頁5。", "L7 頁13（八苦；苦←執着←我執）。", "L7 頁18（緣起、性空）。",
      "L7 頁37（戒、定、慧）。", "L7 頁10（涅槃寂靜）；L8 頁4。", "L8 頁41。"]);
  }

  // ---------- P4 死亡是一個過程 ----------
  {
    const s = page("P4", "緒論　生死觀", ["E08", "E09", "E10", "E11", "W02"]);
    header(s, "死亡是一個過程", "佛教認為，死亡是一個過程，大約分三段：");
    const stages = [
      ["第一段", "臨終", "外呼吸中斷之後，還要到內呼吸中斷，心識才離體{1}。所以佛教重視臨終的幾個小時。"],
      ["第二段", "中陰", "死後、未投生之前的過渡期，稱為中有或中陰{2}。講義引過的聖嚴法師（L8 頁42）說，一般人死後尚有「四十九日的緩衝期間」{3}。"],
      ["第三段", "投生", "投生六道之一：天、人、阿修羅、地獄、餓鬼、畜生。去向主要由生前的善惡業，以及臨終的念頭等因素決定{4}。"],
    ];
    const xs = [140, 665, 1190], w = 478;
    stages.forEach(([n, kw, text], i) => {
      if (i) vl(s, xs[i] - 26, 300, 590, RULE);
      T(s, n, { x: xs[i], y: 296, w, h: 34, s: 24, cs: 4, c: INDIGO, lh: 34 });
      T(s, kw, { x: xs[i], y: 330, w, h: 84, s: 64, lh: 82 });
      T(s, text, { x: xs[i], y: 426, w, h: 160, s: 26, lh: 39 });
    });
    hl(s, 130, 1690, 612, RULE);
    T(s, "講義比喻", { x: 142, y: 626, w: 300, h: 32, s: 22, cs: 3, c: GREY, lh: 32 });
    T(s, "「人就像是一滴水……當每滴水匯入大海之時（人死後），大海浪除卻每滴水的差別，卻保留了每滴水內的雜質。」{5}", { x: 140, y: 664, w: 760, h: 130, s: 26, f: KAI, lh: 40 });
    vl(s, 930, 628, 796, RULE);
    T(s, [
      { t: "在輪迴中流轉的，只有業力{6}。", s: 29, c: INDIGO, br: true },
      { t: "個別生命的意識隨身體崩壞而消解，死後唯一留存的只有業{7}。所以佛教喪禮的重點，在於趁這四十九日，為亡者添一些有利的條件。" },
    ], { x: 960, y: 624, w: 720, h: 178, s: 26, lh: 39 });
    notes(s, ["L8 頁12。", "L8 頁13。", S.W02 + "。", "L8 頁17–18。", "L8 頁22。", "L8 頁21。", "L8 頁24。"]);
  }

  // ---------- P5 以死觀生：各家生死觀，一家一字（據 L8 頁4） ----------
  {
    const s = page("P5", "緒論　生死觀", ["E07", "E13", "W05"]);
    vl(s, 1390, 96, 796, RULE);
    T(s, "如實觀", { x: 1530, y: 112, w: 170, h: 520, s: 150, cs: 15, vert: "eaVert", valign: "middle" });
    T(s, "一不悲觀　二不樂觀", { x: 1448, y: 118, w: 40, h: 400, s: 28, cs: 6, c: GREY, vert: "eaVert", valign: "middle" });
    T(s, "以死觀生", { x: 140, y: 88, w: 1220, h: 116, s: 84, cs: 5, lh: 116 });
    T(s, "人應為甚麼而生、為甚麼而死？各家的答案不同{1}：", { x: 142, y: 212, w: 1230, h: 46, s: 31, lh: 44 });
    hl(s, 130, 1370, 278);
    // each school boiled down to one character plus our own wording; the lecture's table stays in the note
    const schools = [
      ["儒家", "德", ["一生以道德為重，", "可以為道而死"]],
      ["道家", "順", ["生死都屬自然，", "順着自然來去"]],
      ["墨家", "利", ["依天志行事，", "為利益別人而生死"]],
      ["道教", "仙", ["修煉身心，", "追求長生不死"]],
      ["佛教", "脫", ["看破生死的執着，", "超脫輪迴"]],
    ];
    const cw = 246;
    schools.forEach(([who, ch, view], i) => {
      const x = 130 + i * cw, last = i === schools.length - 1, c = last ? INDIGO : INK;
      if (last) box(s, x, 292, cw - 6, 350, { fill: TINT, c: TINT });
      else if (i) vl(s, x, 300, 636, RULE);
      T(s, who, { x: x + 10, y: 304, w: cw - 20, h: 36, s: 26, cs: 4, c: INDIGO, align: "center", lh: 36 });
      T(s, ch, { x: x + 10, y: 350, w: cw - 20, h: 150, s: 128, c, align: "center", lh: 150, check: false });
      T(s, [{ t: view[0], br: true }, { t: view[1] }], { x: x + 16, y: 514, w: cw - 32, h: 112, s: 24, c, align: "center", lh: 36 });
    });
    hl(s, 130, 1370, 656, RULE);
    T(s, "佛教的態度是如實觀：任何苦樂「都是人為主觀添加的判斷」{2}；六道皆苦、人身難得，所以要「珍惜、善用人生」{3}。", { x: 140, y: 668, w: 1230, h: 80, s: 26, c: INDIGO, lh: 39 });
    T(s, "其中和香港喪禮關係最大的，是儒家的重孝、重禮，以及道教的打齋、破地獄{4}。", { x: 140, y: 756, w: 1230, h: 40, s: 23, c: GREY, lh: 36 });
    notes(s, ["L8 頁4（各家各派的生死觀）。", "L8 頁41。", "L8 頁40。", S.W05 + "，頁5、7、59。"]);
  }

  // ---------- P6 特別之處：對照一般華人喪俗 ----------
  {
    const s = page("P6", "緒論　喪禮特色", ["W05", "W04", "W01", "W02", "E03", "E04", "E09", "E10", "E11", "E13"]);
    header(s, "佛教喪禮的特別之處", "對照香港常見的華人喪俗{1}：");
    [[290, 520, "一般華人喪俗"], [830, 530, "佛教喪禮"], [1395, 290, "對照講義"]].forEach(([x, w, t]) => T(s, t, { x, y: 288, w, h: 30, s: 20, cs: 3, c: GREY, lh: 30 }));
    hl(s, 130, 1690, 324);
    vl(s, 1375, 288, 693, RULE);
    const rows = [
      ["定位", "華人重孝：「死，葬之以禮，祭之以禮」{1}", "聖嚴法師：人生的結束「乃是一件莊嚴的佛事」{2}", "如實觀", "L8 頁41"],
      ["祭品", "豬頭、雞、魚、燒酒等「三牲祭品」{1}", "釋果東：「不要以牲禮、酒肉來祭祀往生者」{3}", "不殺生", "L7 頁39"],
      ["衣紙", "燒金銀衣紙及紮作，「寄望逝者在另一世界如常生活」{1}", "釋果東：「不燒（錫箔、冥紙、往生錢、蓮花座、靈厝）」{3}", "輪迴中流轉的只有業力", "L8 頁21、24"],
      ["哀悼", "家屬「輪番舉哀及哭泣」{4}", "聖嚴法師：「以念佛、誦經、迴向代替」{4}", "與親人死別是愛別離苦", "L7 頁13"],
      ["超度", "道教打齋、破地獄：「打齋首要的目的在於救濟逝者」{1}", "聖嚴法師：主體是「亡者的家屬」，超度只是「一種次要的力量」{5}", "去向由自己的業決定", "L8 頁17–18"],
    ];
    const rh = 73;
    rows.forEach(([lab, folk, bud, idea, ref], i) => {
      const y = 328 + i * rh;
      if (i) hl(s, 130, 1690, y, RULE);
      T(s, lab, { x: 140, y, w: 130, h: rh, s: 28, cs: 2, c: INDIGO, valign: "middle", lh: 36 });
      T(s, folk, { x: 290, y, w: 520, h: rh, s: 23, valign: "middle", lh: 32 });
      T(s, bud, { x: 830, y, w: 530, h: rh, s: 23, c: INDIGO, valign: "middle", lh: 32 });
      T(s, [{ t: idea, br: true }, { t: ref, s: 19, c: GREY }], { x: 1395, y, w: 290, h: rh, s: 22, lh: 30, valign: "middle" });
    });
    hl(s, 130, 1690, 693);
    T(s, "香港現實", { x: 140, y: 708, w: 140, h: 40, s: 28, cs: 2, c: INDIGO, lh: 40 });
    T(s, "香港部分喪禮「可同時找到道教、佛教及民間信仰等多種禮儀」{1}；以佛教禮儀辦理的喪禮，「也會出現如燒衣紙或破地獄等道教儀式」{1}。", { x: 290, y: 706, w: 1395, h: 80, s: 25, lh: 38 });
    notes(s, [S.W05 + "，頁5、7、59、82、84。", S.W04 + "，頁39（引聖嚴法師法語）。", "釋果東，同②，頁42。", S.W01 + "。", S.W02 + "。"]);
  }

  // ---------- P7 各儀式背後的三法印（兼報告次序） ----------
  {
    const s = page("P7", "緒論　三法印", ["E02", "E11", "E12", "E14"]);
    header(s, "各儀式背後的三法印", "法印「可以是判定是不是佛法的標準」{1}；之後各個儀式的背後思想，都可以從這裏看。");
    const seals = [
      { name: ["諸行", "無常"], def: "「無常是指不斷地生滅變化，遷流不息」{1}", see: "死亡是無常的必然{2}；送別亡者，也是學習接受變化。", who: [["臨終助念", "[Member A]"], ["出殯", "[Member C]"]] },
      { name: ["諸法", "無我"], def: "「無我也稱為非我，是指沒有實體，沒有主宰者」{1}", see: "沒有一個永恆的我{3}；不執着遺體與哀傷，以布施練習放下我執。", who: [["設靈堂", "[Member A]"], ["出殯", "[Member C]"], ["布施迴向", "[Presenter]"]] },
      { name: ["涅槃", "寂靜"], def: "「滅除一切煩惱與生死輪迴的永恆寂靜境界」{1}", see: "念佛往生淨土，是為了在淨土修行，「以求擺脫輪迴」{4}。", who: [["誦經念佛", "[Member B]"], ["做七", "[Member C]"]] },
    ];
    const xs = [140, 665, 1190], w = 478;
    seals.forEach((o, i) => {
      const x = xs[i];
      if (i) vl(s, x - 26, 300, 700, RULE);
      // 印: double-ruled square; two vertical columns, read right to left
      box(s, x, 300, 150, 150, { c: INDIGO, w: 1.5 });
      box(s, x + 6, 306, 138, 138, { c: INDIGO });
      T(s, o.name[0], { x: x + 82, y: 314, w: 56, h: 122, s: 50, cs: 6, c: INDIGO, vert: "eaVert", valign: "middle" });
      T(s, o.name[1], { x: x + 14, y: 314, w: 56, h: 122, s: 50, cs: 6, c: INDIGO, vert: "eaVert", valign: "middle" });
      T(s, o.def, { x: x + 176, y: 296, w: w - 176, h: 160, s: 23, f: KAI, lh: 34, valign: "middle" });
      T(s, o.see, { x, y: 478, w, h: 116, s: 25, lh: 38 });
      // two rituals per line, so a name never breaks across lines
      const who = o.who.flatMap(([r, p], k) => [{ t: r }, { t: "（" + p + "）", s: 20, f: HEI, c: INDIGO, ...(k === 1 && o.who.length > 2 ? { br: true } : {}) }, ...(k < o.who.length - 1 && !(k === 1 && o.who.length > 2) ? [{ t: "、" }] : [])]);
      T(s, [{ t: "見於　", s: 20, c: GREY, cs: 3 }, ...who], { x, y: 604, w, h: 90, s: 24, lh: 36 });
    });
    hl(s, 130, 1690, 716, RULE);
    T(s, [{ t: "報告次序　", s: 20, c: GREY, cs: 3 }, { t: "臨終助念・設靈堂（[Member A]）→ 誦經念佛（[Member B]）→ 做七・出殯（[Member C]）→ 布施迴向（[Presenter]）" }], { x: 140, y: 732, w: 1540, h: 40, s: 24, lh: 40, valign: "middle" });
    notes(s, ["L7 頁10（三法印）。", "L8 頁26（死亡的必然：無常）。", "L8 頁33（只否定了有一永恆的我）。", "L8 頁43（淨土信仰）。"]);
  }

  // ---------- P8 儀式六：是甚麼、怎樣做 ----------
  {
    const s = page("P8", "儀式六　布施迴向", ["E06", "E09", "W01", "W03", "W04", "W09", "W06"]);
    header(s, "儀式六　布施行善・功德迴向");
    const xs = [140, 665, 1190], w = 470;
    [
      ["布施", "捐錢、出力去幫助別人；是菩薩道六度之一（L7 頁46）。"],
      ["功德", "行善累積的福分。講義指，善業會影響投生的去向（L8 頁17）。"],
      ["迴向", "把功德分一份出去，送給亡者，以至一切眾生。"],
    ].forEach(([t, d], i) => {
      if (i) vl(s, xs[i] - 26, 236, 396, RULE);
      T(s, t, { x: xs[i], y: 230, w, h: 66, s: 48, cs: 4, lh: 64 });
      T(s, d, { x: xs[i], y: 306, w, h: 90, s: 25, lh: 37 });
    });
    hl(s, 130, 1690, 414, RULE);
    const steps = [
      ["帛金轉做善款", "聖嚴法師建議：親友的奠儀，除家屬貧苦所需外，「最好悉數移做供奉三寶、弘法利生及公益慈善等的用途，將此功德迴向亡者」{1}", 80],
      ["以亡者名義行善", "家屬在四十九日內「為亡者誦經、念佛或做諸超薦、印經、布施、供養等佛事，功德迴向亡者」{2}", 40],
      ["以迴向作結", [{ t: "佛化奠祭的誦念儀程，最後一項就是迴向{3}。《法華經》偈：" }, { t: "「願以此功德，普及於一切，我等與眾生，皆共成佛道。」", f: KAI }, { t: "{4}" }], 80],
    ];
    let y = 432;
    steps.forEach(([lab, text, h]) => {
      T(s, lab, { x: 140, y, w: 330, h: 40, s: 27, c: INDIGO, lh: 40 });
      T(s, text, { x: 480, y, w: 1200, h, s: 26, lh: 40 });
      y += h + 20;
    });
    hl(s, 130, 1690, 692, RULE);
    T(s, "比較", { x: 140, y: 708, w: 330, h: 40, s: 27, c: INDIGO, lh: 40 });
    T(s, "香港的善寧會（推動善終服務的慈善團體）在喪禮場地設捐款箱，「讓帛金能夠轉化為悼念捐款」{5}。相同：帛金變善款；不同：佛教多了迴向一步。", { x: 480, y: 708, w: 1200, h: 84, s: 26, lh: 40 });
    notes(s, [S.W01 + "。", S.W03 + "。", S.W04 + "，頁46–48（誦念：誦經、持咒、開示、迴向）。", S.W09 + "，CBETA, T09, no. 262, p. 24c21–22。", S.W06 + "。"]);
  }

  // ---------- P9 業是因，善是緣 ----------
  {
    const s = page("P9", "儀式六　布施迴向", ["E02", "E08", "E09", "E14", "W02", "W07", "W03"]);
    T(s, "業是因，善是緣", { x: 140, y: 88, w: 1540, h: 116, s: 84, cs: 5, lh: 116 });
    T(s, "延伸問題：投生由亡者自己的業決定{1}，家人行善又怎能幫到亡者？", { x: 142, y: 212, w: 1540, h: 46, s: 31, lh: 44 });
    T(s, "講義引聖嚴法師：「以因果的觀念來面對現實，以因緣的觀念來努力以赴。」{2}", { x: 142, y: 264, w: 1540, h: 40, s: 25, c: GREY, lh: 36 });
    hl(s, 130, 1690, 318);
    [[140, "因", INK, "亡者生前的業", "主要條件"], [380, "緣", INDIGO, "家屬布施、迴向", "輔助條件"], [620, "果", INK, "投生去向", ""]].forEach(([x, g, c, cap, sub]) => {
      T(s, g, { x, y: 342, w: 180, h: 180, s: 150, c, align: "center", lh: 176, check: false });
      T(s, [{ t: cap, c, ...(sub ? { br: true } : {}) }, ...(sub ? [{ t: sub, s: 20, c: GREY }] : [])], { x: x - 25, y: 536, w: 230, h: 72, s: 24, align: "center", lh: 34 });
    });
    T(s, "＋", { x: 320, y: 396, w: 60, h: 70, s: 54, c: GREY, align: "center", check: false });
    T(s, "→", { x: 560, y: 396, w: 60, h: 70, s: 54, c: GREY, align: "center", check: false });
    T(s, "講義原句", { x: 142, y: 648, w: 300, h: 32, s: 22, cs: 2, c: GREY, lh: 32 });
    T(s, "「主要條件為因，輔助條件為緣」{3}", { x: 140, y: 690, w: 740, h: 52, s: 34, cs: 1, lh: 50 });
    vl(s, 890, 344, 796, RULE);
    T(s, [
      { t: "力量有限　", s: 29, c: INDIGO }, { t: "超度「只是一種次要的力量」{4}，決定去向的仍是亡者自己的業。", br: true },
      { t: "時間有限　", s: 29, c: INDIGO }, { t: "死後約四十九日{4}，亡者處於中陰{5}，仍未投生；過了這段時間，亡者已隨自己的業力投生{4}。", br: true },
      { t: "份量有限　", s: 29, c: INDIGO }, { t: "功德分七份，亡者只得一份，其餘六份歸行善的生者{6}；因為投生主要由亡者自己的業決定{1}。", br: true },
      { t: "《地藏經》：「七分之中，而乃獲一，六分功德，生者自利。」{6}", f: KAI, s: 24, c: GREY },
    ], { x: 930, y: 344, w: 756, h: 340, s: 26, lh: 39, para: 14 });
    T(s, "所以迴向不能代替亡者自己的業，只是為亡者添一份助緣{7}；最大的得益者，其實是行善的生者。", { x: 930, y: 706, w: 756, h: 92, s: 29, c: INDIGO, lh: 43 });
    notes(s, ["L8 頁17–18。", "L8 頁42（引聖嚴法師《平安的人間》）。", "L7 頁11。", S.W02 + "。",
      "L8 頁13（中有／中陰）。", S.W07 + "，CBETA, T13, no. 412, p. 784b10。", S.W03 + "（「助緣」）。"]);
  }

  // ---------- P10 由孝親到眾生 ----------
  {
    const s = page("P10", "儀式六　布施迴向", ["E05", "E06", "W09", "W03", "W04"]);
    header(s, "由孝親到眾生", "迴向偈說「普及於一切」{1}：功德可以迴向給所有人。");
    // nested frames, from 孝親 at the core to 一切眾生
    box(s, 140, 300, 580, 470);
    box(s, 190, 360, 480, 352, { c: RULE });
    box(s, 240, 420, 380, 234, { c: RULE });
    box(s, 290, 480, 280, 116, { w: 1.5 });
    box(s, 296, 486, 268, 104);
    T(s, [{ t: "一切眾生" }, { t: "　慈悲", s: 20, c: GREY }], { x: 158, y: 312, w: 400, h: 36, s: 26, c: INDIGO, lh: 36 });
    T(s, "社會", { x: 208, y: 372, w: 300, h: 36, s: 26, lh: 36 });
    T(s, "親友", { x: 258, y: 432, w: 300, h: 36, s: 26, lh: 36 });
    T(s, [{ t: "亡者・家人", br: true }, { t: "孝親", s: 20, c: GREY }], { x: 296, y: 486, w: 268, h: 104, s: 26, align: "center", valign: "middle", lh: 36 });
    let y = 300;
    [
      ["慈悲", "「慈」是給予眾生快樂，「悲」是拔除眾生痛苦（L7 頁45）。"],
      ["報眾生恩", "眾生在過去輪迴中「皆曾互為父母眷屬」，因此「應將孝親之愛擴展至社會每個人」（L7 頁46）。"],
      ["菩薩道", "倫理責任由「不傷害」提升為主動「利益眾生」，以布施等六度參與社會關懷（L7 頁46）。"],
      ["實踐", "帛金做慈善，「等施一切眾生，使之離苦得樂」{2}；「紀念往生者，造福生者，冥陽兩利，圓滿真正的孝道」{3}。"],
    ].forEach(([lab, text]) => {
      T(s, lab, { x: 770, y, w: 160, h: 40, s: 27, c: INDIGO, lh: 40 });
      T(s, text, { x: 940, y, w: 740, h: 82, s: 26, lh: 40 });
      y += 96;
    });
    hl(s, 770, 1690, 690, RULE);
    T(s, [{ t: "對照儒家　", c: INDIGO }, { t: "儒家的仁愛以親疏遠近為基礎，是有差等的愛；佛教的慈悲建立在眾生平等之上（L7 頁45）。" }], { x: 770, y: 704, w: 910, h: 84, s: 26, lh: 40 });
    notes(s, [S.W09 + "，CBETA, T09, no. 262, p. 24c21–22。", S.W03 + "。", S.W04 + "，頁42。"]);
  }

  // ---------- P11 布施，就是練習放手 ----------
  {
    const s = page("P11", "儀式六　布施迴向", ["E03", "E04", "E05", "E06", "E12", "E14", "W08", "W07", "W02"]);
    vl(s, 1400, 96, 796, RULE);
    ["菩薩於法", "應無所住", "行於布施"].forEach((c, i) => T(s, c, { x: 1602 - i * 90, y: 120, w: 76, h: 330, s: 64, cs: 10, f: KAI, vert: "eaVert", valign: "middle" }));
    T(s, [{ t: "《金剛經》" }, { t: "{1}" }], { x: 1420, y: 470, w: 260, h: 34, s: 22, c: GREY, align: "right", lh: 34 });
    T(s, "布施，就是練習放手", { x: 140, y: 88, w: 1240, h: 116, s: 84, cs: 5, lh: 116 });
    hl(s, 130, 1380, 214);
    let y = 234;
    [
      ["放下我執", "苦來自執着，執着來自以為有一個永恆的「我」（L7 頁13；L8 頁33）。修好戒、定、慧，「就能放下我執、自利心」（L7 頁37）。"],
      ["布施即放手", "把先人留下的錢、親友的帛金捐出去，要真的放得下才做得到。《金剛經》說布施「應無所住」{1}，講義所講的般若，正是「不執著世間一切法」的智慧（L7 頁41）。"],
      ["自利利他", "六份功德歸行善的生者{2}，是否只為自己？講義指出，慈悲與智慧把「自利」與「利他」緊緊結合（L7 頁46）：幫人的同時，自己也在修行。"],
      ["把握今生", "聖嚴法師：「修善的主要時間是在各人的生前」{3}。與其擔心先人去了哪裡，不如今天就種善因（凡夫畏果，菩薩畏因，L8 頁42）。"],
    ].forEach(([lab, text]) => {
      T(s, lab, { x: 140, y, w: 190, h: 40, s: 27, c: INDIGO, lh: 40 });
      T(s, text, { x: 340, y, w: 1036, h: 120, s: 26, lh: 40 });
      y += 126;
    });
    T(s, "對生者而言，布施迴向本身就是一場修行。", { x: 140, y: 748, w: 1240, h: 46, s: 29, c: INDIGO });
    notes(s, [S.W08 + "，CBETA, T08, no. 235, p. 749a12–13。", S.W07 + "。", S.W02 + "。"]);
  }

  // ---------- P12 布施迴向的意義（科判） ----------
  {
    const s = page("P12", "儀式六　布施迴向", ["E02", "E04", "E05", "E06", "E09", "W03", "W01", "W06"]);
    header(s, "布施迴向的意義");
    kepan(s, "布施迴向", [
      ["對亡者", "助緣", "業是因，善是緣：家屬行善是亡者的助緣{1}，不能代替亡者自己的業（L7 頁11；L8 頁17–18）。"],
      ["對社會", "善款", "帛金化為善款{2}{3}，把對一個人的孝，擴展為對眾生的慈悲（L7 頁45–46）。"],
      ["對生者", "修行", "布施就是練習放下我執；慈悲與智慧把自利與利他結合（L7 頁37、46）。"],
    ], { top: 236, rowH: 150, rootSize: 64 });
    T(s, "對亡者是助緣，對生者是修行。", { x: 140, y: 712, w: 1540, h: 72, s: 44, cs: 4, c: INDIGO, align: "center", lh: 66 });
    notes(s, [S.W03 + "。", S.W01 + "。", S.W06 + "。"]);
  }

  // ---------- P13 總結：逐一回顧各儀式，再引出下一頁的共同主線 ----------
  {
    const s = page("P13", "結論　總結", ["E02", "E04", "E05", "E06", "E08", "E09", "E10", "E11", "E14", "W04", "W01", "W02"]);
    const top = header(s, "總結：儀式背後的生死觀", "先逐一回顧六個儀式的做法與背後的生死觀，再看它們共同的主線。");
    [[140, 260, "儀式"], [420, 460, "做法"], [900, 540, "反映的生死觀"], [1460, 220, "講義"]].forEach(([x, w, t]) => T(s, t, { x, y: top + 12, w, h: 32, s: 22, cs: 3, c: GREY }));
    hl(s, 130, 1690, top + 50);
    const rows = [
      ["儀式一", "臨終助念", "[Member A]", "去世後約 8–12 小時助念{1}", "臨終的念頭影響去向（隨念）；外呼吸停止後，心識才離體", "L8 頁12、18"],
      ["儀式二", "設靈堂", "[Member A]", "素食祭祀，不用酒肉葷腥{2}", "不殺生，愛護一切生命", "L7 頁39"],
      ["儀式三", "誦經念佛", "[Member B]", "以念佛、誦經代替哭泣{2}", "往生淨土：沒有煩惱、方便修行之處，仍需繼續修行", "L8 頁43"],
      ["儀式四", "出殯", "[Member C]", "佛化奠祭{1}；火葬或土葬{2}", "無常：死亡是必然", "L8 頁26"],
      ["儀式五", "做七", "[Member C]", "每七日一次，至第四十九日{3}", "中陰；輪迴中流轉的只有業", "L8 頁13、21"],
      ["儀式六", "布施迴向", "[Presenter]", "帛金轉做善款，誦迴向偈", "業是因、善是緣；慈悲；放下我執", "L7 頁11、37、45–46"],
    ];
    rows.forEach(([lab, name, who, how, idea, ref], i) => {
      const y = top + 56 + i * 66, c = i === 5 ? INDIGO : INK;
      if (i) hl(s, 130, 1690, y, RULE);
      T(s, [{ t: lab + "　", s: 22, c: INDIGO }, { t: name, c, br: true }, { t: who, s: 19, f: HEI, c: GREY }], { x: 140, y: y + 4, w: 270, h: 60, s: 26, lh: 30, check: false });
      T(s, how, { x: 420, y, w: 460, h: 66, s: 26, lh: 31, valign: "middle", c });
      T(s, idea, { x: 900, y, w: 540, h: 66, s: 26, lh: 31, valign: "middle", c });
      T(s, ref, { x: 1460, y, w: 220, h: 66, s: 20, lh: 28, valign: "middle", c: GREY });
    });
    hl(s, 130, 1690, top + 56 + rows.length * 66);
    notes(s, [S.W04 + "，頁41–45（助念見頁43）。", S.W01 + "。", "釋果東，同①，頁45；四十九日見" + S.W02 + "。"]);
  }

  // ---------- P14 總結：用開頭的苦、執着、放下串起各個儀式 ----------
  {
    const s = page("P14", "結論　總結", ["E01", "E03", "E04", "E08", "E09", "E10", "E11", "E12", "E13", "W04", "W01", "W02"]);
    header(s, "總結：從苦到放下", "它們共同的主線，就是開頭的切入框架{1}：苦從執着而來，出路是放下。");
    // same three steps as P3; two rituals under each, so the end answers the question the talk opened with
    const cols = [
      ["問題", "苦", "面對死亡與分離", [["臨終助念", "[Member A]", ["臨終的念頭影響去向{2}，", "助念陪亡者安心離去。"]], ["誦經念佛", "[Member B]", ["家屬以念佛、誦經代替哭泣{3}。"]]]],
      ["成因", "執着", "放不下身體和身外物", [["設靈堂", "[Member A]", ["素食祭祀{3}、不燒衣紙{2}：", "亡者帶走的只有業{4}。"]], ["出殯", "[Member C]", ["送別遺體：身體會壞，沒有永恆的我{4}。"]]]],
      ["出路", "放下", "為亡者添緣，然後放手", [["做七", "[Member C]", ["四十九日內為亡者添助緣；", "之後亡者已隨業投生{5}，家人學會放手。"]], ["布施迴向", "[Presenter]", ["帛金轉做善款{3}，練習放下我執{6}。"]]]],
    ];
    const xs = [140, 665, 1190], w = 478;
    cols.forEach(([lab, kw, gist, items], i) => {
      const x = xs[i];
      if (i) vl(s, x - 26, 296, 686, RULE);
      T(s, lab, { x, y: 294, w, h: 34, s: 24, cs: 4, c: INDIGO, lh: 34 });
      T(s, kw, { x, y: 328, w, h: 84, s: 64, lh: 82 });
      T(s, gist, { x, y: 414, w, h: 36, s: 24, c: GREY, lh: 34 });
      items.forEach(([name, who, text], k) => {
        const y = 460 + k * 118;
        T(s, [{ t: name, c: INDIGO }, { t: "（" + who + "）", s: 19, f: HEI, c: GREY }], { x, y, w, h: 34, s: 24, lh: 34 });
        T(s, text.map((t, j) => ({ t, ...(j < text.length - 1 ? { br: true } : {}) })), { x, y: y + 36, w, h: 72, s: 24, lh: 34 });
      });
    });
    hl(s, 130, 1690, 700);
    T(s, "佛教喪禮就是以死觀生{7}：對亡者是助緣，對生者是修行。", { x: 140, y: 712, w: 1540, h: 46, s: 31, c: INDIGO, lh: 44 });
    T(s, "儀式一至五整理自組員的報告內容。", { x: 140, y: 766, w: 1540, h: 32, s: 22, c: GREY, lh: 32 });
    notes(s, ["L7 頁3（切入框架）、頁13（苦←執着←我執）。", S.W04 + "，頁42–43（衣紙、助念）；L8 頁12、18。", S.W01 + "。", "L8 頁21、24、33（只有業力流轉；沒有永恆的我）。",
      S.W02 + "；釋果東，同②，頁45；L8 頁13。", "L7 頁37（放下我執）。", "L8 頁41。"]);
  }

  // ---------- P15 本組評價 ----------
  {
    const s = page("P15", "結論　評價", ["E03", "E04", "E05", "E06", "E09", "E10", "E11", "E12", "E14", "W01", "W06", "W05", "W02"]);
    header(s, "本組評價");
    vl(s, 910, 232, 640, RULE);
    T(s, "可取之處", { x: 140, y: 230, w: 740, h: 52, s: 36, cs: 4, lh: 50 });
    T(s, "隱憂", { x: 940, y: 230, w: 740, h: 52, s: 36, cs: 4, lh: 50 });
    const col = (x, items) => T(s, items.flatMap(([h, t], i) => [{ t: h, c: INDIGO }, { t, ...(i < items.length - 1 ? { br: true } : {}) }]), { x, y: 298, w: 740, h: 350, s: 25, lh: 36, para: 14 });
    col(140, [
      ["安頓生者：", "「以佛事代替哭泣」{1}，家人有事可做，把思念化為祝福，陪他們走過與親人死別的愛別離苦（L7 頁13）。"],
      ["簡樸環保：", "不燒冥紙、不殺生（L7 頁39），合乎講義所說「知足常樂，簡樸最佳」（L8 頁29）。"],
      ["化私為公：", "帛金化為善款{2}，私人的哀傷變成助人的行動，實踐菩薩道「利益眾生」（L7 頁46）。"],
    ]);
    col(940, [
      ["理念與現實有落差：", "香港佛教喪禮仍見燒衣紙、破地獄{3}；但輪迴中流轉的只有業力（L8 頁21、24），去向由業決定（L8 頁17–18）；過了四十九日，超度「已不能改變他已經投生的處所」{4}。"],
      ["功德容易變成交易：", "以為捐得多、法事做得大，亡者就去得好；但超度「只是一種次要的力量」{4}，這樣想其實是執着結果（凡夫畏果，L8 頁42）。"],
      ["家庭張力：", "長輩覺得不燒衣紙就是不孝；儒家的愛有親疏遠近，佛教卻講眾生平等（L7 頁45）。兩者如何取捨，留待討論。"],
    ]);
    hl(s, 130, 1690, 666);
    T(s, "本組認為：佛教喪禮最珍貴的地方，在於教生者放下、行善。", { x: 140, y: 690, w: 1540, h: 56, s: 34, c: INDIGO, lh: 50 });
    notes(s, [S.W01 + "。", S.W06 + "。", S.W05 + "，頁7。", S.W02 + "。"]);
  }

  // ---------- P16 討論問題 ----------
  {
    const s = page("P16", "結論　討論", ["E05", "E06", "E10", "E14", "W05", "W07", "W03"]);
    T(s, "問", { x: 1440, y: 96, w: 250, h: 270, s: 220, c: INDIGO, align: "center", lh: 260, check: false });
    T(s, "討論問題", { x: 140, y: 88, w: 1240, h: 116, s: 84, cs: 5, lh: 116 });
    hl(s, 130, 1400, 214);
    T(s, "如果家中長輩堅持燒衣紙、做破地獄{1}，而你想按佛教的方式，把錢捐出去、迴向給先人，你會怎樣和長輩商量？還是應該依長輩的意思做？", { x: 140, y: 236, w: 1240, h: 186, s: 40, lh: 60 });
    T(s, "想一想：孝順，是跟足長輩的做法，還是用另一種方式對先人好？", { x: 140, y: 438, w: 1540, h: 42, s: 27, c: GREY, lh: 40 });
    T(s, [
      { t: "立場甲　", c: INDIGO }, { t: "依長輩的做法：孝順先要顧及長輩的心意；儒家的愛本來就有親疏遠近（L7 頁45）。", br: true },
      { t: "立場乙　", c: INDIGO }, { t: "按佛教的方式：輪迴中流轉的只有業（L8 頁21）；以先人名義行善、迴向，把孝擴展至眾生（報眾生恩，L7 頁46）。" },
    ], { x: 140, y: 494, w: 1540, h: 80, s: 25, lh: 38, para: 4 });
    hl(s, 130, 1690, 596, RULE);
    T(s, [{ t: "本組回應（討論後）　", c: INDIGO }, { t: "孝順不必二選一：尊重長輩的心意，同時以先人名義行善、迴向{3}，把對一個人的孝，擴展為對眾生的慈悲。" }], { x: 140, y: 612, w: 1540, h: 80, s: 26, lh: 40 });
    T(s, [{ t: "後備問題　", c: INDIGO }, { t: "亡者只得七分之一功德{2}，家人花錢做法事，究竟是為亡者，還是為自己？（凡夫畏果，菩薩畏因，L8 頁42）" }], { x: 140, y: 742, w: 1540, h: 40, s: 22, c: GREY, lh: 36 });
    notes(s, [S.W05 + "，頁7。", S.W07 + "。", S.W03 + "（布施、迴向）。"]);
  }

  // ---------- P17 徵引書目 ----------
  {
    const s = page("P17", "徵引書目", [], [{ t: "附錄：" }, { t: "證據索引", c: INDIGO, link: "IDX" }]);
    T(s, "徵引書目", { x: 140, y: 88, w: 1540, h: 116, s: 84, cs: 5, lh: 116 });
    T(s, "L7、L8 為本科講義；W 為網上資料，E 為講義原頁，截圖均見附錄。網上資料均於2026年11月2日瀏覽。", { x: 142, y: 214, w: 1540, h: 34, s: 22, c: GREY, lh: 32 });
    hl(s, 130, 1690, 258);
    const colX = [140, 940];
    const groups = [[D.BIB[0], D.BIB[1]], [D.BIB[2], D.BIB[3]]];
    groups.forEach((gs, ci) => {
      let y = 276;
      gs.forEach((g) => {
        T(s, g.head, { x: colX[ci], y, w: 740, h: 34, s: 22, cs: 4, c: INDIGO, lh: 34 });
        y += 42;
        g.items.forEach(([code, text]) => {
          const m = text.match(/^(.*?)(https?:\/\/\S+?)(。?)$/);
          const segs = m ? [{ t: m[1] }, { t: m[2], url: m[2] }, { t: m[3] }] : [{ t: text }];
          const lines = Math.ceil(textW(text, 19) / (666 * 0.97));
          if (code) T(s, code, { x: colX[ci], y, w: 64, h: 28, s: 19, c: INDIGO, lh: 28, check: false });
          T(s, segs, { x: colX[ci] + 72, y, w: 666, h: lines * 28 + 4, s: 19, lh: 28 });
          y += lines * 28 + 12;
        });
        y += 10;
      });
      if (y > 950) WARN.push(`P17: column ${ci + 1} ends at ${y}px`);
    });
  }

  // ======================= APPENDIX =======================
  const backlinks = (s, id, x, y, w, align) => {
    const uses = (USES[id] || []).filter((p) => TITLE[p]);
    const segs = [{ t: "引用於：" }];
    uses.forEach((p, i) => {
      segs.push({ t: "〈" + TITLE[p] + "〉", c: INDIGO, link: p, tip: "返回〈" + TITLE[p] + "〉" });
      if (i < uses.length - 1) segs.push({ t: "、" });
    });
    segs.push({ t: "　｜　" }, { t: "證據索引", c: INDIGO, link: "IDX", tip: "返回證據索引" });
    T(s, segs, { x, y, w, h: 66, s: 20, c: GREY, align, lh: 30, check: false });
  };
  const LECNAME = { L7: "Lecture 7〈佛教：人性論與人倫觀〉", L8: "Lecture 8〈佛教：人生意義觀與死亡意義觀〉" };

  if (!HAS_EV) {
    console.log("build/ev/ not present (course lecture slides excluded); building main 17 slides only.");
  } else {
  // ---------- 證據索引 ----------
  {
    const s = page("IDX", "附錄　證據", []);
    header(s, "附錄　證據索引", "按代號跳到證據頁；每張證據頁上方可返回引用它的投影片。");
    const line = (id, text) => ({ t: id + "　", c: INDIGO, link: id, tip: "跳到 " + id });
    T(s, "講義原頁（E）", { x: 140, y: 296, w: 740, h: 36, s: 24, cs: 3, c: GREY, lh: 36 });
    T(s, EVIDS.flatMap((id, i) => [line(id), { t: `${D.EV[id].lec} 頁${D.EV[id].pages.map((p) => p[0]).join("、")}　${D.EV[id].topic}`, link: id, ...(i < EVIDS.length - 1 ? { br: true } : {}) }]), { x: 140, y: 340, w: 740, h: 560, s: 22, lh: 38 });
    T(s, "網上資料（W）", { x: 940, y: 296, w: 740, h: 36, s: 24, cs: 3, c: GREY, lh: 36 });
    T(s, WEBIDS.flatMap((id, i) => [line(id), { t: S[id], link: id, ...(i < WEBIDS.length - 1 ? { br: true } : {}) }]), { x: 940, y: 340, w: 740, h: 560, s: 22, lh: 38 });
    s.addNotes("Q&A 用：老師問出處時，喺播放模式撳每頁底部嘅證據代號，或者喺呢頁撳代號跳去證據頁。");
  }

  // ---------- E01–E14 講義原頁 ----------
  for (const id of EVIDS) {
    const ev = D.EV[id];
    const s = page(id, "附錄　證據", [], [{ t: `來源：香港專上學院 SSHD2056 ${LECNAME[ev.lec]}講義原頁；紅框為報告引用的句子。` }]);
    T(s, [{ t: id, c: INDIGO }, { t: `　${ev.lec} 頁${ev.pages.map((p) => p[0]).join("、")}　` }, { t: ev.topic, s: 30, c: GREY }], { x: 140, y: 100, w: 1540, h: 64, s: 44, lh: 62, check: false });
    backlinks(s, id, 140, 168, 1540, "left");
    hl(s, 130, 1690, 214);
    const two = ev.pages.length === 2;
    ev.pages.forEach(([pg, cap], i) => {
      const w = 740, h = 555, x = two ? 140 + i * 800 : 590, y = 240;
      s.addImage({ path: path.join(EVDIR, `${ev.lec}_p${String(pg).padStart(2, "0")}.png`), x: X(x), y: X(y), w: X(w), h: X(h), altText: `${ev.lec} 頁${pg}：${cap}` });
      box(s, x, y, w, h);
      T(s, [{ t: `${ev.lec} 頁${pg}　`, c: INDIGO }, { t: cap }], { x, y: y + h + 14, w, h: 36, s: 22, align: "center", lh: 34 });
    });
    s.addNotes(`證據 ${id}：${ev.lec} 頁${ev.pages.map((p) => p[0]).join("、")}。老師問出處時展示；上方連結返回引用頁。`);
  }

  // ---------- W01–W09 網上資料 ----------
  const fullCite = (id) => D.BIB.flatMap((g) => g.items).find(([c]) => c === id)[1];
  for (const id of WEBIDS) {
    const wv = D.WEB[id];
    const s = page(id, "附錄　證據", [], [{ t: "完整書目見〈徵引書目〉" }]);
    T(s, [{ t: id, c: INDIGO }, { t: "　" + S[id] }], { x: 140, y: 100, w: 1540, h: 64, s: 44, lh: 62, check: false });
    backlinks(s, id, 140, 168, 1540, "left");
    hl(s, 130, 1690, 214);
    // screenshot of the source with the cited lines boxed (scripts/render_web_ev.py, scripts/shot_cbeta.js):
    // beside the excerpts when there are several, below them when there are one or two
    const shot = path.join(EVDIR, id + ".png");
    const png = fs.readFileSync(shot);
    const iw = png.readUInt32BE(16), ih = png.readUInt32BE(20);
    const side = wv.quotes.length > 2, qw = side ? 900 : 1540;
    let y = 240;
    const many = wv.quotes.length >= 5, qs = side ? 22 : 26, qlh = side ? 32 : 40;
    for (const q of wv.quotes) {
      const lines = Math.ceil(textW("「" + q.q + "」", qs) / (qw * 0.97));
      T(s, "「" + q.q + "」", { x: 140, y, w: qw, h: lines * qlh + 4, s: qs, f: KAI, lh: qlh });
      y += lines * qlh + 6;
      const meta = `${q.where ? "位置：" + q.where + "｜" : ""}搜尋：「${q.key}」｜用於：${q.use.map((p) => "〈" + TITLE[p] + "〉").join("、")}`;
      const ml = Math.ceil(textW(meta, 18) / (qw * 0.97));
      T(s, meta, { x: 140, y, w: qw, h: ml * 28, s: 18, c: GREY, lh: 28 });
      y += ml * 28 + (many ? 16 : 24);
    }
    if (y > 810) WARN.push(`${id}: quotes end at ${y}px`);
    const area = side ? { x: 1080, y: 240, w: 600, h: 560 } : { x: 140, y: y + 6, w: 1540, h: 800 - (y + 6) };
    const k = Math.min(area.w / iw, area.h / ih, 1.4);
    const w = iw * k, h = ih * k, x = side ? area.x : area.x + (area.w - w) / 2;
    s.addImage({ path: shot, x: X(x), y: X(area.y), w: X(w), h: X(h), altText: `${id} 原文截圖，紅框為引用句子` });
    box(s, x, area.y, w, h, { c: RULE });
    if (k < 0.45) WARN.push(`${id}: screenshot shrunk to ${Math.round(k * 100)}%`);
    hl(s, 130, 1690, 822, RULE);
    const cite = fullCite(id);
    const m = cite.match(/^(.*?)(https?:\/\/\S+?)。$/);
    const citeLines = Math.ceil(textW("完整出處：" + m[1] + m[2] + "，" + D.DATE + "。", 18) / (1540 * 0.97));
    T(s, [{ t: "完整出處：", c: INDIGO }, { t: m[1] }, { t: m[2], url: m[2] }, { t: "，" + D.DATE + "。" }], { x: 140, y: 836, w: 1540, h: citeLines * 28 + 4, s: 18, lh: 28 });
    T(s, wv.note || "＊截圖於2026年11月2日開啟原文截取，紅框為報告引用的句子。", { x: 140, y: 900, w: 1540, h: 30, s: 18, c: GREY, lh: 28 });
    s.addNotes(`證據 ${id}：${wv.src}。老師問出處時展示截圖（紅框為引用句）；撳完整出處嘅網址可以即場打開原文，用「搜尋」關鍵字搵到引文；上方連結返回引用頁。`);
  }

  }
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, {
    name: "經書",
    colors: { dk1: INK, lt1: "FFFFFF", dk2: INDIGO, lt2: PAPER, accent1: INDIGO, accent2: GREY, accent3: "8C8A84", accent4: "4F5B6E", accent5: "D9D7D0", accent6: "6B6255", hlink: INDIGO, folHlink: INDIGO },
  });
  if (WARN.length) console.log("LAYOUT WARNINGS:\n" + WARN.join("\n"));
  console.log("wrote", OUT, "slides:", ORDER.length);
}

build().catch((e) => { console.error(e); process.exit(1); });
