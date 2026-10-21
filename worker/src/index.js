// /yorum sayfası için çerezsiz sayaç + rapor.
// Saklanan tek şey: olay adı, zaman damgası, platform. IP, user-agent veya kimlik saklanmaz.

const EVENTS = ["page_view", "click_maps_app", "click_direct_review"];
const PLATFORMS = ["iOS", "Android", "other"];
// Türkiye 2016'dan beri sabit UTC+3; günler İstanbul saatine göre sayılır.
const TZ = "+3 hours";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/e" && request.method === "POST") return record(request, env);
    if (url.pathname === "/report" && request.method === "GET") return report(url, env);
    return new Response("Not found", { status: 404 });
  },
};

async function record(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (origin && allowed.length && !allowed.includes(origin)) {
    return new Response(null, { status: 403 });
  }

  let data;
  try {
    data = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!EVENTS.includes(data.e)) return new Response(null, { status: 400 });
  const platform = PLATFORMS.includes(data.p) ? data.p : "other";

  await env.DB.prepare("INSERT INTO events (event, platform, ts) VALUES (?, ?, ?)")
    .bind(data.e, platform, Date.now())
    .run();
  return new Response(null, { status: 204 });
}

async function report(url, env) {
  if (!env.REPORT_KEY || url.searchParams.get("key") !== env.REPORT_KEY) {
    return new Response("Yetkisiz", { status: 401 });
  }

  const day = `date(ts / 1000, 'unixepoch', '${TZ}')`;
  // Hafta Pazartesi başlar.
  const week = `date(ts / 1000, 'unixepoch', '${TZ}', 'weekday 0', '-6 days')`;
  const since = (days) => Date.now() - days * 86400000;

  const [daily, weekly] = await Promise.all([
    env.DB.prepare(
      `SELECT ${day} AS period, event, platform, COUNT(*) AS n FROM events
       WHERE ts >= ? GROUP BY period, event, platform`
    ).bind(since(14)).all(),
    env.DB.prepare(
      `SELECT ${week} AS period, event, platform, COUNT(*) AS n FROM events
       WHERE ts >= ? GROUP BY period, event, platform`
    ).bind(since(7 * 12)).all(),
  ]);

  if (url.searchParams.get("format") === "json") {
    return Response.json({ daily: daily.results, weekly: weekly.results });
  }

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>/yorum raporu</title>
<style>
body{font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:16px;color:#1C1C1A;background:#FAF7F2}
h1{font-size:20px}h2{font-size:17px;margin-top:28px}
.t{overflow-x:auto}table{border-collapse:collapse;min-width:100%;background:#fff}
th,td{border:1px solid #DACEB8;padding:6px 8px;text-align:right;white-space:nowrap}
th:first-child,td:first-child{text-align:left}thead th{background:#F3EEE4}
small{color:#5C5A52}
</style></head><body>
<h1>/yorum sayaçları</h1>
<p><small>Okutma = page_view. Maps = ana buton, Yedek = yedek link. Parantez içi: iOS / Android / diğer. Saatler İstanbul.</small></p>
<h2>Haftalık (son 12 hafta, Pazartesi başlangıç)</h2>${table(weekly.results, "Hafta")}
<h2>Günlük (son 14 gün)</h2>${table(daily.results, "Gün")}
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function table(rows, label) {
  const by = new Map();
  for (const r of rows) {
    if (!by.has(r.period)) by.set(r.period, {});
    const p = by.get(r.period);
    p[r.event] ??= { iOS: 0, Android: 0, other: 0, total: 0 };
    p[r.event][r.platform] += r.n;
    p[r.event].total += r.n;
  }
  const periods = [...by.keys()].sort().reverse();
  if (!periods.length) return "<p>Henüz veri yok.</p>";

  const cell = (c) => (c ? `${c.total} <small>(${c.iOS} / ${c.Android} / ${c.other})</small>` : "0");
  const pct = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "–");
  const body = periods
    .map((period) => {
      const p = by.get(period);
      const views = p.page_view?.total || 0;
      const maps = p.click_maps_app?.total || 0;
      const direct = p.click_direct_review?.total || 0;
      return `<tr><td>${period}</td><td>${cell(p.page_view)}</td><td>${cell(p.click_maps_app)}</td>
<td>${cell(p.click_direct_review)}</td><td>${pct(maps, views)}</td><td>${pct(direct, views)}</td></tr>`;
    })
    .join("");
  return `<div class="t"><table><thead><tr><th>${label}</th><th>Okutma</th><th>Maps</th><th>Yedek</th>
<th>Maps %</th><th>Yedek %</th></tr></thead><tbody>${body}</tbody></table></div>`;
}
