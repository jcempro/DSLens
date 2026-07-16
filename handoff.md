<!-- Gerado por npm run agent:handoff. Nao editar manualmente. -->
# Implementacoes em andamento

Resumo operacional gerado de `.agents/continue.ia`.

## FT-001 - Contrato canônico e paridade PowerShell/Python

Objetivo: Fixar vetores comuns e convergir PowerShell e Python sem linguagem principal nem perda de compatibilidade pública válida.

<table>
<thead><tr><th>Etapa</th><th>Tarefa</th><th>Status</th></tr></thead>
<tbody>
<tr>
<td rowspan="3">Marco documental</td>
<td>Corrigir neutralidade entre linguagens e especializações</td>
<td><span style="color:#15803d">&#9679;</span> concluído</td>
</tr>
<tr>
<td>Validar documentação e schema</td>
<td><span style="color:#15803d">&#9679;</span> concluído</td>
</tr>
<tr>
<td>Compactar e registrar commit documental</td>
<td><span style="color:#ca8a04">&#9679;</span> em andamento</td>
</tr>
<tr>
<td rowspan="3">Contrato executável</td>
<td>Criar fixtures e vetores comuns determinísticos</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Criar protocolo de resultado e matriz de capacidades</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Validar schemas e referências</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td rowspan="3">Convergência existente</td>
<td>Atualizar PowerShell e seus testes</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Atualizar Python e seus testes</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Comprovar paridade e compatibilidade</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
</tbody>
</table>

## FT-002 - TypeScript e JavaScript cliente/servidor

Objetivo: Implementar TypeScript importável opcionalmente e transpilar JavaScript ESM para cliente, worker e servidor com paridade integral.

<table>
<thead><tr><th>Etapa</th><th>Tarefa</th><th>Status</th></tr></thead>
<tbody>
<tr>
<td rowspan="3">Estrutura e superfícies</td>
<td>Segregar pacote do produto da governança</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Implementar núcleo TypeScript síncrono</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Implementar tipos e exports</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td rowspan="3">Ambientes</td>
<td>Implementar adaptador client-side assíncrono</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Implementar worker</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Implementar server-side Node.js</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td rowspan="4">Builds e distribuição</td>
<td>Transpilar ESM cliente e servidor</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Gerar declarações e maps</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Gerar artefato client-side otimizado</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Validar npm, Git e submódulo</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td rowspan="3">Paridade</td>
<td>Executar vetores comuns</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Validar browser real e Node</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Fixar baseline e orçamento</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
</tbody>
</table>

## FT-003 - Testes multinível CI e metadados

Objetivo: Orquestrar npm test unitário, integração, conformidade e E2E; criar CI seletivo e badges verificáveis.

<table>
<thead><tr><th>Etapa</th><th>Tarefa</th><th>Status</th></tr></thead>
<tbody>
<tr>
<td rowspan="4">Testador npm</td>
<td>Criar orquestrador e detecção local/CI</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Criar unidades e integração</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Criar E2E mock/fixture e real opt-in</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Garantir saída humana e parseável</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td rowspan="3">CI/CD</td>
<td>Criar workflow e matriz homologada</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Configurar paths e workflow_dispatch</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Validar sintaxe e seleção documental</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td rowspan="3">Metadados e aceite global</td>
<td>Validar badges, runtimes e ambientes</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Executar suíte global e pacote limpo</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
<tr>
<td>Atualizar memória, handoff e documentação</td>
<td><span style="color:#64748b">&#9679;</span> pendente</td>
</tr>
</tbody>
</table>
