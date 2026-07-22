# DSLens

[![Linguagens](https://img.shields.io/badge/linguagens-PowerShell%20%7C%20Python%20%7C%20TypeScript%20%7C%20JavaScript-3178c6)](RCF.md)
[![Runtimes](https://img.shields.io/badge/runtimes-PowerShell%205.1%2B%20%7C%20Python%203.11%2B%20%7C%20Node.js%2020.19%2B-43853d)](RCF.md)
[![Ambientes](https://img.shields.io/badge/ambientes-Windows%20%7C%20Linux%20%7C%20Browser%20%7C%20Worker-blue)](docs/rcf/typescript-javascript.md)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MPL--2.0-brightgreen)](LICENSE)
[![Build](https://github.com/jcempro/DSLens/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/jcempro/DSLens/actions/workflows/tests.yml)

> A Cross-language library for declaratively resolving dynamic endpoints and values through a navigation DSL over structured remote data.

DSLens é uma especificação e uma família de bibliotecas para localizar valores em JSON, XML e, quando disponível, YAML por meio de uma expressão declarativa. A proposta se parece com um seletor para APIs estruturadas: entrada explícita, navegação previsível e o mesmo resultado semântico em cada linguagem certificada.

```text
${"https://api.example.com/data"}.items[0].download.url
```

O projeto está em desenvolvimento. PowerShell, Python, TypeScript e JavaScript implementam o contrato comum. TypeScript é importável opcionalmente e origina por transpilação os artefatos JavaScript destinados a cliente e servidor.

## O que existe hoje

- PowerShell 5.1 e 7.4+: [src/ps/dsl.ps1](src/ps/dsl.ps1), com detecção, fetch HTTP(S) por GET, JSON/XML/YAML condicionado, navegação, cache em memória e retorno fail-safe.
- Teste PowerShell dependente de rede: [src/ps/dsl.test.ps1](src/ps/dsl.test.ps1).
- Python: [src/py/dsl.py](src/py/dsl.py), atualmente com diferenças que serão corrigidas pelos mesmos vetores de conformidade aplicados às demais linguagens.
- Vetores ainda incompletos: [tests/expected.json](tests/expected.json).

O pacote npm `@jeancarloem/dslens` é montado em `package/dslens` a partir do manifesto raiz. Ele inclui TypeScript importável, JavaScript ESM e CommonJS para browser, worker e servidor, declarações, source maps, build minificado e manifesto público, sem levar a governança ou dependências de desenvolvimento ao consumidor.

A configuração TypeScript versionada mantém `target`, `module` e biblioteca-base em `ES2020`. A cada build, `target` e biblioteca ECMAScript são derivados automaticamente como `ES(max(2020, ano UTC atual - 5))`, enquanto `module` permanece `ES2020`; em 2026, o target efetivo é `ES2021`. O metadado resolvido é distribuído pelo subpath `@jcempro/dslens/build-target`.

## Instalação e imports

```bash
npm install @jeancarloem/dslens
```

Entradas principais:

```ts
import { resolveDslData } from "@jeancarloem/dslens";
import { resolveParserExpression } from "@jeancarloem/dslens/browser";
```

Componentes individualizados:

```ts
import { hasParserExpression } from "@jeancarloem/dslens/components/detect";
import { resolveDslData } from "@jeancarloem/dslens/components/resolve-data";
import { resolveParserExpression } from "@jeancarloem/dslens/components/resolve-source";
```

Browser por componente:

```html
<script type="module">
  import { resolveParserExpression } from "@jeancarloem/dslens/browser/components/resolve-source";
</script>
```

O pacote publica JavaScript compilado ESM e CommonJS, declarações `.d.ts`, source maps aprovados, `browser.min.js`, manifests públicos e a fonte TypeScript apenas pelo subpath explícito `./typescript`. `sideEffects` é `false`; imports por componente reduzem o bundle quando o consumidor usa bundler com tree-shaking.

## Manifests por componente

O índice compacto fica em [manifests/components/index.json](manifests/components/index.json). Cada componente possui manifest de máquina e documento humano:

- [detect](docs/components/detect.md): parser e detecção;
- [resolve-data](docs/components/resolve-data.md): seleção local sem I/O;
- [resolve-source](docs/components/resolve-source.md): fetch client-side JSON e resolução.

Uso por IA/máquina:

```js
const index = await import("@jeancarloem/dslens/manifests/components", {
  with: { type: "json" }
});
const target = index.default.components.find((item) => item.id === "resolve-data");
const manifest = await import(`@jeancarloem/dslens/manifests/components/${target.id}`, {
  with: { type: "json" }
});
```

O índice não replica contratos completos; carregue somente o manifest do componente necessário.

## Sintaxe estável documentada

O perfil canônico v1 usa exatamente uma expressão com fonte HTTP(S):

```text
${"SOURCE"}.field.items[0].assets[@name="release"].url
```

Operadores documentados:

- `.field`: acesso literal a membro;
- `[0]`: índice base zero;
- `[@name="release"]`: primeira ocorrência com igualdade textual exata.

Aspas simples e duplas são aceitas no perfil histórico. Texto sem DSL é preservado. Expressão malformada, path ausente, tipo incompatível, múltiplas expressões ou resultado aninhado produzem falha normalizada.

O perfil v2 aceita um `request` opcional, nomeado ou como segundo parâmetro posicional equivalente:

```text
${"https://api.example.com"; request={"method":"POST","headers":{"Authorization":{"env":"TOKEN"}},"body":{"encoding":"json","value":{"id":1}}}}.result
${"https://api.example.com"; {"method":"POST","body":{"encoding":"json","value":{"id":1}}}}.result
```

Sem o segundo parâmetro, permanece `GET` sem body nem cabeçalho customizado. Parâmetro futuro diferente de `request` precisará ser nomeado explicitamente.

Crases, conteúdo inline, arquivos, opções de requisição, `.find()`, wildcards e interpolação parcial aparecem em documentação histórica do código, mas não estão implementados de forma contratual. Consulte as decisões pendentes no RCF antes de depender desses recursos.

## Seletores estruturais

O perfil v3 amplia o path sem mudar a sintaxe válida anterior. A raiz é implícita; não use `$` no path DSLens.

Operadores disponíveis:

- `.name`: propriedade ou elemento;
- `.["display.name"]`: propriedade delimitada;
- `[0]`: índice positivo;
- `[*]`: todos os itens diretos;
- `..email`: busca recursiva limitada;
- `[?(@.active = true)]`: filtro escalar seguro;
- `.@id`: atributo XML;
- `.text()`: texto XML;
- `first(...)`, `all(...)`, `count(...)`, `exists(...)`: cardinalidade explícita.

Exemplo JSON:

```json
{
  "users": [
    { "name": "Ana", "active": true },
    { "name": "Bruno", "active": false }
  ]
}
```

```text
.users[?(@.active = true)].name
```

Resultado:

```text
Ana
```

Exemplo YAML equivalente:

```yaml
users:
  - name: Ana
    active: true
  - name: Bruno
    active: false
```

```text
.users[?(@.active = true)].name
```

Resultado:

```text
Ana
```

Múltiplos resultados são JSON compacto quando a consulta produz mais de um item ou quando `all(...)` é usado:

```text
all(.users[*].name)
```

```json
["Ana","Bruno"]
```

Ausência retorna `null`/`None`/`$null` no binding. Existência é explícita:

```text
exists(.users[?(@.active = true)].name)
```

```text
true
```

Exemplo XML:

```xml
<catalog xmlns:x="urn:test">
  <book id="b1"><title>Ana</title></book>
  <x:book id="b2">Bruno</x:book>
</catalog>
```

```text
first(.book.@id)
.book.title.text()
.["{urn:test}book"].text()
```

Resultados:

```text
b1
Ana
Bruno
```

Uso com URL ou API preserva a expressão de fonte:

```text
${"http://127.0.0.1:3000/users"}.users[?(@.active = true)].name
${"http://127.0.0.1:3000/users"; {"query":{"page":1}}}all(.users[*].name)
```

Nos testes, API remota é simulada por servidor local determinístico; endpoints externos permanecem apenas no perfil `test:real`.

Limites de segurança do perfil v3: consulta até 2048 caracteres, 64 passos, recursão até 32 níveis, 10000 nós visitados, 1024 resultados, 32 filtros e literais até 512 caracteres. Índice negativo, fatias, união de campos, ordenação, projeção transformacional, `.find()`, XPath arbitrário, HTML e XML com `DOCTYPE` não são aceitos.

## Uso atual em PowerShell

Importação:

```powershell
. ./src/ps/dsl.ps1
$value = resolveParserExpression '${"https://api.github.com"}.current_user_url'
```

Execução direta:

```powershell
pwsh -File ./src/ps/dsl.ps1 '${"https://api.github.com"}.current_user_url'
```

A variável de ambiente `DSL_INPUT` também pode fornecer a entrada quando não há argumento. A resolução é síncrona e retorna texto ou `$null`. O callback opcional recebe mensagem e tipo:

```powershell
$callback = { param($message, $type) Write-Host "[$type] $message" }
resolveParserExpression '${"https://api.github.com"}.current_user_url' @{} $callback
```

Os nomes canônicos são idênticos em todas as linguagens: `hasParserExpression(source)`, `resolveDslData(data, path, callback?)` e `resolveParserExpression(source, options?, callback?)`. Os nomes snake_case históricos de PowerShell e Python permanecem aliases compatíveis.

Os exemplos de rede dependem do serviço remoto e não substituem os futuros vetores offline de conformidade.

## Modos síncrono e assíncrono planejados

O contrato síncrono continuará canônico para parsing e navegação sobre dados já disponíveis. No browser, fetch síncrono não será exigido: uma fachada assíncrona obterá os dados e reutilizará o mesmo núcleo síncrono. Essa separação permitirá uso direto, `Promise`, cancelamento e workers sem obrigar consumidores síncronos a adotar assincronia.

## Arquitetura planejada

- núcleo independente de linguagem e de ambiente;
- bindings idiomáticos por linguagem;
- adaptadores separados para browser, worker, Node.js e servidor;
- hooks tipados e opcionais;
- contrato público manifestado e validado por schema;
- vetores comuns para comparar resultados e falhas;
- builds produzidos somente para consumidores comprovados.

Nenhuma linguagem é principal: a sintaxe e a semântica são canônicas. TypeScript será uma implementação importável opcionalmente e a fonte de transpilação dos artefatos JavaScript dessa família. O núcleo browser não dependerá de Node.js, DOM, bundler ou serviço externo para ser importado. O pacote oferecerá JavaScript executável, tipos e fonte TypeScript por subpath explícito.

## Distribuição planejada

Os canais implementados são Git, submódulo Git, pacote npm montável, importação ESM, TypeScript explícito e arquivo JavaScript para cliente/CDN. O checkout como submódulo pode ocupar path arbitrário; nenhuma implementação depende do nome da pasta ou do diretório corrente.

Os artefatos incluem ESM e CommonJS para core, browser, worker e servidor, declarações, source maps e JavaScript client-side otimizado. IIFE e UMD permanecem condicionados a consumidor e implementação comprovados.

## Demo, site e exemplos

A demo local fica em [demo/offline/index.html](demo/offline/index.html) e reutiliza o núcleo comum [demo/shared/demo-core.js](demo/shared/demo-core.js). A mesma base é copiada para o site Pages por `npm run site:build`.

Classificação dos exemplos:

- `live`: executa requisição real client-side, como `https://api.github.com/repos/jcempro/DSLens`;
- `offline`: usa fixture versionada local, como JSON e XML em [demo/offline/fixtures](demo/offline/fixtures);
- `documental`: descreve limitação sem simular resultado, como YAML no browser sem parser obrigatório.

Cada exemplo mostra link da fonte, formato, comando exato, estado, duração e resultado obtido. CORS, timeout, resposta inválida e fonte incompatível são tratados como estado da demonstração, não como resultado falso.

O site público é gerado em `site/dist` por:

```bash
npm run site:build
npm run site:preview
```

O workflow [Pages](.github/workflows/pages.yml) é customizado e acionado manualmente por `workflow_dispatch`; ele não publica por `push`.

## Release, pacote e publicação

Comandos locais seguros:

```bash
npm run release:check
npm run release:prepare
npm run release:build
npm run release:pack
npm run release:test
npm run release:dry-run
npm run release:verify
npm run npm:verify
```

`release:dry-run` valida branch, manifests, build, site, mapa de distribuição, tarball e testes sem criar tag, release, pacote npm ou Pages. Publicação real permanece restrita a comandos explícitos de publicação e bloqueada sem autorização específica; comandos comuns como `build`, `test`, `prepare`, `site:build` e abertura da demo não publicam nada.

## Contratos e manifestos

- [RCF global](RCF.md): semântica, invariantes, compatibilidade e decisões.
- [PowerShell](docs/rcf/powershell.md): binding histórico e divergências conhecidas.
- [Python](docs/rcf/python.md): runtime, distribuição e convergência ao contrato comum.
- [TypeScript/JavaScript](docs/rcf/typescript-javascript.md): browser, workers, Node.js e npm.
- [Distribuição](docs/rcf/distribution.md): artefatos, paths e publicação.
- [Schema do manifesto](schemas/dslens-manifest.schema.json): formato público voltado a máquinas.
- [Implementações em andamento](handoff.md): projeção gerada da memória operacional canônica.

O manifesto de instância será criado junto da implementação e validado contra o schema. Recurso ausente não será anunciado como disponível.

## Compatibilidade e segurança

O núcleo proíbe HTML, scraping, `eval`, execução arbitrária, heurística e mutação remota. Rede é HTTP(S) por GET. Falhas esperadas retornam ausência e telemetria segura; nenhum diagnóstico deve expor segredo.

A paridade obrigatória abrange resultado, erro, normalização, ordenação, defaults, sincronismo e efeitos. A sintaxe e a semântica do RCF são a autoridade; nenhuma linguagem constitui evidência exclusiva.

## Desenvolvimento e contribuição

Antes de alterar comportamento, leia [AGENTS.md](AGENTS.md), [RCF.md](RCF.md) e o sub-RCF aplicável. Mudança pública deve sincronizar contrato, implementação, manifesto, documentação e testes. Recursos novos precisam de vetores comuns e não podem introduzir heurística ou divergência silenciosa entre linguagens.

As FTs de convergência e implementação são mantidas na memória operacional canônica e governam a execução incremental.

## Testes e integração contínua

`npm test` é o ponto único para typecheck, build, unidades, conformidade multilinguagem, schema, orçamento e E2E. O perfil determinístico usa mocks e fixtures locais geradas; `npm run test:real` acrescenta API pública real sem torná-la requisito do CI.

Em terminal local, a saída é compacta, colorida quando suportada e legível por pessoas. Em CI, cores são desativadas e o mesmo resultado mantém estrutura estável para parsing por automações e agentes. O workflow executa em mudanças de runtime ou configuração, aceita acionamento manual e ignora commits exclusivamente documentais.

## Licença e autoria

Licenciado sob [Mozilla Public License 2.0](LICENSE). Autor primário: [JeanCarloEM](https://jeancarloem.com). Repositório: [jcempro/DSLens](https://github.com/jcempro/DSLens).
