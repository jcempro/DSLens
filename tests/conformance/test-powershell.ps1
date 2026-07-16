# Origem: https://github.com/jcempro/DSLens
# Autor: JeanCarloEM - https://jeancarloem.com
# Licença: MPL-2.0 - https://mozilla.org/MPL/2.0/
# Resumo: uso, cópia, modificação e distribuição conforme a MPL-2.0.

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
. (Join-Path $root 'src\ps\dsl.ps1')
$vectors = Get-Content -LiteralPath (Join-Path $root 'tests\conformance\v1.json') -Raw | ConvertFrom-Json
$requestVectors = Get-Content -LiteralPath (Join-Path $root 'tests\conformance\request-v2.json') -Raw | ConvertFrom-Json
$failures = [System.Collections.Generic.List[string]]::new()

foreach ($case in $vectors.cases) {
  $actual = resolve_dsl_data -data $vectors.data -path $case.path
  if ($actual -ne $case.expected) { $failures.Add("$($case.id): esperado=$($case.expected) obtido=$actual") }
  if ((resolveDslData $vectors.data $case.path) -ne $actual) { $failures.Add("alias resolveDslData divergente: $($case.id)") }
}
foreach ($case in $vectors.detection) {
  $actual = has_parser_expression $case.input
  if ($actual -ne $case.expected) { $failures.Add("detect: esperado=$($case.expected) obtido=$actual") }
  if ((hasParserExpression $case.input) -ne $actual) { $failures.Add('alias hasParserExpression divergente') }
}
$expectedParameters = @{
  hasParserExpression = @('source')
  resolveDslData = @('data', 'path', 'callback')
  resolveParserExpression = @('source', 'options', 'callback')
}
foreach ($name in $expectedParameters.Keys) {
  $actualNames = @((Get-Command $name).Parameters.Values | Where-Object { $_.Attributes.Position -ge 0 } | Sort-Object { $_.Attributes.Position } | Select-Object -ExpandProperty Name)
  if (($actualNames -join ',') -ne ($expectedParameters[$name] -join ',')) { $failures.Add("assinatura ${name}: $($actualNames -join ',')") }
}
foreach ($case in $requestVectors.cases) {
  $actual = _extract_dsl $case.input
  $method = if ($actual.request) { $actual.request.method } else { 'GET' }
  if (-not $actual -or $method -ne $case.expected.method -or $actual.path -ne $case.expected.path) { $failures.Add("request: $($case.id)") }
}
foreach ($value in $requestVectors.invalid) {
  if ($null -ne (_extract_dsl $value)) { $failures.Add("request inválido aceito: $value") }
}
if ($failures.Count -gt 0) { throw ($failures -join [Environment]::NewLine) }
Write-Output "PASS powershell conformance ($($vectors.cases.Count + $vectors.detection.Count + $requestVectors.cases.Count + $requestVectors.invalid.Count) casos)"
