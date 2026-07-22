# resolve-source

Componente assíncrono para obter fonte HTTP(S) JSON com `fetch` e aplicar o núcleo de seleção estrutural.

Importação:

```ts
import { resolveParserExpression } from "@jeancarloem/dslens/components/resolve-source";
import { resolveParserExpression as resolveBrowserSource } from "@jeancarloem/dslens/browser/components/resolve-source";
```

Ambiente: browser com CORS compatível, Node.js com `fetch` global ou bundler equivalente. Efeitos colaterais: requisição HTTP de leitura. Dependências: `fetch`.

API:

- `resolveParserExpression(source: string, options?: ResolveSourceOptions, callback?: DslCallback): Promise<string | null>`

Opções: `signal`, `timeoutMs`, `fetcher` e `env` injetado para cabeçalhos declarados por referência. O browser não lê ambiente global.

Limitações: resposta precisa ser JSON; fontes bloqueadas por CORS devem ser classificadas como documentais ou offline.

Exemplo mínimo:

```ts
await resolveParserExpression('${"https://api.github.com/repos/jcempro/DSLens"}.license.spdx_id');
```

Relacionado: [manifest](../../manifests/components/resolve-source.json), [RCF](../../RCF.md#7-sincronismo-estado-cache-e-limites).

