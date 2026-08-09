# RCF global — DSLens

## 1. Autoridade, escopo e conformidade

Este RCF define o contrato funcional, arquitetural e público do DSLens. Ele DEVE complementar `./AGENTS.md`; processamento da IA, FT, Git e operação do repositório permanecem sob a norma superior. Sub-RCFs DEVEM especializar somente o próprio escopo e NÃO DEVEM enfraquecer este arquivo.

Ordem normativa do produto: `./RCF.md` → sub-RCF aplicável → manifesto canônico publicado → `./README.md`. Divergência entre implementação, build, pacote, manifesto ou documentação DEVE ser tratada como não conformidade; o RCF NÃO DEVE ser inferido da implementação divergente.

Aplicam-se `./AGENTS.md` §§0.13, 10–14 e `./.ia.rules/core/contracts.md` CT-1–CT-4. Linguagem normativa segue `./.ia.rules/core/concepts/microconceitos.md` MN-2119, MN-DENS, MN-PRES, MN-REF e MN-VAL.

## 2. Finalidade e limites

DSLens é uma especificação implementável e uma família de bibliotecas para resolução declarativa e determinística de valores em dados estruturados. O núcleo DEVE transformar uma expressão DSL e uma origem autorizada em valor textual ou falha normalizada, sem avaliação de código, scraping ou heurística.

O projeto NÃO DEVE ser parser genérico, seletor de HTML, mecanismo de automação imperativa nem linguagem de execução arbitrária. Operação de rede do núcleo DEVE ser somente leitura por HTTP `GET`; mutação, autenticação implícita e efeito externo não declarado são vedados.

## 3. Taxonomia e raízes

- **contrato canônico**: semântica independente de linguagem definida neste RCF e nos schemas;
- **implementação**: realização do contrato em uma linguagem;
- **binding**: projeção idiomática da API canônica;
- **adaptador**: integração segregada com ambiente ou recurso não pertencente ao núcleo;
- **wrapper**: fachada que preserva o contrato e altera somente forma de consumo;
- **hook**: extensão tipada acionada em ponto de ciclo de vida declarado;
- **build**: artefato derivado para consumidor e runtime definidos;
- **código gerado**: arquivo reproduzível cuja fonte e gerador são declarados;
- **pacote**: unidade distribuível por canal específico;
- **protocolo de interoperabilidade**: representação comum de entrada, resultado, falha e metadados.

A raiz do repositório DEVE conter governança, documentação, manifestos e automação transversal. Implementações DEVEM residir em `./src/<família>/`. Artefatos publicados DEVEM residir em raiz de distribuição declarada e NÃO DEVEM expor `./src`, testes, cache ou configuração de desenvolvimento.

## 4. Famílias e estado

O contrato canônico é a sintaxe e sua semântica. Linguagem, runtime e formato de distribuição são implementações equivalentes e nenhum deles DEVE receber precedência funcional. As famílias iniciais são PowerShell, Python, TypeScript e JavaScript; novas linguagens DEVEM ser adicionadas sempre que houver implementação sustentável, testes de conformidade e canal de distribuição aplicável.

Estado documental em 2026-07-16:

| Família | Estado | Evidência | Autoridade |
|---|---|---|---|
| PowerShell | existente, convergência obrigatória | `./src/ps/dsl.ps1` | implementação equivalente |
| Python | existente, convergência obrigatória | `./src/py/dsl.py` | implementação equivalente |
| TypeScript | implementada e testada | `./src/ts/` | fonte importável opcionalmente |
| JavaScript | implementada e testada | `./package/dslens/dist/javascript/` | transpilação para cliente e servidor |
| demais | futura | ausente | sub-RCF futuro obrigatório |

Recurso futuro NÃO DEVE ser anunciado como implementado. PowerShell e Python DEVEM ser atualizados até aderirem ao contrato canônico e aos vetores comuns; compatibilidade pública válida DEVE ser preservada durante a convergência. Nenhuma implementação DEVE ser promovida a referência semântica única.

## 5. Gramática e semântica canônicas

### 5.1 Forma mínima

```ebnf
expression = "${", quote, source, quote, "}", path ;
quote      = "\"" | "'" ;
path       = { member | index | filter } ;
member     = ".", identifier ;
index      = "[", non-negative-integer, "]" ;
filter     = "[@", identifier, "=", quote, literal, quote, "]" ;
request-expression = "${", quote, source, quote, ";", [ "request", "=" ], request-object, "}", path ;
request-object = JSON-object ;
```

O perfil canônico v1 DEVE aceitar exatamente uma expressão por entrada. `source` DEVE ser URL absoluta HTTP(S). `member` DEVE selecionar membro pelo nome literal; `index` DEVE ser base zero; `filter` DEVE selecionar a primeira ocorrência cujo atributo ou membro tenha igualdade textual exata. Ausência, tipo incompatível, índice fora do limite, expressão malformada ou fonte inválida DEVEM falhar sem fallback heurístico.

Texto sem expressão DEVE ser devolvido sem alteração. Texto que contenha abertura `${` malformada DEVE falhar. Conteúdo externo combinado com expressão, múltiplas expressões, resultado que contenha nova expressão e encadeamento recursivo NÃO DEVEM integrar o perfil canônico v1.

Crases, origem inline, arquivo local/remoto, `.find()`, interpolação parcial e método HTTP diferente de GET/POST permanecem fora do contrato estável. Wildcard somente é estável no perfil v3 como passo delimitado `[*]`; qualquer outro padrão de casamento, glob ou `.find()` NÃO DEVE ser aceito como equivalente.

O perfil v2 adiciona exatamente um segundo parâmetro opcional `request`, nas formas equivalentes `; request={...}` e `; {...}`. O segundo parâmetro posicional DEVE significar `request`; outro parâmetro futuro DEVE ser nomeado. Forma posicional e nomeada juntas, nome desconhecido, objeto não JSON ou parâmetro adicional DEVEM falhar. Ausência de `request` preserva integralmente o perfil v1: `GET`, sem body e sem cabeçalho customizado.

`request` PODE conter `method`, `query`, `headers` e `body`. `method` aceita somente `GET` ou `POST`, com `GET` default. `query` DEVE ser objeto de escalares serializados de forma determinística. `headers` DEVE ser objeto de strings ou referências `{ "env": "NOME" }`; `Host`, `Content-Length`, `Connection` e equivalentes controlados pelo runtime DEVEM ser rejeitados. `body` somente PODE existir em `POST` e declara `encoding` (`json`, `form` ou `text`) e `value`. Referência de ambiente DEVE ser resolvida por provedor injetado; browser e worker NÃO DEVEM ler ambiente global implicitamente. Valor ausente falha sem expor nome ou conteúdo sensível. Cabeçalho sensível NÃO DEVE atravessar redirecionamento entre origens.

### 5.1.1 Seletores estruturais compatíveis

O perfil v3 adiciona consulta estrutural sobre dados já carregados e sobre fontes v1/v2 sem alterar path válido anterior. A sintaxe NÃO copia JSONPath, XPath ou YAMLPath; ela reaproveita conceitos com raiz implícita DSLens. A forma estável é:

```ebnf
selector-expression = result-function, "(", selector-path, ")" | selector-path ;
result-function     = "first" | "all" | "count" | "exists" ;
selector-path       = { step } ;
step                = member | quoted-member | xml-attribute | xml-text | index | wildcard | recursive | filter ;
quoted-member       = ".", "[", quote, literal, quote, "]" ;
xml-attribute       = ".", "@", name-or-expanded-name ;
xml-text            = ".", "text", "(", ")" ;
wildcard            = "[*]" ;
recursive           = "..", ( identifier | "[", quote, literal, quote, "]" | "@", name-or-expanded-name ) ;
filter              = "[?", "(", predicate, ")", "]" | legacy-filter ;
legacy-filter       = "[@", identifier, "=", quote, literal, quote, "]" ;
predicate           = existence | comparison ;
existence           = "@", selector-path ;
comparison          = "@", selector-path, comparator, scalar ;
comparator          = "=" | "!=" | ">" | ">=" | "<" | "<=" ;
scalar              = quoted-string | number | "true" | "false" | "null" ;
```

`member`, `index` e `legacy-filter` preservam integralmente a semântica v1. `quoted-member` seleciona nome de propriedade ou elemento com caractere especial; aspas delimitadoras podem ser simples ou duplas, e somente barra invertida para a própria aspa e para barra invertida é reconhecida. Índice negativo, fatia, união de campos, ordenação e projeção transformacional ficam fora do perfil v3 por custo semântico e por colisão com retorno textual atual.

`wildcard` expande todos os filhos diretos de mapa, objeto, sequência ou elemento XML, preservando ordem nativa determinística do formato. `recursive` realiza busca em profundidade pré-ordem a partir do nó corrente, limitada pelos controles de segurança. Filtro novo `?()` opera item a item sobre sequência ou conjunto de nós e aceita apenas existência e comparação escalar; operadores lógicos, chamada de função e expressão aritmética são proibidos.

Funções de resultado são explícitas e só podem envolver a consulta inteira. Após `${...}`, a expressão de seleção PODE iniciar por `.`, `[`, `first(`, `all(`, `count(` ou `exists(`. Sem função, a compatibilidade v1 prevalece: resultado único retorna texto, múltiplos resultados de sintaxe nova retornam JSON compacto determinístico e vazio retorna ausência. `first(path)` retorna o primeiro item em ordem de seleção ou ausência; `all(path)` sempre materializa lista JSON compacta; `count(path)` retorna contagem decimal; `exists(path)` retorna `true` ou `false`.

### 5.1.2 Modelo de dados dos seletores

A avaliação usa um conjunto ordenado de nós com cardinalidade zero ou mais. Cada passo recebe conjunto e retorna conjunto. Duplicatas por identidade de nó DEVEM ser removidas preservando a primeira ocorrência. Ausência é conjunto vazio; `null` é valor existente e materializável como `null` em `all`, mas retorna ausência em modo legado sem função para preservar v1. Tipo incompatível em passo estrutural retorna conjunto vazio, exceto consulta malformada, que falha como `INVALID_EXPRESSION` ou `INVALID_PATH`.

JSON e YAML compartilham semântica para mapas, sequências e escalares equivalentes. Propriedade acessa somente membro próprio; cadeia de protótipos, atributo de classe, método, getter e execução de código são proibidos. XML preserva elementos, atributos, texto, namespaces e ordem documental quando o runtime expõe esses dados. Elemento é selecionado por nome local ou nome expandido `{uri}local` em `quoted-member`; atributo usa `.@nome` ou `.@{uri}nome`; texto usa `.text()`. XPath arbitrário, entidades externas, DTD externa, HTML e conversão XML para JSON são proibidos.

### 5.1.3 Limites e segurança de consulta

Limites mínimos comuns do perfil v3: consulta até 2048 caracteres; profundidade sintática até 64 passos; recursão até 32 níveis; nós visitados até 10000; resultados materializados até 1024; filtros até 32 por consulta; literal até 512 caracteres. Implementação PODE usar limite menor por runtime somente quando documentado e testado. Exceder limite retorna falha segura e telemetria sem dado sensível.

Consulta, filtros e dados externos são entradas não confiáveis. Implementação NÃO DEVE usar `eval`, `Invoke-Expression`, compilação dinâmica, XPath arbitrário, desserialização insegura, YAML com tags executáveis, acesso a ambiente, protótipo, método ou propriedade herdada durante seleção. XML DEVE desabilitar entidade externa e DTD quando o parser permitir configuração; quando o parser nativo não expuser controle suficiente, entrada com `<!DOCTYPE` DEVE ser rejeitada antes do parse.

### 5.2 Pipeline

O pipeline DEVE executar, em ordem: detecção → validação da expressão e da fonte → obtenção autorizada → interpretação estrutural → navegação determinística → normalização textual → resultado. Implementações DEVEM preservar a ordem semântica mesmo quando otimizarem etapas internas.

JSON e XML DEVEM possuir suporte no perfil base certificado. YAML PODE integrar perfil adicional quando parser seguro e compatível estiver disponível; ausência do parser DEVE ser distinguível no perfil de capacidade e NÃO DEVE mudar silenciosamente a interpretação para outro formato. HTML NÃO DEVE ser interpretado.

## 6. Entradas, saídas, falhas e telemetria

A entrada pública canônica é texto. Sucesso DEVE retornar representação textual determinística do valor terminal. Falha esperada DEVE retornar ausência (`null`, `None` ou equivalente idiomático mapeado a `null` no protocolo) e NÃO DEVE propagar exceção ao consumidor da fachada fail-safe.

Cada implementação DEVE expor detecção de expressão, resolução síncrona sobre dado estruturado já carregado e fachada de resolução de fonte conforme capacidade do ambiente. A superfície canônica multilinguagem DEVE usar `hasParserExpression(source)`, `resolveDslData(data, path, callback?)` e `resolveParserExpression(source, options?, callback?)`, nessa ordem. `source` e `path` DEVEM ser texto; `data` aceita valor estruturado nativo; `options` DEVE ser objeto/mapeamento/hashtable equivalente; `callback` DEVE ser callable/ScriptBlock equivalente e opcional. Binding PODE preservar alias idiomático legado, mas ele NÃO DEVE substituir nem divergir da superfície canônica. Assincronia ambiental PODE alterar somente o invólucro do retorno para `Promise`/equivalente declarado.

O protocolo de resultado estruturado para adaptadores, async e interoperabilidade DEVE conter `ok`, `value`, `error`, `metadata`; `value` DEVE ser texto ou `null`; `error` DEVE conter código estável, etapa e mensagem segura; `metadata` PODE conter implementação, versão, cache e duração. Mensagem NÃO DEVE expor segredo, credencial, conteúdo sensível ou path local.

Códigos mínimos: `INVALID_EXPRESSION`, `INVALID_SOURCE`, `FETCH_FAILED`, `TIMEOUT`, `PARSE_FAILED`, `INVALID_PATH`, `CHAIN_FORBIDDEN`, `BUSY`, `UNSUPPORTED_CAPABILITY`, `INTERNAL_FAILURE`.

Telemetria opcional DEVE receber mensagem e severidade estável. Severidades legadas `t`, `l`, `i`, `w`, `e` PODEM ser preservadas por binding; o protocolo comum DEVE mapeá-las a `step`, `log`, `info`, `warning`, `error`. Falha de callback NÃO DEVE alterar o resultado da resolução.

## 7. Sincronismo, estado, cache e limites

A API síncrona DEVE permanecer canônica quando o ambiente permitir obtenção síncrona. Ambientes que proíbam rede síncrona, inclusive navegador principal, DEVEM separar obtenção assíncrona de resolução síncrona: o núcleo síncrono DEVE aceitar dados já obtidos; a fachada assíncrona PODE obter e então invocar o mesmo núcleo. Consumidor síncrono NÃO DEVE ser obrigado a usar `Promise`, callback ou worker.

Fachada assíncrona DEVE preservar valor, erro, metadados e ordenação. Ela DEVE declarar timeout, cancelamento, concorrência, reentrância e efeitos; NÃO DEVE substituir nem alterar a API síncrona. Worker PODE encapsular operação sem mudar semântica.

Cache DEVE ser opcional, limitado, invalidável e semanticamente transparente. Chave DEVE cobrir fonte normalizada, path e qualquer opção que altere resultado. Cache negativo PODE existir com TTL declarado. Cache persistente NÃO DEVE ser requisito do núcleo e DEVE permanecer em adaptador com privacidade, isolamento e política de expiração. Limites e defaults publicados DEVEM constar do manifesto; relaxamento NÃO DEVE ser silencioso.

## 8. Extensibilidade e ambientes

O núcleo DEVE permanecer independente de DOM, Node.js, framework, worker, sistema de arquivos, processo, binário, serviço externo e detecção heurística de ambiente. Dependência ambiental DEVE entrar por binding, adaptador, hook, subpath ou condição de exportação.

Hook DEVE declarar nome, versão, ciclo, ordem, entrada congelada, retorno estruturado, sincronismo, reentrância, cancelamento, isolamento, erros e estabilidade. Ausência de hook opcional NÃO DEVE impedir o núcleo. Hook NÃO DEVE mutar estado gerenciado fora de ação autorizada nem absorver falha contratada. Aplicam-se `./.ia.rules/core/contracts.md` CT-2 e CT-3.

Perfis previstos: `core`, `browser`, `worker`, `node`, `server`, `ssr`, `build` e `test`. Cada build DEVE declarar exatamente os perfis incluídos; importar `browser` NÃO DEVE carregar código de Node.js ou servidor.

Classes DEVERIAM representar estado, ciclo de vida ou estratégia substituível; composição e injeção DEVERIAM prevalecer sobre herança rígida. Funções puras DEVEM permanecer permitidas quando reduzirem estado e bundle. Orientação a objetos NÃO DEVE criar abstração sem função, estado global, herança profunda ou perda desproporcional de tree-shaking.

Integração de DSLens com HTML/Markdown DEVE permanecer em plugin browser opcional e desacoplado, dependente da API pública da biblioteca e regido por `./docs/rcf/browser-plugin.md`. O núcleo NÃO DEVE descobrir DOM, interpretar texto documental, renderizar markup, carregar CSS, observar lifecycle de página nem incorporar o catálogo utilitário `$`. [PENDENTE-CODIGO]

## 9. Superfície pública e documentação de código

Toda entidade pública DEVE constar no manifesto canônico com nome, categoria, linguagem, runtime, assinatura, parâmetros, retorno, efeitos, erros, sincronismo, estabilidade, importação, compatibilidade, extensão e referência normativa aplicáveis. Exportação acidental NÃO DEVE adquirir estabilidade.

Método e função públicos ou internos DEVEM possuir documentação sucinta no formato idiomático da linguagem, cobrindo finalidade e, quando aplicável, parâmetros, retorno, efeitos, erros, pré/pós-condições, sincronismo, mutabilidade, estabilidade e hooks. Comentário NÃO DEVERIA repetir apenas o código. Documentação gerada DEVERIA derivar da fonte ou ser validada contra ela.

## 10. Distribuição, paths e versionamento

Cada família DEVE suportar Git e os canais idiomáticos aprovados. TypeScript/JavaScript DEVE suportar npm sob o nome minúsculo `@jeancarloem/dslens`, fonte TypeScript explícita, JavaScript executável ESM e CommonJS, tipos, build client-side, CDN e importação direta. Consumidor NÃO DEVE precisar de toolchain de desenvolvimento, runtime alheio, módulos não usados ou paths internos.

Uso como submódulo Git DEVE aceitar diretório configurável, monorepo, workspace e symlink. Resolução DEVE partir da localização do módulo ou configuração explícita, nunca de nome/profundidade fixos ou diretório corrente. Falha estrutural DEVE produzir diagnóstico acionável e NÃO DEVE ser ocultada por fallback.

O projeto DEVE usar versionamento semântico. Mudança de gramática, resultado, erro, ordenação, default, export público ou tipo incompatível DEVE ser major; adição compatível DEVE ser minor; correção que preserve contrato DEVE ser patch. Famílias publicadas DEVEM usar versão coordenada do contrato e declarar versão própria do artefato quando diferir.

O plugin browser documental DEVE ser distribuído em TypeScript, JavaScript e CSS separado, sem tornar-se dependência obrigatória da biblioteca principal. Release DEVE oferecer builds JavaScript independentes da biblioteca e do plugin, CSS separado e all-in-one opcional com ambos e CSS embutido, conforme `./docs/rcf/browser-plugin.md` e `./docs/rcf/distribution.md`. [PENDENTE-CODIGO]

## 11. Builds, dependências e cadeia de suprimentos

Build DEVE possuir consumidor, runtime, formato, entry point, tipos, externalizações, carregamento, compatibilidade, minificação, source map e estabilidade declarados. Build distinto NÃO DEVE divergir semanticamente. Nenhum formato DEVE existir apenas por tradição.

Build TypeScript/JavaScript DEVE resolver anualmente a compatibilidade ECMAScript pelo ano civil UTC da execução menos cinco, com ES2020 como piso. O target do compilador, a biblioteca ECMAScript de tipos e o target do transpilador DEVEM usar o mesmo valor resolvido; o formato de módulo DEVE permanecer ES2020 enquanto esta for a modalidade publicada. A configuração-base versionada DEVE conservar ES2020, e cada build DEVE gerar configuração derivada e metadado determinístico com ano, fórmula e valor efetivo. Target ainda não reconhecido pela toolchain DEVE falhar explicitamente, sem rebaixamento silencioso.

Otimização DEVE preservar comportamento, efeitos necessários, nomes públicos, tipos, maps e licença; DEVE favorecer determinismo, tree-shaking, eliminação de código morto, deduplicação e ausência de dependência acidental. `sideEffects` DEVE refletir módulos puros, registro de hooks, inicialização, estilos e ordem real.

Dependência DEVE estar na categoria correspondente ao uso. Lockfile, licença, vulnerabilidade, script de instalação, proveniência e origem DEVEM ser auditáveis. Build NÃO DEVE depender de recurso remoto não fixado. Segredo NÃO DEVE integrar fonte, build, map, manifesto, pacote, log ou fixture publicada.

Artefatos relevantes DEVEM possuir medição reproduzível de tamanho bruto, minificado, gzip e Brotli, além de baseline. O orçamento do build client-side otimizado DEVE ser fixado após primeiro baseline real aprovado; alteração do limite exige causa, quantificação, alternativas e decisão explícita.

## 12. Manifestos e schemas

O manifesto canônico DEVE ser JSON UTF-8 com ordenação canônica, sem exemplos e validado por `./schemas/dslens-manifest.schema.json`. JSON é adotado por suporte nativo em browser/Node.js, schema consolidado e ausência de parser adicional; comparação de tokenização com YAML/TOML permanece pendente antes da primeira publicação.

Manifesto Markdown híbrido DEVE ser derivado ou validado contra o JSON e priorizar contratos, importação, compatibilidade, customização e exemplos mínimos. Informação normativa NÃO DEVE ser mantida manualmente em duas fontes independentes.

O pipeline futuro DEVE detectar exportação sem contrato, contrato sem exportação, assinatura/path/tipo/build ausente, divergência entre linguagens e referência quebrada. Publicação com inconsistência é vedada.

## 13. Cabeçalhos e licença

Fonte e artefato textual que aceite comentário DEVEM conter somente cabeçalho autoral/licencial conforme `./AGENTS.md` §12, usando dados comprovados do repositório. Build minificado DEVE preservar banner ultrassucinto. Formato sem comentário DEVE usar metadado próprio ou sidecar. Gerado DEVE indicar fonte, gerador e vedação de edição manual.

Licença do projeto: Mozilla Public License 2.0, conforme `./LICENSE`. Autor primário comprovado: JeanCarloEM. Origem comprovada: `https://github.com/jcempro/DSLens`. Site comprovado: `https://jeancarloem.com`. E-mail e autor secundário não foram encontrados e NÃO DEVEM ser inferidos.

## 14. Paridade e validação

Matriz de capacidades DEVE classificar cada item como `required`, `supported`, `optional`, `experimental`, `unavailable` ou `environment-incompatible`. Contratos compartilhados DEVEM possuir vetores offline comuns com entrada, dados, resultado, erro e ordenação determinísticos.

Validação DEVE comparar resultado, falha, normalização, ordenação, default, sincronismo e efeito. Também DEVE cobrir schema, exports, declarações, browser real, worker, Node.js, tree-shaking, headers, tamanho, build reproduzível, tarball, CDN, submódulo renomeado, monorepo, symlink, execução fora da raiz, licenças e segredos conforme aplicável. Teste não executado NÃO DEVE ser declarado executado.

PowerShell, Python, TypeScript e JavaScript DEVEM demonstrar a mesma semântica pelos vetores comuns. Divergência existente DEVE ser corrigida na implementação divergente; nenhuma linguagem DEVE servir como evidência única do contrato.

Capacidade exclusiva do plugin documental NÃO integra a paridade PowerShell/Python do núcleo. Sua conformidade DEVE ser demonstrada no navegador por contrato funcional, DOM dinâmico, fallback sem JavaScript, segurança textual, composição `$`, integração por API e preservação visual inline. [PENDENTE-CODIGO]

### 14.1 Testes automatizados e CI

`npm test` DEVE orquestrar testes unitários, integração, conformidade multilinguagem e E2E. O conjunto determinístico obrigatório DEVE usar mocks e fixtures locais geradas; testes contra APIs reais DEVEM residir em perfil opt-in separado e falha externa NÃO DEVE invalidar o conjunto determinístico sem diagnóstico de causa local.

O testador DEVE detectar CI por sinal explícito do ambiente. Execução local DEVE oferecer saída compacta, amigável e colorida quando o terminal suportar ANSI; execução CI DEVE desativar cor e animação. Ambas DEVEM preservar estrutura estável, severidade, caso, linguagem, duração e erro sem inundação de logs, permitindo leitura humana e parsing por IA.

Workflow de testes DEVE executar em `push` quando houver alteração de runtime, teste, fixture, manifesto, dependência, configuração lógica ou próprio workflow; alteração restrita a documentação NÃO DEVE dispará-lo. `workflow_dispatch` DEVE permitir execução manual. A matriz DEVE validar os runtimes homologados e publicar somente status derivado de execução real.

## 15. Especializações

- PowerShell: `./docs/rcf/powershell.md`.
- Python: `./docs/rcf/python.md`.
- TypeScript, JavaScript, npm e ambientes JS: `./docs/rcf/typescript-javascript.md`.
- Distribuição, builds e manifestos: `./docs/rcf/distribution.md`.
- Plugin browser documental: `./docs/rcf/browser-plugin.md`.

## 16. Decisões pendentes

Antes da implementação, decisão humana DEVE resolver:

1. **Gramática ampliada** — alternativas: manter v1 estrita; adicionar inline/arquivo; adicionar opções, wildcard e `.find`. Impacto: segurança, parser e paridade. Recomendação: implementar e certificar v1 antes de extensões.
2. **Artefato global do núcleo legado** — o plugin documental comprova consumidor para IIFE browser nos quatro assets definidos em `./docs/rcf/browser-plugin.md`, sem autorizar UMD ou novo global. Outros artefatos globais permanecem dependentes de consumidor comprovado.
3. **Orçamento client-side** — alternativas dependem do baseline real. Impacto: build e dependências. Recomendação: fixar limite na FT do primeiro build, sem estimativa documental.
4. **Tokenização do manifesto** — alternativas: JSON, YAML ou TOML. Impacto: IA e toolchain. Recomendação: manter JSON por interoperabilidade e medir antes da publicação inicial.
5. **Condição de runtime para worker** — `worker` ainda é condição customizada e nem todo resolvedor npm a ativa automaticamente. Impacto: importação pela raiz PODE cair no core neutro. Recomendação: manter `./worker` como subpath normativo, testar `--conditions=worker` e acompanhar padronização sem heurística de ambiente.
