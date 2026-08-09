# Solicitação capturada — FT-20260809-001 / FT-20260809-002

- origem: anexo Codex `af0d9f3b-f4d5-488f-b235-68044470deea/pasted-text.txt`
- capturado_em: `2026-08-09T20:04:31-03:00`
- identidade: `REQ-FT-20260809-001`
- sha256_original: `886290367e54e01bfea3dbaa8b9b4a064548ab625bc8439c9e239c3a29b36ba1`
- FTs: `FT-20260809-001`, `FT-20260809-002`
- RCFs_destino: `RCF.md`, `docs/rcf/typescript-javascript.md`, `docs/rcf/distribution.md`
- estado_incorporacao: `capturada; normatização em andamento; implementação pendente`

## Conteúdo original integral

Crie para FT e implemente:
Implemente e normatize um **plugin browser/client-side opcional**, desacoplado da biblioteca DSL principal, destinado a identificar, resolver assincronamente e renderizar expressões DSL explicitamente encapsuladas em HTML/Markdown.

A biblioteca principal continua responsável exclusivamente pela DSL. O plugin constitui camada adicional de integração com documentos e DEVE reutilizá-la como dependência independente.

## Distribuição

Disponibilizar:

* **npm:** biblioteca principal em TypeScript e build `.js`; plugin igualmente em TypeScript e `.js` + `.css` separado;
* **release:** builds `.js` independentes da biblioteca e do plugin (com `.css` separado);
* **release:** bundle opcional **all-in-one** contendo ambos com `.css` embutido.

Tudo DEVE obedecer ao target ECMA vigente.

## Encapsulamento e fail-safe

O plugin DEVE normatizar uma **notação explícita de encapsulamento HTML/Markdown** que:

* identifique inequivocamente quais trechos contêm DSL processável;
* impeça interpretação acidental de texto semelhante à sintaxe DSL;
* permaneça válida e semanticamente aceitável em HTML/Markdown;
* permita localizar deterministicamente expressão DSL, texto provisório e configurações;
* seja extensível sem depender de markup específico de frameworks;
* preserve degradação progressiva.

O encapsulamento DEVE ser **fail-safe sem JavaScript**: se o plugin não carregar, falhar ou estiver desabilitado, eventual texto padrão/placeholder DEVE permanecer naturalmente visível e corretamente integrado ao documento, sem expor obrigatoriamente sintaxe interna, loader quebrado ou estrutura visual inválida.

A escolha da notação DEVE decorrer da arquitetura existente e ser normatizada no RCF com exemplos.

## Funcionamento

O plugin DEVE:

* atuar exclusivamente no navegador;
* executar automaticamente ao menos uma varredura integral da página, independentemente de já terem ocorrido `DOMContentLoaded`, `load` ou eventos equivalentes;
* acompanhar conteúdo inserido posteriormente por AJAX, renderizações assíncronas, SPA e frameworks;
* ser resiliente, fail-safe e impedir processamento duplicado;
* permitir invocação manual global ou limitada a raiz, objeto ou elemento específico, inclusive integração adequada com TypeScript, React e Preact quando aplicável;
* resolver assincronamente a DSL encapsulada e substituir apenas a área destinada ao resultado.

## Renderização inline

Durante a resolução, permitir:

* placeholder opcional;
* loading opcional;
* ambos simultaneamente;
* loading antes ou depois do placeholder; **padrão: depois**.

Placeholder, loading e resultado DEVEM comportar-se como conteúdo inline e preservar altura de linha, espaçamento, quebra, baseline, posicionamento e alinhamento.

Devem herdar do contexto hospedeiro fonte, tamanho, peso, `line-height`, alinhamento e demais propriedades pertinentes. O plugin NÃO DEVE impor identidade visual concorrente ao site, tema, CMS ou framework.

O loader DEVE:

* ser instantâneo, leve e preferencialmente CSS puro;
* caber proporcionalmente no espaço equivalente a um caractere/quadrado da linha;
* permanecer alinhado em diferentes fontes, tamanhos e `line-height`;
* ser neutro, profissional e não invasivo;
* possuir configuração completa de aparência;
* admitir substituição do loader padrão.

O spinner circular anteriormente sugerido é apenas referência; NÃO DEVE ser reproduzido cegamente com dimensões fixas.

## Resultado e pipeline de funções

Por padrão, o resultado da DSL DEVE ser renderizado como **texto seguro**, nunca convertido implicitamente em HTML executável.

O resultado PODE ser processado por funções utilitárias explícitas no namespace `$`, componíveis e **aninháveis**, por exemplo:

```text
$.toUpperCase($.trim(...))
```

Os nomes PODEM ser aprimorados para maior consistência, desde que compatibilidade, semântica e documentação sejam preservadas.

Disponibilizar, no mínimo:

```text
$.formatCpf()
$.formatCnpj()
$.formatPhone()
$.formatCellPhone()
$.validateCpf()
$.validateAlphanumericCnpj()
$.extractDigits()
$.removeAccents()
$.formatCep()
$.formatCurrencyBrl()
$.trim()
$.trimStart()
$.trimEnd()
$.wordCount()
$.length()
$.toUpperCase()
$.toLowerCase()
$.capitalize()
$.capitalizeWords()
$.reverse()
$.truncate()
$.replace()
$.replaceAll()
$.includes()
$.startsWith()
$.endsWith()
$.repeat()
$.padStart()
$.padEnd()
$.split()
$.slugify()
$.btoa()
$.atob()
$.encodeUri()
$.decodeUri()
$.randomString()
$.isEmpty()
$.isAlphanumeric()
$.isAlpha()
$.isNumeric()
$.abs()
$.acos()
$.acosh()
$.asin()
$.asinh()
$.atan()
$.atanh()
$.atan2()
$.cbrt()
$.ceil()
$.clz32()
$.cos()
$.cosh()
$.exp()
$.expm1()
$.floor()
$.fround()
$.hypot()
$.imul()
$.log()
$.log1p()
$.log10()
$.log2()
$.max()
$.min()
$.pow()
$.random()
$.round()
$.sign()
$.sin()
$.sinh()
$.sqrt()
$.tan()
$.tanh()
$.trunc()
$.sum()
$.subtract()
$.multiply()
$.divide()
$.mod()
$.percent()
$.addPercent()
$.subtractPercent()
$.discount()
$.simpleInterest()
$.compoundInterest()
$.isEven()
$.isOdd()
$.factorial()
$.toFixed()
$.toPrecision()
$.toLocaleString()
$.getInteger()
$.getDecimal()
$.roundToMultiple()
$.parseNumber()
$.mean()
$.median()
$.mode()
$.stdDev()
$.variance()
$.sumArray()
$.productArray()
$.weightedMean()
$.maxArray()
$.minArray()
$.range()
$.percentile()
$.quartil()
$.degToRad()
$.radToDeg()
$.circleArea()
$.triangleArea()
$.rectangleArea()
$.circleCircumference()
$.rectanglePerimeter()
$.cubeVolume()
$.sphereVolume()
$.cylinderVolume()
$.distance()
$.randomInt()
$.randomArbitrary()
$.shuffle()
$.sample()
$.combination()
$.arrangement()
$.permutation()
$.decToBin()
$.binToDec()
$.decToHex()
$.hexToDec()
$.decToOct()
$.octToDec()
$.celsiusToFahrenheit()
$.fahrenheitToCelsius()
$.metersToKm()
$.kmToMiles()
$.validateEmail()
$.validateUrl()
$.validateIsoDate()
$.validateTime24h()
$.validateIpV4()
$.validateIpV6()
$.validatePassword()
$.validateHexColor()
$.validateUuid()
$.formatDate()
$.formatDateTime()
$.formatCronometer()
$.formatBytes()
$.formatCurrencyUsd()
$.formatCurrencyEur()
$.toRoman()
$.fromRoman()
$.numberToWords()
$.currencyToWords()
$.stripTags()
$.escapeHtml()
$.unescapeHtml()
$.levenshtein()
$.removeStopWords()
$.extractHashtags()
$.extractMentions()
$.extractUrls()
$.maskEmail()
$.maskDocument()
$.dotProduct()
$.clamp()
$.inRange()
$.linearRegression()
$.lerp()
$.isPrime()
$.nextPrime()
$.gcd()
$.lcm()
```

Essas funções DEVEM possuir contratos determinísticos, validação de argumentos, tratamento coerente de tipos/erros e possibilidade de composição sem efeitos colaterais inesperados.

## Testes

Validar automaticamente combinações variadas de:

* fontes, tamanhos, pesos e `line-height`;
* alinhamentos;
* textos extensos e múltiplas quebras;
* DSL no início, meio e fim do conteúdo;
* múltiplas expressões;
* placeholder e loading em todas as combinações;
* resolução rápida, lenta, concorrente e com erro;
* ausência/falha total do JavaScript;
* DOM já carregado;
* conteúdo inserido dinamicamente;
* HTML/Markdown;
* integrações suportadas por frameworks.

Comparar conteúdo equivalente com e sem plugin, comprovando preservação de altura, baseline, espaçamento e layout.

## Documentação

Criar ou aprimorar seção **Modo de uso**, caso inexistente, tanto para a biblioteca principal quanto para o plugin.

Ela DEVE ser sucinta, porém suficiente, contendo exemplos funcionais de:

* uso básico da DSL;
* instalação/importação;
* uso TypeScript e `.js`;
* encapsulamento HTML/Markdown;
* fallback sem JavaScript;
* placeholder/loading;
* chamada manual;
* conteúdo dinâmico;
* customização;
* composição/aninhamento de funções `$`;
* uso independente e bundle all-in-one.

Centralize no RCF os contratos de encapsulamento, lifecycle, renderização, fallback, funções utilitárias, extensibilidade e integração, mantendo plugin e biblioteca principal desacoplados.
