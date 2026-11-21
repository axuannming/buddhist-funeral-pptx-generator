import sys, zipfile, re, shutil, os
src = sys.argv[1]
tmp = src + ".tmp"
zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED)
for info in zin.infolist():
    data = zin.read(info.filename)
    if info.filename == "ppt/theme/theme1.xml":
        t = data.decode("utf-8")
        def fix(block, ea, hant):
            block = re.sub(r'<a:ea typeface="[^"]*"/>', f'<a:ea typeface="{ea}"/>', block, count=1)
            block = re.sub(r'<a:font script="Hant" typeface="[^"]*"/>', f'<a:font script="Hant" typeface="{hant}"/>', block, count=1)
            return block
        t = re.sub(r'<a:majorFont>.*?</a:majorFont>', lambda m: fix(m.group(0), "PMingLiU", "新細明體"), t, flags=re.S)
        t = re.sub(r'<a:minorFont>.*?</a:minorFont>', lambda m: fix(m.group(0), "PMingLiU", "新細明體"), t, flags=re.S)
        data = t.encode("utf-8")
    zout.writestr(info, data)
zout.close(); zin.close()
os.replace(tmp, src)
z = zipfile.ZipFile(src); t = z.read("ppt/theme/theme1.xml").decode()
print(re.findall(r'<a:(?:major|minor)Font><a:latin typeface="[^"]*"/><a:ea typeface="[^"]*"/>', t))
print(re.findall(r'<a:font script="Hant" typeface="[^"]*"/>', t))
