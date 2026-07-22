/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import {
  DSLENS_DEMO_EXAMPLES,
  runDslensDemoExample,
} from '../shared/demo-core.js';
import {
  resolveDslData,
  resolveParserExpression,
} from '../../package/dslens/dist/javascript/browser.js';

const api = { resolveDslData, resolveParserExpression };
const list = document.querySelector('#examples');
const panel = document.querySelector('#panel');

for (const example of DSLENS_DEMO_EXAMPLES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = example.title;
  button.addEventListener('click', () => render(example.id));
  list.append(button);
}

async function render(id) {
  const example = DSLENS_DEMO_EXAMPLES.find((item) => item.id === id);
  if (!example) return;
  panel.textContent = 'carregando';
  const result = await runDslensDemoExample(example, api);
  panel.innerHTML = `
    <h2>${escapeHtml(example.title)}</h2>
    <p><a href="${escapeAttribute(example.sourceUrl)}">${escapeHtml(example.sourceLabel)}</a> · ${escapeHtml(example.classification)} · ${escapeHtml(example.format)}</p>
    <pre><code>${escapeHtml(example.command)}</code></pre>
    <pre><code>${escapeHtml(JSON.stringify(result, null, 2))}</code></pre>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

await render(location.hash.slice(1) || DSLENS_DEMO_EXAMPLES[0].id);

