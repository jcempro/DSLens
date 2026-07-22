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
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
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
const require = createRequire(import.meta.url);

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
    const manifest = JSON.parse(
      await readFile('manifests/dslens.json', 'utf8'),
    );
    validateManifest(manifest);
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
    if (bytes > 12288)
      throw new Error(
        `browser.min.js excedeu orçamento: ${bytes} > 12288`,
      );
  });

  await stage('workflow-syntax', async () => {
    parseYaml(await readFile('.github/workflows/tests.yml', 'utf8'));
    const releaseWorkflow = parseYaml(
      await readFile('.github/workflows/npm-release.yml', 'utf8'),
    );
    if (!releaseWorkflow.on?.release?.types?.includes('published'))
      throw new Error('workflow npm não reage a release publicada');
    const pagesWorkflow = parseYaml(
      await readFile('.github/workflows/pages.yml', 'utf8'),
    );
    if (
      !Object.prototype.hasOwnProperty.call(
        pagesWorkflow.on ?? {},
        'workflow_dispatch',
      ) ||
      pagesWorkflow.on?.push ||
      pagesWorkflow.permissions?.pages !== 'write' ||
      pagesWorkflow.permissions?.contents !== 'read'
    )
      throw new Error('workflow Pages deve ser manual e minimo');
  });

  await stage('npm-package-contract', async () => {
    const rootManifest = JSON.parse(
      await readFile('package.json', 'utf8'),
    );
    const manifest = JSON.parse(
      await readFile('package/dslens/package.json', 'utf8'),
    );
    if (
      rootManifest.type !== 'commonjs' ||
      manifest.type !== 'module' ||
      manifest.description !== rootManifest.description ||
      !/cross-language library/iu.test(manifest.description) ||
      manifest.name !== '@jeancarloem/dslens' ||
      manifest.version !== '0.0.1' ||
      manifest.main !== 'README.md'
    )
      throw new Error('metadados npm divergentes');
    for (const subpath of [
      '.',
      './browser',
      './worker',
      './server',
      './components/detect',
      './components/resolve-data',
      './components/resolve-source',
      './browser/components/detect',
      './browser/components/resolve-data',
      './browser/components/resolve-source',
    ]) {
      const exported = manifest.exports[subpath];
      if (!exported?.import?.endsWith('.js') || !exported.require?.endsWith('.cjs'))
        throw new Error(`${subpath} não possui condição require`);
    }
    const source = await readFile(
      'scripts/release/npm-release.mjs',
      'utf8',
    );
    for (const expected of [
      '--auth-type=web',
      'NPM_TOKEN',
      '--provenance',
      'PUBLICAÇÃO NPM BLOQUEADA',
    ])
      if (!source.includes(expected))
        throw new Error(
          `diagnóstico de release ausente: ${expected}`,
        );
  });

  await stage('javascript-unit-conformance', async () => {
    const vectors = JSON.parse(
      await readFile('tests/conformance/v1.json', 'utf8'),
    );
    const {
      hasParserExpression,
      parseDslExpression,
      resolveDslData,
    } = await import('../../package/dslens/dist/javascript/index.js');
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
    const requestVectors = JSON.parse(
      await readFile('tests/conformance/request-v2.json', 'utf8'),
    );
    for (const item of requestVectors.cases) {
      const parsed = parseDslExpression(item.input);
      if (
        !parsed ||
        (parsed.request?.method ?? 'GET') !== item.expected.method ||
        parsed.path !== item.expected.path
      )
        throw new Error(`request parser: ${item.id}`);
    }
    for (const input of requestVectors.invalid)
      if (parseDslExpression(input) !== null)
        throw new Error(`request inválido aceito: ${input}`);
    const selectorVectors = JSON.parse(
      await readFile('tests/conformance/selectors-v3.json', 'utf8'),
    );
    for (const item of selectorVectors.cases) {
      const actual = resolveDslData(selectorVectors.data, item.path);
      if (actual !== item.expected)
        throw new Error(
          `selector ${item.id}: esperado=${item.expected} obtido=${actual}`,
        );
    }
    for (const input of selectorVectors.invalid)
      if (resolveDslData(selectorVectors.data, input) !== null)
        throw new Error(`selector inválido aceito: ${input}`);
    const yamlData = parseYaml(`
users:
  - name: Ana
    active: true
    email: ana@example.test
    score: 12
  - name: Bruno
    active: false
    score: 7
special:
  display.name: Ana Maria
meta:
  contacts:
    - email: ops@example.test
nullish: null
`);
    for (const item of selectorVectors.cases) {
      const actual = resolveDslData(yamlData, item.path);
      if (actual !== item.expected)
        throw new Error(
          `yaml selector ${item.id}: esperado=${item.expected} obtido=${actual}`,
        );
    }
  });

  await stage('component-subpath-conformance', async () => {
    const detect = await import(
      '../../package/dslens/dist/javascript/components/detect.js'
    );
    const browserDetect = await import(
      '../../package/dslens/dist/javascript/browser/components/detect.js'
    );
    const data = await import(
      '../../package/dslens/dist/javascript/components/resolve-data.js'
    );
    const browserData = await import(
      '../../package/dslens/dist/javascript/browser/components/resolve-data.js'
    );
    const source = await import(
      '../../package/dslens/dist/javascript/components/resolve-source.js'
    );
    if (
      typeof detect.hasParserExpression !== 'function' ||
      typeof browserDetect.hasParserExpression !== 'function' ||
      data.resolveDslData({ a: 1 }, '.a') !== '1' ||
      browserData.resolveDslData({ a: 1 }, '.a') !== '1' ||
      typeof source.resolveParserExpression !== 'function'
    )
      throw new Error('subpath de componente divergente');
  });

  await stage('commonjs-unit-conformance', async () => {
    for (const entry of ['index', 'browser', 'worker', 'server']) {
      const module = require(
        `../../package/dslens/dist/commonjs/${entry}.cjs`,
      );
      if (typeof module.resolveDslData !== 'function')
        throw new Error(`${entry}: export CommonJS ausente`);
    }
    const browserSource = await readFile(
      'package/dslens/dist/commonjs/browser.cjs',
      'utf8',
    );
    const workerSource = await readFile(
      'package/dslens/dist/commonjs/worker.cjs',
      'utf8',
    );
    if (/node:|require\(["'](?:fs|path|process)/u.test(browserSource))
      throw new Error('CommonJS browser incorporou API Node.js');
    if (/document\.|window\.|node:/u.test(workerSource))
      throw new Error('CommonJS worker incorporou DOM ou Node.js');
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
    let received = null;
    const server = createServer((request, response) => {
      const chunks = [];
      request.on('data', (chunk) => chunks.push(chunk));
      request.on('end', () => {
        received = {
          method: request.method,
          query: request.url,
          header: request.headers['x-token'],
          body: Buffer.concat(chunks).toString('utf8'),
        };
        response.writeHead(200, {
          'content-type': 'application/json',
        });
        response.end(body);
      });
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
      const postValue = await resolveParserExpression(
        `\${"http://127.0.0.1:${address.port}/fixture"; {"method":"POST","query":{"page":1},"headers":{"X-Token":{"env":"TOKEN"}},"body":{"encoding":"json","value":{"id":7}}}}.releases[0].url`,
        { env: { TOKEN: 'safe-test-token' } },
      );
      if (
        postValue !== 'https://example.test/app.zip' ||
        received?.method !== 'POST' ||
        received?.query !== '/fixture?page=1' ||
        received?.header !== 'safe-test-token' ||
        received?.body !== '{"id":7}'
      )
        throw new Error('request POST posicional divergente');
    } finally {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await rm(directory, { recursive: true, force: true });
    }
  });

  await stage('manifests-and-site', async () => {
    run('manifests:validate', process.execPath, [
      'scripts/manifests/validate.mjs',
    ]);
    run('site:build', process.execPath, ['scripts/site/build.mjs']);
    const site = await readFile('site/dist/index.html', 'utf8');
    const demo = await readFile('site/dist/assets/demo-core.js', 'utf8');
    const bundle = await readFile(
      'site/dist/assets/dslens.browser.min.js',
      'utf8',
    );
    if (
      !site.includes('Content-Security-Policy') ||
      !demo.includes('classification') ||
      !bundle.includes('DSLens')
    )
      throw new Error('site ou demo gerados incompletos');
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

/** Valida o manifesto público contra o schema versionado atual sem dependência externa. */
function validateManifest(manifest) {
  assertObject(manifest, 'manifest');
  assertKeys(manifest, [
    'schemaVersion',
    'project',
    'contractVersion',
    'implementations',
    'capabilities',
    'publicSurface',
    'artifacts',
  ], 'manifest');
  if (manifest.schemaVersion !== 1) throw new Error('schemaVersion inválido');
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(manifest.contractVersion))
    throw new Error('contractVersion inválida');
  assertObject(manifest.project, 'project');
  assertKeys(manifest.project, ['name', 'repository', 'license'], 'project');
  if (
    manifest.project.name !== 'DSLens' ||
    manifest.project.license !== 'MPL-2.0' ||
    !URL.canParse(manifest.project.repository)
  )
    throw new Error('project inválido');
  for (const item of assertArray(manifest.implementations, 'implementations')) {
    assertKeys(item, ['id', 'language', 'runtime', 'version', 'status', 'capabilities'], `implementation ${item.id}`);
    assertId(item.id);
    assertStatus(item.status);
    assertArray(item.capabilities, `implementation ${item.id}.capabilities`).forEach(assertId);
  }
  for (const item of assertArray(manifest.capabilities, 'capabilities')) {
    assertKeys(item, ['id', 'status', 'normativeReference'], `capability ${item.id}`);
    assertId(item.id);
    assertStatus(item.status);
    assertText(item.normativeReference, `capability ${item.id}.normativeReference`);
  }
  for (const item of assertArray(manifest.publicSurface, 'publicSurface')) {
    assertKeys(item, [
      'id',
      'category',
      'language',
      'runtime',
      'signature',
      'synchronism',
      'stability',
      'import',
      'normativeReference',
    ], `publicSurface ${item.id}`, true);
    assertId(item.id);
    assertText(item.signature, `publicSurface ${item.id}.signature`);
  }
  for (const item of assertArray(manifest.artifacts, 'artifacts')) {
    assertKeys(item, [
      'id',
      'implementation',
      'consumer',
      'runtime',
      'format',
      'entryPoint',
      'types',
      'externalDependencies',
      'minified',
      'sourceMap',
      'stability',
      'budgetBytes',
    ], `artifact ${item.id}`, true);
    assertId(item.id);
    assertId(item.implementation);
    assertText(item.entryPoint, `artifact ${item.id}.entryPoint`);
  }
}

function assertObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${name} deve ser objeto`);
}

function assertArray(value, name) {
  if (!Array.isArray(value)) throw new Error(`${name} deve ser array`);
  return value;
}

function assertKeys(value, required, name, allowExtra = false) {
  assertObject(value, name);
  for (const key of required)
    if (!Object.prototype.hasOwnProperty.call(value, key))
      throw new Error(`${name}.${key} ausente`);
  if (!allowExtra) {
    const extra = Object.keys(value).filter((key) => !required.includes(key));
    if (extra.length) throw new Error(`${name} possui campos extras: ${extra.join(',')}`);
  }
}

function assertId(value) {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:[._:/-][a-z0-9]+)*$/u.test(value))
    throw new Error(`id inválido: ${value}`);
}

function assertStatus(value) {
  if (!['required', 'supported', 'optional', 'experimental', 'unavailable', 'environment-incompatible'].includes(value))
    throw new Error(`status inválido: ${value}`);
}

function assertText(value, name) {
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`${name} deve ser texto`);
}
