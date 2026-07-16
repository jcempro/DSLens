# DSLens

DSLens é uma especificação e uma família de bibliotecas para localizar valores em JSON, XML e, quando disponível, YAML por meio de uma expressão declarativa. A proposta se parece com um seletor para APIs estruturadas: entrada explícita, navegação previsível e o mesmo resultado semântico em cada linguagem certificada.

```text
${"https://api.example.com/data"}.items[0].download.url
```

O projeto está em desenvolvimento. A implementação PowerShell existe; a implementação Python é experimental e ainda não está certificada; TypeScript/JavaScript, npm, browser e workers estão planejados e ainda não foram implementados.

## O que existe hoje

- PowerShell 5.1 e 7.4+: [src/ps/dsl.ps1](src/ps/dsl.ps1), com detecção, fetch HTTP(S) por GET, JSON/XML/YAML condicionado, navegação, cache em memória e retorno fail-safe.
- Teste PowerShell dependente de rede: [src/ps/dsl.test.ps1](src/ps/dsl.test.ps1).
- Python experimental: [src/py/dsl.py](src/py/dsl.py). Ele contém diferenças conhecidas em relação ao PowerShell e não define sozinho o contrato.
- Vetores ainda incompletos: [tests/expected.json](tests/expected.json).

Não existem nesta revisão pacote npm do produto, build JavaScript, declarações TypeScript, bundle CDN ou artefato para browser. O `package.json` atual pertence à governança operacional e não representa um pacote DSLens publicável.

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

Crases, conteúdo inline, arquivos, opções de requisição, `.find()`, wildcards e interpolação parcial aparecem em documentação histórica do código, mas não estão implementados de forma contratual. Consulte as decisões pendentes no RCF antes de depender desses recursos.

## Uso atual em PowerShell

Importação:

```powershell
. ./src/ps/dsl.ps1
$value = resolve_parser_expression '${"https://api.github.com"}.current_user_url'
```

Execução direta:

```powershell
pwsh -File ./src/ps/dsl.ps1 '${"https://api.github.com"}.current_user_url'
```

A variável de ambiente `DSL_INPUT` também pode fornecer a entrada quando não há argumento. A resolução é síncrona e retorna texto ou `$null`. O callback opcional recebe mensagem e tipo:

```powershell
$callback = { param($message, $type) Write-Host "[$type] $message" }
resolve_parser_expression '${"https://api.github.com"}.current_user_url' $callback
```

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

TypeScript será a fonte principal da nova família. O núcleo browser não dependerá de Node.js, DOM, bundler ou serviço externo para ser importado. O pacote npm futuro deverá oferecer JavaScript executável e tipos; fonte TypeScript poderá existir em subpath explícito.

## Distribuição planejada

Os canais previstos são Git, submódulo Git, npm, importação ESM, arquivo local e CDN. O checkout como submódulo poderá ocupar path arbitrário; nenhuma implementação poderá depender do nome da pasta ou do diretório corrente.

Artefatos planejados incluem ESM core, browser, worker, adaptador Node.js, declarações, source maps e um JavaScript client-side otimizado. CommonJS, IIFE ou UMD somente serão adicionados após necessidade comprovada e decisão registrada.

## Contratos e manifestos

- [RCF global](RCF.md): semântica, invariantes, compatibilidade e decisões.
- [PowerShell](docs/rcf/powershell.md): binding histórico e divergências conhecidas.
- [TypeScript/JavaScript](docs/rcf/typescript-javascript.md): browser, workers, Node.js e npm.
- [Distribuição](docs/rcf/distribution.md): artefatos, paths e publicação.
- [Schema do manifesto](schemas/dslens-manifest.schema.json): formato público voltado a máquinas.

O manifesto de instância será criado junto da implementação e validado contra o schema. Recurso ausente não será anunciado como disponível.

## Compatibilidade e segurança

O núcleo proíbe HTML, scraping, `eval`, execução arbitrária, heurística e mutação remota. Rede é HTTP(S) por GET. Falhas esperadas retornam ausência e telemetria segura; nenhum diagnóstico deve expor segredo.

A paridade futura abrangerá resultado, erro, normalização, ordenação, defaults, sincronismo e efeitos. PowerShell é origem histórica, mas não é evidência exclusiva quando o RCF corrige ou explicita o contrato.

## Desenvolvimento e contribuição

Antes de alterar comportamento, leia [AGENTS.md](AGENTS.md), [RCF.md](RCF.md) e o sub-RCF aplicável. Mudança pública deve sincronizar contrato, implementação, manifesto, documentação e testes. Recursos novos precisam de vetores comuns e não podem introduzir heurística ou divergência silenciosa entre linguagens.

As FTs de implementação ainda não foram criadas. Elas somente serão planejadas após aprovação explícita desta documentação e autorização explícita para implementar.

## Licença e autoria

Licenciado sob [Mozilla Public License 2.0](LICENSE). Autor primário: [JeanCarloEM](https://jeancarloem.com). Repositório: [jcempro/DSLens](https://github.com/jcempro/DSLens).
