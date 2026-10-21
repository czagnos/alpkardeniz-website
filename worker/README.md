# /yorum sayaçları (Cloudflare Worker + D1)

Site GitHub Pages'te statik olduğu için sayaçlar ayrı, küçük bir Cloudflare Worker'da tutulur
(Turnstile için zaten Cloudflare hesabı var; Worker + D1 ücretsiz katmanda yeter).

Saklanan tek şey: olay adı, zaman damgası, platform (`iOS` / `Android` / `other`).
IP, user-agent, çerez veya kimlik saklanmaz.

| Olay | Anlamı |
|---|---|
| `page_view` | Sayfa açılışı (= QR okutma) |
| `click_maps_app` | Ana butona dokunma |
| `click_direct_review` | Yedek linke dokunma |

## Kurulum (bir kez)

```sh
cd worker
npx wrangler login
npx wrangler d1 create alp-yorum-stats        # çıkan database_id'yi wrangler.toml'a yazın
npx wrangler d1 execute alp-yorum-stats --remote --file=schema.sql
npx wrangler secret put REPORT_KEY             # rapor için uzun, rastgele bir anahtar
npx wrangler deploy                            # çıktıda https://alp-yorum-stats.<hesap>.workers.dev
```

Sonra `yorum.html` içindeki config bloğunda:

```js
var STATS_URL = "https://alp-yorum-stats.<hesap>.workers.dev/e";
```

`STATS_URL` boş kalırsa sayfa çalışır, yalnızca sayım yapılmaz.

## Rapor

```
https://alp-yorum-stats.<hesap>.workers.dev/report?key=<REPORT_KEY>
```

Son 12 haftanın haftalık (Pazartesi başlangıç) ve son 14 günün günlük sayıları, her hücrede
iOS / Android / diğer kırılımı ve okutma başına Maps / yedek link tıklama oranı. Günler İstanbul
saatine göredir. Ham veri için `&format=json` ekleyin.

Haftalık okutma sayısını Google Business Profile'daki haftalık yorum artışıyla karşılaştırın.
`Yedek %` sürekli sıfıra yakınsa yedek link kullanılmıyor demektir.

## Notlar

- `ALLOWED_ORIGINS` (wrangler.toml) dışından gelen olaylar reddedilir.
- Yerelde denemek için: `npx wrangler dev` ve `wrangler d1 execute ... --local --file=schema.sql`.
