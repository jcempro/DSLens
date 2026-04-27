#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
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
    - Padrão Base: ${"URL_API"}.path.subcampo[index].valor
    - Delimitadores: URL de origem obrigatoriamente entre ${"..."} ou ${'...'}.
    - Deep Nesting: Suporta acesso a membros (.campo) e índices de arrays ([0]).
    - Hibridismo: Compatível com strings de metadados (ex: ".exe,x64 | ${DSL}").
    - Deve resolver também indices semânticos, ex.: [@attr="img"] e [@attr='img']
      onde "attr" indica o nome de qualquer atributo (ex. src, name, href...) que deve
      casar com o valor de exemplo 'img', DSL retorna a primeira ocorrência de casar.

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
"""

# =========================
# CONSTANTS
# =========================

MAX_DSL_DEPTH = 5
MAX_DSL_CHAINING = 3

MAX_EXECUTION_TIMEOUT = 90
MAX_NETWORK_TIMEOUT = 30
MAX_DSL_RESOLUTION_TIMEOUT = 45
MAX_GLOBAL_TIMEOUT = 300

CACHE_TTL_SECONDS = 60
CACHE_MAX_ENTRIES = 512

RETRY_MAX_ATTEMPTS = 3
RETRY_BACKOFF_BASE_MS = 200
RETRY_BACKOFF_MAX_MS = 2000

ERROR_HTTP = 'HTTP_ERROR'
ERROR_TIMEOUT = 'TIMEOUT_EXCEEDED'
ERROR_INVALID_PATH = 'INVALID_PATH'
ERROR_PARSE_FAILURE = 'PARSE_FAILURE'

# =========================
# IMPORTS (NATIVOS)
# =========================

import base64
import json
import re
import threading
import time
import xml.etree.ElementTree as ET
from collections.abc import Iterable
from datetime import datetime, timedelta
from urllib.parse import urlparse
from urllib.request import Request, urlopen

try:
    import yaml

    _YAML_AVAILABLE = True
except Exception:
    _YAML_AVAILABLE = False  # PROTECAO: fallback silencioso

# =========================
# ESTADO GLOBAL
# =========================

__DSL_RUNTIME_START = datetime.utcnow()
__PARSER_CACHE = {}
__CACHE_LOCK = threading.Lock()
__MUTEX = threading.Lock()

# =========================
# DISK CACHE (OFFLINE-FIRST)
# =========================

import os
import tempfile

__DISK_CACHE_DIR = os.path.join(
    tempfile.gettempdir(), 'dsl_parser_cache'
)


def _disk_cache_path(key):
    return os.path.join(__DISK_CACHE_DIR, key + '.cache')


def _disk_cache_get(key):
    try:
        path = _disk_cache_path(key)
        if not os.path.exists(path):
            return None

        # TTL respeitado
        if time.time() - os.path.getmtime(path) > CACHE_TTL_SECONDS:
            try:
                os.remove(path)
            except Exception:
                pass
            return None

        with open(path, 'r', encoding='utf-8') as f:
            data = f.read()
            return data if data != '__NULL__' else None

    except Exception:
        return None


def _disk_cache_set(key, value):
    try:
        os.makedirs(__DISK_CACHE_DIR, exist_ok=True)
        path = _disk_cache_path(key)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(value if value is not None else '__NULL__')

    except Exception:
        pass


# =========================
# UTIL
# =========================


def _now():
    return datetime.utcnow()


def _emit(msg, typ, callback):
    if callable(callback):
        try:
            callback(msg, typ)
        except Exception:
            pass  # PROTECAO: callback não deve quebrar fluxo


# =========================
# DETECÇÃO DSL
# =========================

_DSL_REGEX = re.compile(r'\$\{\s*(["\']).+?\1\s*\}')


def has_parser_expression(source):
    if not source:
        return False
    return bool(_DSL_REGEX.search(source))


# =========================
# EXTRAÇÃO DSL
# =========================


def _extract_dsl(source):
    m = re.search(r'\$\{\s*(["\'])(?P<url>.*?)\1\s*\}', source)
    if not m:
        return None

    url = m.group('url')
    after = source[m.end() :]

    path = ''
    if after:
        tmp = after.strip()
        if tmp.startswith('.') or tmp.startswith('['):
            tmp = tmp.split('|')[0].strip()
            path = tmp

    return {'url': url, 'path': path}


# =========================
# CACHE
# =========================


def _cache_get(key):
    with __CACHE_LOCK:
        entry = __PARSER_CACHE.get(key)
        if not entry:
            return None, False

        if _now() > entry['expire']:
            __PARSER_CACHE.pop(key, None)
            return None, False

        return entry[
            'value'
        ], True  # PRESERVADO: comportamento externo


def _cache_set(key, value):
    with __CACHE_LOCK:
        if len(__PARSER_CACHE) >= CACHE_MAX_ENTRIES:
            __PARSER_CACHE.clear()  # PROTECAO: evita crescimento descontrolado

        __PARSER_CACHE[key] = {
            'value': value,
            'expire': _now() + timedelta(seconds=CACHE_TTL_SECONDS),
            'is_null': value
            is None,  # PROTECAO: diferencia cache negativo
        }


# =========================
# FETCH
# =========================


def _sanitize_url(url, callback):
    try:
        clean = str(url).strip().strip('"\' ')
        parsed = urlparse(clean)

        if parsed.scheme not in ('http', 'https'):
            _emit('invalid url scheme', 'e', callback)
            return None

        return parsed.geturl()
    except Exception:
        _emit('invalid url', 'e', callback)
        return None


def _fetch_raw(url, callback):
    url = _sanitize_url(url, callback)
    if not url:
        return None

    start = _now()

    def _method_urllib():
        req = Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
            },
        )
        with urlopen(req, timeout=MAX_NETWORK_TIMEOUT) as resp:
            return resp.read().decode('utf-8', errors='replace')

    def _method_raw_socket():  # FIX-BUG: fallback alternativo sem urllib alto nível
        import socket

        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or (
            443 if parsed.scheme == 'https' else 80
        )

        with socket.create_connection(
            (host, port), timeout=MAX_NETWORK_TIMEOUT
        ) as sock:
            req = f'GET {parsed.path or "/"} HTTP/1.0\r\nHost: {host}\r\n\r\n'
            sock.sendall(req.encode())
            data = sock.recv(65536)
            return data.decode(errors='ignore')

    methods = [_method_urllib, _method_raw_socket]

    for method in methods:
        for i in range(RETRY_MAX_ATTEMPTS):
            if (
                _now() - start
            ).total_seconds() > MAX_DSL_RESOLUTION_TIMEOUT:
                _emit('fetch timeout per demand', 'w', callback)
                break

            try:
                result = method()
                if result and str(result).strip():
                    return result
            except Exception:
                _emit(f'fetch retry [{i}] {url}', 'w', callback)
                delay = min(
                    RETRY_BACKOFF_BASE_MS * (i + 1),
                    RETRY_BACKOFF_MAX_MS,
                )
                time.sleep(delay / 1000.0)

    _emit(f'fetch failed {url}', 'e', callback)
    return None


# =========================
# PARSE
# =========================


def _parse_content(raw, callback):
    if raw is None:
        return None

    if not isinstance(raw, str):
        return raw

    # JSON
    try:
        return json.loads(raw)
    except Exception:
        pass

    # XML
    try:
        return ET.fromstring(raw)
    except Exception:
        pass

    # YAML
    if _YAML_AVAILABLE:
        try:
            return yaml.safe_load(raw)
        except Exception:
            pass

    _emit('parse failed', 'w', callback)
    return None


# =========================
# NAVEGAÇÃO
# =========================


def _get_prop(obj, name):
    try:
        if isinstance(obj, dict):
            return obj.get(name)

        if isinstance(obj, list):
            return None

        if isinstance(obj, ET.Element):
            nodes = obj.findall(name)
            if nodes:
                return nodes
            if name in obj.attrib:
                return obj.attrib.get(name)
            return (
                None  # FIX-BUG: evita retorno implícito inconsistente
            )

        return getattr(obj, name, None)
    except Exception:
        return None


def _navigate(obj, path, callback):
    if not path:
        return obj

    tokens = re.findall(
        r'[^.\[\]]+(?:\[[^\]]+\])*', re.sub(r'^\.', '', path)
    )  # FIX-BUG: tokenização segura
    current = obj

    for token in tokens:
        if current is None:
            return None

        # index
        m = re.match(r'^(.+?)\[(\d+)\]$', token) or re.match(
            r'^\[(\d+)\]$', token
        )
        if m:
            if len(m.groups()) == 2:
                name, idx = m.group(1), int(m.group(2))
                current = _get_prop(current, name)
            else:
                idx = int(m.group(1))

            if not isinstance(current, Iterable) or isinstance(
                current, (str, bytes)
            ):
                return None  # FIX-BUG: comportamento equivalente ao PS IEnumerable

            if idx >= len(current):
                return None

            current = current[idx]
            continue

        # filtro
        m = re.match(
            r'^(.+?)\[@(.+?)=["\'](.+?)["\']\]$', token
        ) or re.match(r'^\[@(.+?)=["\'](.+?)["\']\]$', token)

        if m:
            if len(m.groups()) == 3:
                name, attr, val = m.group(1), m.group(2), m.group(3)
                current = _get_prop(current, name)
            else:
                attr, val = m.group(1), m.group(2)

            if not isinstance(current, Iterable) or isinstance(
                current, (str, bytes)
            ):
                return None  # FIX-BUG: comportamento equivalente ao PS IEnumerable

            found = None
            for item in current:
                try:
                    v = None
                    if isinstance(item, ET.Element):
                        v = item.attrib.get(attr)
                    elif isinstance(item, dict):
                        v = item.get(attr)

                    if v is not None and str(v) == val:
                        found = item
                        break
                except Exception:
                    pass

            if found is None:
                return None

            current = found
            continue

        # acesso simples
        current = _get_prop(current, token)

    return current


# =========================
# RESOLVE DSL
# =========================


def resolve_parser_expression(
    source, callback=None, __depth=0, __chain=0
):
    global __DSL_RUNTIME_START

    if __depth > MAX_DSL_DEPTH:
        _emit('max depth reached', 'e', callback)
        return None

    if __chain > MAX_DSL_CHAINING:
        _emit('max chain reached', 'e', callback)
        return None

    matches = list(_DSL_REGEX.finditer(source))

    if len(matches) > MAX_DSL_CHAINING:
        _emit('dsl chain limit exceeded', 'e', callback)
        return None

    if len(matches) > 1:
        _emit('multiple DSL expressions not allowed', 'e', callback)
        return None

    if len(matches) == 0:
        if '${' in source:
            _emit('malformed DSL', 'e', callback)
            return None
        return source

    dsl = _extract_dsl(source)
    if not dsl:
        return None

    key = base64.b64encode(
        f'{dsl["url"]}::__::{dsl["path"]}'.encode()
    ).decode()

    if (
        _now() - __DSL_RUNTIME_START
    ).total_seconds() > MAX_GLOBAL_TIMEOUT:
        _emit('global timeout reached', 'e', callback)
        return None

    cached, found = _cache_get(key)
    if found:
        return str(cached) if cached is not None else None

    # =========================
    # OFFLINE-FIRST (DISK CACHE)
    # =========================
    try:
        local_value = _disk_cache_get(key)
        if local_value is not None:
            _emit('offline cache hit', 'i', callback)
            _cache_set(key, local_value)  # reidrata memória
            return str(local_value)
    except Exception:
        pass  # isolamento total (fail-safe)

    raw = _fetch_raw(dsl['url'], callback)
    if not raw:
        _cache_set(key, None)
        try:
            _disk_cache_set(key, None)
        except Exception:
            pass
        return None

    parsed = _parse_content(raw, callback)
    if not parsed:
        _cache_set(key, None)
        try:
            _disk_cache_set(key, None)
        except Exception:
            pass
        return None

    value = _navigate(parsed, dsl['path'], callback)
    if value is None:
        _cache_set(key, None)
        try:
            _disk_cache_set(key, None)
        except Exception:
            pass
        return None

    value = str(value)

    if has_parser_expression(value):
        _emit('nested DSL not allowed', 'e', callback)
        return None

    _cache_set(key, value)

    try:
        _disk_cache_set(key, value)
    except Exception:
        pass  # não pode quebrar fluxo

    return value


# =========================
# MAIN
# =========================


def main(source_input, callback=None):
    global __DSL_RUNTIME_START

    if not __MUTEX.acquire(timeout=5):
        _emit('mutex busy', 'w', callback)
        return None

    try:
        if not source_input:
            _emit('no input', 'w', callback)
            return None

        __DSL_RUNTIME_START = _now()
        return resolve_parser_expression(source_input, callback)

    except Exception as e:
        _emit(f'main failure: {str(e)}', 'e', callback)
        return None

    finally:
        __MUTEX.release()


# =========================
# AUTO-INVOCAÇÃO
# =========================

if __name__ == '__main__':
    import os
    import sys

    try:
        env_input = os.environ.get('DSL_INPUT')
        arg_input = sys.argv[1] if len(sys.argv) > 1 else None

        value = arg_input if arg_input else env_input

        if value:
            result = main(value)
            if result:
                print(result)
    except Exception:
        pass
