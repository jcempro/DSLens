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

// src/ts/browser/components/detect.ts
var detect_exports = {};
__export(detect_exports, {
  hasParserExpression: () => hasParserExpression,
  parseDslExpression: () => parseDslExpression
});
module.exports = __toCommonJS(detect_exports);

// src/ts/core.ts
var DSL_EXPRESSION = /\$\{\s*(["']).+?\1\s*\}/u;
var BLOCKED_HEADERS = /* @__PURE__ */ new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding"
]);
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
function isSelectorStart(path) {
  return /^[.[]/u.test(path) || /^(?:first|all|count|exists)\(/u.test(path);
}
//# sourceMappingURL=detect.cjs.map
