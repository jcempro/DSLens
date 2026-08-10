# Fonte da solicitação — FormulaKit, procedência e Demos verificáveis

- origem: anexo efêmero `4083e531-ba08-46e5-bc62-00386d2d1e44/pasted-text.txt`
- recebido_em: `2026-08-10T01:27:22-03:00`
- sha256_payload: `e1c5e302c0d6fa94f4890b56e5fdffd5f42231826a805d01ee887d54ffa4b4fa`
- sha256_payload_utf8_lf_sem_eol_final: `7936ff50cff3f08f97d9495e2cdec629e9cae74c929f4157528ba395725eed2f`
- FTs: `FT-20260810-001`, `FT-20260809-002`, `FT-20260810-002`, `FT-20260810-003`
- incorporação: `pendente de cobertura normativa validada`

## Payload integral
# Delegar `$.<nome>()` ao FormulaKitt, validar procedência e consolidar site público/Demos verificáveis

Leia integralmente o contexto normativo aplicável e inspecione RCF, implementação, testes, pipeline de build, integração com terceiros, site público/GitHub Pages e documentação real antes de alterar qualquer artefato. Preserve integralmente normas e melhorias existentes; este requisito **expande**, NÃO substitui nem autoriza regressões.

## 1. FormulaKitt

Todas as funções normatizadas como disponibilizadas pelo plugin na forma `$.<nome>()` DEVEM ser fornecidas **exclusivamente** pela biblioteca terceira:

https://github.com/jcempro/FormulaKitt

Consulte sua documentação autoritativa para identificar funções, nomes, contratos e uso. `<nome>` DEVE corresponder **exatamente** ao nome público fornecido pelo FormulaKitt. NÃO presuma, replique, renomeie ou reimplemente suas funções.

### 1.1 Desacoplamento

Este repositório NÃO DEVE depender do repositório FormulaKitt para funcionar:

- FormulaKitt disponível: use sua API pública.
- FormulaKitt ausente: `$.<nome>()` fica indisponível, mas as demais funcionalidades permanecem operacionais.
- NÃO incorporar cópia, fork, implementação substituta ou lógica equivalente.
- NÃO exigir FormulaKitt para carregamento, parser ou funcionalidades independentes.

A ausência DEVE possuir política configurável pelo consumidor: `ignore` ou `fail`, sendo **`ignore` o padrão**. Reutilize configuração existente quando aplicável; NÃO crie API paralela desnecessária.

### 1.2 FormulaKitt disponível

Resolva `$.<nome>()` diretamente contra sua API pública real. O plugin atua somente como camada de integração/DSL; implementação, cálculo e semântica dessas funções pertencem ao FormulaKitt.

Remova implementações locais equivalentes e ajuste RCF/documentação para estabelecer FormulaKitt como fonte autoritativa, evitando listas locais duplicadas sujeitas a divergência.

### 1.3 FormulaKitt ausente

#### `fail`

"Falhar" NÃO significa exceção catastrófica ou interrupção global. Na avaliação afetada:

1. falhe silenciosamente;
2. encerre/remova `loading`;
3. exiba o valor padrão declarado, se existente;
4. caso contrário, exiba `[error]`;
5. permita personalizar esse fallback.

A falha NÃO DEVE afetar página, runtime, parser ou avaliações independentes.

#### `ignore` — padrão

Determine se a expressão DSL admite **múltiplos resultados/caminhos decisórios**, inclusive por funções equivalentes a `IF/ELSE`, `AND`, `XOR`, `OR` conforme a DSL/API real.

- Havendo múltiplos caminhos possíveis, aplique `fail`: ignorar a função poderia produzir resultado semanticamente falso.
- Havendo resultado único e sendo seguro ignorar a função ausente, devolva o **valor puro, sem tratamento** e emita `console.warn` sucinto indicando a indisponibilidade do FormulaKitt.
- O `warn` NÃO DEVE tornar a degradação erro nem produzir repetição excessiva.

Inspecione a gramática real antes de implementar a detecção. Regex PODE ser usada se comprovadamente suficiente; caso aninhamento, escaping, argumentos ou composição tornem-na insegura, use o mecanismo estrutural mínimo adequado, preferencialmente parser/tokenização já existente.

## 2. Procedência e confiança criptográfica do FormulaKit

Implemente o consumo de procedência do FormulaKit **sem assumir que manifesto de runtime, objeto global, endpoint, pacote ou origem de download prova autoria**.

A verificação DEVE distinguir claramente:

- **descoberta** do material de procedência;
- **autenticidade** desse material;
- **continuidade histórica de confiança**;
- **autenticidade do release**;
- **integridade do artefato**.

Nenhuma dessas propriedades DEVE ser inferida apenas da outra.

### 2.1 Histórico de chaves

Obtenha o histórico de `keyId`s e chaves públicas pelo documento canônico futuro definido ao final deste prompt.

A obtenção DEVE usar:

- HTTPS;
- timeout explicitamente controlado;
- cache local;
- reutilização apenas de cache previamente validado;
- tratamento determinístico de indisponibilidade, divergência e dados inválidos.

A disponibilidade do documento em sua URL conhecida **NÃO constitui prova de autenticidade**.

### 2.2 Trust anchor

O documento de histórico somente DEVE ser aceito quando validado a partir de uma **trust anchor previamente conhecida por canal independente**.

NÃO estabeleça confiança inicial simplesmente porque:

- a URL utiliza HTTPS;
- o conteúdo veio do GitHub;
- o pacote veio do npm;
- o objeto/manifesto existe no navegador;
- o nome do projeto ou `keyId` corresponde ao esperado.

A trust anchor inicial DEVE ser obtida/configurada por mecanismo independente e explicitamente normatizado. NÃO invente sua origem se ela ainda não estiver definida; nesse caso, implemente a infraestrutura necessária e registre a necessidade normativa/configurável sem converter hipótese em confiança efetiva.

### 2.3 Validação de `FormulaKitKeyHistory/v1`

Antes de aceitar ou atualizar o histórico, verifique cumulativamente:

1. schema exatamente compatível com `FormulaKitKeyHistory/v1`;
2. assinatura criptográfica válida;
3. `keyId` assinante pertencente à cadeia previamente confiada;
4. continuidade **append-only** do histórico;
5. cadeia válida de rotação e/ou coassinatura;
6. revogações aplicáveis;
7. compatibilidade entre release alvo e intervalo de validade da respectiva chave;
8. inexistência de truncamento ou reescrita ilegítima do histórico;
9. proteção contra downgrade de:
   - histórico;
   - chave;
   - release;
   - política ou versão mínima de confiança.

A implementação DEVE manter estado suficiente para rejeitar conteúdo autenticamente assinado, porém **mais antigo que o mínimo já aceito**.

### 2.4 Rotação e continuidade

Preserve todos os `keyId`s históricos necessários à validação das versões do FormulaKit ainda suportadas.

Uma chave nova somente DEVE ser aceita quando:

- introduzida/assinada por chave anteriormente confiada; ou
- validamente coassinada conforme o modelo normativo; ou
- introduzida mediante procedimento explícito de **recuperação da trust anchor**.

É PROIBIDO aceitar automaticamente chave desconhecida apenas por ela constar no documento mais recente obtido.

Revogação NÃO DEVE apagar a informação histórica necessária para validar releases passados ainda suportados, mas DEVE impedir utilização incompatível com o escopo temporal ou motivo da revogação conforme o modelo de procedência efetivamente adotado.

### 2.5 Validação de release

Antes de executar, integrar ou aceitar exports do FormulaKit:

1. identifique o `keyId` declarado no artefato, manifesto ou atestação aplicável;
2. selecione no histórico validado a chave pública correspondente;
3. confirme que sua vigência cobre o release/versão alvo;
4. confirme que não está revogada para aquele uso/período;
5. valide criptograficamente a assinatura do manifesto/atestação;
6. valide o hash criptográfico do artefato real consumido;
7. somente então permita sua execução ou aceite seus exports.

Uma assinatura válida de manifesto **sem correspondência do hash do artefato** NÃO autoriza execução.

Da mesma forma, hash correto sem cadeia de assinatura confiável NÃO prova autoria.

### 2.6 Fontes alternativas

Se a URL canônica estiver indisponível, PODE obter **o mesmo documento de procedência** por fontes alternativas autenticáveis, incluindo:

- subpath público do pacote npm;
- asset do GitHub Release correspondente;
- tag assinada/repositório;
- cache local previamente validado.

Essas fontes são vias de obtenção, NÃO trust anchors independentes por si mesmas.

O documento obtido por fallback DEVE ser submetido às mesmas verificações de schema, assinatura, continuidade, validade e anti-downgrade.

Quando múltiplas fontes estiverem disponíveis, compare, conforme aplicável:

- schema;
- conteúdo canônico;
- assinatura;
- hash.

Divergência material entre cópias que deveriam representar o mesmo histórico **invalida a obtenção** até que uma cadeia confiável permita determinar inequivocamente a versão correta.

NÃO escolha silenciosamente a cópia "mais recente", "mais conveniente" ou proveniente do serviço aparentemente mais confiável.

### 2.7 Cache

Cache local DEVE armazenar somente informações públicas necessárias à validação e metadados mínimos de continuidade/anti-downgrade.

Cache NÃO DEVE transformar conteúdo previamente não validado em conteúdo confiável.

A implementação DEVE distinguir pelo menos:

- conteúdo obtido;
- conteúdo criptograficamente validado;
- maior histórico/release mínimo já confiado;
- trust anchor utilizada.

### 2.8 Segredos

É PROIBIDO:

- armazenar;
- solicitar;
- transmitir desnecessariamente;
- registrar em log;
- publicar;
- embutir no cliente;
- persistir em build/artifact;

qualquer chave privada, token, credencial ou segredo relacionado à procedência.

O mecanismo descrito DEVE operar exclusivamente com material público de verificação e trust anchors públicas previamente confiadas.

NÃO considere como fonte única de confiança:

- endpoint canônico;
- npm;
- GitHub;
- manifesto global exposto no navegador;
- qualquer outro canal individual de distribuição.

## 3. Site público e GitHub Pages

O site público com as **Demos do produto ainda não existe ou não está corretamente publicado**. Verifique o estado real e implemente/corrija sua publicação via GitHub Pages.

O site NÃO é mera documentação estática: DEVE constituir demonstração funcional, reproduzível e verificável do plugin.

A página inicial do produto DEVE apresentar acesso inequívoco à área de **Demo/Demos**.

### 3.1 Demos

Preserve toda normatização existente para testes/Demos e amplie-a com os seguintes requisitos:

- testar, validar e demonstrar **múltiplos usos reais do plugin**;
- cobrir suficientemente seus principais comportamentos e recursos, sem transformar a Demo em substituta da suíte automatizada;
- usar o **próprio plugin distribuído pelo projeto** para executar os exemplos;
- o plugin DEVE ser o meio principal/único pelo qual o parser seja executado nas Demos;
- É PROIBIDO criar implementação paralela, mock funcional ou parser especial para fazer os exemplos funcionarem;
- resultados exibidos DEVEM decorrer da execução real do exemplo apresentado;
- FormulaKitt NÃO precisa ter todas as suas funções demonstradas/testadas pelo site;
- entretanto, DEVEM existir alguns exemplos representativos da integração `$.<nome>()`, suficientes para comprovar funcionamento real e integração opcional;
- quando pertinente, demonstre também degradação sem FormulaKitt.

A Demo NÃO DEVE enfraquecer ou contornar a validação de procedência quando estiver exercitando um FormulaKit real sujeito a essa política.

## 4. Organização das Demos

Como existem múltiplos cenários, NÃO concentre artificialmente todos os testes em uma única página.

Organize a área em **múltiplas páginas, categorizadas/subcategorizadas por funcionalidade ou cenário**, com navegação clara entre elas. Reutilize arquitetura/navegação existente quando houver; NÃO invente taxonomia rígida antes de inspecionar o conteúdo real.

Cada exemplo DEVE apresentar conjuntamente:

1. **exemplo funcional real**;
2. **código-fonte correspondente com syntax highlighting**;
3. **resultado real produzido pelo plugin**;
4. quando houver fonte externa, botão/link para visualizar a fonte efetivamente utilizada (`JSON`, `YAML`, `XML` ou formato suportado).

O código apresentado NÃO DEVE ser reprodução manual potencialmente divergente. Sempre que tecnicamente viável, o highlight DEVE derivar do **mesmo HTML/código efetivamente executado**, permitindo ao usuário confrontá-lo posteriormente com o fonte real da página.

A Demo NÃO DEVE falsificar, pré-calcular ou hardcodear resultados para aparentar funcionamento.

## 5. Verificabilidade das Demos

Cada demonstração DEVE permitir estabelecer a cadeia:

**fonte real → HTML/configuração real → plugin/parser real → resultado exibido**

Quando utilizar `JSON`/`YAML`/`XML`, a fonte acessível pelo botão/link DEVE ser exatamente aquela consumida pelo exemplo, salvo transformação de build explicitamente identificável e rastreável.

O usuário DEVE poder inspecionar o HTML/fonte da página e confirmar que o código demonstrado corresponde substancialmente ao executado.

Syntax highlighting, componentes de documentação ou infraestrutura da Demo NÃO DEVEM interferir no comportamento testado nem constituir implementação alternativa do parser.

## 6. RCF, testes e aceite

Atualize cirurgicamente o RCF para incorporar somente contratos ainda não normatizados, referenciando regras existentes em vez de duplicá-las.

Normatize explicitamente:

- autoridade do FormulaKitt sobre `$.<nome>()`;
- correspondência nominal exata;
- integração opcional;
- ausência de dependência funcional;
- políticas `ignore`/`fail`;
- padrão `ignore`;
- fallback configurável;
- encerramento de `loading`;
- tratamento de expressões de um ou múltiplos caminhos;
- `console.warn`;
- distinção entre descoberta e confiança;
- trust anchor independente;
- `FormulaKitKeyHistory/v1`;
- continuidade append-only;
- rotação/coassinatura;
- revogação;
- vigência temporal;
- validação de release;
- assinatura + hash antes da execução;
- fontes alternativas;
- cache validado;
- anti-downgrade;
- recuperação explícita da trust anchor;
- proibição absoluta de segredos privados.

Valide, no mínimo:

- FormulaKitt presente e funções resolvidas;
- FormulaKitt ausente com `ignore`;
- FormulaKitt ausente com `fail`;
- valor padrão presente/ausente;
- `[error]` padrão e personalizado;
- expressão simples de resultado único;
- expressões condicionais/lógicas de múltiplos caminhos, inclusive aninhadas;
- encerramento de `loading`;
- histórico de chaves válido;
- assinatura inválida;
- schema inválido;
- `keyId` desconhecido;
- rotação válida e inválida;
- revogação;
- chave fora do intervalo da versão;
- manifesto válido com artefato/hash divergente;
- downgrade de histórico/chave/release;
- indisponibilidade da fonte canônica;
- fallback por cada fonte alternativa suportada;
- divergência entre fontes;
- cache válido, inválido e desatualizado;
- ausência de trust anchor;
- GitHub Pages publicado e navegável;
- Home → Demos;
- navegação entre categorias/subcategorias;
- múltiplas Demos reais do plugin;
- parser executado exclusivamente por meio do plugin;
- correspondência entre código apresentado, código executado e resultado;
- highlighting;
- fontes `JSON`/`YAML`/`XML` acessíveis quando utilizadas;
- integração representativa com FormulaKitt;
- inexistência de implementações duplicadas;
- preservação de todas as normas e melhorias anteriores.

O aceite exige simultaneamente que:

- este projeto permaneça utilizável sem FormulaKitt;
- nenhuma função `$.<nome>()` seja reimplementada localmente;
- ausência do FormulaKitt jamais produza silenciosamente resultado decisório potencialmente incorreto;
- procedência NÃO seja inferida de mera disponibilidade ou de manifesto de runtime;
- nenhum release seja executado/aceito antes de validar cadeia de confiança, assinatura e hash;
- downgrade e substituição de histórico/chaves sejam rejeitados;
- o site público seja demonstração executável e auditável do produto, não simulação documental;
- o parser demonstrado seja o parser real acessado pelo plugin;
- exemplos, fontes e resultados permaneçam verificavelmente correlacionados;
- nenhuma melhoria, detalhe, nuance ou norma anterior seja perdida ou enfraquecida.

## 7. Localização canônica futura

Ao final da implementação e do relatório, devolva **exatamente** o bloco abaixo e declare, imediatamente antes ou depois dele, que esta localização é **somente uma via de descoberta e NÃO constitui, isoladamente, fonte de confiança ou trust anchor**:

[https://raw.githubusercontent.com/jcempro/FormulaKit/main/provenance/keys/v1.json](https://raw.githubusercontent.com/jcempro/FormulaKit/main/provenance/keys/v1.json)
