/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import {
  resolveDslData,
  resolveParserExpression,
} from './dslens.browser.min.js';
import {
  DSLENS_DEMO_EXAMPLES,
  runDslensDemoExample,
} from './demo-core.js';

const api = { resolveDslData, resolveParserExpression };
const list = document.querySelector('#examples');
const panel = document.querySelector('#panel');

for (const example of DSLENS_DEMO_EXAMPLES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = example.title;
  button.addEventListener('click', () => {
    history.replaceState(null, '', `#${example.id}`);
    render(example.id);
  });
  list.append(button);
}

async function render(id) {
  const example =
    DSLENS_DEMO_EXAMPLES.find((item) => item.id === id) ??
    DSLENS_DEMO_EXAMPLES[0];
  for (const button of list.querySelectorAll('button'))
    button.setAttribute(
      'aria-current',
      button.textContent === example.title ? 'true' : 'false',
    );
  panel.textContent = 'carregando';
  const result = await runDslensDemoExample(example, api);
  panel.innerHTML = `
    <h3>${escapeHtml(example.title)}</h3>
    <p class="meta"><a href="${escapeAttribute(example.sourceUrl)}">${escapeHtml(example.sourceLabel)}</a> · ${escapeHtml(example.classification)} · ${escapeHtml(example.format)} · ${escapeHtml(result.status)} · ${result.durationMs} ms</p>
    <h4>Comando executado</h4>
    <pre><code>${escapeHtml(example.command)}</code></pre>
    <h4>Resultado real</h4>
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

