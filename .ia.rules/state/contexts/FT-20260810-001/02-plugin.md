# Subcontexto 02 — plugin e delegação FormulaKit

- identidade: `CTX-FT-20260810-001-02`
- ordem: `2/5`
- fase: `implementacao_codigo`
- FT: `FT-20260809-002`
- estado: `bloqueado_por_autorizacao_pos_norma`
- objetivo: implementar o plugin documental existente e resolver `$.<nome>()` somente por export público FormulaKit previamente validado.
- dependências: FT-20260810-001 concluída; FT-20260810-002 funcional; autorização pós-norma.
- restrições: FormulaKit opcional; nenhuma cópia/fork/fallback equivalente; parser/núcleo independentes; `ignore|fail`, default `ignore`; fallback configurável; loader sempre encerrado; warn deduplicado.
- entregáveis: runtime TypeScript, builds, exports, manifestos, documentação e testes do plugin.
- validações: presente/ausente; ignore/fail; fallback presente/ausente/customizado; decisão única/múltipla/aninhada; idempotência, DOM, segurança e pacote.
- aceite: ausência nunca afeta avaliações independentes nem produz silenciosamente decisão potencialmente falsa.
