# Contexto-mestre — FormulaKit, procedência e Demos verificáveis

- identidade: `CTX-FT-20260810-001`
- criado_em: `2026-08-10T01:27:22-03:00`
- fonte: `82921be:.ia.rules/state/requests/FT-20260810-001/request.md`, payload SHA-256 `e1c5e302c0d6fa94f4890b56e5fdffd5f42231826a805d01ee887d54ffa4b4fa`.
- objetivo: substituir somente o catálogo `$` local por integração opcional FormulaKit, adicionar procedência verificável e consolidar site/Demos auditáveis, preservando integralmente o plugin documental e a DSL existentes.
- FTs: `FT-20260810-001` (norma), `FT-20260809-002` (plugin), `FT-20260810-002` (procedência) e `FT-20260810-003` (site/Demos).
- ordem: captura/conciliação → commit exclusivo → RCF → validação/commit normativo → nova autorização humana → procedência → plugin → site/Demos → validação global/publicação autorizada.
- conflito conciliado: a nova solicitação humana prevalece sobre o catálogo `$` local da FT-20260809-001; permanecem válidos markup, lifecycle, DOM, renderização segura, CSS, builds e integrações não conflitantes.
- evidência FormulaKit: repositório público canônico `jcempro/FormulaKit`, versão declarada `0.1.0`, commit `dd9bb97b38e109a8395c73c0d29baf92925ad677`; raiz exporta 11 namespaces e nomes públicos documentados em `docs/API.md`; `globalThis.FormulaKit.manifests` é descoberta de assinaturas estruturais, não prova criptográfica de autoria.
- lacuna declarada: em 2026-08-10 o path `provenance/keys/v1.json` ainda retorna 404 e nenhuma origem independente da trust anchor foi definida; a norma deve exigir configuração/recuperação explícita e a implementação futura não pode converter essa ausência em confiança.
- aceite global: cadeia fonte real → HTML/configuração real → plugin/parser distribuído real → resultado exibido; FormulaKit só é aceito após cadeia+assinatura+hash; nenhuma função local equivalente; nenhuma regressão ou publicação implícita.
- estado: marco normativo concluído e validado de forma focada; código bloqueado até nova autorização humana explícita pós-norma.

## Subcontextos

1. `01-norma.md`: autoridade FormulaKit, ausência, procedência, Demos e conciliação normativa.
2. `02-plugin.md`: runtime documental e delegação opcional, pertencente à FT-20260809-002.
3. `03-proveniencia.md`: verificadores, fontes, cache e anti-downgrade, pertencente à FT-20260810-002.
4. `04-demos.md`: site multipágina, exemplos reais e Pages, pertencente à FT-20260810-003.
5. `05-validacao.md`: matriz cumulativa e aceite global.

## Integração

Conclusão local não conclui o objetivo global. Alteração de contrato atualiza primeiro este mestre e os subcontextos dependentes. A URL canônica futura é somente descoberta; confiança exige trust anchor independente previamente conhecida.

## Resultado normativo

- cobertura: 16/16 conceitos exigidos, sem catálogo ou implementação `$` local e com uma única seção normativa de funções;
- rastreabilidade: sentenças materiais novas vinculadas às FTs de código responsáveis;
- degradações preexistentes: `agent:rcf` bloqueado apenas por `docs/rcf/distribution.md:5`; wrapper em `TSCONFIG_AUSENTE`; runner direto bloqueado pela referência antiga a `npm-release.yml`;
- próximo portão: autorização humana explícita para procedência → plugin → site/Demos.
