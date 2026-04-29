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

Set-Variable ERROR_HTTP                 'HTTP_ERROR'       -Option Constant -Scope Script
Set-Variable ERROR_TIMEOUT              'TIMEOUT_EXCEEDED' -Option Constant -Scope Script
Set-Variable ERROR_INVALID_PATH         'INVALID_PATH'     -Option Constant -Scope Script
Set-Variable ERROR_PARSE_FAILURE        'PARSE_FAILURE'    -Option Constant -Scope Script

#endregion

# init lazy (evita chamada antes da definição de função)
if (-not $script:__DSL_RUNTIME_START) {
  $script:__DSL_RUNTIME_START = [DateTime]::UtcNow
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

  # captura estrita da URL
  if ($source -notmatch '\$\{\s*(["''])(?<url>.*?)\1\s*\}') {
    return $null
  }

  $url = $matches['url']

  # extrai path APENAS após fechamento da DSL
  $after = $source.Substring($matches[0].Length)

  $path = ""
  if ($after) {
    $tmp = $after.Trim()

    # aceita apenas path válido (começa com . ou [)
    if ($tmp -match '^[\.\[]') {
      # remove qualquer lixo após pipe (segurança)
      $tmp = ($tmp -split '\|')[0].Trim()
      $path = $tmp
    }
  }

  return @{
    url  = $url
    path = $path
  }
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
    [ScriptBlock]$callback
  )

  $methods = @(
    { Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 15 `
        -Headers @{ 
        "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        "Accept"     = "application/json"
      } `
        -ErrorAction Stop },
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
    }
  )

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
    [int]$__chain = 0
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
    [Text.Encoding]::UTF8.GetBytes("$($dsl.url)::__::$($dsl.path)")
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

  $raw = _fetch_raw -url $dsl.url -callback $callback
  if (-not $raw) {
    _cache_set $key $null  # negative cache
    return $null
  }

  $parsed = _parse_content -raw $raw -callback $callback
  if (-not $parsed) {
    _cache_set $key $null
    return $null
  }

  $value = _navigate -obj $parsed -path $dsl.path -callback $callback
  if ($null -eq $value) {
    _cache_set $key $null
    return $null
  }

  $value = [string]$value
  
  # HARD RULE: encadeamento proibido
  if (has_parser_expression $value) {
    _emit "nested DSL not allowed" "e" $callback
    return $null
  }

  _cache_set $key $value

  return $value
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