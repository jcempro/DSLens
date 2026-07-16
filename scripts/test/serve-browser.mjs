/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.map': 'application/json' };
createServer((request, response) => {
  const relative = normalize(decodeURIComponent((request.url ?? '/').split('?')[0])).replace(/^[\\/]+/u, '');
  const path = join(root, relative || 'tests/browser/index.html');
  if (!path.startsWith(root) || !statSafe(path)) {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
  createReadStream(path).pipe(response);
}).listen(4173, '0.0.0.0');

/** Verifica arquivo sem propagar erro de filesystem. */
function statSafe(path) {
  try { return statSync(path).isFile(); } catch { return false; }
}
