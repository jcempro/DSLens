# DSLens

[![Linguagens](https://img.shields.io/badge/linguagens-PowerShell%20%7C%20Python%20%7C%20TypeScript%20%7C%20JavaScript-3178c6)](RCF.md)
[![Runtimes](https://img.shields.io/badge/runtimes-PowerShell%205.1%2B%20%7C%20Python%203.11%2B%20%7C%20Node.js%2020.19%2B-43853d)](RCF.md)
[![Ambientes](https://img.shields.io/badge/ambientes-Windows%20%7C%20Linux%20%7C%20Browser%20%7C%20Worker-blue)](docs/rcf/typescript-javascript.md)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MPL--2.0-brightgreen)](LICENSE)
[![Build](https://github.com/jcempro/DSLens/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/jcempro/DSLens/actions/workflows/tests.yml)

DSLens é uma especificação e uma família de bibliotecas para localizar valores em JSON, XML e, quando disponível, YAML por meio de uma expressão declarativa. A proposta se parece com um seletor para APIs estruturadas: entrada explícita, navegação previsível e o mesmo resultado semântico em cada linguagem certificada.

```text
${"https://api.example.com/data"}.items[0].download.url
```

O projeto está em desenvolvimento. PowerShell e Python existem e estão em convergência obrigatória com o contrato comum. TypeScript e JavaScript foram autorizados: TypeScript será importável opcionalmente e será transpilado para JavaScript destinado a cliente e servidor.

## O que existe hoje

- PowerShell 5.1 e 7.4+: [src/ps/dsl.ps1](src/ps/dsl.ps1), com detecção, fetch HTTP(S) por GET, JSON/XML/YAML condicionado, navegação, cache em memória e retorno fail-safe.
- Teste PowerShell dependente de rede: [src/ps/dsl.test.ps1](src/ps/dsl.test.ps1).
- Python: [src/py/dsl.py](src/py/dsl.py), atualmente com diferenças que serão corrigidas pelos mesmos vetores de conformidade aplicados às demais linguagens.
- Vetores ainda incompletos: [tests/expected.json](tests/expected.json).

O trabalho autorizado adicionará pacote do produto, TypeScript importável, JavaScript de cliente e servidor, declarações, bundle e manifestos. O `package.json` atual pertence à governança operacional e não representa o pacote DSLens publicável; a segregação será preservada.

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

Nenhuma linguagem é principal: a sintaxe e a semântica são canônicas. TypeScript será uma implementação importável opcionalmente e a fonte de transpilação dos artefatos JavaScript dessa família. O núcleo browser não dependerá de Node.js, DOM, bundler ou serviço externo para ser importado. O pacote oferecerá JavaScript executável, tipos e fonte TypeScript por subpath explícito.

## Distribuição planejada

Os canais previstos são Git, submódulo Git, npm, importação ESM, arquivo local e CDN. O checkout como submódulo poderá ocupar path arbitrário; nenhuma implementação poderá depender do nome da pasta ou do diretório corrente.

Artefatos planejados incluem ESM core, browser, worker, adaptador Node.js, declarações, source maps e um JavaScript client-side otimizado. CommonJS, IIFE ou UMD somente serão adicionados após necessidade comprovada e decisão registrada.

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

`npm test` será o ponto único para unidades, integração, conformidade multilinguagem e E2E. O perfil determinístico usará mocks e fixtures locais geradas; APIs públicas reais integrarão um perfil opt-in separado, pois disponibilidade externa não pode definir o resultado obrigatório do CI.

Em terminal local, a saída será compacta, colorida quando suportada e legível por pessoas. Em CI, cores serão desativadas e o mesmo resultado manterá estrutura estável para parsing por automações e agentes. O workflow será executado em mudanças de runtime ou configuração e poderá ser acionado manualmente; commits exclusivamente documentais não iniciarão testes.

## Licença e autoria

Licenciado sob [Mozilla Public License 2.0](LICENSE). Autor primário: [JeanCarloEM](https://jeancarloem.com). Repositório: [jcempro/DSLens](https://github.com/jcempro/DSLens).
