/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { execFileSync } from 'node:child_process';
import {
  GENERATED_TSCONFIG,
  prepareEcmascriptBuild,
} from './ecmascript-target.mjs';

await prepareEcmascriptBuild();
execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    '-p',
    GENERATED_TSCONFIG,
    '--noEmit',
  ],
  { stdio: 'inherit' },
);
