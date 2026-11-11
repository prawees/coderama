// Static server for the export that behaves like GitHub Pages: /foo serves foo.html, / serves index.html.
// `python3 -m http.server` resets connections under load and has no clean URLs, which looks like game bugs.
// Usage: node scripts/playtest/serve.js out 8765
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || 'out'), port = +(process.argv[3] || 8765);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.stl': 'model/stl', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u.endsWith('/')) u += 'index.html';
  let f = path.join(root, u);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f += '.html';
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`serving ${root} on ${port}`));
