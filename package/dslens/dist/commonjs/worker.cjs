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

// src/ts/worker.ts
var worker_exports = {};
__export(worker_exports, {
  hasParserExpression: () => hasParserExpression,
  resolveDslData: () => resolveDslData,
  resolveWorkerRequest: () => resolveWorkerRequest,
  toDslResult: () => toDslResult
});
module.exports = __toCommonJS(worker_exports);

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

// src/ts/worker.ts
function resolveWorkerRequest(request) {
  return {
    id: request.id,
    value: resolveDslData(request.data, request.path)
  };
}
//# sourceMappingURL=worker.cjs.map
