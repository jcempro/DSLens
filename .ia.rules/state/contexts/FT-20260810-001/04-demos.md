# Subcontexto 04 — site e Demos

- identidade: `CTX-FT-20260810-001-04`
- ordem: `4/5`
- fase: `implementacao_codigo`
- FT: `FT-20260810-003`
- estado: `bloqueado_por_norma`
- objetivo: transformar o site em demonstração funcional multipágina e auditável do produto distribuído.
- dependências: plugin e procedência funcionais; FT normativa concluída; autorização pós-norma.
- restrições: plugin é o único meio de executar o parser nas Demos; sem mock/parser paralelo/resultado hardcoded; código exibido deriva do executado; fontes externas acessíveis e idênticas às consumidas.
- entregáveis: Home→Demos; categorias/subcategorias reais; navegação; exemplos JSON/YAML/XML; highlight; fonte/resultado; FormulaKit representativo e degradação; workflow Pages.
- validações: build/site; subpath; links; fonte→HTML/config→plugin/parser→resultado; navegador real; Pages publicado somente quando autorizado.
- aceite: site público navegável e reproduzível, com múltiplas páginas e resultados produzidos em tempo de execução pelo plugin distribuído.
