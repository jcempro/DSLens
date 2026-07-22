/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { resolveParserExpression } from '../../package/dslens/dist/javascript/components/resolve-source.js';

const expression = '${"https://api.github.com/repos/jcempro/DSLens"}.license.spdx_id';
console.log(await resolveParserExpression(expression));

