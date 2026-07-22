# resolve-data

Componente de seleção estrutural local. Resolve um path DSLens sobre JSON, objeto YAML já parseado ou nó XML/DOM fornecido pelo runtime.

Importação:

```ts
import { resolveDslData } from "@jeancarloem/dslens/components/resolve-data";
import { resolveDslData as resolveBrowserData } from "@jeancarloem/dslens/browser/components/resolve-data";
```

Ambiente: browser, worker, Node.js e bundlers. Efeitos colaterais: nenhum. Dependências: nenhuma.

API:

- `resolveDslData(data: unknown, path: string, callback?: DslCallback): string | null`
- `toDslResult(value: string | null, code?: string): DslResult`

Limitações: HTML, XPath arbitrário, `eval`, índices negativos, fatias e projeções transformacionais não são suportados.

Exemplo mínimo:

```ts
resolveDslData({ users: [{ name: "Ana", active: true }] }, ".users[?(@.active = true)].name");
```

Relacionado: [manifest](../../manifests/components/resolve-data.json), [RCF](../../RCF.md#511-seletores-estruturais-compatíveis).

