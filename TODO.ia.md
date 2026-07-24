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
```
