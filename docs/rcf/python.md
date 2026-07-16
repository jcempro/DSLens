# Sub-RCF — Python

## 1. Escopo e precedência

Este arquivo especializa `../../RCF.md` para `./src/py/dsl.py`. O RCF global prevalece. Python DEVE constituir implementação equivalente e DEVE ser atualizado até plena conformidade, sem precedência inferior ou superior às demais linguagens.

## 2. Runtime e superfície pública

Python 3.11 ou superior DEVE ser homologado. Superfície pública inicial: `has_parser_expression`, `resolve_parser_expression` e `main`; execução direta PODE receber o primeiro argumento ou `DSL_INPUT` e importação NÃO DEVE autoexecutar.

A API DEVE permanecer síncrona e fail-safe. Callback opcional DEVE receber `(message, type)`. Função e método DEVEM possuir docstring sucinta conforme `../../RCF.md` §9.

## 3. Convergência obrigatória

A implementação atual possui cache persistente em diretório temporário, fallback por socket, dependência YAML opcional e diferenças de tokenização. Esses mecanismos NÃO DEVEM produzir semântica diferente do contrato. Cache persistente DEVE ser segregado como adaptador opcional; fallback HTTP DEVE preservar resposta completa, TLS e validação ou ser removido; YAML indisponível DEVE ser capacidade diagnosticável.

Defaults compartilhados DEVEM corresponder ao manifesto e aos vetores comuns. Resultado, erro, normalização textual, ordenação, filtros, índices, limites e rejeições DEVEM ser equivalentes a PowerShell, TypeScript e JavaScript.

## 4. Distribuição

Python DEVE poder ser usado por fonte, Git, submódulo e pacote idiomático futuro. Dependência de runtime somente DEVE existir quando necessária; YAML PODE ser extra opcional. Path DEVE partir de `__file__` ou configuração explícita, nunca do diretório corrente.

## 5. Validação

Validação DEVE executar em Python 3.11 ou superior, usar os vetores offline comuns e cobrir importação, CLI, `DSL_INPUT`, callback, cache, JSON/XML/YAML disponível e indisponível, limites, exceções isoladas e servidor HTTP local. API real DEVE permanecer perfil opt-in.
