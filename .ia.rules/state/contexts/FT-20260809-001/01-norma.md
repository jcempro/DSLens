# Subcontexto 01 — norma

- identidade: `CTX-FT-20260809-001-01`
- ordem: `1/3`
- fase: `implementacao_normativa`
- FT: `FT-20260809-001`
- estado: `concluído`
- objetivo: produzir contrato implementável e não ambíguo no RCF global e nos sub-RCFs TypeScript/JavaScript e distribuição.
- entradas: solicitação capturada no commit `b855059`; RCF vigente; API browser existente; política anual ECMAScript; contratos de build, browser e rastreabilidade.
- dependências: nenhuma além da captura e criação das FTs.
- fora de escopo: código, build, README como recurso já disponível, publicação.
- entregáveis: notação HTML/Markdown; fallback; lifecycle; API manual; renderização inline; erros; pipeline `$`; catálogo mínimo; integração; distribuição; testes.
- validações: cobertura bidirecional da solicitação; ausência de contradição com DSL v1-v3; validação RCF; diff somente normativo/estado.
- aceite: RCF global e sub-RCFs cobrem arquitetura, notação, lifecycle, renderização, catálogo completo de 175 funções, distribuição e testes; 50 sentenças estão rastreadas como `PENDENTE-CODIGO`; FT de código permanece pendente de nova autorização humana.
- validação: verificações focadas aprovadas; gate global degradado exclusivamente por `RCF_SENTENCA_NAO_MAPEADA:docs/rcf/distribution.md:5`, legado anterior não migrado artificialmente.
