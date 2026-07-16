/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { spawnSync } from 'node:child_process';
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';
import {
  MODULE_TARGET,
  resolveEcmascriptPolicy,
} from '../build/ecmascript-target.mjs';

const isCi = Boolean(process.env.CI);
const useColor =
  !isCi && process.stdout.isTTY && !process.env.NO_COLOR;
const color = (code, value) =>
  useColor ? `\u001b[${code}m${value}\u001b[0m` : value;
const stages = [];

/** Executa subprocesso e preserva saída compacta e parseável. */
function run(name, command, args) {
  const started = performance.now();
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  const duration = Math.round(performance.now() - started);
  if (result.status !== 0)
    throw new Error(
      `${name}\n${result.stdout}${result.stderr}`.trim(),
    );
  stages.push({ name, duration });
}

/** Executa uma etapa assíncrona e registra sua duração. */
async function stage(name, task) {
  const started = performance.now();
  await task();
  stages.push({
    name,
    duration: Math.round(performance.now() - started),
  });
}

try {
  run('typecheck', process.execPath, ['scripts/build/typecheck.mjs']);
  run('build', process.execPath, ['scripts/build/build.mjs']);
  run('powershell-conformance', 'pwsh', [
    '-NoProfile',
    '-File',
    'tests/conformance/test-powershell.ps1',
  ]);
  run(
    'python-conformance',
    process.platform === 'win32' ? 'python' : 'python3',
    ['tests/conformance/test-python.py'],
  );

  await stage('manifest-schema', async () => {
    const schema = JSON.parse(
      await readFile('schemas/dslens-manifest.schema.json', 'utf8'),
    );
    const manifest = JSON.parse(
      await readFile('manifests/dslens.json', 'utf8'),
    );
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    if (!ajv.validate(schema, manifest))
      throw new Error(ajv.errorsText(ajv.errors));
  });

  await stage('ecmascript-target-policy', async () => {
    const cases = [
      [2024, 'ES2020'],
      [2025, 'ES2020'],
      [2026, 'ES2021'],
      [2027, 'ES2022'],
      [2030, 'ES2025'],
    ];
    for (const [year, expected] of cases) {
      const policy = resolveEcmascriptPolicy(year);
      if (
        policy.target !== expected ||
        policy.lib[0] !== expected ||
        policy.module !== MODULE_TARGET
      )
        throw new Error(
          `ano=${year} esperado=${expected}/${MODULE_TARGET} obtido=${policy.target}/${policy.module}`,
        );
    }
    const artifact = JSON.parse(
      await readFile('package/dslens/dist/build-target.json', 'utf8'),
    );
    const current = resolveEcmascriptPolicy(
      new Date().getUTCFullYear(),
    );
    if (JSON.stringify(artifact) !== JSON.stringify(current))
      throw new Error('metadado do artefato diverge do target atual');
    const packageManifest = JSON.parse(
      await readFile('package/dslens/package.json', 'utf8'),
    );
    if (
      packageManifest.exports?.['./build-target'] !==
      './dist/build-target.json'
    )
      throw new Error('subpath build-target não publicado');
    try {
      resolveEcmascriptPolicy(Number.NaN);
      throw new Error('ano inválido foi aceito');
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
  });

  await stage('client-size-budget', async () => {
    const bytes = (
      await stat('package/dslens/dist/javascript/browser.min.js')
    ).size;
    if (bytes > 2048)
      throw new Error(
        `browser.min.js excedeu orçamento: ${bytes} > 2048`,
      );
  });

  await stage('workflow-syntax', async () => {
    parseYaml(await readFile('.github/workflows/tests.yml', 'utf8'));
  });

  await stage('javascript-unit-conformance', async () => {
    const vectors = JSON.parse(
      await readFile('tests/conformance/v1.json', 'utf8'),
    );
    const { hasParserExpression, resolveDslData } = await import(
      '../../package/dslens/dist/javascript/index.js'
    );
    for (const item of vectors.cases) {
      const actual = resolveDslData(vectors.data, item.path);
      if (actual !== item.expected)
        throw new Error(
          `${item.id}: esperado=${item.expected} obtido=${actual}`,
        );
    }
    for (const item of vectors.detection) {
      if (hasParserExpression(item.input) !== item.expected)
        throw new Error(`detection: ${item.input}`);
    }
  });

  await stage('e2e-mock-generated-fixture', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dslens-e2e-'));
    const fixture = join(directory, 'fixture.json');
    await writeFile(
      fixture,
      JSON.stringify({
        releases: [
          { name: 'stable', url: 'https://example.test/app.zip' },
        ],
      }),
      'utf8',
    );
    const body = await readFile(fixture);
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(body);
    });
    await new Promise((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    try {
      const address = server.address();
      if (!address || typeof address === 'string')
        throw new Error('servidor local indisponível');
      const { resolveParserExpression } = await import(
        '../../package/dslens/dist/javascript/browser.js'
      );
      const value = await resolveParserExpression(
        `\${"http://127.0.0.1:${address.port}/fixture"}.releases[@name="stable"].url`,
      );
      if (value !== 'https://example.test/app.zip')
        throw new Error(`resultado E2E divergente: ${value}`);
    } finally {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await rm(directory, { recursive: true, force: true });
    }
  });

  if (
    process.argv.includes('--real') ||
    process.env.DSLENS_TEST_REAL === '1'
  ) {
    await stage('e2e-real-api-opt-in', async () => {
      const { resolveParserExpression } = await import(
        '../../package/dslens/dist/javascript/server.js'
      );
      const value = await resolveParserExpression(
        '${"https://api.github.com"}.current_user_url',
      );
      if (!value?.startsWith('https://'))
        throw new Error('API real não retornou URL esperada');
    });
  }

  for (const item of stages)
    console.log(
      `${color('32', 'PASS')} ${item.name} durationMs=${item.duration}`,
    );
  console.log(
    `RESULT status=passed stages=${stages.length} environment=${isCi ? 'ci' : 'local'}`,
  );
} catch (error) {
  console.error(
    `${color('31', 'FAIL')} ${error instanceof Error ? error.message : String(error)}`,
  );
  console.error(
    `RESULT status=failed stages=${stages.length} environment=${isCi ? 'ci' : 'local'}`,
  );
  process.exitCode = 1;
}
