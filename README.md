# Buddhist Funeral Presentation & Programmatic PPTX Generator (`SSHD2056`)

**Course Context:** SSHD2056 *Exploring Traditional Chinese Thought on Life & Death, Human Nature, and Ethics* — **4-Member Group Presentation**.

This repository contains the programmatic **Node.js (`pptxgenjs`) + Python OpenXML** slide generation pipeline, HTML/CSS design-direction prototypes (`經書` thread-bound book aesthetic), verified citation audit log, and sanitized deliverables for **my individual presentation scope**.

---

## Group Attribution & Personal Contribution Scope

- **Group Context**: 4-member collaborative presentation analyzing Buddhist funeral rituals and views on life and death (*以死觀生*). Full team decks (`生死觀*.pdf`) and teammates' individual ritual sections (Rituals 01–05) are excluded to protect teammate privacy and intellectual property.
- **My Individual Presentation Sections**:
  1. **Introduction (P1–P7)**: Cover, Table of Contents, *Suffering / Attachment / Letting Go* framework, the 3-stage process of death (*dying, intermediate state / bardo, rebirth*), cross-school comparison (*Confucianism, Daoism, Mohism, Religious Daoism, Buddhism*), Buddhist vs. Hong Kong Chinese folk funeral practices, and the Three Marks of Existence (*三法印*).
  2. **Ritual 06 — Almsgiving & Merit Dedication (`布施行善・功德迴向`, P8–P12)**: Converting funeral condolence money (*帛金*) into charitable donations, primary cause (*因 / karma*) vs. auxiliary condition (*緣 / merit dedication*), universal compassion (*由孝親到眾生*), and non-attachment in practice (*金剛經*).
  3. **Conclusion, Group Evaluation & Discussion (P13–P17)**: Synthesis mapping all 6 rituals back to the opening framework, strengths/concerns evaluation, interactive discussion prompts, and bibliography.
- **Programmatic Engineering & Verification Pipeline**:
  - `build/build.js` + `build/data.js`: 1920×1080 coordinate-grid `pptxgenjs` generator implementing traditional thread-bound book (*線裝經書*) framing, vertical *banxin* (`版心`) headers, *kepan* (`科判`) bracket trees, superscript footnote indices, speaker-note injection (`[可略：…]` pacing markers), and layout overflow checks (`WARN`).
  - `build/patch_theme.py` & `build/scripts/apply_theme.js`: Post-processes `ppt/theme/theme1.xml` inside `.pptx` OpenXML archives to enforce custom theme color slots (`dk1`–`folHlink`) and Traditional Chinese font mapping (`PMingLiU` / `新細明體`).
  - `build/scripts/check_quotes.py` & `research/sources_and_quotes.md`: Cross-checks every quoted passage (`「…」`) on the slides against verified primary web PDFs (Dharma Drum Mountain, NTU Buddhist Digital Library, Lord Wilson Heritage Trust report, Society for the Promotion of Hospice Care) and CBETA Buddhist canon line numbers (`T08`, `T09`, `T13`).

---

## Repository Structure

```text
├── build/
│   ├── build.js                     # Main pptxgenjs slide deck generator (1920x1080 grid)
│   ├── data.js                      # Structured citations, bibliography & web evidence metadata
│   ├── patch_theme.py               # OpenXML ppt/theme/theme1.xml East-Asian font patcher
│   ├── package.json                 # pptxgenjs & playwright-core dependencies
│   └── scripts/
│       ├── apply_theme.js           # Custom 12-slot theme color XML injector
│       ├── check_quotes.py          # Automated quotation-to-source substring verifier
│       └── dump_pptx.py             # python-pptx slide text/table/note inspector
├── design-demos/
│   ├── directions.md                # Visual grammar exploration across 3 style directions
│   ├── direction-approved.md        # Approved design grammar (經書 thread-bound book style)
│   ├── spec.md                      # Typography, grid & color specification
│   ├── compare.html                 # Side-by-side comparison page
│   └── dir-1/, dir-2/, dir-3/       # Pure HTML/CSS slide prototypes (P2 & P9)
├── research/
│   └── sources_and_quotes.md        # Line-by-line verified online & CBETA primary sources (W01–W09)
├── script/
│   └── speaker_script_individual.md # Sanitized Cantonese speaker script (v2.7) with pacing marks
└── docs/
    ├── slides_individual_sections.pdf     # Sanitized 17-page main slides (Intro, Ritual 06, Conclusion)
    ├── speaker_script_individual.pdf      # Sanitized Cantonese speaker script PDF (with必講/可略 pacing)
    └── script_revision_comparison.pdf     # Sanitized 3-column diff (v1 vs final vs revision rationale)
```

*Course lecture slides (`materials/`, `build/ev/`, `build/lecture_pdf_fixed/`), past student samples, teammate WhatsApp screenshots, and intermediate build artifacts (`v1`–`v4`) are strictly excluded.*

---

## Evidenced Technical Details & Workflow

- **Programmatic PPTX Layout & Theme Engine (`build/build.js`, `build/scripts/apply_theme.js`, `build/patch_theme.py`)**:
  - `pptxgenjs` hard-codes the Office color palette and default East-Asian font slots; post-processing `ppt/theme/theme1.xml` directly fixes both scheme colors and `PMingLiU` / `新細明體` typography, while supporting a `CANVA=1` build mode that converts vertical `eaVert` text into stacked characters and disables intra-deck slide hyperlinks prior to Canva merge.
- **Primary Source & Sutra Verification (`research/sources_and_quotes.md`, `build/scripts/check_quotes.py`)**:
  - All 9 external web/canon sources (`W01`–`W09`) were verified directly against original PDFs and CBETA (`T13 no. 412`, `T08 no. 235`, `T09 no. 262` — including correcting punctuation in the *Diamond Sutra* quote to match CBETA verbatim).
- **Iterative Cantonese Speaker Script Refinement (`docs/script_revision_comparison.pdf`)**:
  - Tracks side-by-side revisions from draft `v1` to final `v2.7`, eliminating homophone ambiguity in spoken Cantonese (e.g., removing spoken page numbers because 「頁」 and 「業」 are homophones), enforcing 3-character/sec speech-rate pacing with optional `{{…}}` skippable clauses, and deduplicating overlap with teammates' slides.

> **Note (Pending User Input):** Personal AI-prompting strategies, specific prompt examples, and subjective debugging/authoring difficulties encountered while developing the generator and Cantonese speaker script are pending user input and will be added once confirmed.

---

## How to Run / Verify

1. **Syntax verification**:
   ```bash
   node --check build/build.js
   node --check build/data.js
   node --check build/scripts/apply_theme.js
   python -m py_compile build/patch_theme.py build/scripts/check_quotes.py build/scripts/dump_pptx.py
   ```
2. **Generate the 17-slide PPTX deck** (from `build/` after `npm install`):
   ```bash
   cd build
   npm install
   node build.js deck.pptx
   python patch_theme.py deck.pptx
   ```
   *(Note: Because copyrighted course lecture slide screenshots in `build/ev/` are excluded from this repository, `build.js` automatically builds the 17 main slides without the appendix evidence pages.)*
3. **Verify quotes against `research/sources_and_quotes.md`**:
   ```bash
   python build/scripts/check_quotes.py build/deck.pptx
   ```
