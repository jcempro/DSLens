/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { resolveDslData } from '../../package/dslens/dist/javascript/components/resolve-data.js';

const data = { users: [{ name: 'Ana', active: true }] };
console.log(resolveDslData(data, '.users[?(@.active = true)].name'));

