#requires -version 5.1
<#
.SYNOPSIS
    BIBLIOTECA PARSER DSL (PowerShell 5.1 + 7.4+).
    Abstração universal de origens via resolução declarativa de URLs dinâmicas.

.DESCRIPTION
    Componente especializado em resolver endpoints dinâmicos a partir de APIs remotas 
    (JSON, YAML, XML) sem a necessidade de parsing heurístico ou scraping. 
    Permite que manifestos definam URLs que se auto-atualizam via navegação de objetos.

    Pense num Document.querySelector para APIs: que funcione em JSON/YAML/XML, com suporte a filtros
    e índices, e que retorne strings (URLs ou metadados) - é isso que esta biblioteca pretende ser.    

    SINTAXE DSL (ESTRUTURA NAVEGACIONAL):     

      1. PADRÃO BASE E ESCOPO
        A sintaxe DEVE seguir a estrutura sequencial: ${"MIXED_INPUT"[, `{OPÇÕES}`]}.PATH
        Onde [, `{OPÇÕES}`] é um componente facultativo destinado à parametrização de 
        requisições de rede (API) em ambiente cross-platform e cross-language.
        * MIXED_INPUT: é a URL, FILEPATH ou CONTEÚDO plano

      2. DELIMITADORES E LITERAIS
        2.1. MIXED_INPUT de Origem: DEVE ser encapsulada obrigatoriamente por aspas duplas ("..."), 
              aspas simples ('...') ou crases (`...`).
        2.2. Objeto de Opções: Se presente, DEVE ser obrigatoriamente envolvido em sua 
              totalidade por crases (ex: `{"method":"POST", "header": {"chave": "val"}}`).
        2.3. Delimitador de Escopo: Toda a instrução de origem DEVE estar contida em ${ }.

      3. NAVEGAÇÃO E DEEP NESTING
        3.1. Membros: O acesso a campos DEVE utilizar o operador ponto (.).
        3.2. Índices Numéricos: O acesso a coleções DEVE utilizar colchetes ([index]).
        3.3. Índices Semânticos: Suporte a seletores [@attr="valor"] ou [@attr='valor'].
              A DSL DEVE retornar a primeira ocorrência onde o atributo (ex: src, name, 
              href) corresponda exatamente ao valor literal fornecido.
        3.4. Coringas: Inclusão de seletores aderentes ao QuerySelector (*) para 
              casamento de padrões em chaves ou estruturas de dados.

      4. FUNCIONALIDADE DE BUSCA RECURSIVA (FIND)
        4.1. Definição: O método .find(query) PODE ser invocado a partir do ROOT ou de 
              qualquer nível do PATH.
        4.2. Comportamento: DEVE realizar busca em profundidade (não linear), localizando 
              a primeira estrutura que satisfaça a query, independentemente de estar 
              imediatamente aninhada ao ponto de invocação.
        4.3. Sintaxe de Busca: O argumento de .find() aceita qualquer especificação 
              válida de PATH ou seletor semântico.

      5. HIBRIDISMO E COMPATIBILIDADE
        5.1. Composição: A DSL DEVE permitir coexistência com strings de metadados.
              Exemplo: ".exe,x64 | ${"MIXED_INPUT"}.path.subcampo"
        5.2. Preservação: Literais externos à marcação ${ } DEVE ser mantidos intactos 
              durante a resolução da expressão.

    PIPELINE DE RESOLUÇÃO:
    1. DETECÇÃO: Identificação de expressões DSL via 'has_parser_expression'.
    2. FETCH: Requisição remota com identificação automática de tipo (JSON/YAML/XML).
    3. NAVEGAÇÃO: Resolução determinística do path sobre o objeto retornado.
    4. CONVERSÃO: Retorno obrigatório do valor final como [string] de URL.
    5. Encadeamento/Aninhamento/Profundidade: Suporte a até MAX_DSL_DEPTH e MAX_DSL_CHAINING níveis de aninhamento
       de expressões DSL limitado a um timeout por demanda inicial (conjunto total de resoluções aninhadas+encadeadas) de MAX_DSL_RESOLUTION_TIMEOUT e
       timeout global (todas as resoluções do runtime) de MAX_GLOBAL_TIMEOUT.

    GESTÃO DE CACHE & PERFORMANCE:
    - Escopo: Cache em memória persistente na sessão (__PARSER_CACHE).
    - TTL (Time-To-Live): CACHE_TTL_SECONDS segundos por entrada (URL + Path).
    - Objetivo: Minimização de tráfego e latência em execuções repetitivas.

    RESTRIÇÕES ESPECÍFICAS (HARD RULES):
    - ❌ VEDAÇÃO: Proibido parsing de HTML ou técnicas de Scraping.
    - ❌ VEDAÇÃO: Proibida execução de código arbitrário (Bloqueio de Invoke-Expression).
    - ❌ VEDAÇÃO: Proibido encadeamento de múltiplas expressões DSL (limitar depth em MAX_DSL_DEPTH).
    - ❌ VEDAÇÃO: Operação estritamente de leitura (Idempotência HTTP GET).

    FAIL-SAFE & TRATAMENTO DE ERROS:
    - Falhas (ERROR_HTTP, ERROR_TIMEOUT, ERROR_INVALID_PATH) retornam obrigatoriamente $null.
    - Isolamento: Erros de parsing não devem interromper o fluxo do Orquestrador.
    - Log: Erros registrados via 'show_message' ou callback de telemetria.

.NOTES
    ================================================================================
    REGRAS DE NEGÓCIO GLOBAIS DO PROJETO
    POWERSHELL MISSION-CRITICAL FRAMEWORK - ESPECIFICAÇÃO DE EXECUÇÃO
    ================================================================================

    [CAPACIDADES GERAIS]
    Orquestração determinística, resiliente e idempotente para Windows.
    Compatibilidade Dual-Engine (5.1 + 7.4+) em contextos SYSTEM, WINPE e USER.

    [ESTILO, DESIGN & RASTREABILIDADE]
    - Design: Imutabilidade, Baixo Acoplamento e suporte a camelCase/snake_case.
    - Rastreabilidade Diff-Friendly: Alterações de código minimalistas otimizados
                                     para desempenho aliado a análise visual
                                     de mudanças.

    [CAPACIDADES TÉCNICAS (REAPROVEITÁVEIS)]
    - COMPATIBILIDADE: Identificação de versão/subversão para comandos adequados.
    - RESILIÊNCIA: Retry com backoff progressivo e múltiplas formas de tentativa.
                   Controlado por RETRY_MAX_ATTEMPTS, RETRY_BACKOFF_BASE_MS e RETRY_BACKOFF_MAX_MS.
    - OFFLINE-FIRST: Lógica global de priorização de recursos locais vs rede.
                     configurável para Online-FIRST.
    - DETERMINISMO: Validação de estado real pós-operação (não apenas ExitCode).

    [EVENTOS & TELEMETRIA (CALLBACK)]
    - DESACOPLAMENTO: Script não gerencia arquivos de log ou console diretamente,
                      salvo se explicitamente definido.
    - OBRIGATORIEDADE: Telemetria via ScriptBlock [callback($msg, $type)]
                       salvo se explicitamente definido.
    - TIPAGEM DE MENSAGEM (Parâmetro 2):
        - [t] Title: Título de etapa ou seções principais.
        - [l] Log: Registro padrão de fluxo e operações.
        - [i] Info: Detalhes informativos ou diagnósticos.
        - [w] Warn: Alertas de falhas não críticas ou retentativas.
        - [e] Error: Falhas críticas que exigem atenção ou interrupção.

    [REGRAS DE ARQUITETURA]
    - ISOLAMENTO: Mutex Global obrigatório para prevenir paralelismo.
    - MODULARIDADE: Baseado em micro-funções especialistas e reutilizáveis.
    - SINCRO: Execução 100% síncrona, bloqueante e sequencial:
      * Garantia de execução totalmente síncrona ou assíncrona predeterminada
        >> Atomicidade com Flexibilidade Controlada
          - Por padrão, o processo é tratado como um bloco síncrono e indivisível para
            eliminar lacunas de etapa e garantir a integridade lógica do sistema.
          - A assincronia interna é permitida apenas em caráter excepcional e sob
            rigorosa validação de segurança (thread-safety), devendo ser aplicada
            exclusivamente onde não houver dependência de estado entre tarefas.
          - A estratégia preferencial de performance reside no Orquestrador, que pode
            paralelizar múltiplos DSLs em instâncias distintas, preservando o
            determinismo e o isolamento de cada script individual.
      
    - ESTADO: Barreira de consistência (DISM/CBS) para operações de sistema.
    - NATIVO: Uso estrito de comandos nativos do OS, salvo exceção declarada.

    [DIRETRIZES DE IMPLEMENTAÇÃO]
    - IDEMPOTÊNCIA: Seguro para múltiplas execuções no mesmo ambiente.
    - HEADLESS: Operação plena sem interface gráfica ou interação de usuário.
    - TIMEOUT: Limites controlados:
        * Execução: MAX_EXECUTION_TIMEOUT
        * Rede: MAX_NETWORK_TIMEOUT
        * DSL: MAX_DSL_RESOLUTION_TIMEOUT
        * Global: MAX_GLOBAL_TIMEOUT

    [RESTRIÇÕES / VEDAÇÕES]
    - Não prosseguir com sistema em estado inconsistente ou pendente.
    - Não assumir conectividade de rede (Offline-First por padrão)
      configurável para Online-FIRST.
    - Não depender de módulos externos ou bibliotecas não nativas.
    - Não executar etapas sem validação de sucesso posterior.

    [ESTRUTURA DE EXECUÇÃO]
    1. Inicialização segura (ExecutionPolicy, TLS, Context Check).
    2. Garantia de instância única (Global Mutex).
    3. Validação de pré-requisitos e pilha de manutenção do SO.
    4. Orquestração modular com validação individual de cada micro-função.
    5. Finalização auditável com log rastreável e saída determinística.

    [INVOCAÇÃO]
    O script sempre auto identifica se foi importado ou executado:
    1. Se executado diretamente executa função main repassando parâmetros 
       recebidos por linha de comando ou variáveis de ambiente.
    2. Se importado expõe as funções públicas para serem chamadas por outros
       scripts sem executar nada.

.COMPONENT
    Abstração de APIs, Resolutor de URLs e Parser de Dados Estruturados.
    Foco: Abstração Universal de Origens e Determinismo de Endpoints.
#>

# =========================
# LIMITES DSL (CONTROLE)
# =========================
#region CONSTANTS

Set-Variable MAX_DSL_DEPTH              5    -Option Constant -Scope Script
Set-Variable MAX_DSL_CHAINING           3    -Option Constant -Scope Script

Set-Variable MAX_EXECUTION_TIMEOUT      90   -Option Constant -Scope Script
Set-Variable MAX_NETWORK_TIMEOUT        30   -Option Constant -Scope Script
Set-Variable MAX_DSL_RESOLUTION_TIMEOUT 45   -Option Constant -Scope Script
Set-Variable MAX_GLOBAL_TIMEOUT         300  -Option Constant -Scope Script

Set-Variable CACHE_TTL_SECONDS          60   -Option Constant -Scope Script
Set-Variable CACHE_MAX_ENTRIES          512  -Option Constant -Scope Script

Set-Variable RETRY_MAX_ATTEMPTS         3    -Option Constant -Scope Script
Set-Variable RETRY_BACKOFF_BASE_MS      200  -Option Constant -Scope Script
Set-Variable RETRY_BACKOFF_MAX_MS       2000 -Option Constant -Scope Script

Set-Variable QUERY_MAX_LENGTH           2048 -Option Constant -Scope Script
Set-Variable QUERY_MAX_STEPS            64   -Option Constant -Scope Script
Set-Variable QUERY_MAX_RECURSIVE_DEPTH  32   -Option Constant -Scope Script
Set-Variable QUERY_MAX_VISITED_NODES    10000 -Option Constant -Scope Script
Set-Variable QUERY_MAX_RESULTS          1024 -Option Constant -Scope Script
Set-Variable QUERY_MAX_FILTERS          32   -Option Constant -Scope Script
Set-Variable QUERY_MAX_LITERAL_LENGTH   512  -Option Constant -Scope Script

Set-Variable ERROR_HTTP                 'HTTP_ERROR'       -Option Constant -Scope Script
Set-Variable ERROR_TIMEOUT              'TIMEOUT_EXCEEDED' -Option Constant -Scope Script
Set-Variable ERROR_INVALID_PATH         'INVALID_PATH'     -Option Constant -Scope Script
Set-Variable ERROR_PARSE_FAILURE        'PARSE_FAILURE'    -Option Constant -Scope Script

#endregion

# init lazy (evita chamada antes da definição de função)
if (-not $script:__DSL_RUNTIME_START) {
  $script:__DSL_RUNTIME_START = [DateTime]::UtcNow
}
if (-not $script:__DSL_NULL) {
  $script:__DSL_NULL = [PSCustomObject]@{ __dslensNull = $true }
}

# =========================
# ESTADO GLOBAL (CACHE)
# =========================
try {
  if (-not $script:__PARSER_CACHE) {
    $script:__PARSER_CACHE = @{}
  }  
}
catch {
  <#Do this if a terminating exception happens#>
}

# =========================
# UTIL
# =========================
function _now {
  return [DateTime]::UtcNow
}
function _emit {
  param($msg, $type, $callback)
  if ($callback -and $callback -is [ScriptBlock]) {
    & $callback $msg $type
  }
}

# =========================
# DETECÇÃO DSL
# =========================
function has_parser_expression {
  param([string]$source)
  if (-not $source) { return $false }
  return ($source -match '\$\{\s*(["'']).+?\1\s*\}')
}

# =========================
# EXTRAÇÃO DSL
# =========================
function _extract_dsl {
  param([string]$source)

  if ($source -notmatch '^\$\{\s*(["''])(?<url>.*?)\1') {
    return $null
  }
  $url = $matches['url']
  $cursor = $matches[0].Length
  while ($cursor -lt $source.Length -and [char]::IsWhiteSpace($source[$cursor])) { $cursor++ }
  $request = $null
  if ($cursor -lt $source.Length -and $source[$cursor] -eq ';') {
    $depth = 1; $quote = [char]0; $escaped = $false; $close = -1
    for ($i = $cursor + 1; $i -lt $source.Length; $i++) {
      $char = $source[$i]
      if ($quote -ne [char]0) {
        if ($escaped) { $escaped = $false }
        elseif ($char -eq '\') { $escaped = $true }
        elseif ($char -eq $quote) { $quote = [char]0 }
      }
      elseif ($char -eq '"') { $quote = $char }
      elseif ($char -eq '{') { $depth++ }
      elseif ($char -eq '}') { $depth--; if ($depth -eq 0) { $close = $i; break } }
    }
    if ($close -lt 0) { return $null }
    $parameter = $source.Substring($cursor + 1, $close - $cursor - 1).Trim()
    if ($parameter.StartsWith('request=')) { $parameter = $parameter.Substring(8).Trim() }
    elseif (-not $parameter.StartsWith('{')) { return $null }
    try { $request = $parameter | ConvertFrom-Json -ErrorAction Stop } catch { return $null }
    $allowed = @('method', 'query', 'headers', 'body')
    if (@($request.PSObject.Properties.Name | Where-Object { $_ -notin $allowed }).Count -gt 0) { return $null }
    if (-not $request.method) { $request | Add-Member -NotePropertyName method -NotePropertyValue 'GET' }
    if ($request.method -notin @('GET', 'POST')) { return $null }
    if ($request.body -and $request.method -ne 'POST') { return $null }
    if ($request.body -and $request.body.encoding -notin @('json', 'form', 'text')) { return $null }
    if ($request.headers) {
      foreach ($header in @($request.headers.PSObject.Properties)) {
        if ($header.Name.ToLowerInvariant() -in @('host', 'content-length', 'connection', 'transfer-encoding')) { return $null }
        if ($header.Value -isnot [string] -and -not $header.Value.env) { return $null }
      }
    }
    $cursor = $close
  }
  if ($cursor -ge $source.Length -or $source[$cursor] -ne '}') { return $null }
  $path = $source.Substring($cursor + 1)
  if (-not (_is_selector_start $path)) { return $null }
  return @{ url = $url; path = $path; request = $request }
}

# =========================
# CACHE
# =========================
function _cache_get {
  param($key, [ref]$found)

  $found.Value = $false

  if (-not $script:__PARSER_CACHE.ContainsKey($key)) {
    return $null
  }

  $entry = $script:__PARSER_CACHE[$key]

  if (-not $entry -or -not $entry.expire -or (_now) -gt $entry.expire) {
    $script:__PARSER_CACHE.Remove($key)
    return $null
  }

  $found.Value = $true
  return $entry.value
}

function _cache_set {
  param($key, $value)

  # PROTECAO: limita o estado de sessão conforme o contrato publicado.
  if ($script:__PARSER_CACHE.Count -ge $script:CACHE_MAX_ENTRIES) {
    $script:__PARSER_CACHE.Clear()
  }

  $script:__PARSER_CACHE[$key] = @{
    value  = $value
    expire = (_now).AddSeconds($script:CACHE_TTL_SECONDS) # FIX-BUG: respeita constante global
  }
}

# =========================
# FETCH (MULTI-ESTRATÉGIA)
# =========================
function _fetch_raw {
  param(
    [string]$url,
    [ScriptBlock]$callback,
    $requestOptions,
    [hashtable]$envValues
  )

  $methodName = if ($requestOptions.method) { $requestOptions.method } else { 'GET' }
  $headers = @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"; "Accept" = "application/json" }
  if ($requestOptions.headers) {
    foreach ($header in @($requestOptions.headers.PSObject.Properties)) {
      if ($header.Value -is [string]) { $headers[$header.Name] = $header.Value }
      elseif ($envValues -and $envValues.ContainsKey($header.Value.env)) { $headers[$header.Name] = $envValues[$header.Value.env] }
      else { return $null }
    }
  }
  if ($requestOptions.query) {
    $pairs = @($requestOptions.query.PSObject.Properties | ForEach-Object { "$([uri]::EscapeDataString($_.Name))=$([uri]::EscapeDataString([string]$_.Value))" })
    if ($pairs.Count) { $url += $(if ($url.Contains('?')) { '&' } else { '?' }) + ($pairs -join '&') }
  }
  $bodyValue = $null; $contentType = $null
  $hasSensitiveHeader = @($headers.Keys | Where-Object { $_ -match '^(?i:Authorization|Cookie|Proxy-Authorization)$' }).Count -gt 0
  if ($requestOptions.body) {
    if ($requestOptions.body.encoding -eq 'json') { $bodyValue = $requestOptions.body.value | ConvertTo-Json -Compress -Depth 20; $contentType = 'application/json' }
    elseif ($requestOptions.body.encoding -eq 'form') { $bodyValue = @($requestOptions.body.value.PSObject.Properties | ForEach-Object { "$([uri]::EscapeDataString($_.Name))=$([uri]::EscapeDataString([string]$_.Value))" }) -join '&'; $contentType = 'application/x-www-form-urlencoded' }
    else { $bodyValue = [string]$requestOptions.body.value }
  }
  $primary = {
    $parameters = @{ Uri = $url; Method = $methodName; TimeoutSec = 15; Headers = $headers; ErrorAction = 'Stop' }
    if ($hasSensitiveHeader) { $parameters.MaximumRedirection = 0 }
    if ($null -ne $bodyValue) { $parameters.Body = $bodyValue }
    if ($contentType) { $parameters.ContentType = $contentType }
    Invoke-RestMethod @parameters
  }
  $methods = @($primary)
  if ($methodName -eq 'GET' -and -not $requestOptions) { $methods += @(
    {
      if ($PSVersionTable.PSVersion.Major -lt 6) {
        Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 15 -UseBasicParsing -Headers @{ "User-Agent" = "Mozilla/5.0 (Windows NT; DSLParser)" } -ErrorAction Stop | Select-Object -ExpandProperty Content
      }
      else {
        Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 15 -Headers @{ "User-Agent" = "Mozilla/5.0 (Windows NT; DSLParser)" } -ErrorAction Stop | Select-Object -ExpandProperty Content
      }
    }
    {
      $wc = New-Object System.Net.WebClient
      try {
        $wc.DownloadString($url)
      }
      finally {
        $wc.Dispose()
      }
    })
  }

  # sanitização + validação resiliente
  try {
    $cleanUrl = ($url -as [string]).Trim()

    # remove possíveis resíduos de parsing
    $cleanUrl = $cleanUrl -replace '[\s`"'' ]+$', ''
    $cleanUrl = $cleanUrl -replace '^[\s`"'' ]+', ''

    $uri = $null
    if (-not [System.Uri]::TryCreate($cleanUrl, [System.UriKind]::Absolute, [ref]$uri)) {
      _emit "invalid url parse" "e" $callback
      return $null
    }

    if (-not $uri.Scheme -or $uri.Scheme -notin @("http", "https")) {
      _emit "invalid url scheme" "e" $callback
      return $null
    }

    $url = $uri.AbsoluteUri
  }
  catch {
    _emit "invalid url" "e" $callback
    return $null
  }

  $start = _now
  foreach ($method in $methods) {
    for ($i = 0; $i -lt 3; $i++) {

      if (((_now) - $start).TotalSeconds -gt $script:MAX_DSL_RESOLUTION_TIMEOUT) {
        # FIX-BUG: constante correta
        _emit "fetch timeout per demand" "w" $callback
        break
      }
      try {
        $result = & $method
        if ($null -ne $result -and "$result".Trim().Length -gt 0) {
          return $result
        }
      }
      catch {
        _emit "fetch retry [$i] $url" "w" $callback
        Start-Sleep -Milliseconds (200 * ($i + 1))
      }
    }
  }

  _emit "fetch failed $url" "e" $callback
  return $null
}

# =========================
# PARSE (JSON/XML/YAML)
# =========================
function _parse_content {
  param(
    $raw,
    [ScriptBlock]$callback
  )

  if ($null -eq $raw) { return $null }

  # já objeto (Invoke-RestMethod)
  if ($raw -isnot [string]) {
    return $raw
  }

  if ($raw.ToUpperInvariant().Contains('<!DOCTYPE')) {
    _emit "xml doctype forbidden" "e" $callback
    return $null
  }

  # JSON
  try {
    return $raw | ConvertFrom-Json -ErrorAction Stop
  }
  catch {}

  # XML
  try {
    return [xml]$raw
  }
  catch {}

  # YAML (se disponível)
  if (-not $script:__YAML_AVAILABLE) {
    $script:__YAML_AVAILABLE = [bool](Get-Command ConvertFrom-Yaml -ErrorAction SilentlyContinue)
  }

  if ($script:__YAML_AVAILABLE) {
    try {
      return $raw | ConvertFrom-Yaml
    }
    catch {}
  }

  _emit "parse failed" "w" $callback
  return $null
}

# =========================
# NAVEGAÇÃO
# =========================
function _navigate {
  param(
    $obj,
    [string]$path,
    [ScriptBlock]$callback
  )

  if (-not $path) { return $obj }

  $current = $obj
  $tokens = ($path -replace '^\.', '') -split '\.'

  foreach ($token in $tokens) {
    if ($null -eq $current) { return $null }

    # --- acesso seguro a propriedade ---
    function __get_prop($o, $name) {
      try {
        if ($o -is [System.Xml.XmlNode]) {
          # XML: tenta ChildNodes primeiro
          $nodes = $o.SelectNodes($name)
          if ($nodes -and $nodes.Count -gt 0) {
            return $nodes
          }
          # atributo XML
          if ($o.Attributes[$name]) {
            return $o.Attributes[$name].Value
          }
        }

        try {
          return $o.PSObject.Properties[$name].Value
        }
        catch {
          return $null
        }
      }
      catch {
        return $null
      }
    }

    # índice numérico
    # índice numérico (com ou sem propriedade)
    if ($token -match '^(.+?)\[(\d+)\]$' -or $token -match '^\[(\d+)\]$') {

      if ($matches.Count -eq 3) {
        $name = $matches[1]
        $idx = [int]$matches[2]
        $current = __get_prop $current $name
      }
      else {
        $idx = [int]$matches[1]
      }

      if ($null -eq $current) { return $null }

      if ($current -is [System.Collections.IEnumerable] -and $current -isnot [string]) {
        $arr = @($current)
        if ($idx -ge $arr.Count) { return $null }
        $current = $arr[$idx]
      }
      else {
        return $null
      }
    }

    # filtro semântico (com ou sem propriedade)
    elseif ($token -match '^(.+?)\[@(.+?)=["''](.+?)["'']\]$' -or $token -match '^\[@(.+?)=["''](.+?)["'']\]$') {

      if ($matches.Count -eq 4) {
        $name = $matches[1]
        $attr = $matches[2]
        $val = $matches[3]
        $current = __get_prop $current $name
      }
      else {
        $attr = $matches[1]
        $val = $matches[2]
      }

      if ($null -eq $current) { return $null }

      if ($current -is [System.Collections.IEnumerable] -and $current -isnot [string]) {
        $found = $false

        foreach ($item in @($current)) {
          try {
            $v = $null
            try {
              if ($item -is [System.Xml.XmlNode] -and $item.Attributes[$attr]) {
                $v = $item.Attributes[$attr].Value
              }
              else {
                $v = $item.PSObject.Properties[$attr].Value
              }
            }
            catch {}

            if ($null -ne $v -and [string]$v -eq $val) {
              $current = $item
              $found = $true
              break
            }
          }
          catch {}
        }

        if (-not $found) { return $null }
      }
      else {
        return $null
      }
    }

    # acesso simples
    else {
      $current = __get_prop $current $token
      if ($null -eq $current) { return $null }
    }
  }

  return $current
}

# =========================
# SELETORES V3
# =========================
function _is_selector_start {
  param([string]$path)
  return ($path -match '^(?:[\.\[]|(?:first|all|count|exists)\()')
}

function _new_parser {
  param([string]$source)
  if ($source.Length -gt $script:QUERY_MAX_LENGTH) { throw "query limit" }
  return @{ source = $source.Trim(); cursor = 0; filters = 0 }
}

function _parser_peek { param($p) if ($p.cursor -lt $p.source.Length) { return [string]$p.source[$p.cursor] }; return "" }
function _parser_consume { param($p, [string]$token) if ($p.source.Substring($p.cursor).StartsWith($token)) { $p.cursor += $token.Length; return $true }; return $false }
function _parser_expect { param($p, [string]$token) if (-not (_parser_consume $p $token)) { throw "expected $token" } }
function _parser_read_while {
  param($p, [string]$pattern)
  $start = $p.cursor
  while ($p.cursor -lt $p.source.Length -and ([string]$p.source[$p.cursor]) -match "^$pattern$") { $p.cursor++ }
  return $p.source.Substring($start, $p.cursor - $start)
}
function _parser_skip_spaces { param($p) [void](_parser_read_while $p '\s') }

function _parse_selector {
  param([string]$source)
  $mode = 'default'
  $path = $source.Trim()
  if ($path -match '^(first|all|count|exists)\(') {
    $mode = $matches[1]
    $open = $matches[0].Length - 1
    $close = _find_selector_close $path $open
    if ($close -ne ($path.Length - 1)) { throw "invalid function" }
    $path = $path.Substring($matches[0].Length, $close - $matches[0].Length)
  }
  $p = _new_parser $path
  $steps = _parse_path $p
  if ($steps.Count -gt $script:QUERY_MAX_STEPS) { throw "step limit" }
  return @{ mode = $mode; steps = $steps }
}

function _find_selector_close {
  param([string]$source, [int]$open)
  $depth = 0; $quote = [char]0; $escaped = $false
  for ($i = $open; $i -lt $source.Length; $i++) {
    $char = $source[$i]
    if ($quote -ne [char]0) {
      if ($escaped) { $escaped = $false }
      elseif ($char -eq '\') { $escaped = $true }
      elseif ($char -eq $quote) { $quote = [char]0 }
    }
    elseif ($char -eq '"' -or $char -eq "'") { $quote = $char }
    elseif ($char -eq '(') { $depth++ }
    elseif ($char -eq ')') { $depth--; if ($depth -eq 0) { return $i } }
  }
  return -1
}

function _parse_path {
  param($p)
  $steps = New-Object System.Collections.ArrayList
  while ($p.cursor -lt $p.source.Length) { [void]$steps.Add((_parse_step $p)) }
  return @($steps)
}

function _parse_step {
  param($p)
  if (_parser_consume $p '..') { return @{ kind = 'recursive'; target = (_parse_recursive_target $p) } }
  if (_parser_consume $p '.text()') { return @{ kind = 'text' } }
  if (_parser_consume $p '.@') { return @{ kind = 'attribute'; name = (_parse_name $p) } }
  if (_parser_consume $p '.[') { return @{ kind = 'property'; name = (_parse_quoted $p ']') } }
  if (_parser_consume $p '.') { return @{ kind = 'property'; name = (_parse_name $p) } }
  if (_parser_consume $p '[*]') { return @{ kind = 'wildcard' } }
  if (_parser_consume $p '[?(') { return _parse_filter $p }
  if ((_parser_peek $p) -eq '[') { return _parse_index_or_legacy_filter $p }
  throw "unexpected token"
}

function _parse_recursive_target {
  param($p)
  if (_parser_consume $p '@') { return @{ kind = 'attribute'; name = (_parse_name $p) } }
  if (_parser_consume $p '[') { return @{ kind = 'property'; name = (_parse_quoted $p ']') } }
  return @{ kind = 'property'; name = (_parse_name $p) }
}

function _parse_filter {
  param($p)
  $p.filters++
  if ($p.filters -gt $script:QUERY_MAX_FILTERS) { throw "filter limit" }
  if (-not (_parser_consume $p '@')) { throw "invalid filter" }
  $start = $p.cursor
  while ($p.cursor -lt $p.source.Length) {
    _parser_skip_spaces $p
    if ($p.source.Substring($p.cursor) -match '^(=|!=|>=|<=|>|<|\)\])') { break }
    [void](_parse_step $p)
  }
  $nested = _new_parser ($p.source.Substring($start, $p.cursor - $start))
  $path = _parse_path $nested
  _parser_skip_spaces $p
  $operator = _parse_operator $p
  if (-not $operator) {
    _parser_expect $p ')]'
    return @{ kind = 'filter'; predicate = @{ kind = 'exists'; path = $path } }
  }
  $value = _parse_scalar $p
  _parser_skip_spaces $p
  _parser_expect $p ')]'
  return @{ kind = 'filter'; predicate = @{ kind = 'compare'; path = $path; operator = $operator; value = $value } }
}

function _parse_index_or_legacy_filter {
  param($p)
  _parser_expect $p '['
  if (_parser_consume $p '@') {
    $name = _parse_name $p
    _parser_expect $p '='
    $value = _parse_scalar $p
    _parser_expect $p ']'
    return @{ kind = 'filter'; predicate = @{ kind = 'compare'; path = @(@{ kind = 'property'; name = $name }); operator = '='; value = $value } }
  }
  $digits = _parser_read_while $p '[0-9]'
  if (-not $digits) { throw "invalid index" }
  _parser_expect $p ']'
  return @{ kind = 'index'; index = [int]$digits }
}

function _parse_operator {
  param($p)
  foreach ($operator in @('>=', '<=', '!=', '=', '>', '<')) {
    if (_parser_consume $p $operator) { return $operator }
  }
  return ''
}

function _parse_name {
  param($p)
  $name = _parser_read_while $p '[A-Za-z0-9_:\-${}]'
  if (-not $name -or $name.Length -gt $script:QUERY_MAX_LITERAL_LENGTH) { throw "invalid name" }
  return $name
}

function _parse_quoted {
  param($p, [string]$close)
  $quote = _parser_peek $p
  if ($quote -ne '"' -and $quote -ne "'") { throw "invalid quote" }
  $value = _parse_string $p $quote
  _parser_expect $p $close
  return $value
}

function _parse_string {
  param($p, [string]$quote)
  _parser_expect $p $quote
  $value = ''
  while ($p.cursor -lt $p.source.Length) {
    $char = [string]$p.source[$p.cursor]; $p.cursor++
    if ($char -eq $quote) {
      if ($value.Length -gt $script:QUERY_MAX_LITERAL_LENGTH) { throw "literal limit" }
      return $value
    }
    if ($char -eq '\') {
      if ($p.cursor -ge $p.source.Length) { throw "invalid escape" }
      $next = [string]$p.source[$p.cursor]; $p.cursor++
      if ($next -ne $quote -and $next -ne '\') { throw "invalid escape" }
      $value += $next
    }
    else { $value += $char }
  }
  throw "unclosed string"
}

function _parse_scalar {
  param($p)
  _parser_skip_spaces $p
  $char = _parser_peek $p
  if ($char -eq '"' -or $char -eq "'") { return _parse_string $p $char }
  $token = _parser_read_while $p '[^\]\)\s]'
  if ($token.Length -gt $script:QUERY_MAX_LITERAL_LENGTH) { throw "literal limit" }
  if ($token -eq 'true') { return $true }
  if ($token -eq 'false') { return $false }
  if ($token -eq 'null') { return $null }
  if ($token -match '^-?(?:0|[1-9]\d*)(?:\.\d+)?$') { return [double]$token }
  throw "invalid scalar"
}

function _evaluate_selector {
  param($data, [string]$path)
  $compiled = _parse_selector $path
  $state = @{ visited = 0 }
  $current = @($data)
  foreach ($step in $compiled.steps) { $current = @(_apply_step $current $step $state) }
  $values = @(_dedupe $current | Select-Object -First $script:QUERY_MAX_RESULTS)
  return _materialize $values $compiled.mode
}

function _apply_step {
  param($nodes, $step, $state)
  $result = New-Object System.Collections.ArrayList
  foreach ($node in @($nodes)) {
    _visit $state
    switch ($step.kind) {
      'property' { foreach ($v in @(_select_property $node $step.name)) { [void]$result.Add($v) } }
      'attribute' { $v = _select_attribute $node $step.name; if ($null -ne $v) { [void]$result.Add($v) } }
      'text' { $v = _select_text $node; if ($null -ne $v) { [void]$result.Add($v) } }
      'index' { if ($node -is [System.Collections.IList] -and $step.index -lt $node.Count) { [void]$result.Add($node[$step.index]) } }
      'wildcard' { foreach ($v in @(_select_children $node)) { [void]$result.Add($v) } }
      'filter' {
        $candidates = if ($node -is [System.Collections.IEnumerable] -and $node -isnot [string]) { @(_select_children $node) } else { @($node) }
        foreach ($candidate in $candidates) {
          if (_matches_predicate $candidate $step.predicate $state) { [void]$result.Add($candidate) }
        }
      }
      'recursive' { foreach ($v in @(_select_recursive $node $step.target $state 0)) { [void]$result.Add($v) } }
    }
    if ($result.Count -gt $script:QUERY_MAX_RESULTS) { throw "result limit" }
  }
  return @($result)
}

function _matches_predicate {
  param($node, $predicate, $state)
  $values = @($node)
  foreach ($step in $predicate.path) { $values = @(_apply_step $values $step $state) }
  if ($predicate.kind -eq 'exists') { return ($values.Count -gt 0) }
  foreach ($value in $values) {
    if (_compare_scalar $value $predicate.operator $predicate.value) { return $true }
  }
  return $false
}

function _compare_scalar {
  param($actual, [string]$operator, $expected)
  $a = _normalize_scalar $actual
  if ($operator -eq '=') { return ($a -eq $expected) }
  if ($operator -eq '!=') { return ($a -ne $expected) }
  if ($a -isnot [ValueType] -or $expected -isnot [ValueType]) { return $false }
  switch ($operator) {
    '>' { return ([double]$a -gt [double]$expected) }
    '>=' { return ([double]$a -ge [double]$expected) }
    '<' { return ([double]$a -lt [double]$expected) }
    '<=' { return ([double]$a -le [double]$expected) }
  }
  return $false
}

function _normalize_scalar {
  param($value)
  if ($null -eq $value -or $value -is [string] -or $value -is [ValueType]) { return $value }
  return [string]$value
}

function _select_property {
  param($node, [string]$name)
  if ($name -in @('__proto__', 'prototype', 'constructor')) { return @() }
  if ($node -is [System.Xml.XmlNode]) {
    $items = @()
    foreach ($child in @($node.ChildNodes)) {
      if ($child.NodeType -eq [System.Xml.XmlNodeType]::Element -and ($child.LocalName -eq $name -or $child.Name -eq $name -or (_xml_expanded_name $child) -eq $name)) { $items += $child }
    }
    return $items
  }
  try {
    $prop = $node.PSObject.Properties[$name]
    if ($prop) {
      if ($null -eq $prop.Value) { return @(,$script:__DSL_NULL) }
      return @(,$prop.Value)
    }
  } catch {}
  return @()
}

function _select_attribute {
  param($node, [string]$name)
  if ($node -isnot [System.Xml.XmlNode] -or -not $node.Attributes) { return $null }
  foreach ($attr in @($node.Attributes)) {
    if ($attr.LocalName -eq $name -or $attr.Name -eq $name -or (_xml_expanded_name $attr) -eq $name) { return $attr.Value }
  }
  return $null
}

function _select_text {
  param($node)
  if ($node -is [System.Xml.XmlNode]) { return $node.InnerText }
  if ($node -is [string] -or $node -is [ValueType]) { return [string]$node }
  return $null
}

function _select_children {
  param($node)
  if ($null -eq $node -or $node -is [string] -or $node -is [ValueType] -or (_is_dsl_null $node)) { return @() }
  if ($node -is [System.Xml.XmlNode]) { return @($node.ChildNodes | Where-Object { $_.NodeType -eq [System.Xml.XmlNodeType]::Element }) }
  if ($node -is [System.Collections.IEnumerable] -and $node -isnot [string] -and $node -isnot [System.Management.Automation.PSCustomObject]) { return @($node) }
  $items = @()
  try {
    foreach ($prop in @($node.PSObject.Properties)) {
      if ($prop.Name -notin @('__proto__', 'prototype', 'constructor')) { $items += $prop.Value }
    }
  } catch {}
  return $items
}

function _select_recursive {
  param($node, $target, $state, [int]$depth)
  if ($depth -gt $script:QUERY_MAX_RECURSIVE_DEPTH) { throw "recursive limit" }
  $items = @(_apply_step @($node) $target $state)
  foreach ($child in @(_select_children $node)) { $items += @(_select_recursive $child $target $state ($depth + 1)) }
  return $items
}

function _visit {
  param($state)
  $state.visited++
  if ($state.visited -gt $script:QUERY_MAX_VISITED_NODES) { throw "visited limit" }
}

function _dedupe {
  param($values)
  $seen = @{}; $result = @()
  foreach ($value in @($values)) {
    $key = if ($null -eq $value -or $value -is [string] -or $value -is [ValueType]) { "$($value.GetType().FullName):$value" } else { [Runtime.CompilerServices.RuntimeHelpers]::GetHashCode($value) }
    if (-not $seen.ContainsKey($key)) { $seen[$key] = $true; $result += $value }
  }
  return $result
}

function _materialize {
  param($values, [string]$mode)
  if ($mode -eq 'exists') { return $(if (@($values).Count -gt 0) { 'true' } else { 'false' }) }
  if ($mode -eq 'count') { return [string]@($values).Count }
  if ($mode -eq 'all') {
    $items = @($values | ForEach-Object { _json_value $_ })
    if ($items.Count -eq 1 -and $null -eq $items[0]) { return '[null]' }
    return (ConvertTo-Json -Compress -Depth 32 -InputObject $items)
  }
  if (@($values).Count -eq 0) { return $null }
  if ($mode -eq 'first') { return [string](_text_value @($values)[0]) }
  if (@($values).Count -gt 1) { return (ConvertTo-Json -Compress -Depth 32 -InputObject @(@($values | ForEach-Object { _json_value $_ }))) }
  return [string](_text_value @($values)[0])
}

function _json_value {
  param($value)
  if (_is_dsl_null $value) { return $null }
  if ($value -is [System.Xml.XmlNode]) { return $value.InnerText }
  return $value
}

function _text_value {
  param($value)
  if (_is_dsl_null $value) { return $null }
  if ($value -is [System.Xml.XmlNode]) { return $value.InnerText }
  return $value
}

function _is_dsl_null {
  param($value)
  try { return [bool]($value.PSObject.Properties['__dslensNull'] -and $value.__dslensNull -eq $true) } catch { return $false }
}

function _xml_expanded_name {
  param($node)
  if ($node.NamespaceURI) { return "{$($node.NamespaceURI)}$($node.LocalName)" }
  return $node.Name
}

# =========================
# RESOLUÇÃO SÍNCRONA DE DADOS
# =========================
function resolve_dsl_data {
  <#
  .SYNOPSIS
    Resolve um path DSL sobre dado estruturado já carregado.
  .PARAMETER data
    Objeto JSON, XML ou equivalente do binding.
  .PARAMETER path
    Path canônico iniciado por ponto ou colchete.
  .OUTPUTS
    String determinística ou $null em falha esperada.
  #>
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true, Position = 0)]
    $data,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$path,

    [Parameter(Position = 2)]
    [ScriptBlock]$callback
  )

  try {
    return _evaluate_selector -data $data -path $path
  }
  catch {
    # PROTECAO: a fachada fail-safe não propaga exceção de navegação.
    _emit "invalid path" "e" $callback
    return $null
  }
}

# =========================
# RESOLVER DSL
# =========================
function resolve_parser_expression {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$source,

    [Parameter(Position = 1)]
    [ScriptBlock]$callback,

    [int]$__depth = 0,
    [int]$__chain = 0,
    [hashtable]$envValues
  )

  # init runtime garantido (TLS / ambiente) - proteção contra chamada direta
  try {
    if (-not $script:__DSL_RUNTIME_INIT) {
      _init_runtime
      $script:__DSL_RUNTIME_INIT = $true
    }
  }
  catch {}

  if ($__depth -gt $script:MAX_DSL_DEPTH) {
    # FIX-BUG: constante correta
    _emit "max depth reached" "e" $callback
    return $null
  }

  if ($__chain -gt $script:MAX_DSL_CHAINING) {
    # FIX-BUG: constante correta
    _emit "max chain reached" "e" $callback
    return $null
  }

  $matchesAll = [regex]::Matches($source, '\$\{\s*(["'']).+?\1\s*\}')

  if ($matchesAll.Count -gt $script:MAX_DSL_CHAINING) {
    # FIX-BUG: constante correta
    _emit "dsl chain limit exceeded" "e" $callback
    return $null
  }

  if ($matchesAll.Count -gt 1) {
    _emit "multiple DSL expressions not allowed" "e" $callback
    return $null
  }

  if ($matchesAll.Count -eq 0) {

    # proteção contra DSL malformado residual
    if ($source -match '\$\{') {
      _emit "malformed DSL" "e" $callback
      return $null
    }

    return $source
  }

  $dsl = _extract_dsl $source
  if (-not $dsl) { return $null }

  $key = [Convert]::ToBase64String(
    [Text.Encoding]::UTF8.GetBytes("$($dsl.url)::__::$($dsl.path)::__::$($dsl.request | ConvertTo-Json -Compress -Depth 20)")
  )

  if (((_now) - $script:__DSL_RUNTIME_START).TotalSeconds -gt $script:MAX_GLOBAL_TIMEOUT) {
    # FIX-BUG: constante correta
    _emit "global timeout reached" "e" $callback
    return $null
  }

  $found = $false
  $cached = _cache_get -key $key -found ([ref]$found)

  if ($found) {
    return [string]$cached
  }

  $raw = _fetch_raw -url $dsl.url -callback $callback -requestOptions $dsl.request -envValues $envValues
  if (-not $raw) {
    _cache_set $key $null  # negative cache
    return $null
  }

  $parsed = _parse_content -raw $raw -callback $callback
  if (-not $parsed) {
    _cache_set $key $null
    return $null
  }

  $value = resolve_dsl_data -data $parsed -path $dsl.path -callback $callback
  if ($null -eq $value) {
    _cache_set $key $null
    return $null
  }

  # HARD RULE: encadeamento proibido
  if (has_parser_expression $value) {
    _emit "nested DSL not allowed" "e" $callback
    return $null
  }

  _cache_set $key $value

  return $value
}

# =========================
# SUPERFÍCIE CANÔNICA MULTILINGUAGEM
# =========================
function hasParserExpression {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true, Position = 0)][string]$source)
  return has_parser_expression -source $source
}

function resolveDslData {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true, Position = 0)][object]$data,
    [Parameter(Mandatory = $true, Position = 1)][string]$path,
    [Parameter(Position = 2)][ScriptBlock]$callback
  )
  return resolve_dsl_data -data $data -path $path -callback $callback
}

function resolveParserExpression {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true, Position = 0)][string]$source,
    [Parameter(Position = 1)][hashtable]$options = @{},
    [Parameter(Position = 2)][ScriptBlock]$callback
  )
  $unknown = @($options.Keys | Where-Object { $_ -ne 'env' })
  if ($unknown.Count -gt 0) { return $null }
  $envValues = if ($options.ContainsKey('env')) { $options.env } else { $null }
  if ($null -ne $envValues -and $envValues -isnot [hashtable]) { return $null }
  return resolve_parser_expression -source $source -callback $callback -envValues $envValues
}

# =========================
# MUTEX GLOBAL (ISOLAMENTO)
# =========================
function _acquire_mutex {
  param([string]$name = "Global\DSLParserMutex")

  try {
    $created = $false
    $mutex = New-Object System.Threading.Mutex($false, $name, [ref]$created)

    if (-not $mutex.WaitOne(5000)) {
      return $null
    }

    return $mutex
  }
  catch {
    return $null
  }
}

function _release_mutex {
  param($mutex)

  try {
    if ($mutex) {
      try { $mutex.ReleaseMutex() | Out-Null } catch {}
      $mutex.Dispose()
    }
  }
  catch {}
}

# =========================
# CONTEXTO / COMPAT
# =========================
function _init_runtime {  
  try {
    # TLS seguro (PS 5.1)
    [Net.ServicePointManager]::Expect100Continue = $false
    [Net.ServicePointManager]::DefaultConnectionLimit = 50
    [Net.ServicePointManager]::SecurityProtocol = `
      [Net.SecurityProtocolType]::Tls12 -bor `
      [Net.SecurityProtocolType]::Tls11 -bor `
      [Net.SecurityProtocolType]::Tls
  }
  catch {}

  try {
    # ExecPolicy somente processo
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue
  }
  catch {}
}

# =========================
# MAIN (ORQUESTRADOR)
# =========================
function main {
  param(
    [string]$sourceInput,
    [ScriptBlock]$callback
  )

  _init_runtime

  $mutex = _acquire_mutex
  if (-not $mutex) {
    _emit "mutex busy" "w" $callback
    return $null
  }

  try {
    if (-not $sourceInput) {
      _emit "no input" "w" $callback
      return $null
    }

    $script:__DSL_RUNTIME_START = [DateTime]::UtcNow
    return resolve_parser_expression -source:$sourceInput -callback:$callback
  }
  catch {
    _emit "main failure: $($_.Exception.Message)" "e" $callback
    return $null
  }
  finally {
    _release_mutex $mutex
  }
}

# =========================
# AUTO-INVOCAÇÃO
# =========================
try {
  if ($MyInvocation.MyCommand.Path -and $MyInvocation.InvocationName -ne '.') {

    $envInput = $env:DSL_INPUT
    $argInput = $args | Select-Object -First 1

    $inputValue = if ($argInput) { $argInput } else { $envInput }

    if ($inputValue) {
      main -sourceInput $inputValue
    }
  }
}
catch {}
