/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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
await mkdir('package/dslens/dist/commonjs', { recursive: true });
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
  await build({
    entryPoints: [`src/ts/${entry}.ts`],
    outfile: `package/dslens/dist/commonjs/${entry}.cjs`,
    bundle: true,
    format: 'cjs',
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
const rootPackage = JSON.parse(
  await readFile('package.json', 'utf8'),
);
const runtimeExport = (name) => ({
  types: `./dist/typescript/${name}.d.ts`,
  import: `./dist/javascript/${name}.js`,
  require: `./dist/commonjs/${name}.cjs`,
  default: `./dist/javascript/${name}.js`,
});
const publicPackage = {
  name: rootPackage.name,
  version: rootPackage.version,
  license: rootPackage.license,
  author: rootPackage.author,
  repository: rootPackage.repository,
  homepage: rootPackage.homepage,
  bugs: rootPackage.bugs,
  description: rootPackage.description,
  main: 'README.md',
  type: 'module',
  types: './dist/typescript/index.d.ts',
  sideEffects: false,
  engines: rootPackage.engines,
  keywords: rootPackage.keywords,
  files: ['dist', 'src', 'README.md', 'LICENSE'],
  exports: {
    '.': {
      types: './dist/typescript/index.d.ts',
      browser: {
        import: './dist/javascript/browser.js',
        require: './dist/commonjs/browser.cjs',
      },
      worker: {
        import: './dist/javascript/worker.js',
        require: './dist/commonjs/worker.cjs',
      },
      node: {
        import: './dist/javascript/server.js',
        require: './dist/commonjs/server.cjs',
      },
      import: './dist/javascript/index.js',
      require: './dist/commonjs/index.cjs',
      default: './dist/javascript/index.js',
    },
    './browser': runtimeExport('browser'),
    './worker': runtimeExport('worker'),
    './server': runtimeExport('server'),
    './typescript': './src/index.ts',
    './manifest': './dist/manifest.json',
    './build-target': './dist/build-target.json',
  },
};
await writeFile(
  'package/dslens/package.json',
  `${JSON.stringify(publicPackage, null, 2)}\n`,
  'utf8',
);
await cp(
  'manifests/dslens.json',
  'package/dslens/dist/manifest.json',
);
await writeFile(
  'package/dslens/dist/build-target.json',
  `${JSON.stringify(ecmascript, null, 2)}\n`,
  'utf8',
);
