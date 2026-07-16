# Sub-RCF — TypeScript, JavaScript e npm

## 1. Escopo e estado

Este arquivo especializa `../../RCF.md` para TypeScript, JavaScript, browser, worker, Node.js e npm. Artefato somente DEVE ser apresentado como concluído quando constar do manifesto e possuir validação correspondente.

## 2. Baseline TypeScript

TypeScript DEVE constituir uma implementação equivalente e a fonte de transpilação dos artefatos JavaScript desta família, sem precedência sobre outra linguagem. Versão mínima normativa: TypeScript 5.8; `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `isolatedModules` e emissão de declarações DEVEM permanecer ativos, salvo incompatibilidade objetiva registrada.

Configuração DEVE usar base compartilhada e projetos referenciados por perfil quando isso reduzir builds repetidos. A base versionada DEVE declarar `target: ES2020`, `module: ES2020` e biblioteca ECMAScript `ES2020`. No início de cada build, `target` e a biblioteca ECMAScript DEVEM ser derivados como `ES(max(2020, ano UTC atual - 5))`; portanto, em 2026, ambos resolvem para `ES2021`. `module` DEVE permanecer `ES2020`, pois representa o formato publicado e não a janela anual de recursos da linguagem. DOM e WebWorker DEVEM integrar somente projetos aplicáveis. Resolução DEVE usar `Bundler` para fonte destinada a bundlers/browser e `NodeNext` somente para adaptadores Node.js.

O target efetivo DEVE ser idêntico em TypeScript e esbuild, publicado em metadado determinístico do artefato e validado contra anos-limite e anos futuros sem depender do relógio real. Valor anual ainda não suportado pela toolchain DEVE encerrar o build com diagnóstico explícito; rebaixamento automático é vedado.

Aliases internos DEVEM ser eliminados ou resolvidos nos artefatos. `declaration`, `declarationMap` e `sourceMap` DEVEM ser gerados para builds não minificados publicados. `.d.ts` DEVE corresponder exatamente a cada módulo JavaScript exportado e NÃO DEVE expor tipo interno, path privado ou dependência de desenvolvimento.

## 3. Núcleo e API

O núcleo DEVE ser funcional, síncrono e livre de I/O: detectar, compilar/validar expressão, interpretar dados já fornecidos e navegar. Classes DEVERIAM encapsular parser compilado, cache ou ciclo de vida; funções puras PODEM realizar tokenização e navegação.

API pública DEVE incluir `hasParserExpression(source: string)`, `resolveDslData(data: unknown, path: string, callback?: DslCallback)` e `resolveParserExpression(source: string, options?: ResolveSourceOptions, callback?: DslCallback)`, nessa ordem, além de resultado estruturado. TypeScript DEVE ser importável por subpath explícito e OPCIONAL; JavaScript transpilado DEVE ser a entrada executável padrão. Fetch DEVE residir em adaptador assíncrono; a fachada async DEVE aceitar `AbortSignal`, timeout e fornecedor de fetch injetável.

## 4. Browser e workers

Entry point `browser` NÃO DEVE importar `node:*`, `fs`, `path`, `process`, CommonJS, binário, serviço servidor ou bundler no consumidor. Ele DEVE funcionar por ESM nativo, CDN, arquivo local e bundler. Build por `<script>` PODE ser IIFE após decisão de `../../RCF.md` §16; se existir, DEVE expor um único namespace estável e configurável sem vazar internos.

Rede síncrona na thread principal NÃO DEVE ser requisito. Resolução síncrona DEVE operar sobre dados fornecidos; obtenção browser DEVE ser assíncrona. Worker e Service Worker DEVEM usar entry points próprios, sem assumir DOM. SSR NÃO DEVE executar efeito de browser na importação.

O artefato client-side ultraotimizado DEVE ser JavaScript sem TypeScript, carregar e executar em navegador real, preservar API aplicável e banner, excluir código Node.js, permitir CDN/local e registrar tamanhos bruto, minificado, gzip e Brotli. Dependência externa DEVE ser resolvida ou declarada.

Baseline minificado após o perfil request v2: 4.510 bytes; orçamento: 5.120 bytes. O aumento anterior de 1.590 bytes (+2.920; +184%) decorre do parser JSON seguro, validação, query, headers, ambiente e body `json`/`form`/`text`. Carregamento dinâmico foi descartado por quebrar uso direto e offline; nenhuma dependência foi adicionada.

## 5. Node.js

JavaScript server-side DEVE ser publicado por subpath e condição próprios. Baseline mínimo: Node.js 20.19.0. Código server-side NÃO DEVE integrar o core/browser. CommonJS DEVE ser publicado para consumidores npm que usam `require`, em arquivo `.cjs` segregado e testado contra dual-package hazard; ESM DEVE permanecer padrão.

## 6. npm e exports

O manifesto raiz DEVE identificar o produto e conservar os scripts operacionais exigidos por `../../AGENTS.md`. O staging publicável em `../../package/dslens/` DEVE ser derivado, conter somente metadados e arquivos do consumidor e excluir governança, dependências de desenvolvimento e automação interna.

O `package.json` DEVE declarar nome `@jeancarloem/dslens`, versão `0.0.1`, licença MPL-2.0, autoria e URLs aprovadas, descrição concisa, `main: README.md`, `types`, `exports`, `files`, `engines`, `sideEffects` e scripts aplicáveis. `module`, `browser`, `imports`, `bin` e `workspaces` somente DEVEM existir quando houver consumidor ou função comprovada.

`exports` DEVE fechar paths internos, declarar `types` antes das condições de runtime e rotear `browser`, `worker`, `node`, `import`, `require` e `default` sem detecção heurística. Subpaths mínimos: `.`, `./browser`, `./worker`, `./server`, `./typescript`, `./manifest` e `./build-target`; somente os realmente gerados DEVEM ser publicados. Fonte TypeScript PODE ser exposta por subpath experimental explícito; NÃO DEVE ser entrada padrão.

JavaScript compilado DEVE ser entrada padrão. Consumidor DEVE poder instalar tarball e importar cada entry point sem TypeScript, bundler ou dependência de desenvolvimento. `files` DEVE incluir somente runtime, tipos, maps aprovados, licença, README e manifestos públicos.

## 7. Scripts e dependências

Scripts npm futuros DEVEM compor os comandos `agent:*` aplicáveis sem renomeá-los. Typecheck, lint, teste, build, validação de exports, schema, tamanho, pacote simulado e release DEVEM possuir comandos determinísticos. Comando extenso DEVERIA residir em arquivo reutilizável.

Runtime core DEVERIA possuir zero dependência. Parser YAML, XML ou fetch auxiliar somente PODE ser adotado após licença, manutenção, tamanho e suporte browser comprovados; dependência opcional DEVE ter ausência funcionalmente definida.

## 8. Validação futura

Validação DEVE cobrir TypeScript, JavaScript emitido, declarações, maps, ESM, browser real, worker, Node.js, async/cancelamento, tree-shaking, side effects, importação isolada, CDN/local, tamanho, headers, `npm pack`, conteúdo do tarball e instalação em projeto limpo. Nenhum build DEVE ser publicado antes de paridade com vetores canônicos.

O testador npm DEVE compor níveis unitário, integração, conformidade e E2E. Mocks e fixtures geradas DEVEM ser reproduzíveis; API real DEVE ser opt-in. Saída local PODE usar ANSI sem alterar conteúdo semântico; CI DEVE emitir texto estável sem ANSI. Dependência visual somente PODE ser adotada quando proporcional e isolada ao desenvolvimento.
