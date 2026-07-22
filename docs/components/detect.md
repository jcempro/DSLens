# detect

Componente de parser para reconhecer expressões DSLens e extrair origem, request opcional e path sem executar rede.

Importação:

```ts
import { hasParserExpression, parseDslExpression } from "@jeancarloem/dslens/components/detect";
import { hasParserExpression as hasBrowserExpression } from "@jeancarloem/dslens/browser/components/detect";
```

Ambiente: browser, worker, Node.js e bundlers. Efeitos colaterais: nenhum. Dependências: nenhuma.

API:

- `hasParserExpression(source: string): boolean`
- `parseDslExpression(source: string): ParsedDslExpression | null`

Limitações: aceita somente uma expressão com fonte HTTP(S); expressão malformada retorna `false` ou `null`.

Exemplo mínimo:

```ts
hasParserExpression('${"https://api.example.test/data"}.items[0].id');
```

Relacionado: [manifest](../../manifests/components/detect.json), [RCF](../../RCF.md#6-entradas-saídas-falhas-e-telemetria).

