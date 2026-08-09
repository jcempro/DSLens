# Contexto-mestre — plugin browser documental DSLens

- identidade: `CTX-FT-20260809-001`
- criado_em: `2026-08-09T20:04:31-03:00`
- fonte: captura histórica `b855059:.ia.rules/state/requests/FT-20260809-001/request.md`, SHA-256 `886290367e54e01bfea3dbaa8b9b4a064548ab625bc8439c9e239c3a29b36ba1`.
- objetivo: normatizar e, somente após nova autorização humana, implementar a camada browser/client-side opcional descrita na solicitação.
- FTs: `FT-20260809-001` (`implementacao_normativa`) e `FT-20260809-002` (`implementacao_codigo`).
- ordem: captura e FTs → RCF → validação/commit normativo → autorização humana → código → validação/integracão.
- arquitetura preservada: núcleo DSLens permanece responsável apenas pela DSL; o plugin depende da API pública browser e não introduz DOM, CSS ou markup no núcleo.
- restrições globais: encapsulamento explícito; texto seguro por padrão; fallback natural sem JavaScript; renderização inline; idempotência; conteúdo dinâmico; nenhum framework obrigatório; target ECMAScript anual vigente.
- aceite global: origem integral rastreável; RCF suficiente e centralizado; artefatos npm/release previstos; API e catálogo `$` determinísticos; testes funcionais, de pacote, browser e layout; documentação de uso; nenhuma publicação remota implícita.
- estado: fase normativa concluída e validada; implementação bloqueada pela autorização pós-norma.

## Subcontextos

1. `01-norma.md`: arquitetura, notação, lifecycle, renderização, utilitários, distribuição e critérios de teste.
2. `02-codigo.md`: runtime browser, funções `$`, build, exports, manifests, documentação e artefatos.
3. `03-validacao.md`: conformance, DOM dinâmico, ausência de JavaScript, pacote e medições visuais.

## Integração

A conclusão local de qualquer subcontexto não conclui o objetivo global. Mudança de escopo deve atualizar este arquivo, as duas FTs e os subcontextos dependentes antes da continuação.
