/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
export const DSLENS_DEMO_EXAMPLES = [
  {
    id: 'github-license-live',
    title: 'Licenca do repositorio',
    classification: 'live',
    format: 'json',
    sourceUrl: 'https://api.github.com/repos/jcempro/DSLens',
    sourceLabel: 'GitHub REST API',
    command:
      '${"https://api.github.com/repos/jcempro/DSLens"}.license.spdx_id',
    mode: 'source',
  },
  {
    id: 'offline-users-json',
    title: 'Usuarios ativos em fixture JSON',
    classification: 'offline',
    format: 'json',
    sourceUrl: './fixtures/users.json',
    sourceLabel: 'Fixture local versionada',
    command: 'all(.users[?(@.active = true)].name)',
    mode: 'data',
    data: {
      users: [
        { name: 'Ana', active: true },
        { name: 'Bruno', active: false },
        { name: 'Carla', active: true },
      ],
    },
  },
  {
    id: 'offline-xml-dom',
    title: 'Titulo em XML local via DOMParser',
    classification: 'offline',
    format: 'xml',
    sourceUrl: './fixtures/catalog.xml',
    sourceLabel: 'Fixture XML local versionada',
    command: '.book.title.text()',
    mode: 'xml',
    data:
      '<catalog><book id="b1"><title>Ana</title></book></catalog>',
  },
  {
    id: 'yaml-documental',
    title: 'YAML sem parser browser obrigatorio',
    classification: 'documental',
    format: 'yaml',
    sourceUrl: './fixtures/users.yaml',
    sourceLabel: 'Fixture YAML local para runtimes com parser seguro',
    command: '.users[0].name',
    mode: 'documental',
    note:
      'O browser nao incorpora parser YAML obrigatorio; use objeto ja carregado ou runtime com parser seguro.',
  },
];

export async function runDslensDemoExample(example, api) {
  const started = performance.now();
  const metadata = {
    id: example.id,
    classification: example.classification,
    format: example.format,
    sourceUrl: example.sourceUrl,
    command: example.command,
    status: 'loading',
  };
  try {
    if (example.mode === 'documental')
      return finish(metadata, started, {
        status: 'source-incompatible',
        result: null,
        note: example.note,
      });
    if (example.mode === 'source') {
      const result = await api.resolveParserExpression(example.command, {
        timeoutMs: 10000,
      });
      return finish(metadata, started, {
        status: result === null ? 'empty' : 'completed',
        result,
      });
    }
    if (example.mode === 'xml') {
      const document = new DOMParser().parseFromString(
        example.data,
        'application/xml',
      );
      const result = api.resolveDslData(
        document.documentElement,
        example.command,
      );
      return finish(metadata, started, {
        status: result === null ? 'empty' : 'completed',
        result,
      });
    }
    const result = api.resolveDslData(example.data, example.command);
    return finish(metadata, started, {
      status: result === null ? 'empty' : 'completed',
      result,
    });
  } catch (error) {
    return finish(metadata, started, {
      status:
        error instanceof DOMException && error.name === 'AbortError' ?
          'timeout'
        : 'failed',
      result: null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function finish(metadata, started, result) {
  return {
    ...metadata,
    ...result,
    durationMs: Math.round(performance.now() - started),
  };
}

