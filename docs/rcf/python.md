# Sub-RCF — Python

## 1. Escopo e precedência

Este arquivo especializa `../../RCF.md` para `./src/py/dsl.py`. O RCF global prevalece. Python DEVE constituir implementação equivalente e DEVE ser atualizado até plena conformidade, sem precedência inferior ou superior às demais linguagens.

## 2. Runtime e superfície pública

Python 3.11 ou superior DEVE ser homologado. Superfície canônica: `hasParserExpression(source: str)`, `resolveDslData(data: Any, path: str, callback: Callable | None)` e `resolveParserExpression(source: str, options: Mapping | None, callback: Callable | None)`. `has_parser_expression`, `resolve_dsl_data` e `resolve_parser_expression` DEVEM permanecer aliases legados compatíveis; `main` e execução direta PODEM receber o primeiro argumento ou `DSL_INPUT`, e importação NÃO DEVE autoexecutar.

A API DEVE permanecer síncrona e fail-safe. Callback opcional DEVE receber `(message, type)`. Função e método DEVEM possuir docstring sucinta conforme `../../RCF.md` §9.

O provedor `env` opcional DEVE ser mapeamento injetado em `resolve_parser_expression`; a implementação NÃO DEVE consultar `os.environ` implicitamente para resolver headers. O transporte v2 DEVE aplicar `query`, `GET`/`POST`, headers e body pelas APIs nativas de `urllib`.

Perfil v3 DEVE implementar parser e AST próprios para os seletores do RCF global §5.1.1. Expressões de filtro NÃO PODEM usar `eval`, `ast.literal_eval` sobre expressão composta, XPath externo ou acesso a atributo Python. A seleção em mapas DEVE usar somente chaves próprias; objeto Python arbitrário não deve expor métodos, descriptors ou atributos herdados como dados.

## 3. Convergência obrigatória

A implementação mantém cache de sessão e dependência YAML opcional. Cache persistente e fallback socket foram removidos do núcleo para eliminar efeitos e respostas divergentes. YAML indisponível DEVE ser capacidade diagnosticável; tokenização e normalização DEVEM permanecer cobertas pelos vetores comuns.

Defaults compartilhados DEVEM corresponder ao manifesto e aos vetores comuns. Resultado, erro, normalização textual, ordenação, filtros, índices, limites e rejeições DEVEM ser equivalentes a PowerShell, TypeScript e JavaScript.

XML v3 DEVE usar `xml.etree.ElementTree` ou parser seguro equivalente com rejeição prévia de `<!DOCTYPE`. Elementos, atributos, texto e nomes expandidos `{uri}local` DEVEM ser preservados. XPath arbitrário por `find`, `findall` ou predicado fornecido pelo usuário é proibido; somente os passos compilados da DSLens podem selecionar nós.

## 4. Distribuição

Python DEVE poder ser usado por fonte, Git, submódulo e pacote idiomático futuro. Dependência de runtime somente DEVE existir quando necessária; YAML PODE ser extra opcional. Path DEVE partir de `__file__` ou configuração explícita, nunca do diretório corrente.

## 5. Validação

Validação DEVE executar em Python 3.11 ou superior, usar os vetores offline comuns e cobrir importação, CLI, `DSL_INPUT`, callback, cache, JSON/XML/YAML disponível e indisponível, limites, exceções isoladas e servidor HTTP local. API real DEVE permanecer perfil opt-in.
