# Subcontexto 03 — procedência e confiança

- identidade: `CTX-FT-20260810-001-03`
- ordem: `3/5`
- fase: `implementacao_codigo`
- FT: `FT-20260810-002`
- estado: `bloqueado_por_norma`
- objetivo: validar separadamente descoberta, autenticidade do histórico, continuidade da confiança, autenticidade do release e integridade do artefato.
- dependências: FT-20260810-001 concluída; autorização pós-norma; material público FormulaKit disponível; trust anchor independente configurada para validação positiva.
- restrições: HTTPS+timeout; cache apenas validado; append-only; rotação/coassinatura/recuperação; revogação/vigência; anti-downgrade; nenhuma chave privada/credencial.
- entregáveis: schemas, canonicalização, verificadores, adaptadores de fonte, cache público mínimo, estado monotônico, diagnósticos e testes.
- validações: histórico/schema/assinatura/keyId/rotação/revogação/vigência; manifesto+hash; downgrade; fontes alternativas/divergência; cache; ausência de anchor.
- aceite: nenhum export FormulaKit é aceito ou executado antes de confiança, assinatura e hash válidos; infraestrutura permanece não confiante enquanto a anchor não existir.
