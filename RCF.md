# RCF global — DSLens

## 1. Autoridade, escopo e conformidade

Este RCF define o contrato funcional, arquitetural e público do DSLens. Ele DEVE complementar `./AGENTS.md`; processamento da IA, FT, Git e operação do repositório permanecem sob a norma superior. Sub-RCFs DEVEM especializar somente o próprio escopo e NÃO DEVEM enfraquecer este arquivo.

Ordem normativa do produto: `./RCF.md` → sub-RCF aplicável → manifesto canônico publicado → `./README.md`. Divergência entre implementação, build, pacote, manifesto ou documentação DEVE ser tratada como não conformidade; o RCF NÃO DEVE ser inferido da implementação divergente.

Aplicam-se `./AGENTS.md` §§0.13, 10–14 e `./.agents/core/contracts.md` CT-1–CT-4. Linguagem normativa segue `./.agents/core/concepts/microconceitos.md` MN-2119, MN-DENS, MN-PRES, MN-REF e MN-VAL.

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

As famílias são: PowerShell histórica, Python experimental, TypeScript/JavaScript planejada e futuras implementações justificadas. Cada família DEVE possuir perfil de capacidade e matriz de conformidade.

Estado documental em 2026-07-16:

| Família | Estado | Evidência | Autoridade |
|---|---|---|---|
| PowerShell | existente, referência histórica | `./src/ps/dsl.ps1` | comportamento legado sujeito a este RCF |
| Python | experimental, não certificado | `./src/py/dsl.py` | NÃO DEVE definir contrato comum |
| TypeScript/JavaScript | planejada | ausente | `./docs/rcf/typescript-javascript.md` |
| demais | futura | ausente | sub-RCF futuro obrigatório |

Recurso futuro NÃO DEVE ser anunciado como implementado. Implementação anterior NÃO DEVE ser alterada, depreciada ou promovida a referência única sem decisão explícita e vetores de conformidade.

## 5. Gramática e semântica canônicas

### 5.1 Forma mínima

```ebnf
expression = "${", quote, source, quote, "}", path ;
quote      = "\"" | "'" ;
path       = { member | index | filter } ;
member     = ".", identifier ;
index      = "[", non-negative-integer, "]" ;
filter     = "[@", identifier, "=", quote, literal, quote, "]" ;
```

O perfil canônico v1 DEVE aceitar exatamente uma expressão por entrada. `source` DEVE ser URL absoluta HTTP(S). `member` DEVE selecionar membro pelo nome literal; `index` DEVE ser base zero; `filter` DEVE selecionar a primeira ocorrência cujo atributo ou membro tenha igualdade textual exata. Ausência, tipo incompatível, índice fora do limite, expressão malformada ou fonte inválida DEVEM falhar sem fallback heurístico.

Texto sem expressão DEVE ser devolvido sem alteração. Texto que contenha abertura `${` malformada DEVE falhar. Conteúdo externo combinado com expressão, múltiplas expressões, resultado que contenha nova expressão e encadeamento recursivo NÃO DEVEM integrar o perfil canônico v1.

Crases, origem inline, arquivo local/remoto, objeto de opções, wildcard, `.find()`, interpolação parcial e método HTTP diferente de GET são capacidades propostas não implementadas. Elas NÃO DEVEM ser aceitas como estáveis até extensão de gramática, modelo de segurança, vetores comuns e decisão normativa explícita.

### 5.2 Pipeline

O pipeline DEVE executar, em ordem: detecção → validação da expressão e da fonte → obtenção autorizada → interpretação estrutural → navegação determinística → normalização textual → resultado. Implementações DEVEM preservar a ordem semântica mesmo quando otimizarem etapas internas.

JSON e XML DEVEM possuir suporte no perfil base certificado. YAML PODE integrar perfil adicional quando parser seguro e compatível estiver disponível; ausência do parser DEVE ser distinguível no perfil de capacidade e NÃO DEVE mudar silenciosamente a interpretação para outro formato. HTML NÃO DEVE ser interpretado.

## 6. Entradas, saídas, falhas e telemetria

A entrada pública canônica é texto. Sucesso DEVE retornar representação textual determinística do valor terminal. Falha esperada DEVE retornar ausência (`null`, `None` ou equivalente idiomático mapeado a `null` no protocolo) e NÃO DEVE propagar exceção ao consumidor da fachada fail-safe.

O protocolo de resultado estruturado para adaptadores, async e interoperabilidade DEVE conter `ok`, `value`, `error`, `metadata`; `value` DEVE ser texto ou `null`; `error` DEVE conter código estável, etapa e mensagem segura; `metadata` PODE conter implementação, versão, cache e duração. Mensagem NÃO DEVE expor segredo, credencial, conteúdo sensível ou path local.

Códigos mínimos: `INVALID_EXPRESSION`, `INVALID_SOURCE`, `FETCH_FAILED`, `TIMEOUT`, `PARSE_FAILED`, `INVALID_PATH`, `CHAIN_FORBIDDEN`, `BUSY`, `UNSUPPORTED_CAPABILITY`, `INTERNAL_FAILURE`.

Telemetria opcional DEVE receber mensagem e severidade estável. Severidades legadas `t`, `l`, `i`, `w`, `e` PODEM ser preservadas por binding; o protocolo comum DEVE mapeá-las a `step`, `log`, `info`, `warning`, `error`. Falha de callback NÃO DEVE alterar o resultado da resolução.

## 7. Sincronismo, estado, cache e limites

A API síncrona DEVE permanecer canônica quando o ambiente permitir obtenção síncrona. Ambientes que proíbam rede síncrona, inclusive navegador principal, DEVEM separar obtenção assíncrona de resolução síncrona: o núcleo síncrono DEVE aceitar dados já obtidos; a fachada assíncrona PODE obter e então invocar o mesmo núcleo. Consumidor síncrono NÃO DEVE ser obrigado a usar `Promise`, callback ou worker.

Fachada assíncrona DEVE preservar valor, erro, metadados e ordenação. Ela DEVE declarar timeout, cancelamento, concorrência, reentrância e efeitos; NÃO DEVE substituir nem alterar a API síncrona. Worker PODE encapsular operação sem mudar semântica.

Cache DEVE ser opcional, limitado, invalidável e semanticamente transparente. Chave DEVE cobrir fonte normalizada, path e qualquer opção que altere resultado. Cache negativo PODE existir com TTL declarado. Cache persistente NÃO DEVE ser requisito do núcleo e DEVE permanecer em adaptador com privacidade, isolamento e política de expiração. Limites e defaults publicados DEVEM constar do manifesto; relaxamento NÃO DEVE ser silencioso.

## 8. Extensibilidade e ambientes

O núcleo DEVE permanecer independente de DOM, Node.js, framework, worker, sistema de arquivos, processo, binário, serviço externo e detecção heurística de ambiente. Dependência ambiental DEVE entrar por binding, adaptador, hook, subpath ou condição de exportação.

Hook DEVE declarar nome, versão, ciclo, ordem, entrada congelada, retorno estruturado, sincronismo, reentrância, cancelamento, isolamento, erros e estabilidade. Ausência de hook opcional NÃO DEVE impedir o núcleo. Hook NÃO DEVE mutar estado gerenciado fora de ação autorizada nem absorver falha contratada. Aplicam-se `./.agents/core/contracts.md` CT-2 e CT-3.

Perfis previstos: `core`, `browser`, `worker`, `node`, `server`, `ssr`, `build` e `test`. Cada build DEVE declarar exatamente os perfis incluídos; importar `browser` NÃO DEVE carregar código de Node.js ou servidor.

Classes DEVERIAM representar estado, ciclo de vida ou estratégia substituível; composição e injeção DEVERIAM prevalecer sobre herança rígida. Funções puras DEVEM permanecer permitidas quando reduzirem estado e bundle. Orientação a objetos NÃO DEVE criar abstração sem função, estado global, herança profunda ou perda desproporcional de tree-shaking.

## 9. Superfície pública e documentação de código

Toda entidade pública DEVE constar no manifesto canônico com nome, categoria, linguagem, runtime, assinatura, parâmetros, retorno, efeitos, erros, sincronismo, estabilidade, importação, compatibilidade, extensão e referência normativa aplicáveis. Exportação acidental NÃO DEVE adquirir estabilidade.

Método e função públicos ou internos DEVEM possuir documentação sucinta no formato idiomático da linguagem, cobrindo finalidade e, quando aplicável, parâmetros, retorno, efeitos, erros, pré/pós-condições, sincronismo, mutabilidade, estabilidade e hooks. Comentário NÃO DEVERIA repetir apenas o código. Documentação gerada DEVERIA derivar da fonte ou ser validada contra ela.

## 10. Distribuição, paths e versionamento

Cada família DEVE suportar Git e os canais idiomáticos aprovados. TypeScript/JavaScript DEVE suportar npm, fonte TypeScript explícita, JavaScript executável, tipos, build client-side, CDN e importação direta. Consumidor NÃO DEVE precisar de toolchain de desenvolvimento, runtime alheio, módulos não usados ou paths internos.

Uso como submódulo Git DEVE aceitar diretório configurável, monorepo, workspace e symlink. Resolução DEVE partir da localização do módulo ou configuração explícita, nunca de nome/profundidade fixos ou diretório corrente. Falha estrutural DEVE produzir diagnóstico acionável e NÃO DEVE ser ocultada por fallback.

O projeto DEVE usar versionamento semântico. Mudança de gramática, resultado, erro, ordenação, default, export público ou tipo incompatível DEVE ser major; adição compatível DEVE ser minor; correção que preserve contrato DEVE ser patch. Famílias publicadas DEVEM usar versão coordenada do contrato e declarar versão própria do artefato quando diferir.

## 11. Builds, dependências e cadeia de suprimentos

Build DEVE possuir consumidor, runtime, formato, entry point, tipos, externalizações, carregamento, compatibilidade, minificação, source map e estabilidade declarados. Build distinto NÃO DEVE divergir semanticamente. Nenhum formato DEVE existir apenas por tradição.

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

PowerShell NÃO DEVE ser evidência única quando este RCF corrigir ou tornar explícito o contrato. Divergências existentes DEVEM permanecer inventariadas até FT autorizada.

## 15. Especializações

- PowerShell: `./docs/rcf/powershell.md`.
- TypeScript, JavaScript, npm e ambientes JS: `./docs/rcf/typescript-javascript.md`.
- Distribuição, builds e manifestos: `./docs/rcf/distribution.md`.

## 16. Decisões pendentes

Antes da implementação, decisão humana DEVE resolver:

1. **Gramática ampliada** — alternativas: manter v1 estrita; adicionar inline/arquivo; adicionar opções, wildcard e `.find`. Impacto: segurança, parser e paridade. Recomendação: implementar e certificar v1 antes de extensões.
2. **Python existente** — alternativas: certificar após convergência; manter experimental; remover em major futura. Impacto: cache persistente, dependência YAML e fallback socket divergentes. Recomendação: manter experimental até vetores comuns.
3. **Artefato global** — alternativas: IIFE ou UMD. Impacto: tamanho, namespace e compatibilidade. Recomendação: medir ESM e IIFE; publicar IIFE apenas com consumidor comprovado.
4. **Orçamento client-side** — alternativas dependem do baseline real. Impacto: build e dependências. Recomendação: fixar limite na FT do primeiro build, sem estimativa documental.
5. **Tokenização do manifesto** — alternativas: JSON, YAML ou TOML. Impacto: IA e toolchain. Recomendação: manter JSON por interoperabilidade e medir antes da publicação inicial.
