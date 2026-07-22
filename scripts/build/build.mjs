/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import {
  cp,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
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
const componentEntries = [
  'components/detect',
  'components/resolve-data',
  'components/resolve-source',
  'browser/components/detect',
  'browser/components/resolve-data',
  'browser/components/resolve-source',
];
for (const entry of componentEntries) {
  await build({
    entryPoints: [`src/ts/${entry}.ts`],
    outfile: `package/dslens/dist/javascript/${entry}.js`,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ecmascript.target.toLowerCase(),
    sourcemap: true,
    banner: { js: banner },
  });
  await build({
    entryPoints: [`src/ts/${entry}.ts`],
    outfile: `package/dslens/dist/commonjs/${entry}.cjs`,
    bundle: true,
    format: 'cjs',
    platform: 'browser',
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
const componentExport = (name) => runtimeExport(`components/${name}`);
const browserComponentExport = (name) =>
  runtimeExport(`browser/components/${name}`);
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
    './components/detect': componentExport('detect'),
    './components/resolve-data': componentExport('resolve-data'),
    './components/resolve-source': componentExport('resolve-source'),
    './browser/components/detect': browserComponentExport('detect'),
    './browser/components/resolve-data':
      browserComponentExport('resolve-data'),
    './browser/components/resolve-source':
      browserComponentExport('resolve-source'),
    './typescript': './src/index.ts',
    './manifest': './dist/manifest.json',
    './manifests/components': './dist/manifests/components/index.json',
    './manifests/components/detect':
      './dist/manifests/components/detect.json',
    './manifests/components/resolve-data':
      './dist/manifests/components/resolve-data.json',
    './manifests/components/resolve-source':
      './dist/manifests/components/resolve-source.json',
    './build-target': './dist/build-target.json',
  },
};
await writeGeneratedFile(
  'package/dslens/package.json',
  `${JSON.stringify(publicPackage, null, 2)}\n`,
);
await cp(
  'manifests/dslens.json',
  'package/dslens/dist/manifest.json',
);
await mkdir('package/dslens/dist/manifests', { recursive: true });
await cp('manifests/components', 'package/dslens/dist/manifests/components', {
  recursive: true,
});
await writeGeneratedFile(
  'package/dslens/dist/build-target.json',
  `${JSON.stringify(ecmascript, null, 2)}\n`,
);

async function writeGeneratedFile(path, content) {
  const temporary = `${path}.tmp-${process.pid}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await writeFile(temporary, content, 'utf8');
      await rename(temporary, path);
      return;
    } catch (error) {
      await rm(temporary, { force: true });
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
}
