/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const ci = args.has('--ci') || Boolean(process.env.CI);
if (args.has('--help')) {
  console.log('Uso: npm run release -- [--dry-run] [--ci]');
  process.exit(0);
}
for (const arg of args)
  if (!['--dry-run', '--ci'].includes(arg)) {
    console.error(`Parâmetro desconhecido: ${arg}`);
    process.exit(2);
  }

/** Executa comando sem shell e interrompe com diagnóstico acionável. */
function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    if (options.capture) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    throw new Error(
      `${command} encerrou com código ${result.status}`,
    );
  }
  return result;
}

/** Executa npm com o launcher correto em Windows e POSIX. */
function runNpm(npmArgs, options = {}) {
  if (process.platform === 'win32')
    return run(
      process.env.ComSpec ?? 'cmd.exe',
      ['/d', '/s', '/c', 'npm.cmd', ...npmArgs],
      options,
    );
  return run('npm', npmArgs, options);
}

/** Consulta a identidade npm sem emitir credencial ou log. */
function hasNpmIdentity() {
  const command =
    process.platform === 'win32' ?
      (process.env.ComSpec ?? 'cmd.exe')
    : 'npm';
  const commandArgs =
    process.platform === 'win32' ?
      ['/d', '/s', '/c', 'npm.cmd', 'whoami']
    : ['whoami'];
  return (
    spawnSync(command, commandArgs, {
      stdio: 'ignore',
      env: process.env,
    }).status === 0
  );
}

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
if (manifest.name !== '@jeancarloem/dslens')
  throw new Error('Nome npm deve ser @jeancarloem/dslens');
const releaseTag = process.env.GITHUB_REF_NAME;
if (ci && releaseTag?.replace(/^v/u, '') !== manifest.version)
  throw new Error(
    `Tag ${releaseTag ?? '<ausente>'} diverge da versão ${manifest.version}`,
  );

run(process.execPath, ['scripts/test/run.mjs']);
if (dryRun) {
  runNpm(['pack', './package/dslens', '--dry-run', '--json']);
  console.log('RESULT status=passed mode=dry-run publish=false');
  process.exit(0);
}

if (ci && !process.env.NODE_AUTH_TOKEN && !process.env.NPM_TOKEN)
  throw new Error('NPM_TOKEN não foi disponibilizado ao workflow');
if (!ci) {
  if (!hasNpmIdentity()) {
    console.log(
      'Autenticação npm inicial: o navegador será aberto para validação PKI/2FA.',
    );
    runNpm(['login', '--auth-type=web']);
  }
}

try {
  runNpm(
    [
      'publish',
      './package/dslens',
      '--access',
      'public',
      '--provenance',
    ],
    { capture: true },
  );
} catch (error) {
  console.error(
    'PUBLICAÇÃO NPM BLOQUEADA: confirme que @jeancarloem existe no npm, crie um Automation Token com permissão de publicação, grave-o como secret NPM_TOKEN no repositório GitHub e autorize o pacote/organização a aceitar esse token. Para a primeira publicação local, execute npm login --auth-type=web e conclua PKI/2FA no navegador.',
  );
  throw error;
}
console.log('RESULT status=passed mode=publish');
