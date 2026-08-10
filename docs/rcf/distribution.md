# Sub-RCF — Distribuição, builds e manifestos

## 1. Escopo

Este arquivo especializa `../../RCF.md` para canais, artefatos, resolução de paths, manifestos e publicação. Canal NÃO DEVE alterar semântica.

## 2. Matriz de artefatos

Cada artefato DEVE declarar `id`, família, consumidor, runtime, formato, extensão, entry point, tipos, dependências externas, carregamento, minificação, source map, estabilidade, licença e orçamento. Matriz inicial planejada:

| Artefato | Consumidor | Estado documental |
|---|---|---|
| script PowerShell | importação/execução direta | existente, não empacotado |
| fonte Python | importação/execução direta | existente, convergência obrigatória |
| fonte TypeScript | toolchain compatível, subpath opcional | implementado |
| ESM core | browser/bundler/server compatível | implementado |
| ESM client | browser/CDN/bundler | implementado |
| worker | Web Worker | implementado |
| ESM server | Node.js | implementado |
| CommonJS core/browser/worker/server | Node.js, bundler ou ferramenta compatível | autorizado nesta FT |
| JavaScript minificado | browser/CDN/local | implementado |
| declarações/maps | toolchain TS/depuração | implementado |
| plugin documental TypeScript/ESM | browser, CDN e bundler | normatizado; implementação pendente |
| CSS separado do plugin | browser e CMS | normatizado; implementação pendente |
| plugin documental IIFE | browser por script independente após núcleo | normatizado; implementação pendente |
| all-in-one IIFE com CSS embutido | browser por script único | normatizado; implementação pendente |

CommonJS está autorizado para compatibilidade de consumidores npm legados e DEVE possuir teste contra dual-package hazard em cada entrada publicada. IIFE e UMD NÃO DEVEM ser produzidos sem consumidor e decisão registrada.

A demanda `FT-20260809-001` autoriza IIFE somente para os assets browser `dslens.browser.js`, `dslens-plugin.browser.js` e `dslens-all.browser.js`, sob o namespace único `globalThis.DSLens`; UMD permanece não autorizado. O CSS `dslens-plugin.css` DEVE ser asset próprio e corresponder semanticamente ao CSS incorporado pelo all-in-one. [PENDENTE-CODIGO]

## 3. Git e submódulo

Git e submódulo DEVEM permitir checkout em path arbitrário. Código DEVE resolver recurso relativo ao próprio módulo (`$PSScriptRoot`, `import.meta.url`, `__file__` ou equivalente) ou configuração explícita. CWD, nome `DSLens`, profundidade, raiz do consumidor e ausência de symlink NÃO DEVEM ser pressupostos.

Diagnóstico DEVE distinguir instalação aninhada, workspace, monorepo, symlink, submódulo renomeado, asset ausente, módulo duplicado e import relativo inválido. Fallback NÃO DEVE mascarar estrutura inválida.

## 4. Manifestos

Manifesto JSON canônico DEVE usar `./schemas/dslens-manifest.schema.json`, ordenação lexicográfica de chaves e arrays ordenados por `id` quando não houver ordem semântica. Ele NÃO DEVE conter exemplos ou prosa extensa. O Markdown híbrido DEVE ser derivado ou validado e PODE conter exemplos.

Toda API, hook, adaptador, evento, configuração, módulo, subpath, comando, build, binding e schema públicos DEVEM constar no manifesto. Assinatura divergente DEVE bloquear pacote e release.

O plugin DEVE possuir manifesto próprio com dependência compatível do manifesto do núcleo, opções, estados, eventos, diagnósticos, loaders, contrato de integração FormulaKit e matriz de artefatos. O manifesto NÃO DEVE duplicar catálogo ou assinatura de funções FormulaKit; registra somente provedor, política, versão/hash/atestado efetivamente validados e referência autoritativa. O all-in-one DEVE referenciar os manifestos DSLens e provar que agrega versões compatíveis sem redefinir contratos nem embutir FormulaKit. [PENDENTE-CODIGO]

Cada componente público DEVE possuir manifest individual em `./manifests/components/<id>.json`, documentação humana em `./docs/components/<id>.md` e referência no índice compacto `./manifests/components/index.json`. O pacote npm DEVE distribuir esses manifests em `./dist/manifests/components/` e expor subpaths JSON somente para leitura seletiva; o índice NÃO DEVE repetir contratos completos.

## 5. Reprodutibilidade e publicação

Build DEVE partir de checkout limpo, lockfile aprovado e toolchain fixada; timestamp e path local NÃO DEVEM alterar bytes quando não integrarem metadado normativo. Hashes DEVEM ser registrados. Source map público DEVE usar paths portáveis e excluir segredo ou fonte não destinada à distribuição.

Publicação DEVE validar pacote montado, não somente árvore-fonte. Para npm, `npm pack --dry-run`, tarball real, instalação limpa e imports de todos os exports DEVEM preceder release. CDN DEVE servir exatamente artefato versionado e verificável. Release DEVE seguir `./.ia.rules/scenarios/release/scenario.md` somente após autorização.

Release GitHub no estado `published` DEVE acionar publicação npm somente quando a tag corresponder exatamente à versão do pacote. CI DEVE usar OIDC/provenance e `NPM_TOKEN` secreto, sem expor credencial. Publicação local inicial DEVE autenticar por navegador com PKI/2FA; falha `401`/`403` DEVE orientar a vinculação de token de automação ao repositório e ao escopo npm. Versão já publicada DEVE encerrar sem nova tentativa destrutiva.

GitHub Pages DEVE usar workflow customizado, manual e explícito, com permissões mínimas, instalação reproduzível, build da biblioteca e do plugin distribuído, validação de manifests, build do site e upload oficial do artefato. O site DEVE ser estático, funcionar sob domínio/subpath configurado e não publicar por `push`. Publicação Pages pertence a `publish`/`publish:*`; `release:*` NÃO DEVE acioná-la e `site:publish` somente PODE delegar para `publish:pages`. Estado `built` sem `index.html` navegável, workflow ausente da branch publicada ou URL pública 404 é publicação inválida. [PENDENTE-CODIGO]

A Home pública DEVE identificar o produto e oferecer acesso inequívoco a **Demo/Demos**. A área usa múltiplas páginas organizadas por funcionalidades ou cenários reais, com categorias/subcategorias e navegação clara; uma página única que concentre artificialmente todos os casos é proibida. A taxonomia deriva do inventário real e não vira hierarquia rígida sem necessidade. [PENDENTE-CODIGO]

Demo online e offline DEVEM compartilhar infraestrutura visual/documental, mas cada exemplo executa o próprio plugin distribuído e o parser real exclusivamente pela API do plugin. Mock funcional, parser especial, implementação paralela, chamada direta ao parser para contornar o plugin e resultado pré-calculado ou hardcoded são proibidos. `live` executa requisição client-side real; `offline` usa fixture local declarada; `documental` apenas descreve limitação sem simular resultado. [PENDENTE-CODIGO]

Cada exemplo apresenta conjuntamente exemplo funcional, código correspondente com syntax highlighting e resultado produzido na execução. Sempre que viável, o bloco destacado deriva do mesmo elemento, template ou código executado, não de reprodução manual. Highlight, componente documental e navegação NÃO DEVEM interferir no exemplo nem implementar parte do parser. [PENDENTE-CODIGO]

Quando usar JSON, YAML, XML ou outro formato suportado, a página oferece link ou botão à fonte exata consumida; transformação de build somente é aceita quando identificada, determinística e rastreável. A cadeia fonte real → HTML/configuração real → plugin/parser real → resultado exibido DEVE ser verificável por inspeção da página e dos artefatos publicados. [PENDENTE-CODIGO]

A área cobre múltiplos usos reais e principais comportamentos sem substituir a suíte automatizada, incluindo exemplos representativos de `$.<nome>()` e degradação sem FormulaKit. Demo com FormulaKit real aplica integralmente o gate de procedência; não aceita objeto, manifesto ou origem como confiança e não enfraquece assinatura+hash para funcionar. [PENDENTE-CODIGO]

## 6. Orçamentos

Baseline DEVE medir arquivo individual e pacote, distinguindo fonte, runtime, tipos e maps. Regressão DEVE registrar valor anterior, novo, delta e causa. Orçamento inicial permanece pendente até artefato real; ausência de baseline NÃO autoriza publicação do build otimizado.
