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
  resolveDslData: () => resolveDslData,
  resolveParserExpression: () => resolveParserExpression,
  toDslResult: () => toDslResult
});
module.exports = __toCommonJS(browser_exports);

// src/ts/core.ts
var DSL_EXPRESSION = /\$\{\s*(["']).+?\1\s*\}/u;
var TOKEN = /[^.\[\]]+(?:\[[^\]]+\])*/gu;
var INDEX = /^(.+?)\[(\d+)\]$/u;
var FILTER = /^(.+?)\[@(.+?)=["'](.+?)["']\]$/u;
function hasParserExpression(source) {
  return source.length > 0 && DSL_EXPRESSION.test(source);
}
function resolveDslData(data, path) {
  try {
    let current = data;
    const tokens = path.replace(/^\./u, "").match(TOKEN) ?? [];
    for (const token of tokens) {
      if (current === null || current === void 0) return null;
      const index = token.match(INDEX);
      if (index) {
        const container = getProperty(current, index[1] ?? "");
        if (!Array.isArray(container)) return null;
        const position = Number(index[2]);
        current = position < container.length ? container[position] : null;
        continue;
      }
      const filter = token.match(FILTER);
      if (filter) {
        const container = getProperty(current, filter[1] ?? "");
        if (!Array.isArray(container)) return null;
        const attribute = filter[2] ?? "";
        const expected = filter[3] ?? "";
        current = container.find(
          (item) => String(getProperty(item, attribute)) === expected
        ) ?? null;
        continue;
      }
      current = getProperty(current, token);
    }
    return current === null || current === void 0 ? null : String(current);
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
function getProperty(value, key) {
  if (typeof value !== "object" || value === null || !Object.prototype.hasOwnProperty.call(value, key))
    return null;
  return value[key];
}

// src/ts/browser.ts
var EXPRESSION = /^\$\{\s*(["'])(?<source>.*?)\1\s*\}(?<path>[.\[].*)$/u;
async function resolveParserExpression(source, options = {}) {
  const match = source.match(EXPRESSION);
  const url = match?.groups?.source;
  const path = match?.groups?.path;
  if (!url || !path || !/^https?:\/\//u.test(url)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 3e4
  );
  const signal = options.signal ?? controller.signal;
  try {
    const response = await (options.fetcher ?? fetch)(url, {
      method: "GET",
      signal,
      headers: { accept: "application/json" }
    });
    if (!response.ok) return null;
    return resolveDslData(await response.json(), path);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
//# sourceMappingURL=browser.cjs.map
