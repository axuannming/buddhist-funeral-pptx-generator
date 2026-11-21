# Checks that every 「quoted」 passage on the slides comes from a real source: the lecture PDFs
# (build/lecture_pdf_fixed) or the verified web quotes in research/sources_and_quotes.md.
#   python scripts/check_quotes.py deck.pptx
import re, sys, zipfile, os
import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
deck = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "deck.pptx")

def norm(s):
    s = re.sub(r"[\s　]", "", s)
    s = s.translate(str.maketrans("()，,;；:：!！?？.。、", "（）,,;;::!!??..,"))
    return re.sub(r"[「」『』〈〉《》（）\"'“”]", "", s)

corpus = ""
lec_dir = os.path.join(HERE, "..", "lecture_pdf_fixed")
if os.path.isdir(lec_dir):
    for lec in ("L7", "L8"):
        p = os.path.join(lec_dir, lec + ".pdf")
        if os.path.isfile(p):
            doc = pymupdf.open(p)
            corpus += "".join(page.get_text() for page in doc)
corpus += open(os.path.join(ROOT, "research", "sources_and_quotes.md"), encoding="utf-8").read()
corpus = norm(corpus)

z = zipfile.ZipFile(deck)
slides = sorted((n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)), key=lambda n: int(re.findall(r"\d+", n)[0]))
bad = checked = 0
for name in slides:
    xml = z.read(name).decode("utf-8")
    paras = ["".join(re.findall(r"<a:t>([^<]*)</a:t>", p)) for p in re.findall(r"<a:p>.*?</a:p>", xml, re.S)]
    text = "\n".join(paras)
    for q in re.findall(r"「([^「」]*(?:「[^「」]*」[^「」]*)*)」", text):
        for part in re.split(r"……|…", q):
            part = re.sub(r"[①-⑳]", "", part)
            if len(norm(part)) < 6:
                continue
            checked += 1
            if norm(part) not in corpus:
                bad += 1
                print(f"slide {re.findall(r'\d+', name)[0]}: NOT FOUND 「{part}」")
print("quotes checked:", checked, "| not found:", bad)

