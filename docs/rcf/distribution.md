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
| JavaScript minificado | browser/CDN/local | implementado |
| declarações/maps | toolchain TS/depuração | implementado |

CommonJS, IIFE e UMD NÃO DEVEM ser produzidos sem consumidor e decisão registrada.

## 3. Git e submódulo

Git e submódulo DEVEM permitir checkout em path arbitrário. Código DEVE resolver recurso relativo ao próprio módulo (`$PSScriptRoot`, `import.meta.url`, `__file__` ou equivalente) ou configuração explícita. CWD, nome `DSLens`, profundidade, raiz do consumidor e ausência de symlink NÃO DEVEM ser pressupostos.

Diagnóstico DEVE distinguir instalação aninhada, workspace, monorepo, symlink, submódulo renomeado, asset ausente, módulo duplicado e import relativo inválido. Fallback NÃO DEVE mascarar estrutura inválida.

## 4. Manifestos

Manifesto JSON canônico DEVE usar `./schemas/dslens-manifest.schema.json`, ordenação lexicográfica de chaves e arrays ordenados por `id` quando não houver ordem semântica. Ele NÃO DEVE conter exemplos ou prosa extensa. O Markdown híbrido DEVE ser derivado ou validado e PODE conter exemplos.

Toda API, hook, adaptador, evento, configuração, módulo, subpath, comando, build, binding e schema públicos DEVEM constar no manifesto. Assinatura divergente DEVE bloquear pacote e release.

## 5. Reprodutibilidade e publicação

Build DEVE partir de checkout limpo, lockfile aprovado e toolchain fixada; timestamp e path local NÃO DEVEM alterar bytes quando não integrarem metadado normativo. Hashes DEVEM ser registrados. Source map público DEVE usar paths portáveis e excluir segredo ou fonte não destinada à distribuição.

Publicação DEVE validar pacote montado, não somente árvore-fonte. Para npm, `npm pack --dry-run`, tarball real, instalação limpa e imports de todos os exports DEVEM preceder release. CDN DEVE servir exatamente artefato versionado e verificável. Release DEVE seguir `./.agents/scenarios/release/scenario.md` somente após autorização.

## 6. Orçamentos

Baseline DEVE medir arquivo individual e pacote, distinguindo fonte, runtime, tipos e maps. Regressão DEVE registrar valor anterior, novo, delta e causa. Orçamento inicial permanece pendente até artefato real; ausência de baseline NÃO autoriza publicação do build otimizado.
