/* DSLens | https://github.com/jcempro/DSLens | JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/ts/browser.ts
var browser_exports = {};
__export(browser_exports, {
  hasParserExpression: () => hasParserExpression,
  parseDslExpression: () => parseDslExpression,
  resolveDslData: () => resolveDslData,
  resolveParserExpression: () => resolveParserExpression,
  toDslResult: () => toDslResult
});
module.exports = __toCommonJS(browser_exports);

// src/ts/core.ts
var DSL_EXPRESSION = /\$\{\s*(["']).+?\1\s*\}/u;
var BLOCKED_HEADERS = /* @__PURE__ */ new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding"
]);
var BLOCKED_KEYS = /* @__PURE__ */ new Set([
  "__proto__",
  "prototype",
  "constructor"
]);
var LIMITS = {
  queryLength: 2048,
  steps: 64,
  recursiveDepth: 32,
  visitedNodes: 1e4,
  results: 1024,
  filters: 32,
  literalLength: 512
};
function parseDslExpression(source) {
  const prefix = source.match(/^\$\{\s*(["'])(.*?)\1/u);
  if (!prefix) return null;
  const url = prefix[2] ?? "";
  let cursor = prefix[0].length;
  while (/\s/u.test(source[cursor] ?? "")) cursor += 1;
  let request = null;
  if (source[cursor] === ";") {
    const close = findExpressionClose(source, cursor + 1);
    if (close < 0) return null;
    let parameter = source.slice(cursor + 1, close).trim();
    if (parameter.startsWith("request="))
      parameter = parameter.slice("request=".length).trim();
    else if (!parameter.startsWith("{")) return null;
    try {
      request = validateRequest(JSON.parse(parameter));
    } catch {
      return null;
    }
    cursor = close;
  }
  if (source[cursor] !== "}") return null;
  const path = source.slice(cursor + 1);
  if (!url || !/^https?:\/\//u.test(url) || !isSelectorStart(path))
    return null;
  return { url, path, request };
}
function findExpressionClose(source, start) {
  let depth = 1;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index] ?? "";
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"') quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return index;
  }
  return -1;
}
function validateRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("request inv\xE1lido");
  const input = value;
  if (Object.keys(input).some(
    (key) => !["method", "query", "headers", "body"].includes(key)
  ))
    throw new TypeError("campo request desconhecido");
  const method = input.method ?? "GET";
  if (method !== "GET" && method !== "POST")
    throw new TypeError("m\xE9todo inv\xE1lido");
  const query = validateScalarRecord(input.query ?? {});
  const headers = validateHeaders(input.headers ?? {});
  const body = input.body;
  if (body !== void 0) {
    if (method !== "POST" || !body || typeof body !== "object" || Array.isArray(body))
      throw new TypeError("body inv\xE1lido");
    const bodyObject = body;
    if (!["json", "form", "text"].includes(String(bodyObject.encoding)))
      throw new TypeError("encoding inv\xE1lido");
    if (!Object.prototype.hasOwnProperty.call(bodyObject, "value"))
      throw new TypeError("body sem value");
    return {
      method,
      query,
      headers,
      body: {
        encoding: bodyObject.encoding,
        value: bodyObject.value
      }
    };
  }
  return { method, query, headers };
}
function validateScalarRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("query inv\xE1lida");
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (!["string", "number", "boolean"].includes(typeof item))
      throw new TypeError("query n\xE3o escalar");
    result[key] = item;
  }
  return result;
}
function validateHeaders(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("headers inv\xE1lido");
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (BLOCKED_HEADERS.has(key.toLowerCase()))
      throw new TypeError("header controlado pelo runtime");
    if (typeof item === "string") result[key] = item;
    else if (item && typeof item === "object" && !Array.isArray(item) && typeof item.env === "string" && Object.keys(item).length === 1)
      result[key] = { env: item.env };
    else throw new TypeError("valor de header inv\xE1lido");
  }
  return result;
}
function hasParserExpression(source) {
  return source.length > 0 && DSL_EXPRESSION.test(source);
}
function resolveDslData(data, path, _callback) {
  try {
    const compiled = parseSelector(path);
    const values = evaluateSelector(data, compiled);
    return materialize(values, compiled.mode);
  } catch {
    return null;
  }
}
function toDslResult(value, code = "INVALID_PATH") {
  return value === null ? {
    ok: false,
    value: null,
    error: {
      code,
      stage: "resolve",
      message: "DSL resolution failed"
    },
    metadata: {}
  } : { ok: true, value, error: null, metadata: {} };
}
function isSelectorStart(path) {
  return /^[.[]/u.test(path) || /^(?:first|all|count|exists)\(/u.test(path);
}
function parseSelector(source) {
  if (source.length > LIMITS.queryLength) throw new Error("limit");
  let mode = "default";
  let path = source.trim();
  const functionMatch = path.match(/^(first|all|count|exists)\(/u);
  if (functionMatch) {
    mode = functionMatch[1];
    const close = findMatchingClose(path, functionMatch[0].length - 1);
    if (close !== path.length - 1) throw new Error("invalid selector");
    path = path.slice(functionMatch[0].length, close);
  }
  const parser = new SelectorParser(path);
  const steps = parser.parsePath();
  if (steps.length > LIMITS.steps) throw new Error("limit");
  return { mode, steps };
}
var SelectorParser = class _SelectorParser {
  constructor(source) {
    this.source = source;
    this.cursor = 0;
    this.filters = 0;
  }
  parsePath() {
    const steps = [];
    while (this.cursor < this.source.length) steps.push(this.parseStep());
    return steps;
  }
  parseStep() {
    if (this.consume("..")) return { kind: "recursive", target: this.parseRecursiveTarget() };
    if (this.consume(".text()")) return { kind: "text" };
    if (this.consume(".@")) return { kind: "attribute", name: this.parseName() };
    if (this.consume(".[")) return { kind: "property", name: this.parseQuoted("]") };
    if (this.consume(".")) return { kind: "property", name: this.parseName() };
    if (this.consume("[*]")) return { kind: "wildcard" };
    if (this.consume("[?(")) return this.parseFilter();
    if (this.peek() === "[") return this.parseIndexOrLegacyFilter();
    throw new Error("unexpected token");
  }
  parseRecursiveTarget() {
    if (this.consume("@")) return { kind: "attribute", name: this.parseName() };
    if (this.consume("[")) return { kind: "property", name: this.parseQuoted("]") };
    return { kind: "property", name: this.parseName() };
  }
  parseFilter() {
    this.filters += 1;
    if (this.filters > LIMITS.filters) throw new Error("limit");
    if (!this.consume("@")) throw new Error("invalid filter");
    const path = this.parsePredicatePath();
    this.skipSpaces();
    const operator = this.parseOperator();
    if (!operator) {
      this.expect(")]");
      return { kind: "filter", predicate: { kind: "exists", path } };
    }
    const value = this.parseScalar();
    this.skipSpaces();
    this.expect(")]");
    return { kind: "filter", predicate: { kind: "compare", path, operator, value } };
  }
  parsePredicatePath() {
    const start = this.cursor;
    while (this.cursor < this.source.length) {
      this.skipSpaces();
      if (/^(?:=|!=|>=|<=|>|<|\)\])/u.test(this.source.slice(this.cursor))) break;
      this.parseStep();
    }
    const nested = new _SelectorParser(this.source.slice(start, this.cursor).trim());
    return nested.parsePath();
  }
  parseIndexOrLegacyFilter() {
    this.expect("[");
    if (this.consume("@")) {
      const name = this.parseName();
      this.expect("=");
      const value = this.parseScalar();
      this.expect("]");
      return {
        kind: "filter",
        predicate: {
          kind: "compare",
          path: [{ kind: "property", name }],
          operator: "=",
          value
        }
      };
    }
    const digits = this.readWhile(/[0-9]/u);
    if (!digits) throw new Error("invalid index");
    this.expect("]");
    return { kind: "index", index: Number(digits) };
  }
  parseScalar() {
    this.skipSpaces();
    const char = this.peek();
    if (char === '"' || char === "'") return this.parseString(char);
    const token = this.readWhile(/[^\]\)\s]/u);
    if (token.length > LIMITS.literalLength) throw new Error("limit");
    if (token === "true") return true;
    if (token === "false") return false;
    if (token === "null") return null;
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(token)) return Number(token);
    throw new Error("invalid scalar");
  }
  parseOperator() {
    this.skipSpaces();
    for (const operator of [">=", "<=", "!=", "=", ">", "<"])
      if (this.consume(operator)) return operator;
    return "";
  }
  parseName() {
    const name = this.readWhile(/[A-Za-z0-9_:\-${}]/u);
    if (!name || name.length > LIMITS.literalLength) throw new Error("invalid name");
    return name;
  }
  parseQuoted(close) {
    const quote = this.peek();
    if (quote !== '"' && quote !== "'") throw new Error("invalid quote");
    const value = this.parseString(quote);
    this.expect(close);
    return value;
  }
  parseString(quote) {
    this.expect(quote);
    let value = "";
    while (this.cursor < this.source.length) {
      const char = this.source[this.cursor++] ?? "";
      if (char === quote) {
        if (value.length > LIMITS.literalLength) throw new Error("limit");
        return value;
      }
      if (char === "\\") {
        const next = this.source[this.cursor++] ?? "";
        if (next !== quote && next !== "\\") throw new Error("invalid escape");
        value += next;
      } else value += char;
    }
    throw new Error("unclosed string");
  }
  readWhile(pattern) {
    const start = this.cursor;
    while (this.cursor < this.source.length && pattern.test(this.source[this.cursor] ?? ""))
      this.cursor += 1;
    return this.source.slice(start, this.cursor);
  }
  skipSpaces() {
    this.readWhile(/\s/u);
  }
  consume(token) {
    if (!this.source.startsWith(token, this.cursor)) return false;
    this.cursor += token.length;
    return true;
  }
  expect(token) {
    if (!this.consume(token)) throw new Error(`expected ${token}`);
  }
  peek() {
    return this.source[this.cursor] ?? "";
  }
};
function findMatchingClose(source, open) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index] ?? "";
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "(") depth += 1;
    else if (char === ")" && --depth === 0) return index;
  }
  return -1;
}
function evaluateSelector(data, selector) {
  const state = { visited: 0, results: 0 };
  let current = [data];
  for (const step of selector.steps) current = applyStep(current, step, state);
  return dedupe(current).slice(0, LIMITS.results);
}
function applyStep(nodes, step, state) {
  const result = [];
  for (const node of nodes) {
    visit(state);
    if (step.kind === "property") pushAll(result, selectProperty(node, step.name));
    else if (step.kind === "attribute") pushDefined(result, selectAttribute(node, step.name));
    else if (step.kind === "text") pushDefined(result, selectText(node));
    else if (step.kind === "index") pushDefined(result, Array.isArray(node) ? node[step.index] : void 0);
    else if (step.kind === "wildcard") pushAll(result, selectChildren(node));
    else if (step.kind === "filter") {
      const candidates = Array.isArray(node) || isXmlNode(node) ? selectChildren(node) : [node];
      for (const candidate of candidates)
        if (matchesPredicate(candidate, step.predicate, state))
          result.push(candidate);
    } else pushAll(result, selectRecursive(node, step.target, state, 0));
    if (result.length > LIMITS.results) throw new Error("limit");
  }
  return result;
}
function matchesPredicate(node, predicate, state) {
  let values = [node];
  for (const step of predicate.path) values = applyStep(values, step, state);
  if (predicate.kind === "exists") return values.length > 0;
  return values.some((value) => compareScalar(value, predicate.operator, predicate.value));
}
function compareScalar(actual, operator, expected) {
  const normalized = normalizeScalar(actual);
  if (operator === "=") return normalized === expected;
  if (operator === "!=") return normalized !== expected;
  if (typeof normalized !== "number" || typeof expected !== "number") return false;
  if (operator === ">") return normalized > expected;
  if (operator === ">=") return normalized >= expected;
  if (operator === "<") return normalized < expected;
  return normalized <= expected;
}
function normalizeScalar(value) {
  if (value === null || value === void 0) return null;
  if (["string", "number", "boolean"].includes(typeof value))
    return value;
  return String(value);
}
function selectProperty(node, name) {
  if (Array.isArray(node)) return [];
  if (isXmlNode(node)) return xmlChildrenByName(node, name);
  if (node && typeof node === "object" && !BLOCKED_KEYS.has(name) && Object.prototype.hasOwnProperty.call(node, name))
    return [node[name]];
  return [];
}
function selectAttribute(node, name) {
  if (!isXmlNode(node)) return void 0;
  const element = node;
  if (name.startsWith("{")) {
    const close = name.indexOf("}");
    if (close > 1) return element.getAttributeNS(name.slice(1, close), name.slice(close + 1)) ?? void 0;
  }
  return element.getAttribute(name) ?? void 0;
}
function selectText(node) {
  if (isXmlNode(node)) return node.textContent ?? "";
  return typeof node === "string" || typeof node === "number" || typeof node === "boolean" ? String(node) : void 0;
}
function selectChildren(node) {
  if (Array.isArray(node)) return node;
  if (isXmlNode(node))
    return Array.from(node.childNodes).filter(
      (child) => child.nodeType === 1
    );
  if (node && typeof node === "object")
    return Object.keys(node).filter((key) => !BLOCKED_KEYS.has(key)).map((key) => node[key]);
  return [];
}
function selectRecursive(node, target, state, depth) {
  if (depth > LIMITS.recursiveDepth) throw new Error("limit");
  const result = [...applyStep([node], target, state)];
  for (const child of selectChildren(node))
    result.push(...selectRecursive(child, target, state, depth + 1));
  return result;
}
function isXmlNode(value) {
  return Boolean(
    value && typeof value === "object" && "nodeType" in value && value.nodeType === 1
  );
}
function xmlChildrenByName(node, name) {
  if (!isXmlNode(node)) return [];
  return Array.from(node.childNodes).filter((child) => {
    const item = child;
    if (item.nodeType !== 1) return false;
    if (name.startsWith("{")) {
      const close = name.indexOf("}");
      return close > 1 && item.namespaceURI === name.slice(1, close) && item.localName === name.slice(close + 1);
    }
    return item.localName === name || item.nodeName === name;
  });
}
function pushAll(target, values) {
  for (const value of values) pushDefined(target, value);
}
function pushDefined(target, value) {
  if (value !== void 0) target.push(value);
}
function visit(state) {
  state.visited += 1;
  if (state.visited > LIMITS.visitedNodes) throw new Error("limit");
}
function dedupe(values) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const value of values) {
    const key = value && typeof value === "object" ? value : `${typeof value}:${String(value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}
function materialize(values, mode) {
  if (mode === "exists") return values.length > 0 ? "true" : "false";
  if (mode === "count") return String(values.length);
  if (mode === "all") return stableJson(values.map(toJsonValue));
  const selected = mode === "first" ? values[0] : values.length === 1 ? values[0] : values;
  if (selected === void 0 || selected === null) return null;
  if (Array.isArray(selected)) return selected.length ? stableJson(selected.map(toJsonValue)) : null;
  return typeof selected === "object" && !isXmlNode(selected) ? String(selected) : String(toJsonValue(selected));
}
function toJsonValue(value) {
  if (isXmlNode(value)) return value.textContent ?? "";
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort())
      if (!BLOCKED_KEYS.has(key)) result[key] = toJsonValue(value[key]);
    return result;
  }
  return value;
}
function stableJson(value) {
  return JSON.stringify(toJsonValue(value));
}

// src/ts/browser.ts
async function resolveParserExpression(source, options = {}, callback) {
  const expression = parseDslExpression(source);
  if (!expression) {
    callback?.("Invalid DSL expression", "error");
    return null;
  }
  const request = expression.request;
  const url = new URL(expression.url);
  for (const [key, value] of Object.entries(request?.query ?? {}))
    url.searchParams.append(key, String(value));
  const headers = {
    accept: "application/json"
  };
  for (const [key, value] of Object.entries(request?.headers ?? {})) {
    if (typeof value === "string") headers[key] = value;
    else {
      const resolved = options.env?.[value.env];
      if (resolved === void 0) {
        callback?.("Environment value unavailable", "error");
        return null;
      }
      headers[key] = resolved;
    }
  }
  let body;
  if (request?.body) {
    if (request.body.encoding === "json") {
      body = JSON.stringify(request.body.value);
      headers["content-type"] ??= "application/json";
    } else if (request.body.encoding === "form") {
      if (!request.body.value || typeof request.body.value !== "object")
        return null;
      body = new URLSearchParams(
        Object.entries(
          request.body.value
        ).map(([key, value]) => [key, String(value)])
      ).toString();
      headers["content-type"] ??= "application/x-www-form-urlencoded";
    } else body = String(request.body.value);
  }
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 3e4
  );
  const signal = options.signal ?? controller.signal;
  try {
    const response = await (options.fetcher ?? fetch)(url, {
      method: request?.method ?? "GET",
      signal,
      headers,
      ...body === void 0 ? {} : { body },
      redirect: Object.keys(headers).some(
        (key) => /^(authorization|cookie|proxy-authorization)$/iu.test(
          key
        )
      ) ? "error" : "follow"
    });
    if (!response.ok) {
      callback?.("Source request failed", "error");
      return null;
    }
    return resolveDslData(
      await response.json(),
      expression.path,
      callback
    );
  } catch {
    callback?.("Source resolution failed", "error");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
//# sourceMappingURL=browser.cjs.map
