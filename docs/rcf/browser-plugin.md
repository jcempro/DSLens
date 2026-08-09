# Sub-RCF — plugin browser documental

## 1. Escopo, identidade e desacoplamento

Este arquivo especializa `../../RCF.md` para a camada opcional que integra DSLens a documentos HTML/Markdown executados em navegador. O plugin DEVE depender da API browser pública da biblioteca, permanecer distribuível e versionável separadamente e NÃO DEVE transferir DOM, markup, estilo, lifecycle de documento ou funções utilitárias para o núcleo DSLens. [PENDENTE-CODIGO]

O plugin DEVE atuar exclusivamente em navegador com DOM. Importação em SSR, Node.js, worker ou ferramenta de build PODE expor tipos e funções puras, mas NÃO DEVE acessar `window`, `document`, `MutationObserver`, inserir estilo ou iniciar observação durante a importação fora de navegador. [PENDENTE-CODIGO]

O termo **host** designa o elemento explicitamente marcado; **slot de resultado**, seu descendente direto substituível; **fallback**, o conteúdo original desse slot; **placeholder**, a permanência opcional do fallback durante a resolução; **loader**, o indicador temporário; e **pipeline `$`**, a transformação explícita posterior à resolução da DSL. Esses conceitos NÃO DEVEM alterar a gramática canônica do núcleo. [PENDENTE-CODIGO]

## 2. Encapsulamento HTML/Markdown

A notação canônica DEVE ser HTML inline nativo, igualmente utilizável como HTML bruto em Markdown: um `span[data-dslens-plugin]` host, exatamente um filho direto `span[data-dslens-result]`, a expressão em `data-dslens-expression` e configuração opcional em JSON estrito no atributo `data-dslens-options`. Texto semelhante à DSL fora desse host NÃO DEVE ser descoberto nem processado. [PENDENTE-CODIGO]

```html
Preço:
<span
  data-dslens-plugin
  data-dslens-expression='${"https://example.test/product.json"}.price'
  data-dslens-options='{"pipeline":"$.formatCurrencyBrl($.parseNumber(@))"}'
>
  <span data-dslens-result>Preço indisponível</span>
</span>
```

O mesmo trecho DEVE permanecer semanticamente válido em Markdown que aceite HTML inline. Processadores que removam HTML bruto não são adaptados por sintaxe Markdown proprietária; integração com eles DEVE ocorrer após a renderização por adaptador explícito que produza a mesma árvore canônica. [PENDENTE-CODIGO]

O host, a expressão e o slot DEVEM ser inequívocos. Host ausente, expressão vazia, JSON inválido, zero ou mais de um slot direto, host aninhado sem fronteira própria ou configuração desconhecida DEVEM impedir a mutação daquele host, preservar seu conteúdo e produzir diagnóstico estruturado sem lançar erro global não tratado. [PENDENTE-CODIGO]

O fallback DEVE residir como conteúdo real do slot, não em pseudo-elemento, atributo oculto, script, template ou dependência JavaScript. Sem plugin, com JavaScript desabilitado, em CSP incompatível ou diante de qualquer falha, ele DEVE permanecer visível, selecionável, acessível e integrado ao fluxo normal, sem tornar a expressão DSL texto visível da página. [PENDENTE-CODIGO]

`data-dslens-options` DEVE aceitar somente propriedades versionadas: `placeholder`, `loading`, `loadingPosition`, `loader`, `pipeline`, `timeoutMs`, `errorMode`, `observe` e `accessibility`. Defaults são `placeholder:true`, `loading:true`, `loadingPosition:'after'`, `loader:'default'`, `pipeline:null`, timeout do adaptador browser, `errorMode:'preserve'`, `observe:true` e live region desativada. Propriedade desconhecida, tipo incorreto ou limite excedido DEVE falhar fechado para o host. Configuração JavaScript tipada PODE complementar o atributo segundo a precedência execução manual → host → global, sem mutar objetos recebidos. [PENDENTE-CODIGO]

## 3. Lifecycle, estado e idempotência

Ao ser carregado em navegador, o plugin DEVE instalar a observação antes de aguardar eventos e agendar uma varredura do documento atual. Se `document.readyState` ainda for `loading`, DEVE também executar uma varredura integral após `DOMContentLoaded`; se o evento já tiver ocorrido, DEVE executar a varredura integral imediatamente, sem depender de `load` ou de evento futuro. [PENDENTE-CODIGO]

Um `MutationObserver` DEVE acompanhar inserção de subárvores e mudanças somente nos atributos canônicos, agrupar trabalho em fila finita e processar apenas hosts novos ou cuja assinatura tenha mudado. Mutações feitas pelo próprio plugin DEVEM ser identificadas e ignoradas para impedir laço, reentrada e processamento duplicado. [PENDENTE-CODIGO]

Cada host DEVE possuir estado observável `idle|queued|loading|resolved|error|disposed` em `data-dslens-state` e estado privado em `WeakMap`. A identidade de execução DEVE combinar host, expressão, opções efetivas e revisão do registro de extensões; chamada repetida com a mesma identidade DEVE retornar o resultado vigente sem nova requisição, salvo `force: true` explícito. [PENDENTE-CODIGO]

Nova execução do mesmo host DEVE abortar a anterior quando possível e usar token monotônico para impedir que resultado antigo vença uma corrida. Remoção do host DEVE cancelar recursos associados; `disconnect()` DEVE encerrar observadores e tarefas futuras sem apagar resultado já renderizado; `dispose(target)` DEVE restaurar o fallback capturado e remover apenas nós/atributos pertencentes ao plugin. [PENDENTE-CODIGO]

Falha de um host NÃO DEVE interromper outros. Timeout, aborto, erro de rede, DSL inválida, pipeline inválido, loader customizado defeituoso ou DOM removido DEVEM resultar em código estruturado, remoção segura do loader, restauração/preservação conforme `errorMode` e continuidade da fila. [PENDENTE-CODIGO]

## 4. API pública e integração

A API TypeScript/JavaScript DEVE expor `configure(options)`, `scan(root?)`, `process(target, options?)`, `observe(root?)`, `disconnect(root?)`, `dispose(target)`, `registerFunction(name, contract, implementation)`, `registerLoader(name, factory)` e getters imutáveis de configuração, funções, loaders e estado. `root` DEVE aceitar `Document`, `DocumentFragment`, `ShadowRoot` ou `Element`; `target` DEVE aceitar elemento host ou descritor `{ element, expression?, options? }`. [PENDENTE-CODIGO]

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

## 6. Pipeline `$`, tipos e falhas

O pipeline DEVE residir somente em `options.pipeline`, depois da resolução da DSL, e usar gramática própria sem alterar a expressão DSL: `pipeline = call; call = "$.", name, "(", [ argument, { ",", argument } ], ")"; argument = "@" | call | JSON-literal`. `@` representa o valor resolvido; somente chamadas registradas, literais JSON e aninhamento balanceado são aceitos. [PENDENTE-CODIGO]

O parser DEVE possuir limites configurados e conservadores de comprimento, profundidade, quantidade de chamadas, argumentos e tamanho de valores. `eval`, `Function`, acesso a propriedade, índice arbitrário, variável global, template literal, operador, atribuição, `this`, `constructor`, protótipo e chamada indireta são proibidos. [PENDENTE-CODIGO]

Valores internos permitidos são `string`, `boolean`, número finito, `null`, arrays desses valores e objetos de resultado declarados por função. A serialização final DEVE manter string sem alteração, usar representação decimal canônica para número finito, `true|false` para booleano, vazio para `null` e JSON compacto com chaves estáveis para array/objeto; a inserção permanece `textContent` mesmo após `escapeHtml` ou `stripTags`. [PENDENTE-CODIGO]

Toda função DEVE declarar nome, versão, pureza, aridade, tipos, defaults, limites, domínio, retorno e códigos de erro. Não há coerção implícita além de `Text` (`string|number finito|boolean` convertido canonicamente); conversão numérica exige `parseNumber`; argumento ausente, tipo incompatível, `NaN`, infinito, divisão por zero, domínio matemático inválido, overflow ou opção desconhecida DEVE falhar atomicamente sem executar chamadas externas restantes. [PENDENTE-CODIGO]

Segmentação Unicode, listas linguísticas e perfis localizados DEVEM possuir versão no manifesto e produzir o mesmo resultado em toda a matriz suportada, sem expor diferenças de ICU/CLDR do host. Locales iniciais são `pt-BR`, `en-US` e `pt-PT`; outro locale somente PODE ser registrado com catálogo e vetores próprios. [PENDENTE-CODIGO]

Funções registradas DEVEM usar identificador ASCII `[A-Za-z][A-Za-z0-9]*`, não podem substituir builtin e recebem contexto congelado com locale, zona, `RandomSource`, limites e `AbortSignal`. Implementação customizada PODE ser assíncrona, mas NÃO DEVE acessar DOM, rede ou estado global sem contrato próprio; sua rejeição vira falha estruturada do pipeline. [PENDENTE-CODIGO]

As funções aleatórias DEVEM consumir exclusivamente `RandomSource` injetável. O padrão browser usa `crypto.getRandomValues`; testes e reprodução usam fonte determinística explícita, e ausência de fonte segura DEVE falhar sem recorrer silenciosamente a `Math.random`. [PENDENTE-CODIGO]

### 6.1 Texto, documentos e validação

| Função | Assinatura e contrato determinístico |
|---|---|
| `formatCpf` | `(Text) -> string`; extrai dígitos, exige 11 e formata `000.000.000-00`. |
| `formatCnpj` | `(Text) -> string`; remove pontuação, aceita 12 alfanuméricos maiúsculos + 2 dígitos e formata `AA.AAA.AAA/AAAA-00`. |
| `formatPhone` | `(Text) -> string`; exige DDD + 8 dígitos e produz `(00) 0000-0000`. |
| `formatCellPhone` | `(Text) -> string`; exige DDD + 9 dígitos e produz `(00) 00000-0000`. |
| `validateCpf` | `(Text) -> boolean`; normaliza pontuação, rejeita repetição e valida os dois DVs módulo 11. |
| `validateAlphanumericCnpj` | `(Text) -> boolean`; normaliza pontuação/caixa, exige 12 posições `[0-9A-Z]` e 2 DVs numéricos, converte cada caractere por código ASCII menos 48 e aplica pesos/módulo 11 oficiais aos dois DVs. |
| `extractDigits` | `(Text) -> string`; conserva somente ASCII `0-9`. |
| `removeAccents` | `(Text) -> string`; normaliza NFD e remove marcas Unicode combinantes, sem transliteração adicional. |
| `formatCep` | `(Text) -> string`; exige 8 dígitos e produz `00000-000`. |
| `formatCurrencyBrl` | `(number) -> string`; `Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})`. |
| `formatCurrencyUsd` | `(number) -> string`; `Intl.NumberFormat('en-US',{style:'currency',currency:'USD'})`. |
| `formatCurrencyEur` | `(number, locale='pt-PT') -> string`; estilo `currency`, moeda `EUR`. |
| `trim` / `trimStart` / `trimEnd` | `(Text) -> string`; semântica ECMAScript vigente. |
| `wordCount` | `(Text) -> number`; conta palavras pelo segmentador Unicode versionado do catálogo, sem depender de segmentador do host. |
| `length` | `(string|array) -> number`; conta code points Unicode para string e elementos para array. |
| `toUpperCase` / `toLowerCase` | `(Text, locale?) -> string`; locale ausente usa mapeamento Unicode invariável, locale explícito usa forma canônica BCP 47. |
| `capitalize` | `(Text, locale?) -> string`; transforma o primeiro code point textual e conserva o restante. |
| `capitalizeWords` | `(Text, locale?) -> string`; capitaliza início de cada segmento de palavra sem colapsar espaços. |
| `reverse` | `(string|array) -> mesmo tipo`; string por grapheme do catálogo Unicode versionado, array por cópia. |
| `truncate` | `(Text,max,suffix='…') -> string`; mede graphemes, exige inteiro não negativo e inclui o sufixo no limite. |
| `replace` | `(Text,search,replacement) -> string`; substitui a primeira ocorrência literal. |
| `replaceAll` | `(Text,search,replacement) -> string`; substitui ocorrências literais não sobrepostas e rejeita busca vazia. |
| `includes` / `startsWith` / `endsWith` | `(Text,search[,position]) -> boolean`; busca literal conforme ECMAScript e posição inteira validada. |
| `repeat` | `(Text,count) -> string`; inteiro não negativo e limite de saída. |
| `padStart` / `padEnd` | `(Text,length,pad=' ') -> string`; comprimento por code points e limite de saída. |
| `split` | `(Text,separator,limit?) -> string[]`; separador literal, limite inteiro e quantidade máxima de itens. |
| `slugify` | `(Text) -> string`; remove acentos, minúsculas invariáveis, troca sequências não alfanuméricas por `-` e apara hífens. |
| `btoa` / `atob` | `(string) -> string`; contrato Web API de byte-string Latin-1/base64 estrito, com erro para caractere ou base64 inválido. |
| `encodeUri` / `decodeUri` | `(Text) -> string`; semântica `encodeURI`/`decodeURI`, erro em sequência inválida. |
| `isEmpty` | `(string|array|null) -> boolean`; `null`, string vazia e array vazio são vazios; espaços não são vazios. |
| `isAlphanumeric` / `isAlpha` / `isNumeric` | `(Text) -> boolean`; string não vazia e classes Unicode versionadas; `isNumeric` não faz parsing decimal. |
| `validateEmail` | `(Text) -> boolean`; formato pragmático local@domínio, sem DNS, sem aceitar controle ou espaço. |
| `validateUrl` | `(Text) -> boolean`; URL absoluta WHATWG com protocolo `http:` ou `https:`. |
| `validateIsoDate` | `(Text) -> boolean`; `YYYY-MM-DD` real no calendário gregoriano. |
| `validateTime24h` | `(Text) -> boolean`; `HH:mm` ou `HH:mm:ss`, de `00:00:00` a `23:59:59`. |
| `validateIpV4` / `validateIpV6` | `(Text) -> boolean`; endereço integral canônico/compactável, sem porta, CIDR ou zona. |
| `validatePassword` | `(Text,options?) -> boolean`; defaults versionados: 8–128 code points, ao menos maiúscula, minúscula, dígito e símbolo, sem controle. |
| `validateHexColor` | `(Text) -> boolean`; aceita somente `#RGB`, `#RGBA`, `#RRGGBB` ou `#RRGGBBAA`. |
| `validateUuid` | `(Text,version?) -> boolean`; formato RFC 9562, variante válida e versão opcional explícita. |
| `stripTags` | `(Text) -> string`; parseia em `template` desconectado e retorna apenas `textContent`, sem inserir/executar nós. |
| `escapeHtml` / `unescapeHtml` | `(Text) -> string`; converte somente `& < > " '` e as cinco entidades nomeadas correspondentes. |
| `levenshtein` | `(Text,Text) -> number`; distância por graphemes com limite quadrático explícito. |
| `removeStopWords` | `(Text,locale='pt-BR') -> string`; usa lista imutável/versionada por locale, conserva separadores e rejeita locale sem catálogo. |
| `extractHashtags` / `extractMentions` | `(Text) -> string[]`; ordem de ocorrência, sem duplicação implícita, identificadores Unicode delimitados. |
| `extractUrls` | `(Text) -> string[]`; URLs absolutas HTTP(S) reconhecidas por delimitadores e validadas por `validateUrl`. |
| `maskEmail` | `(Text,visibleStart=1) -> string`; valida e mascara parte local preservando domínio. |
| `maskDocument` | `(Text,visibleEnd=4,mask='*') -> string`; conserva pontuação opcional e revela somente quantidade final explícita. |

### 6.2 Matemática, estatística, geometria e conversões

| Função | Assinatura e contrato determinístico |
|---|---|
| `abs`, `acos`, `acosh`, `asin`, `asinh`, `atan`, `atanh`, `cbrt`, `ceil`, `cos`, `cosh`, `exp`, `expm1`, `floor`, `fround`, `log`, `log1p`, `log10`, `log2`, `round`, `sign`, `sin`, `sinh`, `sqrt`, `tan`, `tanh`, `trunc` | `(number) -> number`; semântica ECMAScript, resultado deve ser finito e domínio inválido falha. |
| `atan2` / `pow` | `(number,number) -> number`; semântica ECMAScript com resultado finito. |
| `clz32` | `(number) -> number`; conversão explícita para uint32 e contagem ECMAScript. |
| `imul` | `(number,number) -> number`; conversão explícita int32 e produto int32 ECMAScript. |
| `hypot`, `max`, `min`, `sum` | `(...number) -> number`; ao menos um argumento para `max/min`, resultado finito. |
| `subtract` | `(first,...rest) -> number`; subtração associativa à esquerda. |
| `multiply` | `(...number) -> number`; ao menos um argumento e produto finito. |
| `divide` / `mod` | `(a,b) -> number`; divisor diferente de zero. |
| `percent` | `(part,total) -> number`; `part/total*100`, total diferente de zero. |
| `addPercent` / `subtractPercent` / `discount` | `(value,percent) -> number`; respectivamente soma, subtração e desconto percentual sobre `value`. |
| `simpleInterest` | `(principal,ratePercent,periods) -> number`; retorna montante `P*(1+r*n)`. |
| `compoundInterest` | `(principal,ratePercent,periods) -> number`; retorna montante `P*(1+r)^n`. |
| `isEven` / `isOdd` | `(safeInteger) -> boolean`. |
| `factorial` | `(safeInteger>=0) -> safeInteger`; falha em overflow. |
| `toFixed` / `toPrecision` | `(number,digits) -> string`; limites ECMAScript validados. |
| `toLocaleString` | `(number,locale='pt-BR',options?) -> string`; locale BCP 47 e allowlist de opções `Intl.NumberFormat`. |
| `getInteger` | `(number) -> number`; parte inteira por truncamento em direção a zero. |
| `getDecimal` | `(number) -> number`; `value-trunc(value)`, preservando sinal. |
| `roundToMultiple` | `(value,multiple,mode='nearest') -> number`; múltiplo não zero e modo `nearest|floor|ceil|trunc`. |
| `parseNumber` | `(Text,locale='pt-BR') -> number`; parser estrito de sinal, agrupamento e separador decimal do locale suportado, sem lixo residual. |
| `mean` | `(number[]) -> number`; média aritmética de array não vazio. |
| `median` | `(number[]) -> number`; cópia ordenada numericamente; média dos centrais em cardinalidade par. |
| `mode` | `(number[]) -> number[]`; todos os modos em ordem numérica; array vazio falha. |
| `stdDev` / `variance` | `(number[],sample=false) -> number`; população por padrão, amostra exige ao menos dois valores. |
| `sumArray` / `productArray` | `(number[]) -> number`; soma inicia em 0, produto em 1, ambos com resultado finito. |
| `weightedMean` | `(values,weights) -> number`; arrays não vazios de mesmo tamanho, pesos não negativos e soma positiva. |
| `maxArray` / `minArray` | `(number[]) -> number`; array não vazio. |
| `range` | `(number[]) -> number`; máximo menos mínimo. |
| `percentile` | `(number[],p) -> number`; `p` em `[0,100]`, interpolação linear no índice `(n-1)*p/100`. |
| `quartil` | `(number[],q) -> number`; `q` inteiro `0..4`, equivalente a `percentile(values,q*25)`. |
| `dotProduct` | `(number[],number[]) -> number`; vetores não vazios de mesmo tamanho. |
| `clamp` | `(value,min,max) -> number`; exige `min<=max`. |
| `inRange` | `(value,min,max,inclusive=true) -> boolean`; exige `min<=max`. |
| `linearRegression` | `(xs,ys) -> {slope,intercept,r2}`; pares finitos, ao menos dois, variância de `x` não zero. |
| `lerp` | `(a,b,t) -> number`; `a+(b-a)*t`, sem restringir extrapolação. |
| `degToRad` / `radToDeg` | `(number) -> number`; conversão por `π/180`. |
| `circleArea` | `(radius>=0) -> number`; `πr²`. |
| `triangleArea` | `(base>=0,height>=0) -> number`; `base*height/2`. |
| `rectangleArea` | `(width>=0,height>=0) -> number`; produto. |
| `circleCircumference` | `(radius>=0) -> number`; `2πr`. |
| `rectanglePerimeter` | `(width>=0,height>=0) -> number`; `2*(w+h)`. |
| `cubeVolume` | `(edge>=0) -> number`; `edge³`. |
| `sphereVolume` | `(radius>=0) -> number`; `4πr³/3`. |
| `cylinderVolume` | `(radius>=0,height>=0) -> number`; `πr²h`. |
| `distance` | `(x1,y1,x2,y2) -> number`; distância euclidiana 2D. |
| `isPrime` / `nextPrime` | `(safeInteger) -> boolean|safeInteger`; teste exato; próxima prima maior ou igual, com limite de iterações. |
| `gcd` / `lcm` | `(safeInteger,safeInteger) -> safeInteger`; valores absolutos, algoritmo de Euclides, `lcm(0,0)=0`, overflow falha. |
| `combination` | `(n,k) -> safeInteger`; `n!/(k!(n-k)!)`, inteiros `0<=k<=n`, cálculo redutor sem overflow intermediário evitável. |
| `arrangement` | `(n,k) -> safeInteger`; `n!/(n-k)!`, inteiros `0<=k<=n`. |
| `permutation` | `(n) -> safeInteger`; alias matemático de `factorial(n)`. |
| `decToBin` / `decToHex` / `decToOct` | `(safeInteger) -> string`; sinal separado e dígitos em caixa alta para hexadecimal. |
| `binToDec` / `hexToDec` / `octToDec` | `(Text) -> safeInteger`; string integral estrita na base correspondente e sem prefixo obrigatório. |
| `celsiusToFahrenheit` / `fahrenheitToCelsius` | `(number) -> number`; fórmulas exatas usuais. |
| `metersToKm` | `(number) -> number`; divide por 1000. |
| `kmToMiles` | `(number) -> number`; usa constante versionada `0.621371192237334`. |

### 6.3 Aleatoriedade, datas e formatos avançados

| Função | Assinatura e contrato determinístico |
|---|---|
| `random` | `() -> number`; amostra uniforme em `[0,1)` do `RandomSource`. |
| `randomString` | `(length,alphabet=alnum) -> string`; inteiro limitado, alfabeto não vazio/sem grapheme duplicado e seleção sem viés por rejeição. |
| `randomInt` | `(min,max) -> safeInteger`; intervalo inclusivo uniforme. |
| `randomArbitrary` | `(min,max) -> number`; intervalo `[min,max)`, exige `min<max`. |
| `shuffle` | `(array) -> array`; cópia por Fisher–Yates uniforme, sem mutar entrada. |
| `sample` | `(array,count=1) -> valor|array`; sem reposição, count 1 retorna valor, demais retornam array. |
| `formatDate` | `(iso,locale='pt-BR',timeZone='UTC') -> string`; ISO estrito e `Intl.DateTimeFormat` apenas com data. |
| `formatDateTime` | `(iso,locale='pt-BR',timeZone='UTC') -> string`; ISO estrito e data/hora com segundos. |
| `formatCronometer` | `(totalSeconds,showMilliseconds=false) -> string`; duração não negativa em `HH:MM:SS` com horas não limitadas a 23. |
| `formatBytes` | `(bytes,base=1024,decimals=2) -> string`; bytes não negativos, base somente `1000|1024`, unidades até `PB|PiB` e arredondamento half-away-from-zero. |
| `toRoman` / `fromRoman` | `(integer|string) -> string|integer`; romanos canônicos de 1 a 3999, caixa alta e rejeição de forma não canônica. |
| `numberToWords` | `(safeInteger,locale='pt-BR') -> string`; catálogo versionado, sinal explícito e intervalo inicial de `-999999999999999..999999999999999`. |
| `currencyToWords` | `(number,currency='BRL',locale='pt-BR') -> string`; mesmo limite inteiro, arredonda para centavos por half-away-from-zero e flexiona unidade/subunidade do catálogo versionado. |

## 7. Distribuição e compatibilidade

O pacote npm DEVE publicar fonte TypeScript tipada e JavaScript ESM do plugin em `./plugin`, CSS separado em `./plugin.css` e all-in-one em `./all-in-one`, mantendo a biblioteca principal importável sem o plugin. O plugin ESM DEVE declarar a biblioteca como dependência interna por export público, sem copiar seu núcleo; o all-in-one PODE agregá-los no build, mas a fonte continua composta por módulos independentes. [PENDENTE-CODIGO]

Release DEVE oferecer `dslens.browser.js`, `dslens-plugin.browser.js`, `dslens-plugin.css` e `dslens-all.browser.js`, com variantes minificadas quando o pipeline vigente as produzir. Os dois primeiros JavaScript DEVEM ser independentes como arquivos e o plugin separado exige a biblioteca carregada; o all-in-one DEVE conter ambos e incorporar exatamente o CSS versionado do arquivo separado. [PENDENTE-CODIGO]

Os builds globais autorizados por esta demanda DEVEM usar IIFE e um único namespace `globalThis.DSLens`; o plugin separado registra `DSLens.browserPlugin` somente após validar versão/API compatível do núcleo. Ausência ou incompatibilidade da biblioteca DEVE preservar o documento, emitir diagnóstico e permitir nova inicialização manual após a dependência existir. [PENDENTE-CODIGO]

Todos os JavaScript DEVEM obedecer à fórmula ECMAScript anual vigente do projeto; CSS e JS DEVEM possuir banners, hashes, tamanhos bruto/minificado/gzip/Brotli, source maps aplicáveis e manifestação positiva. O orçamento do plugin e do all-in-one DEVE ser fixado pelo primeiro baseline real da FT de código, separando custo incremental do plugin e duplicação zero do núcleo. [PENDENTE-CODIGO]

O build all-in-one DEVE provar equivalência funcional com a combinação dos artefatos independentes. Nenhum pacote/release DEVE conter React, Preact, framework, polyfill global, parser HTML externo ou runtime CSS-in-JS obrigatório. [PENDENTE-CODIGO]

## 8. Validação e documentação

Testes automatizados DEVEM cruzar fontes, tamanhos, pesos, `line-height`, direção e alinhamentos; textos curtos, extensos e multilinha; DSL no início, meio e fim; múltiplos hosts; quatro combinações de placeholder/loading e duas posições; resposta imediata, lenta, concorrente, abortada e com erro; documento sem JavaScript; DOM já carregado; inserção AJAX/SPA; HTML e Markdown renderizado; Shadow DOM explícito; e exemplos React/Preact sem dependência runtime do plugin. [PENDENTE-CODIGO]

A validação visual DEVE comparar a mesma linha antes/depois e com/sem plugin por métricas de `getBoundingClientRect`, `Range.getClientRects`, baseline de testemunha, scroll e screenshots. Altura de linha, baseline, avanço inline, espaçamento, quebra, alinhamento e ausência de overflow DEVEM permanecer dentro de tolerâncias fixadas antes do teste; exceção só é válida quando o resultado textual altera naturalmente a largura/quebra. [PENDENTE-CODIGO]

Testes de segurança DEVEM cobrir texto com tags/scripts, atributos maliciosos, JSON/pipeline inválidos, prototype pollution, profundidade/tamanho excessivos, função/loader defeituoso, CSP sem style inline, host removido, resposta obsoleta e conteúdo dinâmico recursivo. O resultado sempre DEVE permanecer texto e o fallback deve sobreviver à falha total. [PENDENTE-CODIGO]

README e README do pacote DEVEM possuir seção **Modo de uso** sucinta e executável para núcleo e plugin: instalação/importação TS/JS, encapsulamento HTML/Markdown, fallback sem JavaScript, placeholder/loading, chamada manual, conteúdo dinâmico, customização, composição `$`, React/Preact e uso independente/all-in-one. Recurso somente DEVE ser descrito como disponível após os artefatos e testes correspondentes existirem. [PENDENTE-CODIGO]

## 9. Códigos e aceite

Diagnósticos públicos DEVEM usar famílias `DSLENS_PLUGIN_MARKUP_*`, `DSLENS_PLUGIN_CONFIG_*`, `DSLENS_PLUGIN_LIFECYCLE_*`, `DSLENS_PLUGIN_RESOLVE_*`, `DSLENS_PLUGIN_PIPE_*`, `DSLENS_PLUGIN_RENDER_*` e `DSLENS_PLUGIN_DEPENDENCY_*`, com host/correlationId sanitizados e sem expressão, segredo, header ou conteúdo remoto integral por padrão. [PENDENTE-CODIGO]

A implementação somente será conforme quando biblioteca e plugin forem instaláveis separadamente; fallback funcionar sem JavaScript; varredura inicial e dinâmica forem idempotentes; API manual cobrir raiz/descritor/elemento; resultado for texto seguro; catálogo mínimo estiver completo; CSS separado e all-in-one forem equivalentes; e todos os testes funcionais, visuais, de pacote e build anual estiverem aprovados.

## 10. Referência externa versionada

`validateAlphanumericCnpj` DEVE seguir o [Manual de Cálculo do DV do CNPJ Alfanumérico da Receita Federal](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf), incluindo doze caracteres alfanuméricos, dois DVs numéricos, conversão ASCII menos 48 e módulo 11. Mudança futura da fonte oficial exige nova versão do contrato e vetores, sem alteração silenciosa. [PENDENTE-CODIGO]
