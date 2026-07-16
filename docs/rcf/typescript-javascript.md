# Sub-RCF — TypeScript, JavaScript e npm

## 1. Escopo e estado

Este arquivo especializa `../../RCF.md` para TypeScript, JavaScript, browser, worker, Node.js e npm. A implementação está autorizada, mas nenhum item DEVE ser apresentado como concluído antes de artefato e validação correspondentes.

## 2. Baseline TypeScript

TypeScript DEVE constituir uma implementação equivalente e a fonte de transpilação dos artefatos JavaScript desta família, sem precedência sobre outra linguagem. Versão mínima normativa: TypeScript 5.8; `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `isolatedModules` e emissão de declarações DEVEM permanecer ativos, salvo incompatibilidade objetiva registrada.

Configuração DEVE usar base compartilhada e projetos referenciados por perfil quando isso reduzir builds repetidos. Target mínimo DEVE ser ES2020 para módulos e browser; bibliotecas de tipos DEVEM ser segregadas (`ES2020`, DOM e WebWorker somente nos projetos aplicáveis). Resolução DEVE usar `Bundler` para fonte destinada a bundlers/browser e `NodeNext` somente para adaptadores Node.js.

Aliases internos DEVEM ser eliminados ou resolvidos nos artefatos. `declaration`, `declarationMap` e `sourceMap` DEVEM ser gerados para builds não minificados publicados. `.d.ts` DEVE corresponder exatamente a cada módulo JavaScript exportado e NÃO DEVE expor tipo interno, path privado ou dependência de desenvolvimento.

## 3. Núcleo e API

O núcleo DEVE ser funcional, síncrono e livre de I/O: detectar, compilar/validar expressão, interpretar dados já fornecidos e navegar. Classes DEVERIAM encapsular parser compilado, cache ou ciclo de vida; funções puras PODEM realizar tokenização e navegação.

API pública DEVE incluir equivalentes tipados de detecção e resolução síncrona, além de resultado estruturado. TypeScript DEVE ser importável por subpath explícito e OPCIONAL; JavaScript transpilado DEVE ser a entrada executável padrão. Nomes finais DEVEM ser fixados no manifesto antes da implementação. Fetch DEVE residir em adaptador assíncrono; a fachada async DEVE aceitar `AbortSignal`, timeout e fornecedor de fetch injetável.

## 4. Browser e workers

Entry point `browser` NÃO DEVE importar `node:*`, `fs`, `path`, `process`, CommonJS, binário, serviço servidor ou bundler no consumidor. Ele DEVE funcionar por ESM nativo, CDN, arquivo local e bundler. Build por `<script>` PODE ser IIFE após decisão de `../../RCF.md` §16; se existir, DEVE expor um único namespace estável e configurável sem vazar internos.

Rede síncrona na thread principal NÃO DEVE ser requisito. Resolução síncrona DEVE operar sobre dados fornecidos; obtenção browser DEVE ser assíncrona. Worker e Service Worker DEVEM usar entry points próprios, sem assumir DOM. SSR NÃO DEVE executar efeito de browser na importação.

O artefato client-side ultraotimizado DEVE ser JavaScript sem TypeScript, carregar e executar em navegador real, preservar API aplicável e banner, excluir código Node.js, permitir CDN/local e registrar tamanhos bruto, minificado, gzip e Brotli. Dependência externa DEVE ser resolvida ou declarada.

## 5. Node.js

JavaScript server-side DEVE ser publicado por subpath e condição próprios. Baseline mínimo: Node.js 20.19.0. Código server-side NÃO DEVE integrar o core/browser. CommonJS somente PODE ser publicado diante de consumidor comprovado e teste contra dual-package hazard; ESM DEVE ser padrão.

## 6. npm e exports

O pacote do produto DEVE possuir manifesto distinto do manifesto operacional de governança atualmente existente na raiz; a estrutura física DEVE preservar essa segregação.

O futuro `package.json` publicável DEVE declarar `name`, `version`, `description`, `license`, `author`, `repository`, `homepage`, `bugs`, `keywords`, `type`, `types`, `exports`, `files`, `engines`, `sideEffects`, dependências e scripts aplicáveis. `main`, `module`, `browser`, `imports`, `bin` e `workspaces` somente DEVEM existir quando houver consumidor ou função comprovada.

`exports` DEVE fechar paths internos e declarar condições `types` antes das condições de runtime. Subpaths mínimos previstos: `.`, `./browser`, `./worker`, `./node`, `./async`, `./manifest`; somente os realmente gerados DEVEM ser publicados. Fonte TypeScript PODE ser exposta por subpath experimental explícito; NÃO DEVE ser entrada padrão.

JavaScript compilado DEVE ser entrada padrão. Consumidor DEVE poder instalar tarball e importar cada entry point sem TypeScript, bundler ou dependência de desenvolvimento. `files` DEVE incluir somente runtime, tipos, maps aprovados, licença, README e manifestos públicos.

## 7. Scripts e dependências

Scripts npm futuros DEVEM compor os comandos `agent:*` aplicáveis sem renomeá-los. Typecheck, lint, teste, build, validação de exports, schema, tamanho, pacote simulado e release DEVEM possuir comandos determinísticos. Comando extenso DEVERIA residir em arquivo reutilizável.

Runtime core DEVERIA possuir zero dependência. Parser YAML, XML ou fetch auxiliar somente PODE ser adotado após licença, manutenção, tamanho e suporte browser comprovados; dependência opcional DEVE ter ausência funcionalmente definida.

## 8. Validação futura

Validação DEVE cobrir TypeScript, JavaScript emitido, declarações, maps, ESM, browser real, worker, Node.js, async/cancelamento, tree-shaking, side effects, importação isolada, CDN/local, tamanho, headers, `npm pack`, conteúdo do tarball e instalação em projeto limpo. Nenhum build DEVE ser publicado antes de paridade com vetores canônicos.

O testador npm DEVE compor níveis unitário, integração, conformidade e E2E. Mocks e fixtures geradas DEVEM ser reproduzíveis; API real DEVE ser opt-in. Saída local PODE usar ANSI sem alterar conteúdo semântico; CI DEVE emitir texto estável sem ANSI. Dependência visual somente PODE ser adotada quando proporcional e isolada ao desenvolvimento.
