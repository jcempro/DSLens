# Sub-RCF — Python

## 1. Escopo e precedência

Este arquivo especializa `../../RCF.md` para `./src/py/dsl.py`. O RCF global prevalece. Python DEVE constituir implementação equivalente e DEVE ser atualizado até plena conformidade, sem precedência inferior ou superior às demais linguagens.

## 2. Runtime e superfície pública

Python 3.11 ou superior DEVE ser homologado. Superfície pública: `has_parser_expression` (`detect`), `resolve_dsl_data` (`resolveData`), `resolve_parser_expression` (`resolveSource`) e `main`; execução direta PODE receber o primeiro argumento ou `DSL_INPUT` e importação NÃO DEVE autoexecutar.

A API DEVE permanecer síncrona e fail-safe. Callback opcional DEVE receber `(message, type)`. Função e método DEVEM possuir docstring sucinta conforme `../../RCF.md` §9.

O provedor `env` opcional DEVE ser mapeamento injetado em `resolve_parser_expression`; a implementação NÃO DEVE consultar `os.environ` implicitamente para resolver headers. O transporte v2 DEVE aplicar `query`, `GET`/`POST`, headers e body pelas APIs nativas de `urllib`.

## 3. Convergência obrigatória

A implementação mantém cache de sessão e dependência YAML opcional. Cache persistente e fallback socket foram removidos do núcleo para eliminar efeitos e respostas divergentes. YAML indisponível DEVE ser capacidade diagnosticável; tokenização e normalização DEVEM permanecer cobertas pelos vetores comuns.

Defaults compartilhados DEVEM corresponder ao manifesto e aos vetores comuns. Resultado, erro, normalização textual, ordenação, filtros, índices, limites e rejeições DEVEM ser equivalentes a PowerShell, TypeScript e JavaScript.

## 4. Distribuição

Python DEVE poder ser usado por fonte, Git, submódulo e pacote idiomático futuro. Dependência de runtime somente DEVE existir quando necessária; YAML PODE ser extra opcional. Path DEVE partir de `__file__` ou configuração explícita, nunca do diretório corrente.

## 5. Validação

Validação DEVE executar em Python 3.11 ou superior, usar os vetores offline comuns e cobrir importação, CLI, `DSL_INPUT`, callback, cache, JSON/XML/YAML disponível e indisponível, limites, exceções isoladas e servidor HTTP local. API real DEVE permanecer perfil opt-in.
