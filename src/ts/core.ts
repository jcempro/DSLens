/*
 * Origem: https://github.com/jcempro/DSLens
 * Autor: JeanCarloEM - https://jeancarloem.com
 * Licença: MPL-2.0 - https://mozilla.org/MPL/2.0/
 * Resumo: uso, cópia, modificação e distribuição conforme a MPL-2.0.
 */

/** Resultado estruturado comum às fachadas DSLens. */
export interface DslResult {
  readonly ok: boolean;
  readonly value: string | null;
  readonly error: DslError | null;
  readonly metadata: Readonly<Record<string, unknown>>;
}

/** Falha normalizada sem exposição de dados sensíveis. */
export interface DslError {
  readonly code: string;
  readonly stage: string;
  readonly message: string;
}

/** Callback opcional comum aos bindings para telemetria segura. */
export type DslCallback = (message: string, type: string) => void;

const DSL_EXPRESSION = /\$\{\s*(["']).+?\1\s*\}/u;
const BLOCKED_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
]);
const BLOCKED_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor',
]);
const LIMITS = {
  queryLength: 2048,
  steps: 64,
  recursiveDepth: 32,
  visitedNodes: 10_000,
  results: 1024,
  filters: 32,
  literalLength: 512,
} as const;

export interface DslEnvReference {
  readonly env: string;
}

export interface DslRequest {
  readonly method: 'GET' | 'POST';
  readonly query: Readonly<Record<string, string | number | boolean>>;
  readonly headers: Readonly<
    Record<string, string | DslEnvReference>
  >;
  readonly body?: {
    readonly encoding: 'json' | 'form' | 'text';
    readonly value: unknown;
  };
}

export interface ParsedDslExpression {
  readonly url: string;
  readonly path: string;
  readonly request: DslRequest | null;
}

/** Interpreta a origem e o request opcional sem executar I/O. */
export function parseDslExpression(
  source: string,
): ParsedDslExpression | null {
  const prefix = source.match(/^\$\{\s*(["'])(.*?)\1/u);
  if (!prefix) return null;
  const url = prefix[2] ?? '';
  let cursor = prefix[0].length;
  while (/\s/u.test(source[cursor] ?? '')) cursor += 1;
  let request: DslRequest | null = null;
  if (source[cursor] === ';') {
    const close = findExpressionClose(source, cursor + 1);
    if (close < 0) return null;
    let parameter = source.slice(cursor + 1, close).trim();
    if (parameter.startsWith('request='))
      parameter = parameter.slice('request='.length).trim();
    else if (!parameter.startsWith('{')) return null;
    try {
      request = validateRequest(JSON.parse(parameter));
    } catch {
      return null;
    }
    cursor = close;
  }
  if (source[cursor] !== '}') return null;
  const path = source.slice(cursor + 1);
  if (
    !url ||
    !/^https?:\/\//u.test(url) ||
    !isSelectorStart(path)
  )
    return null;
  return { url, path, request };
}

/** Localiza o fechamento externo, ignorando chaves dentro de strings JSON. */
function findExpressionClose(source: string, start: number): number {
  let depth = 1;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index] ?? '';
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"') quote = character;
    else if (character === '{') depth += 1;
    else if (character === '}' && --depth === 0) return index;
  }
  return -1;
}

/** Valida o objeto request e aplica defaults sem coerção silenciosa. */
function validateRequest(value: unknown): DslRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('request inválido');
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).some(
      (key) => !['method', 'query', 'headers', 'body'].includes(key),
    )
  )
    throw new TypeError('campo request desconhecido');
  const method = input.method ?? 'GET';
  if (method !== 'GET' && method !== 'POST')
    throw new TypeError('método inválido');
  const query = validateScalarRecord(input.query ?? {});
  const headers = validateHeaders(input.headers ?? {});
  const body = input.body;
  if (body !== undefined) {
    if (
      method !== 'POST' ||
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    )
      throw new TypeError('body inválido');
    const bodyObject = body as Record<string, unknown>;
    if (
      !['json', 'form', 'text'].includes(String(bodyObject.encoding))
    )
      throw new TypeError('encoding inválido');
    if (!Object.prototype.hasOwnProperty.call(bodyObject, 'value'))
      throw new TypeError('body sem value');
    return {
      method,
      query,
      headers,
      body: {
        encoding: bodyObject.encoding as 'json' | 'form' | 'text',
        value: bodyObject.value,
      },
    };
  }
  return { method, query, headers };
}

function validateScalarRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('query inválida');
  const result: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!['string', 'number', 'boolean'].includes(typeof item))
      throw new TypeError('query não escalar');
    result[key] = item as string | number | boolean;
  }
  return result;
}

function validateHeaders(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('headers inválido');
  const result: Record<string, string | DslEnvReference> = {};
  for (const [key, item] of Object.entries(value)) {
    if (BLOCKED_HEADERS.has(key.toLowerCase()))
      throw new TypeError('header controlado pelo runtime');
    if (typeof item === 'string') result[key] = item;
    else if (
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      typeof (item as Record<string, unknown>).env === 'string' &&
      Object.keys(item).length === 1
    )
      result[key] = { env: (item as { env: string }).env };
    else throw new TypeError('valor de header inválido');
  }
  return result;
}

/** Detecta uma expressão DSL canônica sem executar I/O. */
export function hasParserExpression(source: string): boolean {
  return source.length > 0 && DSL_EXPRESSION.test(source);
}

/** Resolve sincronamente um path canônico sobre dado estruturado carregado. */
export function resolveDslData(
  data: unknown,
  path: string,
  _callback?: DslCallback,
): string | null {
  try {
    const compiled = parseSelector(path);
    const values = evaluateSelector(data, compiled);
    return materialize(values, compiled.mode);
  } catch {
    return null;
  }
}

/** Constrói resultado estruturado para integrações e transportes assíncronos. */
export function toDslResult(
  value: string | null,
  code = 'INVALID_PATH',
): DslResult {
  return value === null ?
      {
        ok: false,
        value: null,
        error: {
          code,
          stage: 'resolve',
          message: 'DSL resolution failed',
        },
        metadata: {},
      }
    : { ok: true, value, error: null, metadata: {} };
}

/** Lê propriedade própria sem permitir acesso à cadeia de protótipos. */
function getProperty(value: unknown, key: string): unknown {
  if (
    BLOCKED_KEYS.has(key) ||
    typeof value !== 'object' ||
    value === null ||
    !Object.prototype.hasOwnProperty.call(value, key)
  )
    return null;
  return (value as Record<string, unknown>)[key];
}

type ResultMode = 'default' | 'first' | 'all' | 'count' | 'exists';

type SelectorStep =
  | Readonly<{ kind: 'property'; name: string }>
  | Readonly<{ kind: 'attribute'; name: string }>
  | Readonly<{ kind: 'text' }>
  | Readonly<{ kind: 'index'; index: number }>
  | Readonly<{ kind: 'wildcard' }>
  | Readonly<{ kind: 'recursive'; target: SelectorStep }>
  | Readonly<{ kind: 'filter'; predicate: Predicate }>;

type Predicate =
  | Readonly<{ kind: 'exists'; path: readonly SelectorStep[] }>
  | Readonly<{
      kind: 'compare';
      path: readonly SelectorStep[];
      operator: CompareOperator;
      value: string | number | boolean | null;
    }>;

type CompareOperator = '=' | '!=' | '>' | '>=' | '<' | '<=';

interface CompiledSelector {
  readonly mode: ResultMode;
  readonly steps: readonly SelectorStep[];
}

interface EvalState {
  visited: number;
  results: number;
}

function isSelectorStart(path: string): boolean {
  return (
    /^[.[]/u.test(path) ||
    /^(?:first|all|count|exists)\(/u.test(path)
  );
}

function parseSelector(source: string): CompiledSelector {
  if (source.length > LIMITS.queryLength) throw new Error('limit');
  let mode: ResultMode = 'default';
  let path = source.trim();
  const functionMatch = path.match(/^(first|all|count|exists)\(/u);
  if (functionMatch) {
    mode = functionMatch[1] as ResultMode;
    const close = findMatchingClose(path, functionMatch[0].length - 1);
    if (close !== path.length - 1) throw new Error('invalid selector');
    path = path.slice(functionMatch[0].length, close);
  }
  const parser = new SelectorParser(path);
  const steps = parser.parsePath();
  if (steps.length > LIMITS.steps) throw new Error('limit');
  return { mode, steps };
}

class SelectorParser {
  private cursor = 0;
  private filters = 0;

  public constructor(private readonly source: string) {}

  public parsePath(): readonly SelectorStep[] {
    const steps: SelectorStep[] = [];
    while (this.cursor < this.source.length) steps.push(this.parseStep());
    return steps;
  }

  private parseStep(): SelectorStep {
    if (this.consume('..')) return { kind: 'recursive', target: this.parseRecursiveTarget() };
    if (this.consume('.text()')) return { kind: 'text' };
    if (this.consume('.@')) return { kind: 'attribute', name: this.parseName() };
    if (this.consume('.[')) return { kind: 'property', name: this.parseQuoted(']') };
    if (this.consume('.')) return { kind: 'property', name: this.parseName() };
    if (this.consume('[*]')) return { kind: 'wildcard' };
    if (this.consume('[?(')) return this.parseFilter();
    if (this.peek() === '[') return this.parseIndexOrLegacyFilter();
    throw new Error('unexpected token');
  }

  private parseRecursiveTarget(): SelectorStep {
    if (this.consume('@')) return { kind: 'attribute', name: this.parseName() };
    if (this.consume('[')) return { kind: 'property', name: this.parseQuoted(']') };
    return { kind: 'property', name: this.parseName() };
  }

  private parseFilter(): SelectorStep {
    this.filters += 1;
    if (this.filters > LIMITS.filters) throw new Error('limit');
    if (!this.consume('@')) throw new Error('invalid filter');
    const path = this.parsePredicatePath();
    this.skipSpaces();
    const operator = this.parseOperator();
    if (!operator) {
      this.expect(')]');
      return { kind: 'filter', predicate: { kind: 'exists', path } };
    }
    const value = this.parseScalar();
    this.skipSpaces();
    this.expect(')]');
    return { kind: 'filter', predicate: { kind: 'compare', path, operator, value } };
  }

  private parsePredicatePath(): readonly SelectorStep[] {
    const start = this.cursor;
    while (this.cursor < this.source.length) {
      this.skipSpaces();
      if (/^(?:=|!=|>=|<=|>|<|\)\])/u.test(this.source.slice(this.cursor))) break;
      this.parseStep();
    }
    const nested = new SelectorParser(this.source.slice(start, this.cursor).trim());
    return nested.parsePath();
  }

  private parseIndexOrLegacyFilter(): SelectorStep {
    this.expect('[');
    if (this.consume('@')) {
      const name = this.parseName();
      this.expect('=');
      const value = this.parseScalar();
      this.expect(']');
      return {
        kind: 'filter',
        predicate: {
          kind: 'compare',
          path: [{ kind: 'property', name }],
          operator: '=',
          value,
        },
      };
    }
    const digits = this.readWhile(/[0-9]/u);
    if (!digits) throw new Error('invalid index');
    this.expect(']');
    return { kind: 'index', index: Number(digits) };
  }

  private parseScalar(): string | number | boolean | null {
    this.skipSpaces();
    const char = this.peek();
    if (char === '"' || char === "'") return this.parseString(char);
    const token = this.readWhile(/[^\]\)\s]/u);
    if (token.length > LIMITS.literalLength) throw new Error('limit');
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'null') return null;
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(token)) return Number(token);
    throw new Error('invalid scalar');
  }

  private parseOperator(): CompareOperator | '' {
    this.skipSpaces();
    for (const operator of ['>=', '<=', '!=', '=', '>', '<'] as const)
      if (this.consume(operator)) return operator;
    return '';
  }

  private parseName(): string {
    const name = this.readWhile(/[A-Za-z0-9_:\-${}]/u);
    if (!name || name.length > LIMITS.literalLength) throw new Error('invalid name');
    return name;
  }

  private parseQuoted(close: string): string {
    const quote = this.peek();
    if (quote !== '"' && quote !== "'") throw new Error('invalid quote');
    const value = this.parseString(quote);
    this.expect(close);
    return value;
  }

  private parseString(quote: string): string {
    this.expect(quote);
    let value = '';
    while (this.cursor < this.source.length) {
      const char = this.source[this.cursor++] ?? '';
      if (char === quote) {
        if (value.length > LIMITS.literalLength) throw new Error('limit');
        return value;
      }
      if (char === '\\') {
        const next = this.source[this.cursor++] ?? '';
        if (next !== quote && next !== '\\') throw new Error('invalid escape');
        value += next;
      } else value += char;
    }
    throw new Error('unclosed string');
  }

  private readWhile(pattern: RegExp): string {
    const start = this.cursor;
    while (
      this.cursor < this.source.length &&
      pattern.test(this.source[this.cursor] ?? '')
    )
      this.cursor += 1;
    return this.source.slice(start, this.cursor);
  }

  private skipSpaces(): void {
    this.readWhile(/\s/u);
  }

  private consume(token: string): boolean {
    if (!this.source.startsWith(token, this.cursor)) return false;
    this.cursor += token.length;
    return true;
  }

  private expect(token: string): void {
    if (!this.consume(token)) throw new Error(`expected ${token}`);
  }

  private peek(): string {
    return this.source[this.cursor] ?? '';
  }
}

function findMatchingClose(source: string, open: number): number {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index] ?? '';
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '(') depth += 1;
    else if (char === ')' && --depth === 0) return index;
  }
  return -1;
}

function evaluateSelector(
  data: unknown,
  selector: CompiledSelector,
): readonly unknown[] {
  const state: EvalState = { visited: 0, results: 0 };
  let current: readonly unknown[] = [data];
  for (const step of selector.steps) current = applyStep(current, step, state);
  return dedupe(current).slice(0, LIMITS.results);
}

function applyStep(
  nodes: readonly unknown[],
  step: SelectorStep,
  state: EvalState,
): readonly unknown[] {
  const result: unknown[] = [];
  for (const node of nodes) {
    visit(state);
    if (step.kind === 'property') pushAll(result, selectProperty(node, step.name));
    else if (step.kind === 'attribute') pushDefined(result, selectAttribute(node, step.name));
    else if (step.kind === 'text') pushDefined(result, selectText(node));
    else if (step.kind === 'index') pushDefined(result, Array.isArray(node) ? node[step.index] : undefined);
    else if (step.kind === 'wildcard') pushAll(result, selectChildren(node));
    else if (step.kind === 'filter') {
      const candidates =
        Array.isArray(node) || isXmlNode(node) ? selectChildren(node) : [node];
      for (const candidate of candidates)
        if (matchesPredicate(candidate, step.predicate, state))
          result.push(candidate);
    } else pushAll(result, selectRecursive(node, step.target, state, 0));
    if (result.length > LIMITS.results) throw new Error('limit');
  }
  return result;
}

function matchesPredicate(
  node: unknown,
  predicate: Predicate,
  state: EvalState,
): boolean {
  let values: readonly unknown[] = [node];
  for (const step of predicate.path) values = applyStep(values, step, state);
  if (predicate.kind === 'exists') return values.length > 0;
  return values.some((value) => compareScalar(value, predicate.operator, predicate.value));
}

function compareScalar(
  actual: unknown,
  operator: CompareOperator,
  expected: string | number | boolean | null,
): boolean {
  const normalized = normalizeScalar(actual);
  if (operator === '=') return normalized === expected;
  if (operator === '!=') return normalized !== expected;
  if (typeof normalized !== 'number' || typeof expected !== 'number') return false;
  if (operator === '>') return normalized > expected;
  if (operator === '>=') return normalized >= expected;
  if (operator === '<') return normalized < expected;
  return normalized <= expected;
}

function normalizeScalar(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (['string', 'number', 'boolean'].includes(typeof value))
    return value as string | number | boolean;
  return String(value);
}

function selectProperty(node: unknown, name: string): readonly unknown[] {
  if (Array.isArray(node)) return [];
  if (isXmlNode(node)) return xmlChildrenByName(node, name);
  if (
    node &&
    typeof node === 'object' &&
    !BLOCKED_KEYS.has(name) &&
    Object.prototype.hasOwnProperty.call(node, name)
  )
    return [(node as Record<string, unknown>)[name]];
  return [];
}

function selectAttribute(node: unknown, name: string): unknown {
  if (!isXmlNode(node)) return undefined;
  const element = node as Element;
  if (name.startsWith('{')) {
    const close = name.indexOf('}');
    if (close > 1) return element.getAttributeNS(name.slice(1, close), name.slice(close + 1)) ?? undefined;
  }
  return element.getAttribute(name) ?? undefined;
}

function selectText(node: unknown): unknown {
  if (isXmlNode(node)) return (node as Element).textContent ?? '';
  return typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean' ? String(node) : undefined;
}

function selectChildren(node: unknown): readonly unknown[] {
  if (Array.isArray(node)) return node;
  if (isXmlNode(node))
    return Array.from((node as Element).childNodes).filter(
      (child) => (child as Node).nodeType === 1,
    );
  if (node && typeof node === 'object')
    return Object.keys(node)
      .filter((key) => !BLOCKED_KEYS.has(key))
      .map((key) => (node as Record<string, unknown>)[key]);
  return [];
}

function selectRecursive(
  node: unknown,
  target: SelectorStep,
  state: EvalState,
  depth: number,
): readonly unknown[] {
  if (depth > LIMITS.recursiveDepth) throw new Error('limit');
  const result = [...applyStep([node], target, state)];
  for (const child of selectChildren(node))
    result.push(...selectRecursive(child, target, state, depth + 1));
  return result;
}

function isXmlNode(value: unknown): value is Element {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'nodeType' in value &&
      (value as Node).nodeType === 1,
  );
}

function xmlChildrenByName(node: unknown, name: string): readonly unknown[] {
  if (!isXmlNode(node)) return [];
  return Array.from(node.childNodes).filter((child) => {
    const item = child as Element;
    if (item.nodeType !== 1) return false;
    if (name.startsWith('{')) {
      const close = name.indexOf('}');
      return close > 1 && item.namespaceURI === name.slice(1, close) && item.localName === name.slice(close + 1);
    }
    return item.localName === name || item.nodeName === name;
  });
}

function pushAll(target: unknown[], values: readonly unknown[]): void {
  for (const value of values) pushDefined(target, value);
}

function pushDefined(target: unknown[], value: unknown): void {
  if (value !== undefined) target.push(value);
}

function visit(state: EvalState): void {
  state.visited += 1;
  if (state.visited > LIMITS.visitedNodes) throw new Error('limit');
}

function dedupe(values: readonly unknown[]): readonly unknown[] {
  const seen = new Set<unknown>();
  const result: unknown[] = [];
  for (const value of values) {
    const key = value && typeof value === 'object' ? value : `${typeof value}:${String(value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function materialize(
  values: readonly unknown[],
  mode: ResultMode,
): string | null {
  if (mode === 'exists') return values.length > 0 ? 'true' : 'false';
  if (mode === 'count') return String(values.length);
  if (mode === 'all') return stableJson(values.map(toJsonValue));
  const selected = mode === 'first' ? values[0] : values.length === 1 ? values[0] : values;
  if (selected === undefined || selected === null) return null;
  if (Array.isArray(selected)) return selected.length ? stableJson(selected.map(toJsonValue)) : null;
  return typeof selected === 'object' && !isXmlNode(selected) ? String(selected) : String(toJsonValue(selected));
}

function toJsonValue(value: unknown): unknown {
  if (isXmlNode(value)) return (value as Element).textContent ?? '';
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort())
      if (!BLOCKED_KEYS.has(key)) result[key] = toJsonValue((value as Record<string, unknown>)[key]);
    return result;
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(toJsonValue(value));
}
