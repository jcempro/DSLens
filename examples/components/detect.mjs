/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { hasParserExpression } from '../../package/dslens/dist/javascript/components/detect.js';

const expression = '${"https://api.example.test/data"}.items[0].id';
console.log(hasParserExpression(expression));

