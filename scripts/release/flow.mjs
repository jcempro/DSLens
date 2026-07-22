/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { spawnSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import process from 'node:process';

const command = process.argv[2] ?? 'check';
const dryRun = process.argv.includes('--dry-run');
const confirm = process.argv.includes('--confirm-publish');

const tasks = {
  check: releaseCheck,
  prepare: releasePrepare,
  build: releaseBuild,
  pack: releasePack,
  test: releaseTest,
  'dry-run': releaseDryRun,
  create: releaseCreate,
  publish: releasePublish,
  verify: releaseVerify,
  'npm-publish': npmPublish,
  'npm-verify': npmVerify,
  'distribution-map': distributionMap,
};

if (!tasks[command]) throw new Error(`comando desconhecido: ${command}`);
await tasks[command]();

async function releaseCheck() {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  if (pkg.private) throw new Error('pacote privado nao pode publicar');
  if (pkg.name !== '@jeancarloem/dslens')
    throw new Error(`nome npm invalido: ${pkg.name}`);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(pkg.version))
    throw new Error(`versao invalida: ${pkg.version}`);
  const status = run('git', ['status', '--short', '--branch'], true);
  if (!status.stdout.startsWith('## dev'))
    throw new Error('release deve partir da branch dev');
  console.log('release check ok');
}

async function releasePrepare() {
  await releaseCheck();
  await runNpm('manifests:validate');
  console.log('release prepare ok');
}

async function releaseBuild() {
  await runNpm('build:dslens');
  await runNpm('manifests:generate');
  await runNpm('site:build');
  await distributionMap();
  console.log('release build ok');
}

async function releasePack() {
  await runNpm('build:dslens');
  await rm('.ia.rules/cache/package', { recursive: true, force: true });
  await mkdir('.ia.rules/cache/package', { recursive: true });
  const result = runNpmRaw(
    ['pack', './package/dslens', '--pack-destination', '.ia.rules/cache/package', '--json'],
    true,
  );
  const parsed = JSON.parse(result.stdout);
  const files = parsed[0]?.files?.map((item) => item.path) ?? [];
  for (const blocked of ['.github/', '.ia.rules/', 'scripts/', 'tests/'])
    if (files.some((file) => file.startsWith(blocked)))
      throw new Error(`tarball contem item interno: ${blocked}`);
  const filename = parsed[0]?.filename;
  if (!filename) throw new Error('npm pack nao retornou filename');
  console.log(`release pack ok files=${files.length} tarball=.ia.rules/cache/package/${filename}`);
  return resolve('.ia.rules/cache/package', filename);
}

async function releaseTest() {
  await runNpm('test');
  await npmVerify();
  console.log('release test ok');
}

async function releaseDryRun() {
  await releasePrepare();
  await releaseBuild();
  await releasePack();
  await releaseTest();
  console.log('release dry-run ok published=false');
}

async function releaseCreate() {
  if (dryRun) return releaseDryRun();
  if (!confirm) throw new Error('PUBLICACAO BLOQUEADA: use --confirm-publish');
  throw new Error('criacao remota deve usar fluxo autorizado especifico');
}

async function releasePublish() {
  if (dryRun) return releaseDryRun();
  if (!confirm) throw new Error('PUBLICACAO BLOQUEADA: use --confirm-publish');
  throw new Error('publicacao remota deve usar fluxo autorizado especifico');
}

async function releaseVerify() {
  await releaseCheck();
  await runNpm('manifests:validate');
  await runNpm('site:build');
  console.log('release verify ok');
}

async function npmPublish() {
  if (dryRun) return releasePack();
  if (!confirm) throw new Error('PUBLICACAO NPM BLOQUEADA: use --confirm-publish');
  throw new Error('npm publish real nao executado por este wrapper sem rotina dedicada');
}

async function npmVerify() {
  const tarball = await releasePack();
  const directory = await mkdtemp(join(tmpdir(), 'dslens-install-'));
  try {
    await writeFile(
      join(directory, 'package.json'),
      '{"type":"module","private":true}\n',
      'utf8',
    );
    runNpmRaw(['install', tarball, '--ignore-scripts', '--no-audit', '--no-fund'], false, directory);
    const check = [
      'import { createRequire } from "node:module";',
      'const require=createRequire(import.meta.url);',
      'const root=await import("@jeancarloem/dslens");',
      'const data=await import("@jeancarloem/dslens/components/resolve-data");',
      'const b=await import("@jeancarloem/dslens/browser/components/resolve-data");',
      'const manifests=require("@jeancarloem/dslens/manifests/components");',
      'if(data.resolveDslData({a:1},".a")!=="1"||b.resolveDslData({a:2},".a")!=="2"||typeof root.resolveDslData!=="function"||!Array.isArray(manifests.components)) process.exit(1);',
    ].join('');
    run(process.execPath, ['--input-type=module', '-e', check], false, directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  console.log('npm verify ok');
}

async function distributionMap() {
  await mkdir('.ia.rules/distribution', { recursive: true });
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const files = [];
  for (const root of ['package/dslens', 'site/dist', 'manifests', 'docs/components', 'demo/offline']) {
    try {
      await collect(root, files);
    } catch {
      if (root !== 'site/dist') throw new Error(`raiz ausente: ${root}`);
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const map = {
    schemaVersion: 1,
    version: pkg.version,
    generatedBy: 'scripts/release/flow.mjs distribution-map',
    destinations: ['npm-package', 'release-asset', 'offline-demo', 'github-pages'],
    files,
  };
  await writeFile(
    `.ia.rules/distribution/distribution-map-${pkg.version}.json`,
    `${JSON.stringify(map, null, 2)}\n`,
    'utf8',
  );
  console.log(`distribution map ok files=${files.length}`);
}

async function collect(root, files) {
  for (const name of await readdir(root)) {
    const path = join(root, name).replaceAll('\\', '/');
    const info = await stat(path);
    if (info.isDirectory()) await collect(path, files);
    else {
      const content = await readFile(path);
      files.push({
        path,
        size: content.length,
        sha256: createHash('sha256').update(content).digest('hex'),
        policy: 'replace-generated',
      });
    }
  }
}

async function runNpm(script) {
  runNpmRaw(['run', script], false);
}

function runNpmRaw(args, capture, cwd = process.cwd()) {
  if (process.platform !== 'win32') return run('npm', args, capture, cwd);
  return run('cmd.exe', ['/d', '/s', '/c', 'npm.cmd', ...args], capture, cwd);
}

function run(commandName, args, capture, cwd = process.cwd()) {
  const result = spawnSync(commandName, args, {
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    cwd,
  });
  if (result.status !== 0)
    throw new Error(
      `${commandName} ${args.join(' ')} falhou\n${result.error?.message ?? ''}${result.stdout ?? ''}${result.stderr ?? ''}`,
    );
  return result;
}
