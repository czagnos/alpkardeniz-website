"""Kaynak JPEG'lerden WebP varyantları ve og:image üretir.

Kullanım:
  python3 tools/unbundle.py <eski-index.html> <cikti-klasoru>   # (bir kez) eski bundle'dan JPEG'leri çıkarır
  python3 tools/optimize-images.py <cikti-klasoru>/assets

Çıktı: assets/img/<ad>-<genişlik>.webp, assets/img/og-image.jpg ve
src/data/images.json (build script'in width/height/srcset için okuduğu boyutlar).
Gereksinim: Pillow (pip install pillow).
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img')
WIDTHS = [480, 720, 960, 1600]  # kaynak daha darsa en büyük varyant kaynak genişliğinde kalır
QUALITY = 82  # 66'da pide kabuğu gibi ince dokular belirgin şekilde bulanıklaşıyordu
# Sayfanın LCP görseli olanlar: Lighthouse mobil (yavaş 4G) LCP < 2,5 sn kalsın diye daha düşük kalite.
# salon-dikey: kalite 60'ta (56 KB) LCP 2,4–2,5 sn sınırında kalıyordu, 50'de (51 KB) 2,25 sn.
QUALITY_BY_NAME = {'salon-dikey': 50, 'pide-sofrasi': 70}

# eski bundle'daki dosya kimliği -> anlamlı ad, ya da (ad, (en, boy)).
# Oran verilirse görsel sayfadaki aspect-ratio kutusuna ortadan kırpılır; object-fit: cover
# zaten ortadan kırptığı için görünüm aynı kalır, gereksiz piksel indirilmez.
NAMES = {
    'bb33cd1d-c388-4d3d-8b81-7339341e5a10': 'salon',
    '76e94085-8631-4990-80fe-0499ac65f16e': ('usta-hamur', (4, 5)),
    'bd405777-1388-40e9-9f91-dfecfd7860ca': ('tereyagi-firca', (3, 4)),
    '0bf2ab80-e64b-4457-ab3e-75796816ef7a': ('pide-tepsiler', (4, 5)),
    'bfb3822c-6183-4c17-a43f-549cc2e149ee': ('firin-sutlac', (1, 1)),
    '964bb9df-3dfa-4d12-99e2-1699f7834f8a': ('yumurtali-kavurmali-yakin', (3, 4)),
    '52dc7d17-b2c6-4273-92a6-6a24615b5f38': ('kavurmali-pide-tabak', (3, 4)),
    '4b311704-a2a5-412a-8338-574a30a75fc3': ('kapali-pide-sepet', (16, 10)),
    '1eec660b-ff79-4ca9-98e9-092ceb9ce662': ('firindan-cikaris', (3, 4)),
    'b4e165b8-3777-448b-807e-d788b864725a': ('sucuklu-kasarli', (1, 1)),
    '5f00abeb-54e1-4660-8925-3a298432ac54': ('kavurmali-acik-tepsi', (2, 3)),
    '9a195c60-1be9-4510-931e-1248513dbcc0': ('kapali-pide-tugla', (3, 4)),
    'af3633ad-781b-43c9-915d-283f0f71ea09': ('mantarli-kasarli', (3, 4)),
    '688f2c14-1b54-468e-8271-3d24f88af0d5': ('dilimli-pideler', (4, 5)),
    'd7ebf13d-3fc6-4c89-a8b8-5b37f720bc47': ('kavurmali-yumurtali-tabak', (3, 4)),
    'd7bb418a-5443-4afd-8cb6-14de74065629': 'kemerli-nisler',
    'a2693dc0-3325-4fd6-9b21-3bb4b3931a20': 'usta-firin',
    'd01390f0-21a7-4f99-b887-eef9b06edf77': ('pide-sofrasi', (4, 3)),
}
# Aynı kaynaktan ek kırpımlar: ad -> (dosya kimliği, oran).
# salon-dikey: telefonda hero (92vh, object-fit: cover) yatay fotoğrafın yalnızca orta şeridini
# gösteriyor. 960'lık yatay varyant orada 2-3 kat büyütülüp bulanıklaşıyordu; bu şerit kaynağın tam
# çözünürlüğünde ayrı dosya olarak verilir (index.html'de <picture>, max-aspect-ratio: 3/5).
CROPS = {
    'salon-dikey': ('bb33cd1d-c388-4d3d-8b81-7339341e5a10', (31, 50)),
}
OG_SOURCE = 'salon'


def center_crop(im, ratio):
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio)
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = round(w / ratio)
    top = (h - nh) // 2
    return im.crop((0, top, w, top + nh))


def main(src_dir):
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    jobs = [(uid, *(e if isinstance(e, tuple) else (e, None))) for uid, e in NAMES.items()]
    jobs += [(uid, name, ratio) for name, (uid, ratio) in CROPS.items()]
    for uid, name, ratio in jobs:
        im = Image.open(os.path.join(src_dir, uid + '.jpg')).convert('RGB')
        if ratio:
            im = center_crop(im, ratio[0] / ratio[1])
        w, h = im.size
        widths = [x for x in WIDTHS if x < w]
        if widths and w - widths[-1] <= 200:  # 960 ile 1000 gibi neredeyse aynı varyantlarda kaynağı tut
            widths.pop()
        widths.append(w)
        for tw in widths:
            th = round(h * tw / w)
            im.resize((tw, th), Image.LANCZOS).save(
                os.path.join(OUT, f'{name}-{tw}.webp'), 'WEBP', quality=QUALITY_BY_NAME.get(name, QUALITY), method=6)
        meta[name] = {'width': w, 'height': h, 'widths': widths}
        if name == OG_SOURCE:
            # 1200x630 ortadan kırpma
            scale = max(1200 / w, 630 / h)
            r = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
            left, top = (r.width - 1200) // 2, (r.height - 630) // 2
            r.crop((left, top, left + 1200, top + 630)).save(
                os.path.join(OUT, 'og-image.jpg'), 'JPEG', quality=82, optimize=True, progressive=True)
    with open(os.path.join(ROOT, 'src', 'data', 'images.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
        f.write('\n')


if __name__ == '__main__':
    main(sys.argv[1])
