# alpkardeniz-website

alpkaradeniz.com — GitHub Pages üzerinde yayınlanan statik site.

> **Önemli:** Site artık bu repoda, düz HTML/CSS olarak düzenleniyor. Tasarım aracından
> export edilip `index.html` üzerine **yazılmamalı**; bu, SEO etiketlerini, ayrı sayfa
> URL'lerini ve yapılandırılmış veriyi siler. Eski tek dosyalık export git geçmişinde duruyor.

## Yapı

| Yol | Ne |
| --- | --- |
| `src/pages/*.html` | Sayfa kaynakları (`/`, `/menu`, `/hikayemiz`, `/rezervasyon`, `/iletisim`, `/sss`) |
| `src/partials/` | Ortak `<head>`, header ve footer |
| `src/layouts/default.html` | KVKK `.md` sayfalarının Jekyll layout kaynağı; build `_layouts/default.html`'i üretir |
| `src/data/site.json` | İşletme bilgileri (adres, telefon, saatler, linkler) — footer ve JSON-LD buradan |
| `src/data/menu.json` | Menü, fiyatlar ve isteğe bağlı `description` — hem görünen menü hem `Menu` JSON-LD buradan |
| `src/data/faq.json` | SSS soru/cevapları — hem `/sss` sayfası hem `FAQPage` JSON-LD buradan; saat/telefon/adres/e-posta `site.json`'dan, yumurta ilavesi `menu.json`'dan (`eggExtraPrice`) |
| `src/data/images.json` | Görsel boyutları (`tools/optimize-images.py` üretir) |
| `assets/css/site.css` | Tek CSS dosyası (design system tokenları + bileşenler) |
| `assets/js/rezervasyon.js` | Rezervasyon formu (canlı backend'e gönderir) |
| `assets/js/kvkk.js` | Aydınlatma / Açık Rıza penceresi (yalnızca rezervasyon sayfasında) |
| `index.html`, `menu.html`, …, `_layouts/` | **Üretilen** çıktı — elle düzenleme, `src/`'yi düzenleyip build al |
| `yorum.html`, `worker/` | QR yorum sayfası ve sayaç Worker'ı (build'den bağımsız) |

## Düzenleme

```sh
node src/build.mjs        # src/ -> kök dizindeki .html dosyaları, _layouts/default.html + sitemap.xml
node tools/serve.mjs      # http://localhost:8080 (GitHub Pages gibi /menu -> menu.html)
```

Node 18+ yeterli, `npm install` gerekmiyor. Üretilen HTML dosyalarını da commit'le.

- Fiyat değişikliği: `src/data/menu.json` → build.
- Adres/telefon/saat: `src/data/site.json` → build. Google İşletme Profili ile birebir aynı yazılmalı.
- Yeni fotoğraf: `tools/optimize-images.py` içindeki listeye ekle, WebP'leri üret, sayfada
  `<img data-img="ad" sizes="…" alt="…">` olarak kullan.

## Rezervasyon formu

`assets/js/rezervasyon.js`, `restaurant-manager-backend` servisine POST eder ve Cloudflare
Turnstile kullanır. Payload alanları (customerName, phone, email, partySize, reservationTime,
note, turnstileToken, marketingConsent, utm) backend ile sözleşmedir; backend'i değiştirmeden
değiştirme. Lokal testte Cloudflare'in test site key'ini (`1x00000000000000000000AA`) geçici
olarak kullan, commit'leme.

## Analitik

Cloudflare Web Analytics snippet'i `src/partials/footer.html`'in sonunda, `</body>`'den hemen önce
duruyor; build ile tüm sayfalara ve `_layouts/default.html` üzerinden KVKK sayfalarına geliyor.
`yorum.html` build dışında olduğu için orada elle ekli. Başka analitik/izleme script'i, çerez
veya localStorage eklenmiyor.

## Yayınlanmayanlar

`_config.yml` içindeki `exclude` listesi: `worker/`, `docs/`, `.idea/`, `src/`, `tools/`, `README.md`.
