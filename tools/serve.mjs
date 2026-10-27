// Lokal önizleme: GitHub Pages gibi /menu -> menu.html servis eder.
// Çalıştır: node tools/serve.mjs [port]   (varsayılan 8080)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
const port = Number(process.argv[2]) || 8080;

createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (p.endsWith('/')) p += 'index.html';
  for (const cand of [p, p + '.html']) {
    try {
      const file = join(ROOT, cand);
      if (!file.startsWith(ROOT) || !(await stat(file)).isFile()) continue;
      const type = TYPES[extname(file)] || 'application/octet-stream';
      let body = await readFile(file);
      const headers = { 'Content-Type': type };
      // GitHub Pages metin dosyalarını gzip'li sunar; ölçümler gerçeğe yakın olsun
      if (/text|javascript|json|xml|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
        body = gzipSync(body);
        headers['Content-Encoding'] = 'gzip';
      }
      res.writeHead(200, headers);
      return res.end(body);
    } catch {}
  }
  res.writeHead(404); res.end('404');
}).listen(port, () => console.log(`http://localhost:${port}`));
