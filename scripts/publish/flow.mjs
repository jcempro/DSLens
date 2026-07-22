/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { spawnSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import process from 'node:process';

const command = process.argv[2] ?? 'pages';
const dryRun = process.argv.includes('--dry-run');
const confirm = process.argv.includes('--confirm-publish');

const tasks = {
  check: publishCheck,
  build: publishBuild,
  'dry-run': publishDryRun,
  pages: publishPages,
  verify: publishVerify,
};

if (!tasks[command]) throw new Error(`comando publish desconhecido: ${command}`);
await tasks[command]();

async function publishCheck() {
  const workflow = await readFile('.github/workflows/pages.yml', 'utf8');
  if (!workflow.includes('workflow_dispatch:') || workflow.includes('\n  push:'))
    throw new Error('workflow Pages deve ser manual e nao disparar por push');
  if (
    !workflow.includes('pages: write') ||
    !workflow.includes('contents: read') ||
    !workflow.includes('actions/deploy-pages@v5')
  )
    throw new Error('workflow Pages sem permissao minima ou deploy oficial');
  console.log('publish check ok target=pages');
}

async function publishBuild() {
  await publishCheck();
  runNpm(['run', 'build:dslens']);
  runNpm(['run', 'site:build']);
  console.log('publish build ok target=pages output=site/dist');
}

async function publishDryRun() {
  await publishVerify();
  console.log('publish dry-run ok target=pages published=false');
}

async function publishPages() {
  if (dryRun) return publishDryRun();
  await publishVerify();
  if (!confirm)
    throw new Error(
      'PAGES_PUBLICACAO_BLOQUEADA: use npm run publish:pages -- --confirm-publish',
    );
  run('gh', ['workflow', 'run', 'pages.yml', '--ref', 'dev']);
  console.log('publish pages dispatched workflow=pages.yml ref=dev');
}

async function publishVerify() {
  await publishBuild();
  for (const path of [
    'site/dist/index.html',
    'site/dist/assets/site.js',
    'site/dist/assets/demo-core.js',
    'site/dist/assets/dslens.browser.min.js',
    'site/dist/manifests/components/index.json',
  ]) {
    const info = await stat(path);
    if (!info.isFile() || info.size === 0)
      throw new Error(`artefato Pages invalido: ${path}`);
  }
  const html = await readFile('site/dist/index.html', 'utf8');
  if (!html.includes('Content-Security-Policy') || !html.includes('#demo'))
    throw new Error('site Pages sem CSP ou demo');
  console.log('publish verify ok target=pages');
}

function runNpm(args) {
  if (process.platform === 'win32')
    return run('cmd.exe', ['/d', '/s', '/c', 'npm.cmd', ...args]);
  return run('npm', args);
}

function run(commandName, args) {
  const result = spawnSync(commandName, args, {
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.status !== 0)
    throw new Error(
      `${commandName} ${args.join(' ')} falhou: ${result.error?.message ?? ''}`,
    );
}

