# Subcontexto 05 — validação cumulativa

- identidade: `CTX-FT-20260810-001-05`
- ordem: `5/5`
- fase: `validacao_integracao`
- FTs: `FT-20260810-001`, `FT-20260809-002`, `FT-20260810-002`, `FT-20260810-003`
- estado: `pendente`
- objetivo: provar cobertura integral, preservação e funcionamento real local/pacote/browser/Pages.
- dependências: entregáveis das quatro FTs.
- validações normativas: origem íntegra/hash; FTs/ordem/autorização; conflito conciliado; origem→RCF; nenhuma lista/função `$` local.
- validações técnicas: suíte automatizada; vetores de ausência e decisão; procedência completa; cache/anti-downgrade; build reproduzível; tarball/instalação; navegador real; Demos e Pages.
- validações de preservação: diff integral contra baseline; API/núcleo/DSL/builds/manifests/README/workflows existentes; ausência de segredo; nenhuma publicação implícita.
- aceite: todos os critérios do pedido aprovados simultaneamente e branches convergidas somente após sistema global funcional.
