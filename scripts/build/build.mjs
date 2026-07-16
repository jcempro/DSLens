/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import {
  GENERATED_TSCONFIG,
  prepareEcmascriptBuild,
} from './ecmascript-target.mjs';

const banner =
  '/* DSLens | https://github.com/jcempro/DSLens | JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */';
await rm('package/dslens/dist', { recursive: true, force: true });
await mkdir('package/dslens/dist/javascript', { recursive: true });
const ecmascript = await prepareEcmascriptBuild();
execFileSync(
  process.execPath,
  ['node_modules/typescript/bin/tsc', '-p', GENERATED_TSCONFIG],
  { stdio: 'inherit' },
);
for (const entry of ['index', 'browser', 'worker', 'server']) {
  await build({
    entryPoints: [`src/ts/${entry}.ts`],
    outfile: `package/dslens/dist/javascript/${entry}.js`,
    bundle: true,
    format: 'esm',
    platform: entry === 'server' ? 'node' : 'browser',
    target: ecmascript.target.toLowerCase(),
    sourcemap: true,
    banner: { js: banner },
  });
}
await build({
  entryPoints: ['src/ts/browser.ts'],
  outfile: 'package/dslens/dist/javascript/browser.min.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ecmascript.target.toLowerCase(),
  minify: true,
  sourcemap: true,
  banner: { js: banner },
});
await cp('src/ts', 'package/dslens/src', { recursive: true });
await cp('README.md', 'package/dslens/README.md');
await cp('LICENSE', 'package/dslens/LICENSE');
await cp(
  'manifests/dslens.json',
  'package/dslens/dist/manifest.json',
);
await writeFile(
  'package/dslens/dist/build-target.json',
  `${JSON.stringify(ecmascript, null, 2)}\n`,
  'utf8',
);
