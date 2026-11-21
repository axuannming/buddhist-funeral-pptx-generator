import sys
from pptx import Presentation
from pptx.util import Emu
p = Presentation(sys.argv[1])
print("slide size", p.slide_width, p.slide_height, "n=", len(p.slides))
for i, s in enumerate(p.slides, 1):
    print(f"\n######## SLIDE {i} ########")
    for sh in s.shapes:
        def dump(sh, depth=0):
            if sh.shape_type == 6:  # group
                for x in sh.shapes: dump(x, depth+1)
                return
            if sh.has_text_frame:
                t = sh.text_frame.text.strip()
                if t: print("  "*depth + "- " + t.replace("\n", "\n" + "  "*depth + "  "))
            if getattr(sh, "has_table", False) and sh.has_table:
                for r in sh.table.rows:
                    print("  "*depth + " | ".join(c.text.strip() for c in r.cells))
            if sh.shape_type == 13:
                print("  "*depth + "[picture]")
        dump(sh)
    if s.has_notes_slide:
        n = s.notes_slide.notes_text_frame.text.strip()
        if n: print("  NOTES:", n)
