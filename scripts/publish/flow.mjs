/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { spawnSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import process from 'node:process';

const command = process.argv[2] ?? 'pages';
const dryRun = process.argv.includes('--dry-run');
const repository = {
  owner: 'jcempro',
  name: 'DSLens',
};

const tasks = {
  check: publishCheck,
  build: publishBuild,
  'dry-run': publishDryRun,
  pages: publishPages,
  verify: publishVerify,
};

try {
  if (!tasks[command]) throw new Error(`comando publish desconhecido: ${command}`);
  await tasks[command]();
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

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
  const publisher = await resolvePublisher();
  await publishVerify();
  await publisher.dispatch();
  console.log(
    `publish pages dispatched workflow=pages.yml ref=dev via=${publisher.via}`,
  );
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

async function resolvePublisher() {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (token)
    return {
      via: 'github-api',
      dispatch: () => dispatchWithGitHubApi(token),
    };
  const gitCredential = resolveGitCredentialToken();
  if (gitCredential)
    return {
      via: 'git-credential',
      dispatch: () => dispatchWithGitHubApi(gitCredential),
    };
  if (commandSucceeds('gh', ['--version'])) {
    if (!commandSucceeds('gh', ['auth', 'status']))
      throw new Error(
        'PAGES_PUBLICADOR_INDISPONIVEL: GitHub CLI encontrado, mas sem autenticacao. Execute gh auth login ou defina GH_TOKEN/GITHUB_TOKEN.',
      );
    return {
      via: 'gh',
      dispatch: () => run('gh', ['workflow', 'run', 'pages.yml', '--ref', 'dev']),
    };
  }
  throw new Error(
    'PAGES_PUBLICADOR_INDISPONIVEL: Git autenticado por SSH ou helper sem token API nao aciona workflow_dispatch; use remoto HTTPS com credential helper, gh auth login ou GH_TOKEN/GITHUB_TOKEN.',
  );
}

async function dispatchWithGitHubApi(token) {
  const response = await fetch(
    `https://api.github.com/repos/${repository.owner}/${repository.name}/actions/workflows/pages.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'dev' }),
    },
  );
  if (response.status !== 204)
    throw new Error(
      `GitHub API falhou ao acionar Pages: status=${response.status}`,
    );
}

function resolveGitCredentialToken() {
  const candidates = [
    `protocol=https\nhost=github.com\npath=${repository.owner}/${repository.name}.git\n\n`,
    'protocol=https\nhost=github.com\n\n',
  ];
  for (const input of candidates) {
    const result = spawnSync('git', ['credential', 'fill'], {
      encoding: 'utf8',
      input,
      stdio: 'pipe',
    });
    if (result.status !== 0) continue;
    const credential = parseGitCredential(result.stdout);
    if (credential.password) return credential.password;
  }
  return '';
}

function parseGitCredential(output) {
  const credential = {};
  for (const line of output.split(/\r?\n/u)) {
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    credential[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return credential;
}

function commandSucceeds(commandName, args) {
  const result = spawnSync(commandName, args, {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return result.status === 0;
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
