/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { cp, mkdir, readFile, rm } from 'node:fs/promises';

await rm('site/dist', { recursive: true, force: true });
await mkdir('site/dist/assets', { recursive: true });
await cp('site/src/index.html', 'site/dist/index.html');
await cp('site/src/assets', 'site/dist/assets', { recursive: true });
await cp('demo/shared/demo-core.js', 'site/dist/assets/demo-core.js');
await cp(
  'package/dslens/dist/javascript/browser.min.js',
  'site/dist/assets/dslens.browser.min.js',
);
await cp('manifests', 'site/dist/manifests', { recursive: true });

const html = await readFile('site/dist/index.html', 'utf8');
for (const expected of [
  'Content-Security-Policy',
  './assets/site.js',
  './manifests/components/index.json',
])
  if (!html.includes(expected))
    throw new Error(`site sem referencia obrigatoria: ${expected}`);

console.log('site build ok output=site/dist');

