"""Eski tasarım aracı export'unu (tek dosyalık index.html) çözer.

Kullanım: python3 tools/unbundle.py <eski-index.html> <cikti-klasoru>
  git show 9421b4b:index.html > eski.html   # bundle'ın son hali
Çıktı: <klasor>/assets/<uuid>.<uzantı> (JPEG, TTF, JS), <klasor>/template.html
"""
import json, base64, gzip, re, sys, os, mimetypes
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def block(t):
    m = re.search(r'<script type="%s">(.*?)</script>' % re.escape(t), s, re.S)
    return m.group(1) if m else None
man = json.loads(block('__bundler/manifest'))
tpl = json.loads(block('__bundler/template'))
ext = json.loads(block('__bundler/ext_resources') or '[]')
os.makedirs(out+'/assets', exist_ok=True)
names = {}
for u, e in man.items():
    b = base64.b64decode(e['data'])
    if e.get('compressed'): b = gzip.decompress(b)
    extn = {'image/jpeg':'.jpg','font/ttf':'.ttf','application/javascript':'.js','text/javascript':'.js','image/png':'.png','image/svg+xml':'.svg','text/css':'.css'}.get(e['mime'], mimetypes.guess_extension(e['mime']) or '.bin')
    fn = u + extn
    open(f'{out}/assets/{fn}','wb').write(b)
    names[u] = 'assets/'+fn
    print(u, e['mime'], len(b), e.get('compressed'))
for u,fn in names.items(): tpl = tpl.replace(u, fn)
open(out+'/template.html','w').write(tpl)
json.dump({'ext_resources':ext,'files':names}, open(out+'/index.json','w'), indent=1)
