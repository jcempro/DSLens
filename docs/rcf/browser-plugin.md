# Sub-RCF — plugin browser documental

## 1. Escopo, identidade e desacoplamento

Este arquivo especializa `../../RCF.md` para a camada opcional que integra DSLens a documentos HTML/Markdown executados em navegador. O plugin DEVE depender da API browser pública da biblioteca, permanecer distribuível e versionável separadamente e NÃO DEVE transferir DOM, markup, estilo, lifecycle de documento ou funções utilitárias para o núcleo DSLens. [PENDENTE-CODIGO]

O plugin DEVE atuar exclusivamente em navegador com DOM. Importação em SSR, Node.js, worker ou ferramenta de build PODE expor tipos e funções puras, mas NÃO DEVE acessar `window`, `document`, `MutationObserver`, inserir estilo ou iniciar observação durante a importação fora de navegador. [PENDENTE-CODIGO]

O termo **host** designa o elemento explicitamente marcado; **slot de resultado**, seu descendente direto substituível; **fallback**, o conteúdo original desse slot; **placeholder**, a permanência opcional do fallback durante a resolução; **loader**, o indicador temporário; e **pipeline `$`**, a transformação explícita posterior à resolução da DSL. Esses conceitos NÃO DEVEM alterar a gramática canônica do núcleo. [PENDENTE-CODIGO]

## 2. Encapsulamento HTML/Markdown

A notação canônica DEVE ser HTML inline nativo, igualmente utilizável como HTML bruto em Markdown: um `span[data-dslens-plugin]` host, exatamente um filho direto `span[data-dslens-result]`, a expressão em `data-dslens-expression` e configuração opcional em JSON estrito no atributo `data-dslens-options`. Texto semelhante à DSL fora desse host NÃO DEVE ser descoberto nem processado. [PENDENTE-CODIGO]

```html
CPF:
<span
  data-dslens-plugin
  data-dslens-expression='${"https://example.test/customer.json"}.cpf'
  data-dslens-options='{"pipeline":"$.formatCpf(@)"}'
>
  <span data-dslens-result>CPF indisponível</span>
</span>
```

O mesmo trecho DEVE permanecer semanticamente válido em Markdown que aceite HTML inline. Processadores que removam HTML bruto não são adaptados por sintaxe Markdown proprietária; integração com eles DEVE ocorrer após a renderização por adaptador explícito que produza a mesma árvore canônica. [PENDENTE-CODIGO]

O host, a expressão e o slot DEVEM ser inequívocos. Host ausente, expressão vazia, JSON inválido, zero ou mais de um slot direto, host aninhado sem fronteira própria ou configuração desconhecida DEVEM impedir a mutação daquele host, preservar seu conteúdo e produzir diagnóstico estruturado sem lançar erro global não tratado. [PENDENTE-CODIGO]

O fallback DEVE residir como conteúdo real do slot, não em pseudo-elemento, atributo oculto, script, template ou dependência JavaScript. Sem plugin, com JavaScript desabilitado, em CSP incompatível ou diante de qualquer falha, ele DEVE permanecer visível, selecionável, acessível e integrado ao fluxo normal, sem tornar a expressão DSL texto visível da página. [PENDENTE-CODIGO]

`data-dslens-options` DEVE aceitar somente propriedades versionadas: `placeholder`, `loading`, `loadingPosition`, `loader`, `pipeline`, `timeoutMs`, `errorMode`, `observe`, `accessibility`, `formulaKitPolicy` e `formulaKitFallback`. Defaults são `placeholder:true`, `loading:true`, `loadingPosition:'after'`, `loader:'default'`, `pipeline:null`, timeout do adaptador browser, `errorMode:'preserve'`, `observe:true`, live region desativada, `formulaKitPolicy:'ignore'` e `formulaKitFallback:'[error]'`. Propriedade desconhecida, tipo incorreto ou limite excedido DEVE falhar fechado para o host. Configuração JavaScript tipada PODE complementar o atributo segundo a precedência execução manual → host → global, sem mutar objetos recebidos; fontes, trust anchors e mínimos de confiança do FormulaKit somente PODEM ser configurados na API JavaScript, nunca em atributo documental. [PENDENTE-CODIGO]

## 3. Lifecycle, estado e idempotência

Ao ser carregado em navegador, o plugin DEVE instalar a observação antes de aguardar eventos e agendar uma varredura do documento atual. Se `document.readyState` ainda for `loading`, DEVE também executar uma varredura integral após `DOMContentLoaded`; se o evento já tiver ocorrido, DEVE executar a varredura integral imediatamente, sem depender de `load` ou de evento futuro. [PENDENTE-CODIGO]

Um `MutationObserver` DEVE acompanhar inserção de subárvores e mudanças somente nos atributos canônicos, agrupar trabalho em fila finita e processar apenas hosts novos ou cuja assinatura tenha mudado. Mutações feitas pelo próprio plugin DEVEM ser identificadas e ignoradas para impedir laço, reentrada e processamento duplicado. [PENDENTE-CODIGO]

Cada host DEVE possuir estado observável `idle|queued|loading|resolved|error|disposed` em `data-dslens-state` e estado privado em `WeakMap`. A identidade de execução DEVE combinar host, expressão, opções efetivas, identidade do release FormulaKit validado e revisão dos loaders; chamada repetida com a mesma identidade DEVE retornar o resultado vigente sem nova requisição, salvo `force: true` explícito. [PENDENTE-CODIGO]

Nova execução do mesmo host DEVE abortar a anterior quando possível e usar token monotônico para impedir que resultado antigo vença uma corrida. Remoção do host DEVE cancelar recursos associados; `disconnect()` DEVE encerrar observadores e tarefas futuras sem apagar resultado já renderizado; `dispose(target)` DEVE restaurar o fallback capturado e remover apenas nós/atributos pertencentes ao plugin. [PENDENTE-CODIGO]

Falha de um host NÃO DEVE interromper outros. Timeout, aborto, erro de rede, DSL inválida, pipeline inválido, loader customizado defeituoso ou DOM removido DEVEM resultar em código estruturado, remoção segura do loader, restauração/preservação conforme `errorMode` e continuidade da fila. [PENDENTE-CODIGO]

## 4. API pública e integração

A API TypeScript/JavaScript DEVE expor `configure(options)`, `scan(root?)`, `process(target, options?)`, `observe(root?)`, `disconnect(root?)`, `dispose(target)`, `registerLoader(name, factory)` e getters imutáveis de configuração, loaders, estado e procedência FormulaKit. Não DEVE expor registro de função `$`: toda chamada `$.<nome>()` pertence exclusivamente ao FormulaKit. `root` DEVE aceitar `Document`, `DocumentFragment`, `ShadowRoot` ou `Element`; `target` DEVE aceitar elemento host ou descritor `{ element, expression?, options? }`. [PENDENTE-CODIGO]

`scan` DEVE retornar `Promise<ScanReport>` com contagens por estado e diagnósticos; `process` DEVE retornar `Promise<RenderResult>` sem depender de evento global. A entrada global IIFE DEVE usar exclusivamente `globalThis.DSLens.browserPlugin`; npm/ESM DEVE usar exports nomeados e não criar global. [PENDENTE-CODIGO]

React e Preact DEVEM integrar-se por markup canônico, `ref` e efeito que chama `process`/`dispose`, sem peer dependency obrigatória nem renderização paralela. O plugin NÃO DEVE assumir ciclo de vida do framework, reconciliar filhos fora do slot, manter Virtual DOM próprio ou processar string JSX antes que seja DOM real. [PENDENTE-CODIGO]

Shadow DOM DEVE ser observado somente quando sua raiz for passada explicitamente ou registrada por configuração. Iframe e documento cross-origin NÃO DEVEM ser atravessados; iframe same-origin exige raiz explícita e lifecycle próprio. [PENDENTE-CODIGO]

## 5. Renderização inline e acessibilidade

Antes de resolver, o plugin DEVE capturar nós originais do slot para restauração exata. Durante a resolução, `placeholder` controla se esses nós permanecem visíveis e `loading` controla independentemente se existe loader; ambos PODEM coexistir, ambos PODEM ser desativados e `loadingPosition` aceita `before|after`, com `after` como padrão. [PENDENTE-CODIGO]

O loader DEVE ser inserido como irmão do slot dentro do host e ser o único nó temporário. O sucesso DEVE removê-lo e substituir somente o conteúdo do slot por um único `Text` criado da serialização segura; `innerHTML`, `insertAdjacentHTML`, avaliação de script, URL executável e ativação implícita de markup são proibidos. [PENDENTE-CODIGO]

O erro padrão `preserve` DEVE restaurar o fallback original e remover todo estado temporário. Modos opt-in `message` e `empty` PODEM respectivamente escrever mensagem textual configurada ou esvaziar o slot, mas nunca interpretar HTML; erro de configuração sempre usa `preserve`. [PENDENTE-CODIGO]

Host, slot, placeholder e resultado DEVEM permanecer inline e herdar fonte, tamanho, peso, `line-height`, direção, escrita, alinhamento, cor e espaçamento. O CSS do plugin NÃO DEVE impor fonte, cor de fundo, altura de linha, margem, posição, largura de bloco, tema ou identidade visual ao host/resultado. [PENDENTE-CODIGO]

O loader padrão DEVE ser CSS puro, instantâneo, neutro e proporcional, reservar no máximo o avanço inline configurado equivalente a um caractere e não aumentar a caixa de linha observada. Seu fallback sem CSS DEVE ser um glifo textual discreto; tamanho, cor, espessura, opacidade, velocidade, easing, gap, alinhamento e animação DEVEM ser controláveis por CSS Custom Properties relativas a `em`/`lh`, nunca por dimensão fixa em `px`. [PENDENTE-CODIGO]

`prefers-reduced-motion: reduce` DEVE desativar rotação contínua e manter indicador estático compreensível. O loader padrão DEVE usar `aria-hidden="true"`, enquanto o host usa `aria-busy`; anúncio de resultado/erro por live region é opt-in para evitar leitura duplicada. [PENDENTE-CODIGO]

Loader alternativo DEVE ser registrado por nome e retornar `Node` ou `DocumentFragment`, nunca HTML em string. Falha do loader customizado DEVE usar o fallback textual mínimo sem cancelar a resolução. O CSS separado NÃO DEVE ser injetado pelo build independente; o all-in-one DEVE injetar o mesmo CSS uma única vez, respeitar `nonce` configurado e continuar fail-safe se a CSP bloquear a inserção. [PENDENTE-CODIGO]

## 6. Pipeline `$`, FormulaKit e falhas

O pipeline DEVE residir somente em `options.pipeline`, depois da resolução da DSL, e usar gramática própria sem alterar a expressão DSL: `pipeline = call; call = "$.", name, "(", [ argument, { ",", argument } ], ")"; argument = "@" | call | JSON-literal`. `@` representa o valor resolvido; somente chamadas FormulaKit, literais JSON e aninhamento balanceado são aceitos. O parser DEVE produzir AST antes da avaliação e impor limites conservadores de comprimento, profundidade, chamadas, argumentos e valores; `eval`, `Function`, acesso arbitrário, variável global, operador, atribuição, protótipo e chamada indireta são proibidos. Regex isolada NÃO DEVE decidir multiplicidade quando aninhamento, escaping, argumentos ou composição puderem alterar caminhos. [PENDENTE-CODIGO]

### 6.1 Autoridade, nomes e desacoplamento

FormulaKit, projeto público canônico `jcempro/FormulaKit`, é a única autoridade de implementação, cálculo, nomes, assinaturas, tipos e semântica de toda função apresentada pelo plugin como `$.<nome>()`. `<nome>` DEVE coincidir exatamente, inclusive caixa, com nome público documentado e exportado pelo release FormulaKit validado. DSLens NÃO DEVE manter catálogo autoritativo, alias, renomeação, wrapper semântico, cópia, fork, substituto, polyfill, registro customizado no namespace `$` ou lógica equivalente; documentação local referencia a API FormulaKit sem reproduzir sua lista. [PENDENTE-CODIGO]

A API FormulaKit 0.1.0 observada em 2026-08-10 exporta funções por namespaces no módulo raiz e documenta a superfície em `docs/API.md`; `globalThis.FormulaKit.manifests` contém assinaturas estruturais de artefatos e NÃO expõe nem autentica funções. O adaptador DEVE resolver somente propriedade própria e chamável dos namespaces públicos do módulo validado, rejeitar nome ausente ou ambíguo e invocar diretamente a função correspondente, sem reinterpretar argumentos ou resultado. Mudança futura é consumida da autoridade validada, não por lista local. [PENDENTE-CODIGO]

FormulaKit é estritamente opcional. Núcleo, parser DSL, markup, lifecycle, resolução sem pipeline e avaliações independentes DEVEM carregar e operar sem pacote, repositório, objeto global, rede ou artefato FormulaKit. FormulaKit somente entra por provedor que valide procedência e devolva handle opaco do módulo; objeto cru, manifesto global, endpoint, pacote instalado ou origem de download NÃO constituem handle validado. Build DSLens NÃO DEVE embutir FormulaKit, buscar seu repositório nem declará-lo dependência runtime obrigatória. [PENDENTE-CODIGO]

### 6.2 Ausência: `ignore` e `fail`

`formulaKitPolicy` aceita somente `ignore|fail`, com `ignore` por padrão. Indisponibilidade inclui ausência física, procedência não validada, trust anchor ausente, release incompatível, nome inexistente, ambiguidade ou falha de carregamento. Avaliação afetada sempre DEVE encerrar `loading`, remover loader e `aria-busy`, sem lançar erro global, interromper página, parser, fila ou avaliação independente. Falha da própria função após invocação válida continua erro de pipeline, não ausência. [PENDENTE-CODIGO]

Em `fail`, a avaliação falha silenciosamente: restaura e exibe o fallback original declarado no slot quando houver conteúdo; sem ele, escreve `formulaKitFallback`, cujo default é `[error]` e cuja personalização permanece texto seguro. Não emite `console.error`, não propaga rejeição não tratada nem altera outro host; código e estado estruturados continuam disponíveis pela API. [PENDENTE-CODIGO]

Em `ignore`, a AST completa e os contratos públicos validados DEVEM provar resultado único. Condicional, curto-circuito, seleção, lógica equivalente a `IF/ELSE`, `AND`, `XOR` ou `OR`, múltiplas ocorrências de `@`, alternativas literais, argumentos semanticamente concorrentes ou qualquer dúvida tornam a expressão multipercurso e aplicam `fail`. Metadado semântico insuficiente também aplica `fail`; inferência permissiva por nome, regex ou categoria é proibida. [PENDENTE-CODIGO]

Somente quando a remoção da chamada ausente não puder escolher, descartar, combinar ou fabricar resultado, o plugin devolve o valor puro que a atravessa, sem coerção, serialização intermediária, formatação ou tratamento. Chamadas restantes só executam se ordem e entrada permanecerem inequívocas. `console.warn` sucinto informa código, nome e indisponibilidade sem dado remoto; avisos idênticos são deduplicados por documento, nome e identidade de release ou tentativa de confiança. [PENDENTE-CODIGO]

### 6.3 Propriedades independentes de procedência

A integração DEVE distinguir separadamente descoberta; autenticidade do histórico de chaves; continuidade histórica de confiança; autenticidade do release; e integridade dos bytes. Uma propriedade NÃO infere outra. HTTPS, GitHub, npm, tag, endpoint, nome, `keyId`, manifesto ou objeto global são vias ou evidências parciais e NÃO constituem autoria ou trust anchor isoladamente. [PENDENTE-CODIGO]

Obtenção usa HTTPS, timeout explícito, cancelamento, limite de tamanho e fontes configuradas. Conteúdo permanece `discovered-unvalidated` até validação completa; só cache antes validado PODE ser reutilizado, sujeito a mínimos monotônicos. Indisponibilidade, invalidade ou divergência são determinísticas e não escolhem silenciosamente cópia mais nova, conveniente ou hospedada no serviço percebido como confiável. [PENDENTE-CODIGO]

### 6.4 Trust anchor e `FormulaKitKeyHistory/v1`

Histórico somente é aceito a partir de trust anchor pública previamente conhecida por canal independente e fornecida por configuração versionada com `keyId`, algoritmo, chave, escopo, origem independente registrada e mínimos de histórico, política e release. Enquanto essa origem não existir, infraestrutura e testes negativos DEVEM existir, mas nenhuma chave descoberta adquire confiança. Recuperação ou troca da anchor exige procedimento humano explícito, auditável e separado, sem reduzir mínimos silenciosamente. [PENDENTE-CODIGO]

O verificador DEVE comprovar cumulativamente schema exatamente compatível com `FormulaKitKeyHistory/v1`; canonicalização e assinatura; assinante na cadeia confiada; continuidade append-only; rotação e/ou coassinatura; revogações; vigência para release alvo; ausência de truncamento ou reescrita; e não redução de histórico, chave, release, política ou versão mínima. Conteúdo autenticamente assinado abaixo de mínimo já aceito é downgrade e é rejeitado. [PENDENTE-CODIGO]

Todos os `keyId` históricos necessários às versões suportadas são preservados. Chave nova somente entra assinada por chave anteriormente confiada, coassinada pelo modelo validado ou pelo procedimento explícito de recuperação. Revogação conserva história para release passado suportado, mas bloqueia uso incompatível com período, finalidade e motivo; chave desconhecida nunca é aceita só por constar no documento. [PENDENTE-CODIGO]

### 6.5 Release, artefato e execução

Antes de executar bytes FormulaKit, integrar módulo ou aceitar export, o provedor identifica o `keyId`; seleciona a chave do histórico validado; verifica vigência e revogação; valida assinatura do manifesto ou atestação; calcula e compara o hash dos bytes reais; confirma mínimos; e somente então cria handle opaco e executa o módulo. Assinatura sem hash correspondente e hash sem cadeia confiável são insuficientes. [PENDENTE-CODIGO]

Estado confiado vincula indivisivelmente release e versão, hash, manifesto ou atestação, `keyId`, revisão do histórico, trust anchor e política. Import estático, `<script src>`, execução prévia pelo consumidor ou objeto global NÃO satisfazem o gate. Ambiente incapaz de validar bytes antes da execução mantém FormulaKit indisponível e aplica `formulaKitPolicy`, sem degradar DSLens. [PENDENTE-CODIGO]

### 6.6 Fontes, cache, anti-downgrade e segredos

URL canônica, subpath npm, asset de GitHub Release, tag ou repositório assinado e cache validado PODEM fornecer o mesmo histórico; são descoberta, não anchors. Todas recebem schema, canonicalização, assinatura, continuidade, validade e anti-downgrade. Cópias equivalentes são comparadas por schema, conteúdo canônico, assinatura e hash; divergência material invalida obtenção até cadeia confiável decidir inequivocamente. [PENDENTE-CODIGO]

Cache armazena somente material público e metadados mínimos, distinguindo obtido, criptograficamente validado, maior histórico, release e política confiados e anchor usada. Persistência não promove conteúdo não validado; cache inválido, antigo, incompatível ou abaixo dos mínimos é rejeitado. Estado monotônico é atualizado atomicamente após validação e resiste a replay concorrente. [PENDENTE-CODIGO]

É proibido armazenar, solicitar, transmitir desnecessariamente, registrar, publicar, embutir ou persistir em cliente, build ou artefato chave privada, token, credencial ou segredo. Implementação, fixture, log e Demo usam apenas material público; nenhum canal individual vira fonte única de confiança. [PENDENTE-CODIGO]

A localização canônica futura abaixo é somente uma via de descoberta e NÃO constitui, isoladamente, fonte de confiança ou trust anchor:

[https://raw.githubusercontent.com/jcempro/FormulaKit/main/provenance/keys/v1.json](https://raw.githubusercontent.com/jcempro/FormulaKit/main/provenance/keys/v1.json)

Em 2026-08-10 essa localização ainda não existe em `main`; isso não autoriza inventar schema concreto além de `FormulaKitKeyHistory/v1`, anchor, chave, assinatura ou confiança. Validação positiva fica bloqueada até material compatível e anchor independente configurada existirem. [PENDENTE-CODIGO]

## 7. Distribuição e compatibilidade

O pacote npm DEVE publicar fonte TypeScript tipada e JavaScript ESM do plugin em `./plugin`, CSS separado em `./plugin.css` e all-in-one em `./all-in-one`, mantendo a biblioteca principal importável sem o plugin. O plugin ESM DEVE declarar a biblioteca DSLens como dependência interna por export público, sem copiar seu núcleo; FormulaKit permanece provedor opcional externo, nunca é embutido no all-in-one e somente é executado após o gate de procedência. O all-in-one PODE agregar núcleo DSLens e plugin, mas a fonte continua composta por módulos independentes. [PENDENTE-CODIGO]

Release DEVE oferecer `dslens.browser.js`, `dslens-plugin.browser.js`, `dslens-plugin.css` e `dslens-all.browser.js`, com variantes minificadas quando o pipeline vigente as produzir. Os dois primeiros JavaScript DEVEM ser independentes como arquivos e o plugin separado exige a biblioteca carregada; o all-in-one DEVE conter ambos e incorporar exatamente o CSS versionado do arquivo separado. [PENDENTE-CODIGO]

Os builds globais autorizados por esta demanda DEVEM usar IIFE e um único namespace `globalThis.DSLens`; o plugin separado registra `DSLens.browserPlugin` somente após validar versão/API compatível do núcleo. Ausência ou incompatibilidade da biblioteca DEVE preservar o documento, emitir diagnóstico e permitir nova inicialização manual após a dependência existir. [PENDENTE-CODIGO]

Todos os JavaScript DEVEM obedecer à fórmula ECMAScript anual vigente do projeto; CSS e JS DEVEM possuir banners, hashes, tamanhos bruto/minificado/gzip/Brotli, source maps aplicáveis e manifestação positiva. O orçamento do plugin e do all-in-one DEVE ser fixado pelo primeiro baseline real da FT de código, separando custo incremental do plugin e duplicação zero do núcleo. [PENDENTE-CODIGO]

O build all-in-one DEVE provar equivalência funcional com a combinação dos artefatos independentes. Nenhum pacote/release DEVE conter React, Preact, framework, polyfill global, parser HTML externo ou runtime CSS-in-JS obrigatório. [PENDENTE-CODIGO]

## 8. Validação e documentação

Testes automatizados DEVEM cruzar fontes, tamanhos, pesos, `line-height`, direção e alinhamentos; textos curtos, extensos e multilinha; DSL no início, meio e fim; múltiplos hosts; quatro combinações de placeholder/loading e duas posições; resposta imediata, lenta, concorrente, abortada e com erro; documento sem JavaScript; DOM já carregado; inserção AJAX/SPA; HTML e Markdown renderizado; Shadow DOM explícito; e exemplos React/Preact sem dependência runtime do plugin. [PENDENTE-CODIGO]

A validação visual DEVE comparar a mesma linha antes/depois e com/sem plugin por métricas de `getBoundingClientRect`, `Range.getClientRects`, baseline de testemunha, scroll e screenshots. Altura de linha, baseline, avanço inline, espaçamento, quebra, alinhamento e ausência de overflow DEVEM permanecer dentro de tolerâncias fixadas antes do teste; exceção só é válida quando o resultado textual altera naturalmente a largura/quebra. [PENDENTE-CODIGO]

Testes de segurança DEVEM cobrir texto com tags/scripts, atributos maliciosos, JSON/pipeline inválidos, prototype pollution, profundidade/tamanho excessivos, loader defeituoso, CSP sem style inline, host removido, resposta obsoleta e conteúdo dinâmico recursivo. Também DEVEM cobrir FormulaKit presente; ausência com `ignore|fail`; fallback original, `[error]` e personalizado; fluxo único e multipercurso aninhado; `loading` encerrado; warn deduplicado; histórico/schema/assinatura/keyId/rotação/revogação/vigência; assinatura+hash; downgrade; fontes/caches/divergência; ausência de trust anchor e inexistência de segredo. O resultado sempre DEVE permanecer texto e o fallback deve sobreviver à falha total. [PENDENTE-CODIGO]

README e README do pacote DEVEM possuir seção **Modo de uso** sucinta e executável para núcleo e plugin: instalação/importação TS/JS, encapsulamento HTML/Markdown, fallback sem JavaScript, placeholder/loading, chamada manual, conteúdo dinâmico, customização, composição `$`, React/Preact e uso independente/all-in-one. Recurso somente DEVE ser descrito como disponível após os artefatos e testes correspondentes existirem. [PENDENTE-CODIGO]

## 9. Códigos e aceite

Diagnósticos públicos DEVEM usar famílias `DSLENS_PLUGIN_MARKUP_*`, `DSLENS_PLUGIN_CONFIG_*`, `DSLENS_PLUGIN_LIFECYCLE_*`, `DSLENS_PLUGIN_RESOLVE_*`, `DSLENS_PLUGIN_PIPE_*`, `DSLENS_PLUGIN_RENDER_*` e `DSLENS_PLUGIN_DEPENDENCY_*`, com host/correlationId sanitizados e sem expressão, segredo, header ou conteúdo remoto integral por padrão. [PENDENTE-CODIGO]

A implementação somente será conforme quando biblioteca e plugin forem instaláveis separadamente e permanecerem funcionais sem FormulaKit; fallback funcionar sem JavaScript; varredura inicial e dinâmica forem idempotentes; API manual cobrir raiz/descritor/elemento; resultado for texto seguro; nenhuma função `$` existir localmente; FormulaKit somente for executado após cadeia, assinatura e hash válidos; ausência multipercurso nunca produzir resultado silenciosamente falso; CSS separado e all-in-one forem equivalentes; e todos os testes funcionais, criptográficos, visuais, de pacote e build anual estiverem aprovados. [PENDENTE-CODIGO]

## 10. Autoridade externa versionada

Nomes, contratos, exports e semântica de `$.<nome>()` DEVEM ser consultados na documentação e no release FormulaKit efetivamente validados. DSLens registra somente identidade/versão/hash/atestado consumidos e vínculo à API autoritativa; não copia a lista nem conserva contrato alternativo. A referência documental conhecida é [jcempro/FormulaKit](https://github.com/jcempro/FormulaKit), cuja disponibilidade isolada não prova autoria ou integridade. [PENDENTE-CODIGO]
