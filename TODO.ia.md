- [ ] **Adicionar à pseudo query string o modo explícito `HEAD`, além dos
  `GET` e `POST` já implementados, para obter exclusivamente status e
  cabeçalhos da resposta, sem transferir o respectivo corpo, preservando a
  sintaxe, os parâmetros, a segurança, a compatibilidade e os contratos
  existentes.**

  - **Escopo e preservação**
    - Tratar esta tarefa como aprimoramento cirúrgico da implementação atual,
      NÃO como reescrita do mecanismo de requisições.
    - Inspecionar antes de alterar:
      - RCF;
      - gramática e parser da pseudo query string;
      - implementação de `GET` e `POST`;
      - parâmetros públicos e ocultos;
      - transporte client-side;
      - tratamento de respostas, erros, timeout, cancelamento e segurança;
      - testes e documentação existentes.
    - Preservar integralmente:
      - sintaxe já normatizada;
      - semântica dos parâmetros;
      - compatibilidade retroativa;
      - validações;
      - codificação;
      - autenticação;
      - headers;
      - políticas de segurança;
      - comportamento atual de `GET` e `POST`.
    - O novo modo NÃO DEVE alterar o significado dos modos existentes nem
      obrigar consumidores atuais a adaptar scripts válidos.

  - **Semântica de `HEAD`**
    - `HEAD` DEVE representar, no nível da DSL, a intenção de:
      - enviar uma requisição compatível com a semântica de `GET` ou `POST`;
      - receber e disponibilizar status, URL final e cabeçalhos;
      - impedir ou interromper o download do corpo tão cedo quanto
        tecnicamente possível.
    - Neste contexto, `HEAD` é um **modo lógico de resposta somente por
      metadados**, podendo utilizar:
      - o método HTTP `HEAD`, quando equivalente ao fluxo `GET`;
      - uma requisição HTTP `POST` sem consumo do corpo da resposta, quando
        houver parâmetros que não possam ser expostos na URL.
    - A implementação NÃO DEVE confundir:
      - o modo declarativo `HEAD` da DSL;
      - o método HTTP `HEAD`;
      - um `GET` ou `POST` cuja resposta seja descartada somente depois de
        integralmente transferida.
    - O objetivo de consumo zero refere-se ao **corpo da resposta**; status,
      cabeçalhos e dados mínimos do protocolo continuarão necessariamente sendo
      transferidos.

  - **Sintaxe e parâmetros**
    - `HEAD` DEVE usar a mesma sintaxe de declaração, passagem, tipagem,
      validação, codificação e interpolação já definida para `GET` e `POST`.
    - NÃO DEVE ser criado um segundo formato de parâmetros.
    - Parâmetros equivalentes aos de `GET` DEVEM conservar sua representação
      atual na URL.
    - Parâmetros ocultos, sensíveis ou já normatizados como pertencentes ao
      payload de `POST` DEVEM permanecer fora da URL e ser enviados:
      - no corpo da requisição; ou
      - em headers HTTPS autorizados pelo contrato existente.
    - Dados sensíveis NÃO DEVEM ser convertidos em query string apenas para
      permitir o uso do método HTTP `HEAD`.
    - A nova opção DEVE integrar-se ao padrão linguístico já definido no RCF,
      sem criar dialeto, exceção lexical ou estrutura paralela desnecessária.

  - **Inferência do transporte**
    - O runtime DEVE ser capaz de inferir automaticamente o transporte
      apropriado a partir dos parâmetros já declarados.
    - Quando NÃO houver parâmetros ocultos, sensíveis ou exclusivos de `POST`,
      o modo `HEAD` DEVE preferir o método HTTP `HEAD`, desde que o destino o
      suporte adequadamente.
    - Quando houver qualquer parâmetro já classificado pelo contrato atual como
      oculto ou pertencente ao payload de `POST`, o modo `HEAD` DEVE utilizar
      transporte HTTP `POST`.
    - A inferência DEVE reutilizar a classificação existente dos parâmetros;
      NÃO DEVE duplicar, reinterpretar nem manter uma segunda lista de
      parâmetros de `POST`.
    - Se houver mecanismo explícito já normatizado para seleção do transporte,
      ele DEVE prevalecer sobre a inferência automática.
    - Ambiguidades NÃO DEVEM resultar em exposição de parâmetros sensíveis na
      URL; na dúvida, preservar o transporte seguro equivalente a `POST`.
    - A decisão inferida DEVE permanecer determinística, testável e disponível
      ao diagnóstico sem expor valores sensíveis.

  - **Fluxo equivalente a `GET`**
    - Quando o modo `HEAD` for compatível com `GET`, priorizar o método HTTP
      `HEAD`, pois ele solicita os mesmos metadados que um `GET` correspondente
      sem transferência do corpo.
    - A URL, query string, headers, credenciais, política de redirecionamento,
      cache, timeout e demais opções DEVEM seguir os mesmos contratos do `GET`
      já implementado.
    - Caso o servidor não suporte corretamente o método HTTP `HEAD`, qualquer
      fallback DEVE:
      - ser explicitamente normatizado;
      - preservar segurança e semântica;
      - evitar download integral do corpo;
      - não ocorrer silenciosamente quando puder alterar o resultado.
    - A implementação NÃO DEVE presumir que todo servidor trata `HEAD` de forma
      idêntica a `GET`; diferenças relevantes DEVEM ser detectadas ou
      diagnosticadas conforme os mecanismos existentes.

  - **Fluxo equivalente a `POST`**
    - Quando houver parâmetros ocultos ou payload próprio de `POST`, a
      requisição DEVE utilizar HTTP `POST`, preservando exatamente a sintaxe e
      o processamento já adotados pelo modo `POST`.
    - O servidor ou adaptador correspondente DEVE, preferencialmente, responder
      sem corpo, utilizando:
      - `204 No Content`; ou
      - outro status semanticamente necessário que garanta corpo ausente ou
        comprimento zero.
    - A resposta PODE conter todos os headers necessários à DSL, inclusive
      metadados customizados autorizados pelo contrato.
    - O uso de `204` NÃO DEVE ser imposto quando outro status for necessário
      para representar corretamente sucesso, redirecionamento, autenticação,
      validação ou erro; contudo, o corpo ainda DEVE permanecer ausente sempre
      que o endpoint suportar o contrato `HEAD` lógico.
    - A biblioteca client-side NÃO DEVE baixar o corpo integral para somente
      depois descartá-lo.

  - **Implementação client-side**
    - Priorizar, nesta ordem:
      1. método HTTP `HEAD`, para requisições equivalentes a `GET`;
      2. endpoint `POST` que responda deliberadamente sem corpo;
      3. mecanismo nativo que permita cancelar ou descartar o stream antes de
         sua leitura;
      4. `Fetch API` com `AbortController`, somente quando não houver solução
         mais eficiente ou semanticamente correta.
    - Com `Fetch API`, os headers ficam disponíveis quando a Promise da
      requisição é resolvida; o corpo NÃO DEVE ser lido por:
      - `.text()`;
      - `.json()`;
      - `.blob()`;
      - `.arrayBuffer()`;
      - leitor integral equivalente.
    - Após a obtenção dos headers, a implementação DEVE cancelar imediatamente
      o corpo ou a conexão pelo mecanismo mais adequado disponível, incluindo,
      conforme compatibilidade:
      - cancelamento de `response.body`;
      - `AbortController`;
      - combinação segura de ambos.
    - O cancelamento DEVE ocorrer uma única vez e integrar-se ao timeout,
      encerramento e tratamento de erros já existentes.
    - `AbortController` NÃO DEVE transformar uma resposta válida, cujos headers
      já foram obtidos, em falha indevida da operação lógica.
    - Como navegador, rede, proxy ou servidor PODEM transferir ou armazenar
      antecipadamente parte do corpo antes do cancelamento, esse fallback NÃO
      DEVE ser documentado como garantia física absoluta de zero bytes.
    - A garantia estrita de corpo não transferido DEVE depender de método
      HTTP `HEAD` ou resposta backend deliberadamente sem conteúdo.
    - O fallback client-side DEVE assegurar, no mínimo:
      - nenhuma leitura intencional do corpo;
      - cancelamento tão cedo quanto possível;
      - ausência de retenção do payload em memória;
      - ausência de processamento, desserialização ou exposição do corpo.

  - **Retorno à DSL**
    - O modo `HEAD` DEVE disponibilizar apenas os metadados autorizados pelo
      modelo atual, incluindo, conforme já suportado ou normatizado:
      - status HTTP;
      - texto ou categoria do status;
      - headers;
      - URL final;
      - redirecionamento;
      - tipo de conteúdo declarado;
      - comprimento declarado;
      - informações de cache;
      - demais metadados permitidos.
    - O body DEVE ser:
      - ausente;
      - inacessível;
      - não iterável;
      - não desserializado;
      - não convertido implicitamente em string, objeto ou valor padrão.
    - Qualquer propriedade de body já existente DEVE retornar o estado
      normatizado para ausência, sem fabricar conteúdo vazio ambíguo.
    - Para efeito e contexto deste projeto, e deste TO-DO, o cabecalho objtido é o conteudo legítimo e real a ser considerado como retorno no lugar do body.
    - Mesmo o cabeçalho http nao atendendo ao formato json, XML e yml, excepcionalmente ele, deve ser tratado e indexado corretamente, como equivalente (se for possível, e tecnicamente conveniente, faça a conversão/absorção dele, para e como json, diretamente), e isso deve ser feito de forma blindada e resiliente a falhas, erros de sintaxes, ausências ou o adequações.
    - A diferença entre:
      - corpo inexistente;
      - corpo não solicitado;
      - corpo cancelado;
      - corpo bloqueado;
      - erro antes dos headers
      DEVE ser representada somente quando essa distinção for útil e compatível
      com o modelo de resultados existente.

  - **Erros e diagnóstico**
    - Preservar os códigos, categorias e estruturas de erro atuais.
    - Adicionar somente diagnósticos indispensáveis ao novo modo, como:
      - método `HEAD` não suportado;
      - endpoint `POST` incompatível com resposta sem corpo;
      - falha antes da obtenção dos headers;
      - cancelamento prematuro;
      - tentativa indevida de leitura do body;
      - impossibilidade de inferir transporte com segurança.
    - Respostas HTTP de erro ainda DEVEM disponibilizar status e headers quando
      recebidos, mesmo sem leitura do corpo.
    - A ausência deliberada de body NÃO DEVE ser tratada como erro.
    - O cancelamento intencional após a leitura dos headers NÃO DEVE produzir
      exceção não tratada, log enganoso ou rejeição indevida da operação.
    - Valores sensíveis enviados por `POST` ou headers NÃO DEVEM aparecer em
      logs, mensagens, URLs, caches, diagnósticos ou relatórios.

  - **Segurança e compatibilidade**
    - Manter HTTPS, CORS, CSP, credenciais, autenticação, redirects e demais
      políticas conforme a implementação e o RCF existentes.
    - O novo modo NÃO DEVE contornar restrições do navegador nem presumir acesso
      a headers não expostos por CORS.
    - Headers protegidos ou indisponíveis ao JavaScript NÃO DEVEM ser simulados
      ou inferidos.
    - O cancelamento do body NÃO DEVE ser utilizado para contornar controles de
      acesso, autenticação, validação ou limites do servidor.
    - `HEAD` NÃO DEVE permitir envio de parâmetros ocultos por URL.
    - A implementação DEVE preservar ambientes que não utilizem navegador,
      adaptando o transporte aos recursos nativos disponíveis sem alterar a
      semântica normativa.
    - Nenhum polyfill ou dependência externa DEVE ser incorporado quando APIs
      nativas ou mecanismos já existentes no projeto forem suficientes.

  - **Backend e interoperabilidade**
    - Documentar o contrato recomendado para endpoints compatíveis com
      `HEAD` lógico via `POST`.
    - O endpoint DEVE:
      - aceitar o mesmo payload esperado pelo `POST` correspondente;
      - executar somente o processamento necessário à produção dos metadados;
      - evitar gerar, serializar ou transmitir um body desnecessário;
      - retornar headers suficientes para o caso de uso;
      - preferir `204 No Content` quando semanticamente adequado.
    - A rota NÃO DEVE exigir que dados sensíveis sejam movidos para a URL.
    - Quando o backend não puder ser alterado, o client-side PODE aplicar o
      cancelamento antecipado, observadas as limitações normatizadas.
    - A DSL NÃO DEVE presumir que todo endpoint `POST` existente suporta o modo
      sem corpo; a capacidade DEVE ser conhecida, declarada ou tratada de modo
      seguro.

  - **Documentação e RCF**
    - Atualizar o RCF, a documentação da pseudo query string e os exemplos
      aplicáveis para definir:
      - semântica do modo `HEAD`;
      - diferença entre modo lógico e método HTTP;
      - sintaxe;
      - inferência `GET`/`POST`;
      - parâmetros ocultos;
      - retorno disponível;
      - ausência do body;
      - cancelamento;
      - limitações client-side;
      - contrato backend;
      - erros;
      - segurança.
    - Os exemplos DEVEM incluir:
      - `HEAD` sem parâmetros;
      - `HEAD` com parâmetros equivalentes a `GET`;
      - `HEAD` com parâmetros ocultos inferindo `POST`;
      - `POST` com resposta `204`;
      - leitura de headers;
      - erro HTTP com headers disponíveis;
      - fallback com cancelamento antecipado.
    - Os exemplos NÃO DEVEM afirmar consumo físico zero quando dependerem
      exclusivamente de cancelamento client-side.
    - A norma DEVE deixar inequívoco que o objetivo principal é eliminar a
      transferência e o processamento do corpo, preservando os metadados.

  - **Validação e aceite**
    - Confirmar por testes que:
      - `GET` e `POST` existentes permanecem inalterados;
      - `HEAD` é reconhecido pela gramática e pelo runtime;
      - a sintaxe de parâmetros permanece idêntica à existente;
      - ausência de parâmetros ocultos seleciona o fluxo equivalente a `GET`;
      - presença de parâmetros ocultos seleciona o fluxo equivalente a `POST`;
      - parâmetros sensíveis nunca são movidos para a URL;
      - o método HTTP `HEAD` não lê nem disponibiliza body;
      - o `POST` compatível com `204` retorna headers sem body;
      - status distintos de `204` continuam suportados quando respondem sem
        corpo;
      - fallback client-side não chama métodos de leitura integral do body;
      - cancelamento ocorre imediatamente após a obtenção dos headers;
      - cancelamento intencional não transforma sucesso em erro;
      - timeout e cancelamento permanecem determinísticos;
      - respostas de erro preservam status e headers;
      - CORS e headers protegidos continuam respeitados;
      - nenhuma dependência externa desnecessária é adicionada;
      - ambientes não client-side mantêm semântica equivalente;
      - documentação e RCF refletem exatamente o comportamento implementado.

- [ ] **Aprimorar o mecanismo de pesquisa da pseudo query string para
  suportar correspondência literal, correspondência isolada semelhante a
  `querySelectorAll`, expressões regulares, negação uniforme e projeção reversa
  de propriedades**, preservando a lógica de comparação de parâmetros, a
  sintaxe, a arquitetura, a segurança, a compatibilidade e os contratos já
  definidos no RCF.

  - **Escopo e preservação**
    - Tratar esta tarefa como evolução cirúrgica da biblioteca de query já
      implementada, NÃO como reescrita ou criação de mecanismo paralelo.
    - Inspecionar antes de alterar:
      - RCF;
      - gramática e parser da pseudo query string;
      - modelo interno de query;
      - operadores e comparadores existentes;
      - resolução de parâmetros;
      - percurso de estruturas;
      - normalização de JSON, YAML e XML;
      - retorno de nós, itens, tags, atributos, propriedades e valores;
      - tratamento de erros, limites, segurança, testes e documentação.
    - Preservar integralmente:
      - comparações de parâmetros já implementadas;
      - sintaxes válidas;
      - semântica atual;
      - ordenação e cardinalidade dos resultados;
      - compatibilidade retroativa;
      - regras de tipagem, coerção e normalização já normatizadas.
    - Os novos modos de correspondência DEVEM complementar os comparadores
      existentes, sem alterar silenciosamente seu significado.
    - A implementação DEVE permanecer adequada a estruturas extensas, densas,
      profundamente aninhadas e heterogêneas em JSON, YAML e XML.

  - **Separação entre seleção, correspondência e projeção**
    - Formalizar três etapas independentes e combináveis:
      1. **seleção**: determina quais nós, tags, objetos, itens, propriedades,
         atributos ou valores serão examinados;
      2. **correspondência**: determina como o critério será comparado ao
         conteúdo examinado;
      3. **projeção**: determina qual parte do elemento correspondente será
         devolvida.
    - Essa separação DEVE permitir combinar qualquer modo de correspondência
      compatível com:
      - comparadores existentes;
      - negação;
      - seleção por propriedade;
      - seleção por valor;
      - retorno do próprio item;
      - retorno de uma propriedade específica.
    - A sintaxe final DEVE permanecer coerente com a pseudo-linguagem atual e
      evitar construções distintas para operações semanticamente equivalentes.

  - **Modos de correspondência**
    - Implementar, no mínimo, três modos explicitamente distinguíveis:
      1. **literal parcial**;
      2. **isolado ou tokenizado**;
      3. **expressão regular**.
    - O modo utilizado DEVE ser determinístico e identificável pela sintaxe;
      NÃO DEVE depender de heurística ambígua sobre o conteúdo pesquisado.
    - Quando nenhuma notação especial for usada, preservar o comportamento
      atual ou o modo padrão já normatizado, evitando regressão.
    - Caso o comportamento atual não esteja formalmente definido, documentá-lo
      antes de introduzir os novos modos.

  - **Correspondência literal parcial**
    - Disponibilizar busca literal por sequência de caracteres, equivalente a
      uma procura direta de substring.
    - Nesse modo, o termo pesquisado PODE corresponder a parte de um conteúdo
      maior.
    - Exemplo semântico:

      ```text
      lume
      ```

      PODE corresponder a:

      ```text
      vagalume
      ```

    - A busca literal:
      - NÃO DEVE interpretar metacaracteres de regex;
      - NÃO DEVE exigir limites de palavra ou token;
      - DEVE preservar as regras atuais de case sensitivity, normalização,
        codificação e coerção, salvo alteração explicitamente normatizada;
      - DEVE tratar o termo como conteúdo literal, ainda que contenha
        caracteres especiais.
    - O nome normativo preferencial DEVE ser `literal`, `substring` ou
      equivalente inequívoco; expressões informais como “busca burra” ou
      “busca crua” PODEM ser usadas apenas para explicação, NÃO como
      terminologia técnica principal.

  - **Correspondência isolada ou tokenizada**
    - Implementar busca semanticamente semelhante à resolução de seletores do
      `querySelectorAll`, na qual o termo DEVE constituir unidade isolada e não
      mera subsequência de caracteres.
    - O mecanismo DEVE distinguir, por exemplo:

      ```html
      class="lume"
      class="botao lume ativo"
      class="vagalume"
      ```

    - Uma pesquisa equivalente a:

      ```js
      $(".lume")
      ```

      DEVE corresponder às classes `lume` isoladas e NÃO DEVE corresponder a
      `vagalume`.
    - A noção de isolamento DEVE respeitar o tipo do conteúdo:
      - listas de classes ou tokens DEVEM ser comparadas por membro;
      - nomes de propriedades, atributos e tags DEVEM ser comparados como
        identificadores completos;
      - listas normalizadas DEVEM ser comparadas por item;
      - strings comuns DEVEM utilizar limites ou delimitadores definidos pelo
        contrato, sem tratar arbitrariamente qualquer mudança de caractere como
        separação.
    - A implementação NÃO DEVE aplicar uma regra única de “palavra” que produza
      resultados incorretos em identificadores, caminhos, classes, números,
      símbolos ou conteúdos Unicode.
    - Delimitadores, normalização e limites DEVEM ser definidos de forma
      verificável no RCF.
    - Quando o campo possuir semântica própria já conhecida, como `class` no
      modelo XML/HTML, essa semântica DEVE prevalecer sobre tokenização genérica.
    - O nome normativo preferencial DEVE ser `token`, `isolated`, `exact-token`
      ou equivalente inequívoco.

  - **Correspondência por expressão regular**
    - Implementar pesquisa por expressão regular utilizando, tanto quanto
      possível, a implementação nativa do ambiente de execução.
    - A notação DEVE permitir informar:
      - padrão;
      - flags suportadas;
      - aplicação positiva ou negativa;
      - campo ou conteúdo ao qual a regex será aplicada.
    - A regex DEVE operar somente sobre o valor selecionado, sem receber acesso
      irrestrito à estrutura, ao runtime ou a dados fora do escopo da query.
    - Padrões inválidos DEVEM produzir erro determinístico antes da execução
      integral da pesquisa.
    - Flags não suportadas DEVEM ser rejeitadas; NÃO DEVEM ser ignoradas
      silenciosamente.
    - A biblioteca NÃO DEVE implementar dialeto próprio quando a regex nativa
      for suficiente.
    - Diferenças inevitáveis entre ambientes DEVEM ser:
      - normatizadas;
      - detectáveis;
      - documentadas;
      - cobertas por testes.
    - Limites existentes de tempo, profundidade, tamanho e processamento DEVEM
      alcançar regexes.
    - A implementação DEVE evitar que expressões excessivamente custosas
      bloqueiem indefinidamente o runtime, especialmente no client-side.
    - Nenhuma dependência externa DEVE ser adicionada quando a regex nativa e
      os controles existentes forem suficientes.

  - **Negação uniforme**
    - Todos os modelos de pesquisa e comparação DEVEM aceitar negação
      explícita.
    - A negação DEVE ser aplicável, no mínimo, a:
      - comparação de parâmetros já existente;
      - correspondência literal;
      - correspondência isolada;
      - regex;
      - existência de propriedade;
      - existência de atributo;
      - correspondência de valor;
      - correspondência de nome;
      - combinações compostas suportadas.
    - A negação DEVE representar a oposição lógica do predicado completo, e não
      apenas inversão parcial de um operador interno.
    - Exemplo semântico:

      ```text
      NÃO corresponde literalmente a "lume"
      NÃO contém o token "lume"
      NÃO corresponde à regex fornecida
      NÃO possui a propriedade informada
      ```

    - A sintaxe DEVE reutilizar o operador lógico de negação já adotado pela
      pseudo-linguagem, quando existente.
    - NÃO DEVE ser criado operador distinto para cada modo de correspondência.
    - A precedência da negação em consultas compostas DEVE ser inequívoca e
      documentada.
    - A negação NÃO DEVE fazer com que elementos sem o campo pesquisado sejam
      incluídos ou excluídos ambiguamente; a relação entre:
      - campo ausente;
      - campo presente com valor nulo;
      - campo presente com valor vazio;
      - campo presente sem correspondência
      DEVE seguir o modelo já existente ou ser explicitamente normatizada.

  - **Pesquisa por propriedade para obtenção do item**
    - Preservar o fluxo já esperado em que a query pesquisa:
      - atributo;
      - propriedade;
      - chave;
      - campo;
      - parâmetro;
      - valor associado;
      com o objetivo de localizar e retornar a tag, objeto, nó ou item que o
      contém.
    - Os novos modos de correspondência DEVEM poder ser aplicados tanto ao nome
      quanto ao valor da propriedade, conforme indicado pela sintaxe.
    - A implementação NÃO DEVE assumir que toda pesquisa por propriedade deseja
      retornar diretamente o valor dessa propriedade.

  - **Pesquisa por valor com projeção de propriedade**
    - Implementar o fluxo inverso: localizar uma tag, objeto, nó ou item por um
      valor e, a partir do elemento correspondente, devolver o valor de uma
      propriedade, atributo ou campo cujo nome seja informado pela query.
    - A pseudo query string DEVE oferecer notação explícita para separar:
      - o critério usado para localizar o elemento;
      - o nome da propriedade cujo valor deverá ser retornado.
    - Exemplo semântico:

      ```text
      localizar item cujo valor corresponda a X
      retornar a propriedade Y desse item
      ```

    - A projeção NÃO DEVE alterar o predicado de pesquisa.
    - O nome da propriedade projetada DEVE ser tratado como identificador, e não
      como valor de busca, salvo indicação explícita em contrário.
    - A projeção DEVE ser aplicável após:
      - comparação existente;
      - busca literal;
      - busca isolada;
      - regex;
      - negação;
      - composição de critérios.
    - A solução DEVE funcionar, conforme o modelo de dados:
      - para propriedades de objetos JSON;
      - para chaves de mapas YAML;
      - para atributos ou propriedades normalizadas de elementos XML;
      - para demais estruturas já representadas pela abstração interna.
    - A nomenclatura externa PODE usar `property`, `attribute`, `field` ou
      equivalente, mas o modelo interno DEVE possuir conceito unificado e
      mapeamento específico para cada formato.

  - **Resultado da projeção**
    - A query DEVE conseguir distinguir explicitamente entre retorno de:
      - nó, tag, objeto ou item correspondente;
      - valor que produziu a correspondência;
      - nome da propriedade correspondente;
      - valor de uma propriedade indicada;
      - coleção de resultados, quando houver múltiplas correspondências.
    - A projeção de uma propriedade inexistente DEVE seguir comportamento
      determinístico, compatível com o sistema atual de ausência, nulidade ou
      erro.
    - A implementação NÃO DEVE fabricar string vazia, `null`, `undefined` ou
      coleção vazia sem que o significado correspondente esteja normatizado.
    - Quando múltiplos elementos corresponderem, a propriedade DEVE ser
      projetada de cada resultado na mesma ordem em que os elementos seriam
      retornados pela pesquisa normal.
    - Valores repetidos NÃO DEVEM ser eliminados automaticamente, salvo opção
      de unicidade já existente ou explicitamente solicitada.
    - A projeção NÃO DEVE mutar os elementos pesquisados.

  - **Nomes, valores e direções de pesquisa**
    - Formalizar as possíveis direções, incluindo:
      - nome → item;
      - valor → item;
      - nome e valor → item;
      - item correspondente → valor;
      - item correspondente → propriedade indicada;
      - item correspondente → nome da propriedade;
      - item correspondente → valor da propriedade indicada.
    - As direções DEVEM ser combináveis com os modos de correspondência sem
      multiplicar sintaxes redundantes.
    - Quando a consulta puder ser interpretada como pesquisa de nome ou de
      valor, a sintaxe DEVE exigir indicação suficiente para eliminar a
      ambiguidade.
    - O parser NÃO DEVE inferir silenciosamente uma direção que possa alterar o
      conjunto ou o tipo do resultado.

  - **Composição com comparadores existentes**
    - Os modos de correspondência DEVEM integrar-se à lógica atual de
      comparação de parâmetros.
    - Comparadores numéricos, booleanos, de igualdade, desigualdade, ordem,
      existência ou demais operadores já implementados DEVEM continuar
      operando sobre seus tipos apropriados.
    - Busca literal, isolada e regex DEVEM ser aplicadas prioritariamente a
      conteúdos textuais ou representações explicitamente permitidas.
    - Coerções entre string, número, booleano, data, nulo, coleção ou objeto NÃO
      DEVEM ser introduzidas implicitamente apenas para viabilizar um modo de
      busca.
    - Quando uma combinação não possuir semântica válida, o analisador DEVE
      rejeitá-la com diagnóstico claro, em vez de produzir resultado
      aproximado.
    - Operações compostas DEVEM respeitar os operadores lógicos e precedências
      já definidos no RCF.

  - **Percurso de JSON, YAML e XML**
    - A pesquisa DEVE operar sobre a abstração de dados já existente,
      preservando as diferenças semânticas indispensáveis entre os formatos.
    - JSON e YAML DEVEM tratar adequadamente:
      - objetos ou mapas;
      - propriedades ou chaves;
      - arrays ou sequências;
      - escalares;
      - valores nulos;
      - estruturas aninhadas.
    - XML DEVE tratar adequadamente:
      - elementos;
      - nomes de tags;
      - atributos;
      - valores de atributos;
      - texto;
      - filhos;
      - nós repetidos;
      - namespaces, quando já suportados.
    - A implementação NÃO DEVE achatar estruturas de modo que:
      - nomes se confundam com valores;
      - atributos se confundam com filhos;
      - arrays percam cardinalidade;
      - caminhos distintos se tornem indistinguíveis.
    - A busca em estruturas densas DEVE preservar:
      - caminho;
      - origem;
      - ordem;
      - profundidade;
      - elemento proprietário;
      - relação entre propriedade e valor.
    - A projeção reversa DEVE recuperar a propriedade do elemento correto, e não
      outra propriedade homônima existente em ancestral, descendente ou irmão,
      salvo quando o escopo da query determinar expressamente essa travessia.

  - **Sintaxe**
    - Definir uma notação concisa, inequívoca e aderente ao padrão já usado pela
      pseudo query string para indicar:
      - modo literal;
      - modo isolado;
      - modo regex;
      - negação;
      - origem da correspondência;
      - propriedade pesquisada;
      - valor pesquisado;
      - propriedade projetada;
      - tipo de resultado desejado.
    - A sintaxe DEVE separar predicado e projeção, evitando sobrecarregar o mesmo
      token com ambos os significados.
    - Priorizar operadores, prefixos, sufixos ou funções já existentes na
      pseudo-linguagem.
    - NÃO inventar notação inspirada em CSS, XPath, JSONPath, jq ou regex quando
      ela conflitar com a gramática ou com decisões já normatizadas.
    - Padrões consolidados PODEM ser reutilizados quando:
      - reduzirem ambiguidade;
      - forem compatíveis com a linguagem atual;
      - não exigirem implementação desproporcional;
      - não alterarem o significado de consultas existentes.
    - A sintaxe definitiva DEVE ser normatizada no RCF antes de ser considerada
      estável.
    - Exemplos conceituais deste TODO NÃO DEVEM ser tratados como imposição da
      forma lexical final.

  - **Desempenho e resiliência**
    - Evitar múltiplos percursos integrais da mesma estrutura quando seleção,
      correspondência, negação e projeção puderem ser resolvidas no mesmo
      percurso.
    - A busca isolada NÃO DEVE tokenizar repetidamente o mesmo valor quando
      houver forma segura de reutilizar o resultado dentro da mesma operação.
    - Regexes DEVEM ser compiladas uma única vez por query, e não para cada
      elemento examinado.
    - A projeção DEVE ocorrer somente após a confirmação do predicado.
    - O mecanismo DEVE preservar os limites existentes de:
      - profundidade;
      - quantidade de resultados;
      - tamanho de entrada;
      - tempo;
      - cancelamento;
      - memória.
    - Otimizações NÃO DEVEM:
      - alterar a ordem;
      - omitir correspondências;
      - compartilhar estado incorreto entre consultas;
      - produzir diferenças semânticas entre estruturas equivalentes.
    - Nenhum índice persistente ou cache global DEVE ser introduzido sem
      necessidade demonstrada e regras claras de invalidação.

  - **Erros e diagnósticos**
    - Adicionar somente diagnósticos necessários, incluindo:
      - modo de correspondência inválido;
      - regex inválida;
      - flag não suportada;
      - negação em contexto incompatível;
      - projeção ausente ou ambígua;
      - propriedade projetada inválida;
      - combinação de tipo e operador incompatível;
      - direção de pesquisa indeterminável;
      - limite de processamento excedido.
    - O diagnóstico DEVE identificar:
      - trecho da query;
      - modo;
      - operação;
      - causa;
      - posição, quando disponível.
    - A ausência normal de correspondências NÃO DEVE ser tratada como erro.
    - A ausência da propriedade projetada DEVE seguir política explicitamente
      definida, distinta de erro de sintaxe ou falha de execução.
    - Regex e valores pesquisados NÃO DEVEM ser executados como código.

  - **Documentação e RCF**
    - Atualizar o RCF, a documentação e os exemplos aplicáveis para normatizar:
      - seleção;
      - correspondência;
      - projeção;
      - literal parcial;
      - token isolado;
      - regex;
      - negação;
      - pesquisa por nome;
      - pesquisa por valor;
      - projeção de propriedade;
      - cardinalidade;
      - ausência;
      - erros;
      - desempenho;
      - comportamento em JSON, YAML e XML.
    - Incluir tabela comparativa equivalente a:

      | Modo | Critério `lume` | `lume` | `vagalume` | `botao lume ativo` |
      |---|---|---:|---:|---:|
      | Literal parcial | substring | corresponde | corresponde | corresponde |
      | Isolado/token | unidade completa | corresponde | não corresponde | corresponde |
      | Regex | padrão informado | depende da regex | depende da regex | depende da regex |

    - Incluir exemplos de:
      - correspondência literal;
      - classe isolada;
      - nome completo de propriedade;
      - regex com flags;
      - negação de cada modo;
      - localização por atributo;
      - localização por valor;
      - retorno do item;
      - retorno de propriedade indicada;
      - propriedade ausente;
      - múltiplas correspondências;
      - estruturas aninhadas JSON;
      - mapas e sequências YAML;
      - tags, atributos e texto XML.
    - Incluir contraexemplos de:
      - substring usada indevidamente como token;
      - regex interpretada como literal;
      - negação ambígua;
      - projeção confundida com predicado;
      - propriedade recuperada do nó errado;
      - coerção implícita incompatível.
    - A documentação NÃO DEVE afirmar que todas as possibilidades de pesquisa
      estão definitivamente esgotadas; DEVE registrar que esses recursos
      completam o conjunto atualmente identificado e exigir análise de lacunas
      diante de novos modelos de dados ou requisitos.

  - **Validação e aceite**
    - Confirmar por testes que:
      - consultas existentes permanecem inalteradas;
      - comparadores atuais continuam funcionando;
      - `lume` em modo literal corresponde a `vagalume`;
      - `lume` em modo isolado NÃO corresponde a `vagalume`;
      - `lume` em modo isolado corresponde ao token em
        `botao lume ativo`;
      - nomes de propriedades são comparados integralmente no modo isolado;
      - regex nativa funciona com padrões e flags suportados;
      - regex inválida falha antes do percurso integral;
      - cada modo aceita negação;
      - a negação inverte o predicado completo;
      - campo ausente, nulo, vazio e não correspondente permanecem
        distinguíveis conforme o RCF;
      - a pesquisa por propriedade retorna o item correto;
      - a pesquisa por valor pode retornar uma propriedade nomeada;
      - predicado e projeção permanecem independentes;
      - projeção ausente segue política determinística;
      - múltiplos resultados preservam ordem e cardinalidade;
      - valores repetidos não são removidos indevidamente;
      - propriedades homônimas em níveis diferentes não são confundidas;
      - objetos e arrays JSON são percorridos corretamente;
      - mapas e sequências YAML são percorridos corretamente;
      - tags, atributos e textos XML permanecem semanticamente distintos;
      - regex é compilada uma única vez por query;
      - seleção, correspondência e projeção não exigem percursos redundantes
        evitáveis;
      - limites de profundidade, tamanho, tempo, memória e cancelamento continuam
        aplicados;
      - a sintaxe está integralmente normatizada;
      - documentação e implementação descrevem o mesmo comportamento;
      - o mecanismo atende às formas de pesquisa atualmente identificadas em
        estruturas densas JSON, YAML e XML sem declarar completude absoluta
        não demonstrada.
