// Statik site üreticisi — bağımlılık yok. Çalıştır: node src/build.mjs
//
// src/pages/*.html  ->  kök dizinde aynı adlı .html (çıktı commit'lenir)
// src/layouts/default.html  ->  _layouts/default.html (KVKK .md sayfaları için Jekyll layout'u)
//
// Sayfa sözdizimi:
//   <!-- { ...json... } -->         dosyanın başında sayfa ayarları (path, nav, title, description)
//   {{ a.b }} / {{{ a.b }}}         değer (kaçışlı / ham)
//   {{> header }}                   src/partials/header.html
//   {{@ menu }}, {{@ jsonld }}, {{@ preload }}, {{@ asset /yol }}   üretilen bloklar
//   <img data-img="ad" sizes="…">   src/data/images.json'dan srcset/width/height eklenir;
//                                   data-eager yoksa loading="lazy" olur (<source data-img> da desteklenir)
//   <!--@head-->…<!--@endhead-->    <head> sonuna eklenir; <!--@body-->…<!--@endbody--> </body> öncesine
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SRC, '..');
const readJson = (p) => JSON.parse(readFileSync(join(SRC, p), 'utf8'));

const site = readJson('data/site.json');
const menu = readJson('data/menu.json');
const images = readJson('data/images.json');

// Yol tarifi (Google Maps URLs): place_id öncelikli, koordinat yedek
site.directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.geo.latitude},${site.geo.longitude}&destination_place_id=${site.googlePlaceId}`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (ctx, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
const imgPath = (name, w) => `/assets/img/${name}-${w}.webp`;

function assetUrl(path) {
  const hash = createHash('sha1').update(readFileSync(join(ROOT, path))).digest('hex').slice(0, 8);
  return `${path}?v=${hash}`;
}

function srcset(name) {
  const meta = images[name];
  if (!meta) throw new Error(`images.json'da yok: ${name}`);
  return meta.widths.map((w) => `${imgPath(name, w)} ${w}w`).join(', ');
}

// <picture> içindeki <source data-img="ad" media="…" sizes="…">: yalnızca srcset ve boyut eklenir
function expandSource(tag) {
  const name = tag.match(/data-img="([^"]+)"/)[1];
  const meta = images[name];
  if (!meta) throw new Error(`images.json'da yok: ${name}`);
  return tag.replace(/\sdata-img="[^"]+"/, '').replace(/^<source/, `<source srcset="${srcset(name)}" width="${meta.width}" height="${meta.height}"`);
}

function expandImg(tag) {
  const name = tag.match(/data-img="([^"]+)"/)[1];
  const meta = images[name];
  if (!meta) throw new Error(`images.json'da yok: ${name}`);
  const eager = /\sdata-eager\b/.test(tag);
  const fallback = meta.widths.find((w) => w >= 960) || meta.widths[meta.widths.length - 1];
  const attrs = [
    `src="${imgPath(name, fallback)}"`,
    `srcset="${srcset(name)}"`,
    `width="${meta.width}" height="${meta.height}"`,
    eager ? 'fetchpriority="high"' : 'loading="lazy"',
    'decoding="async"',
  ].join(' ');
  return tag.replace(/\sdata-img="[^"]+"/, '').replace(/\sdata-eager\b/, '').replace(/^<img/, `<img ${attrs}`);
}

const fmtPrice = (n) => String(n);

function menuHtml() {
  return menu.sections.map((sec) => {
    const items = sec.items.map((it) => `      <li class="menu-item${it.description ? ' menu-item--desc' : ''}">
        <span class="menu-item__name">${esc(it.name)}</span>
        <span class="menu-item__dots" aria-hidden="true"></span>
        <span class="menu-item__price">${fmtPrice(it.price)}<span class="visually-hidden"> TL</span></span>${it.description ? `
        <span class="menu-item__desc">${esc(it.description)}</span>` : ''}
      </li>`).join('\n');
    const note = sec.note ? `\n    <p class="menu-section__note">${esc(sec.note)}</p>` : '';
    return `  <section class="menu-section">
    <div class="menu-section__head">
      <h2 class="menu-section__title">${esc(sec.title)}</h2>
      <span class="menu-section__line"></span>
    </div>
    <ul class="menu-list">
${items}
    </ul>${note}
  </section>`;
  }).join('\n');
}

function priceRange() {
  const prices = menu.sections.flatMap((s) => s.items.map((i) => i.price));
  return `${Math.min(...prices)}–${Math.max(...prices)} TRY`;
}

function restaurantLd() {
  const ld = {
    '@type': 'Restaurant',
    '@id': `${site.url}/#restaurant`,
    name: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/assets/img/logo.png`,
    image: `${site.url}/assets/img/og-image.jpg`,
    telephone: site.telephone,
    email: site.email,
    address: { '@type': 'PostalAddress', ...site.address },
    hasMap: site.mapsUrl,
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: site.opens,
      closes: site.closes,
    }],
    servesCuisine: site.servesCuisine,
    priceRange: priceRange(),
    currenciesAccepted: menu.currency,
    foundingDate: site.foundingDate,
    hasMenu: `${site.url}/menu`,
    acceptsReservations: `${site.url}/rezervasyon`,
    sameAs: [site.instagram, site.mapsUrl],
  };
  if (site.geo) ld.geo = { '@type': 'GeoCoordinates', ...site.geo };
  return ld;
}

function menuLd() {
  return {
    '@type': 'Menu',
    '@id': `${site.url}/menu#menu`,
    name: 'Menü',
    url: `${site.url}/menu`,
    inLanguage: 'tr',
    hasMenuSection: menu.sections.map((sec) => ({
      '@type': 'MenuSection',
      name: sec.title,
      ...(sec.note ? { description: sec.note } : {}),
      hasMenuItem: sec.items.map((it) => ({
        '@type': 'MenuItem',
        name: it.name,
        ...(it.description ? { description: it.description } : {}),
        offers: { '@type': 'Offer', price: String(it.price), priceCurrency: menu.currency },
      })),
    })),
  };
}

function contactLd(page) {
  return {
    '@type': 'ContactPage',
    '@id': `${site.url}${page.path}#webpage`,
    url: site.url + page.path,
    name: page.title,
    inLanguage: 'tr',
    mainEntity: { '@id': `${site.url}/#restaurant` },
  };
}

function jsonLd(page) {
  const graph = [restaurantLd()];
  if (page.menuJsonLd) graph.push(menuLd());
  if (page.contactJsonLd) graph.push(contactLd(page));
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function preload(page) {
  if (!page.preload) return '';
  return [].concat(page.preload).map(({ img, sizes, media }) =>
    `<link rel="preload" as="image" type="image/webp" imagesrcset="${srcset(img)}" imagesizes="${sizes}"${media ? ` media="${media}"` : ''} fetchpriority="high">\n`).join('');
}

function render(tpl, ctx) {
  let out = tpl;
  for (let i = 0; i < 5 && /\{\{>/.test(out); i++) {
    out = out.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => readFileSync(join(SRC, 'partials', `${n}.html`), 'utf8'));
  }
  // sayfaya özel head/body blokları da @-bloklarından önce yerleşmeli
  out = out.replace('{{{ headStart }}}', ctx.headStart).replace('{{{ bodyEnd }}}', ctx.bodyEnd);
  out = out.replace(/\{\{@\s*(\w+)\s*([^}]*?)\s*\}\}/g, (_, fn, arg) => {
    switch (fn) {
      case 'menu': return menuHtml();
      case 'jsonld': return jsonLd(ctx.page);
      case 'preload': return preload(ctx.page);
      case 'asset': return assetUrl(arg);
      default: throw new Error(`bilinmeyen blok: ${fn}`);
    }
  });
  out = out.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, p) => get(ctx, p) ?? '');
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => {
    const v = get(ctx, p);
    if (v === undefined) throw new Error(`tanımsız değer: ${p}`);
    return esc(v);
  });
  return out
    .replace(/<source\b[^>]*\bdata-img="[^"]+"[^>]*>/g, expandSource)
    .replace(/<img\b[^>]*\bdata-img="[^"]+"[^>]*>/g, expandImg);
}

const GALLERY_SIZES = '(min-width: 1240px) 379px, (min-width: 884px) calc((100vw - 104px) / 3), (min-width: 600px) calc((100vw - 80px) / 2), calc(100vw - 56px)';

// sitemap.xml: lastmod yalnızca sayfanın çıktısı değiştiğinde bugünün tarihine güncellenir
const sitemapPath = join(ROOT, 'sitemap.xml');
const oldSitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';
const oldLastmod = (loc) => (oldSitemap.match(new RegExp(`<loc>${loc}</loc>\\s*<lastmod>([^<]+)</lastmod>`)) || [])[1];
const today = new Date().toISOString().slice(0, 10);
const sitemapEntries = [];

for (const file of readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'))) {
  let raw = readFileSync(join(SRC, 'pages', file), 'utf8');
  const fm = raw.match(/^<!--\s*(\{[\s\S]*?\})\s*-->\n/);
  if (!fm) throw new Error(`${file}: sayfa ayarları (JSON yorum) eksik`);
  const page = JSON.parse(fm[1]);
  raw = raw.slice(fm[0].length);
  const block = (name) => {
    const m = raw.match(new RegExp(`<!--@${name}-->\\n?([\\s\\S]*?)<!--@end${name}-->\\n?`));
    if (!m) return '';
    raw = raw.replace(m[0], '');
    return m[1];
  };
  const headExtra = block('head');
  const bodyEnd = block('body');
  const nav = { [page.nav]: ' aria-current="page"' };
  const ctx = {
    site, page, nav, bodyEnd,
    canonical: site.url + page.path,
    gallerySizes: GALLERY_SIZES,
    headStart: headExtra,
  };
  const html = render(readFileSync(join(SRC, 'partials', 'head.html'), 'utf8') + raw, ctx);
  const outPath = join(ROOT, file);
  const changed = !existsSync(outPath) || readFileSync(outPath, 'utf8') !== html;
  writeFileSync(outPath, html);
  sitemapEntries.push({ loc: ctx.canonical, lastmod: (!changed && oldLastmod(ctx.canonical)) || today });
  console.log(`${file}  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}

// Jekyll layout'u (_layouts/default.html): KVKK .md sayfaları aynı head/header/footer ile açılsın.
// Başlık, açıklama, adres ve içerik sayfanın front matter'ından Liquid ile gelir.
{
  const mark = (k) => `\u0001${k}\u0001`;
  const page = { title: mark('title'), description: mark('description'), path: mark('path') };
  const ctx = { site, page, nav: {}, bodyEnd: '', canonical: site.url + page.path, gallerySizes: GALLERY_SIZES, headStart: '' };
  const tpl = readFileSync(join(SRC, 'partials', 'head.html'), 'utf8') + readFileSync(join(SRC, 'layouts', 'default.html'), 'utf8');
  const html = render(tpl, ctx)
    .replaceAll(mark('title'), '{{ page.title | escape }}')
    .replaceAll(mark('description'), '{{ page.description | escape }}')
    .replaceAll(mark('path'), "{{ page.url | remove: '.html' }}")
    .replace('<!--@content-->', '{{ content }}');
  const liquid = html.match(/\{\{.*?\}\}|\{%.*?%\}/g);
  if (liquid.some((t) => !/^\{\{ (page\.|content)/.test(t))) throw new Error(`layout'ta beklenmeyen Liquid: ${liquid}`);
  mkdirSync(join(ROOT, '_layouts'), { recursive: true });
  writeFileSync(join(ROOT, '_layouts', 'default.html'), html);
  console.log(`_layouts/default.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}

const order = ['/', '/menu', '/hikayemiz', '/rezervasyon', '/iletisim'].map((p) => site.url + p);
sitemapEntries.sort((a, b) => order.indexOf(a.loc) - order.indexOf(b.loc));
writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map((e) => `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>
`);
console.log(`sitemap.xml  ${sitemapEntries.length} URL`);
