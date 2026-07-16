/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

export const ECMASCRIPT_FLOOR_YEAR = 2020;
export const ECMASCRIPT_WINDOW_YEARS = 5;
export const MODULE_TARGET = 'ES2020';
export const GENERATED_TSCONFIG = '.runtime/tsconfig.build.json';

/** Resolve o ano ECMAScript efetivo a partir do ano civil UTC. */
export function resolveEcmascriptPolicy(sourceYear) {
  if (!Number.isInteger(sourceYear) || sourceYear < 0)
    throw new TypeError(`Ano UTC inválido: ${sourceYear}`);
  const targetYear = Math.max(
    ECMASCRIPT_FLOOR_YEAR,
    sourceYear - ECMASCRIPT_WINDOW_YEARS,
  );
  const target = `ES${targetYear}`;
  return {
    schema: 1,
    policy: 'utc-year-minus-5',
    sourceYear,
    windowYears: ECMASCRIPT_WINDOW_YEARS,
    floor: `ES${ECMASCRIPT_FLOOR_YEAR}`,
    target,
    module: MODULE_TARGET,
    lib: [target, 'DOM', 'WebWorker'],
  };
}

/** Valida a base versionada e grava a configuração derivada do build. */
export async function prepareEcmascriptBuild(
  sourceYear = new Date().getUTCFullYear(),
) {
  const base = JSON.parse(await readFile('tsconfig.json', 'utf8'));
  const options = base.compilerOptions ?? {};
  if (
    options.target !== 'ES2020' ||
    options.module !== MODULE_TARGET ||
    !Array.isArray(options.lib) ||
    options.lib[0] !== 'ES2020'
  )
    throw new Error(
      'tsconfig.json deve preservar a base target/module/lib ES2020',
    );

  const policy = resolveEcmascriptPolicy(sourceYear);
  await mkdir('.runtime', { recursive: true });
  await writeFile(
    GENERATED_TSCONFIG,
    `${JSON.stringify(
      {
        extends: '../tsconfig.json',
        compilerOptions: {
          target: policy.target,
          module: policy.module,
          lib: policy.lib,
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  return policy;
}
