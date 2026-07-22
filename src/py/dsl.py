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

QUERY_MAX_LENGTH = 2048
QUERY_MAX_STEPS = 64
QUERY_MAX_RECURSIVE_DEPTH = 32
QUERY_MAX_VISITED_NODES = 10000
QUERY_MAX_RESULTS = 1024
QUERY_MAX_FILTERS = 32
QUERY_MAX_LITERAL_LENGTH = 512

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
from typing import Any, Callable, Mapping
from urllib.parse import urlencode, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen

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
    m = re.match(r'^\$\{\s*(["\'])(?P<url>.*?)\1', source)
    if not m:
        return None
    url = m.group('url')
    cursor = m.end()
    while cursor < len(source) and source[cursor].isspace():
        cursor += 1
    request = None
    if cursor < len(source) and source[cursor] == ';':
        close = _find_expression_close(source, cursor + 1)
        if close < 0:
            return None
        parameter = source[cursor + 1 : close].strip()
        if parameter.startswith('request='):
            parameter = parameter[len('request=') :].strip()
        elif not parameter.startswith('{'):
            return None
        try:
            request = _validate_request(json.loads(parameter))
        except Exception:
            return None
        cursor = close
    if cursor >= len(source) or source[cursor] != '}':
        return None
    path = source[cursor + 1 :]
    if not _is_selector_start(path):
        return None
    return {'url': url, 'path': path, 'request': request}


def _find_expression_close(source, start):
    depth, quote, escaped = 1, '', False
    for index in range(start, len(source)):
        character = source[index]
        if quote:
            if escaped:
                escaped = False
            elif character == '\\':
                escaped = True
            elif character == quote:
                quote = ''
        elif character == '"':
            quote = character
        elif character == '{':
            depth += 1
        elif character == '}':
            depth -= 1
            if depth == 0:
                return index
    return -1


def _validate_request(value):
    if not isinstance(value, dict) or set(value) - {
        'method', 'query', 'headers', 'body'
    }:
        raise ValueError('invalid request')
    method = value.get('method', 'GET')
    if method not in ('GET', 'POST'):
        raise ValueError('invalid method')
    query = value.get('query', {})
    headers = value.get('headers', {})
    if not isinstance(query, dict) or not all(
        isinstance(item, (str, int, float, bool))
        for item in query.values()
    ):
        raise ValueError('invalid query')
    if not isinstance(headers, dict):
        raise ValueError('invalid headers')
    for name, item in headers.items():
        if name.lower() in {
            'host', 'content-length', 'connection', 'transfer-encoding'
        }:
            raise ValueError('blocked header')
        if not isinstance(item, str) and not (
            isinstance(item, dict)
            and set(item) == {'env'}
            and isinstance(item['env'], str)
        ):
            raise ValueError('invalid header')
    body = value.get('body')
    if body is not None:
        if method != 'POST' or not isinstance(body, dict):
            raise ValueError('invalid body')
        if body.get('encoding') not in ('json', 'form', 'text') or 'value' not in body:
            raise ValueError('invalid body')
    return {'method': method, 'query': query, 'headers': headers, 'body': body}


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


def _fetch_raw(url, callback, request_options=None, env=None):
    url = _sanitize_url(url, callback)
    if not url:
        return None

    start = _now()

    request_options = request_options or {
        'method': 'GET', 'query': {}, 'headers': {}, 'body': None
    }
    query = urlencode(request_options['query'])
    if query:
        url = f'{url}{"&" if "?" in url else "?"}{query}'

    def _method_urllib():
        headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'}
        for name, item in request_options['headers'].items():
            if isinstance(item, dict):
                resolved = (env or {}).get(item['env'])
                if resolved is None:
                    raise ValueError('missing environment value')
                headers[name] = resolved
            else:
                headers[name] = item
        data = None
        body = request_options.get('body')
        if body:
            if body['encoding'] == 'json':
                data = json.dumps(body['value'], separators=(',', ':')).encode()
                headers.setdefault('Content-Type', 'application/json')
            elif body['encoding'] == 'form':
                data = urlencode(body['value']).encode()
                headers.setdefault('Content-Type', 'application/x-www-form-urlencoded')
            else:
                data = str(body['value']).encode()
        req = Request(
            url,
            data=data,
            headers=headers,
            method=request_options['method'],
        )
        sensitive = any(
            name.lower() in ('authorization', 'cookie', 'proxy-authorization')
            for name in headers
        )
        if sensitive:
            class _NoRedirect(HTTPRedirectHandler):
                def redirect_request(self, *_args, **_kwargs):
                    return None

            response = build_opener(_NoRedirect()).open(
                req, timeout=MAX_NETWORK_TIMEOUT
            )
        else:
            response = urlopen(req, timeout=MAX_NETWORK_TIMEOUT)
        with response as resp:
            return resp.read().decode('utf-8', errors='replace')

    methods = [_method_urllib]

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

    if '<!DOCTYPE' in raw.upper():
        _emit('xml doctype forbidden', 'e', callback)
        return None

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


def _is_selector_start(path):
    return bool(re.match(r'^(?:[.\[]|(?:first|all|count|exists)\()', path or ''))


class _SelectorParser:
    def __init__(self, source):
        if len(source) > QUERY_MAX_LENGTH:
            raise ValueError('query limit')
        self.source = source.strip()
        self.cursor = 0
        self.filters = 0

    def parse(self):
        mode = 'default'
        match = re.match(r'^(first|all|count|exists)\(', self.source)
        if match:
            mode = match.group(1)
            close = self._find_close(match.end() - 1)
            if close != len(self.source) - 1:
                raise ValueError('invalid function')
            self.source = self.source[match.end():close]
            self.cursor = 0
        steps = self._parse_path()
        if len(steps) > QUERY_MAX_STEPS:
            raise ValueError('step limit')
        return {'mode': mode, 'steps': steps}

    def _parse_path(self):
        steps = []
        while self.cursor < len(self.source):
            steps.append(self._parse_step())
        return steps

    def _parse_step(self):
        if self._consume('..'):
            return {'kind': 'recursive', 'target': self._parse_recursive_target()}
        if self._consume('.text()'):
            return {'kind': 'text'}
        if self._consume('.@'):
            return {'kind': 'attribute', 'name': self._parse_name()}
        if self._consume('.['):
            return {'kind': 'property', 'name': self._parse_quoted(']')}
        if self._consume('.'):
            return {'kind': 'property', 'name': self._parse_name()}
        if self._consume('[*]'):
            return {'kind': 'wildcard'}
        if self._consume('[?('):
            return self._parse_filter()
        if self._peek() == '[':
            return self._parse_index_or_legacy_filter()
        raise ValueError('unexpected token')

    def _parse_recursive_target(self):
        if self._consume('@'):
            return {'kind': 'attribute', 'name': self._parse_name()}
        if self._consume('['):
            return {'kind': 'property', 'name': self._parse_quoted(']')}
        return {'kind': 'property', 'name': self._parse_name()}

    def _parse_filter(self):
        self.filters += 1
        if self.filters > QUERY_MAX_FILTERS:
            raise ValueError('filter limit')
        if not self._consume('@'):
            raise ValueError('invalid filter')
        start = self.cursor
        while self.cursor < len(self.source):
            self._skip_spaces()
            if re.match(r'^(=|!=|>=|<=|>|<|\)\])', self.source[self.cursor:]):
                break
            self._parse_step()
        path = _SelectorParser(self.source[start:self.cursor])._parse_path()
        self._skip_spaces()
        operator = self._parse_operator()
        if not operator:
            self._expect(')]')
            return {'kind': 'filter', 'predicate': {'kind': 'exists', 'path': path}}
        value = self._parse_scalar()
        self._skip_spaces()
        self._expect(')]')
        return {
            'kind': 'filter',
            'predicate': {
                'kind': 'compare',
                'path': path,
                'operator': operator,
                'value': value,
            },
        }

    def _parse_index_or_legacy_filter(self):
        self._expect('[')
        if self._consume('@'):
            name = self._parse_name()
            self._expect('=')
            value = self._parse_scalar()
            self._expect(']')
            return {
                'kind': 'filter',
                'predicate': {
                    'kind': 'compare',
                    'path': [{'kind': 'property', 'name': name}],
                    'operator': '=',
                    'value': value,
                },
            }
        digits = self._read_while(r'[0-9]')
        if not digits:
            raise ValueError('invalid index')
        self._expect(']')
        return {'kind': 'index', 'index': int(digits)}

    def _parse_scalar(self):
        self._skip_spaces()
        char = self._peek()
        if char in ('"', "'"):
            return self._parse_string(char)
        token = self._read_while(r'[^\]\)\s]')
        if len(token) > QUERY_MAX_LITERAL_LENGTH:
            raise ValueError('literal limit')
        if token == 'true':
            return True
        if token == 'false':
            return False
        if token == 'null':
            return None
        if re.match(r'^-?(?:0|[1-9]\d*)(?:\.\d+)?$', token):
            return float(token) if '.' in token else int(token)
        raise ValueError('invalid scalar')

    def _parse_operator(self):
        for operator in ('>=', '<=', '!=', '=', '>', '<'):
            if self._consume(operator):
                return operator
        return ''

    def _parse_name(self):
        name = self._read_while(r'[A-Za-z0-9_:\-${}]')
        if not name or len(name) > QUERY_MAX_LITERAL_LENGTH:
            raise ValueError('invalid name')
        return name

    def _parse_quoted(self, close):
        quote = self._peek()
        if quote not in ('"', "'"):
            raise ValueError('invalid quote')
        value = self._parse_string(quote)
        self._expect(close)
        return value

    def _parse_string(self, quote):
        self._expect(quote)
        value = ''
        while self.cursor < len(self.source):
            char = self.source[self.cursor]
            self.cursor += 1
            if char == quote:
                if len(value) > QUERY_MAX_LITERAL_LENGTH:
                    raise ValueError('literal limit')
                return value
            if char == '\\':
                if self.cursor >= len(self.source):
                    raise ValueError('invalid escape')
                nxt = self.source[self.cursor]
                self.cursor += 1
                if nxt not in (quote, '\\'):
                    raise ValueError('invalid escape')
                value += nxt
            else:
                value += char
        raise ValueError('unclosed string')

    def _find_close(self, open_index):
        depth, quote, escaped = 0, '', False
        for index in range(open_index, len(self.source)):
            char = self.source[index]
            if quote:
                if escaped:
                    escaped = False
                elif char == '\\':
                    escaped = True
                elif char == quote:
                    quote = ''
            elif char in ('"', "'"):
                quote = char
            elif char == '(':
                depth += 1
            elif char == ')':
                depth -= 1
                if depth == 0:
                    return index
        return -1

    def _read_while(self, pattern):
        start = self.cursor
        while self.cursor < len(self.source) and re.match(pattern, self.source[self.cursor]):
            self.cursor += 1
        return self.source[start:self.cursor]

    def _skip_spaces(self):
        self._read_while(r'\s')

    def _consume(self, token):
        if not self.source.startswith(token, self.cursor):
            return False
        self.cursor += len(token)
        return True

    def _expect(self, token):
        if not self._consume(token):
            raise ValueError(f'expected {token}')

    def _peek(self):
        return self.source[self.cursor] if self.cursor < len(self.source) else ''


def _evaluate_selector(data, path):
    compiled = _SelectorParser(path).parse()
    state = {'visited': 0}
    current = [data]
    for step in compiled['steps']:
        current = _apply_step(current, step, state)
    values = _dedupe(current)[:QUERY_MAX_RESULTS]
    return _materialize(values, compiled['mode'])


def _apply_step(nodes, step, state):
    result = []
    for node in nodes:
        _visit(state)
        kind = step['kind']
        if kind == 'property':
            result.extend(_select_property(node, step['name']))
        elif kind == 'attribute':
            value = _select_attribute(node, step['name'])
            if value is not None:
                result.append(value)
        elif kind == 'text':
            value = _select_text(node)
            if value is not None:
                result.append(value)
        elif kind == 'index':
            if isinstance(node, list) and step['index'] < len(node):
                result.append(node[step['index']])
        elif kind == 'wildcard':
            result.extend(_select_children(node))
        elif kind == 'filter':
            candidates = _select_children(node) if isinstance(node, (list, ET.Element)) else [node]
            for candidate in candidates:
                if _matches_predicate(candidate, step['predicate'], state):
                    result.append(candidate)
        elif kind == 'recursive':
            result.extend(_select_recursive(node, step['target'], state, 0))
        if len(result) > QUERY_MAX_RESULTS:
            raise ValueError('result limit')
    return result


def _matches_predicate(node, predicate, state):
    values = [node]
    for step in predicate['path']:
        values = _apply_step(values, step, state)
    if predicate['kind'] == 'exists':
        return bool(values)
    return any(
        _compare_scalar(value, predicate['operator'], predicate['value'])
        for value in values
    )


def _compare_scalar(actual, operator, expected):
    actual = _normalize_scalar(actual)
    if operator == '=':
        return actual == expected
    if operator == '!=':
        return actual != expected
    if not isinstance(actual, (int, float)) or not isinstance(expected, (int, float)):
        return False
    return {
        '>': actual > expected,
        '>=': actual >= expected,
        '<': actual < expected,
        '<=': actual <= expected,
    }[operator]


def _normalize_scalar(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def _select_property(node, name):
    if isinstance(node, dict):
        return [node[name]] if name in node else []
    if isinstance(node, ET.Element):
        return [
            child for child in list(node)
            if child.tag == name or _xml_expanded_name(child.tag) == name
        ]
    return []


def _select_attribute(node, name):
    if not isinstance(node, ET.Element):
        return None
    for key, value in node.attrib.items():
        if key == name or _xml_expanded_name(key) == name:
            return value
    return None


def _select_text(node):
    if isinstance(node, ET.Element):
        return ''.join(node.itertext())
    if isinstance(node, (str, int, float, bool)):
        return str(node)
    return None


def _select_children(node):
    if isinstance(node, list):
        return list(node)
    if isinstance(node, dict):
        return [node[key] for key in node]
    if isinstance(node, ET.Element):
        return list(node)
    return []


def _select_recursive(node, target, state, depth):
    if depth > QUERY_MAX_RECURSIVE_DEPTH:
        raise ValueError('recursive limit')
    result = list(_apply_step([node], target, state))
    for child in _select_children(node):
        result.extend(_select_recursive(child, target, state, depth + 1))
    return result


def _visit(state):
    state['visited'] += 1
    if state['visited'] > QUERY_MAX_VISITED_NODES:
        raise ValueError('visited limit')


def _dedupe(values):
    seen, result = set(), []
    for value in values:
        key = id(value) if isinstance(value, (dict, list, ET.Element)) else (type(value).__name__, value)
        if key in seen:
            continue
        seen.add(key)
        result.append(value)
    return result


def _materialize(values, mode):
    if mode == 'exists':
        return 'true' if values else 'false'
    if mode == 'count':
        return str(len(values))
    if mode == 'all':
        return json.dumps([_json_value(value) for value in values], separators=(',', ':'), sort_keys=True)
    if mode == 'first':
        return None if not values or values[0] is None else str(_text_value(values[0]))
    if not values:
        return None
    if len(values) > 1:
        return json.dumps([_json_value(value) for value in values], separators=(',', ':'), sort_keys=True)
    return None if values[0] is None else str(_text_value(values[0]))


def _json_value(value):
    if isinstance(value, ET.Element):
        return ''.join(value.itertext())
    if isinstance(value, list):
        return [_json_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_value(value[key]) for key in sorted(value)}
    return value


def _text_value(value):
    if isinstance(value, ET.Element):
        return ''.join(value.itertext())
    return value


def _xml_expanded_name(name):
    return name


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


def resolve_dsl_data(data, path, callback=None):
    """Resolve um path canônico sobre dado carregado e retorna texto ou None."""
    try:
        return _evaluate_selector(data, path)
    except Exception:
        # PROTECAO: a fachada fail-safe não propaga exceção de navegação.
        _emit('invalid path', 'e', callback)
        return None


# =========================
# RESOLVE DSL
# =========================


def resolve_parser_expression(
    source, callback=None, __depth=0, __chain=0, env=None
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
        f'{dsl["url"]}::__::{dsl["path"]}::__::{json.dumps(dsl.get("request"), sort_keys=True)}'.encode()
    ).decode()

    if (
        _now() - __DSL_RUNTIME_START
    ).total_seconds() > MAX_GLOBAL_TIMEOUT:
        _emit('global timeout reached', 'e', callback)
        return None

    cached, found = _cache_get(key)
    if found:
        return str(cached) if cached is not None else None

    raw = _fetch_raw(dsl['url'], callback, dsl.get('request'), env)
    if not raw:
        _cache_set(key, None)
        return None

    parsed = _parse_content(raw, callback)
    if not parsed:
        _cache_set(key, None)
        return None

    value = resolve_dsl_data(parsed, dsl['path'], callback)
    if value is None:
        _cache_set(key, None)
        return None

    if has_parser_expression(value):
        _emit('nested DSL not allowed', 'e', callback)
        return None

    _cache_set(key, value)

    return value


# =========================
# SUPERFÍCIE CANÔNICA MULTILINGUAGEM
# =========================


def hasParserExpression(source: str) -> bool:
    """Detecta DSL pela mesma assinatura pública dos demais bindings."""
    return has_parser_expression(source)


def resolveDslData(
    data: Any,
    path: str,
    callback: Callable[[str, str], None] | None = None,
) -> str | None:
    """Resolve dados pela ordem canônica data, path e callback opcional."""
    return resolve_dsl_data(data, path, callback)


def resolveParserExpression(
    source: str,
    options: Mapping[str, Any] | None = None,
    callback: Callable[[str, str], None] | None = None,
) -> str | None:
    """Resolve fonte pela ordem canônica source, options e callback."""
    normalized = dict(options or {})
    if set(normalized) - {'env'}:
        return None
    env = normalized.get('env')
    if env is not None and not isinstance(env, Mapping):
        return None
    return resolve_parser_expression(
        source,
        callback,
        env=dict(env) if env is not None else None,
    )


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
