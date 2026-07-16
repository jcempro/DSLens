# Sub-RCF — PowerShell

## 1. Escopo e precedência

Este arquivo especializa `../../RCF.md` para `./src/ps/dsl.ps1`. O RCF global prevalece. A implementação existente DEVE ser atualizada até plena conformidade, preservando compatibilidade pública válida e correções defensivas.

## 2. Runtime e superfície pública

O binding PowerShell DEVE suportar Windows PowerShell 5.1 e PowerShell 7.4 ou superior enquanto esses runtimes permanecerem declarados. Superfície pública: `has_parser_expression` (`detect`), `resolve_dsl_data` (`resolveData`), `resolve_parser_expression` (`resolveSource`) e `main`; execução direta PODE receber o primeiro argumento ou `DSL_INPUT`; dot-source NÃO DEVE autoexecutar.

`resolve_parser_expression` DEVE permanecer síncrona e fail-safe. Callback opcional DEVE receber `($msg, $type)`. `main` DEVE serializar execução por mutex, reiniciar o relógio global da demanda e liberar recurso mesmo em falha.

## 3. Comportamento preservado

O perfil atual DEVE preservar: aspas simples ou duplas; URL HTTP(S); GET; tentativas por `Invoke-RestMethod`, `Invoke-WebRequest` e `WebClient`; JSON, XML e YAML condicionado a `ConvertFrom-Yaml`; campo, índice base zero e filtro textual exato; conversão final para `[string]`; retorno `$null` em falha; cache em memória por URL e path com TTL de 60 s; rejeição de múltiplas expressões e resultado aninhado.

Defaults legados comprovados: profundidade 5, chaining 3, execução 90 s, rede 30 s, demanda DSL 45 s, global 300 s, cache máximo declarado 512, três tentativas, backoff declarado 200–2000 ms e espera de mutex 5 s. Constante declarada mas não aplicada integralmente DEVE ser tratada como divergência, não como comportamento garantido.

## 4. Especificidades e divergências

TLS, `ExecutionPolicy`, mutex global Windows, tipos XML do .NET e estratégias de fetch são detalhes do binding e NÃO DEVEM contaminar o contrato comum.

O código declara crases, fonte inline/arquivo, opções, `.find`, wildcard, preservação de texto externo, profundidade/chain efetivos e cache máximo, mas não os implementa integralmente. O timeout de fetch usa 15 s por tentativa; `MAX_NETWORK_TIMEOUT`, `MAX_EXECUTION_TIMEOUT`, códigos de erro, limites de backoff e `CACHE_MAX_ENTRIES` não governam todos os caminhos. Testes atuais dependem de rede e validam principalmente URL resultante. Essas diferenças DEVEM ser corrigidas ou removidas da superfície declarada conforme o perfil canônico e DEVEM ser cobertas por testes offline comuns.

## 5. Empacotamento e documentação

Distribuição PowerShell PODE oferecer script autossuficiente e módulo, desde que ambos preservem a mesma API. Função pública e interna DEVE receber comment-based help sucinto quando a implementação for autorizada. Artefato DEVE preservar banner MPL-2.0 e origem comprovada.

## 6. Validação futura

Validação DEVE executar em PowerShell 5.1 e 7.4+, sem rede para vetores canônicos e com servidor local controlado para fetch. Ela DEVE cobrir importação, execução direta, `DSL_INPUT`, callback, cache positivo/negativo, TTL, mutex, limites, JSON/XML/YAML disponível e indisponível, erros normalizados e ausência de exceção.
