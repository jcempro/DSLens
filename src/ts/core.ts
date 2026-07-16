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

const DSL_EXPRESSION = /\$\{\s*(["']).+?\1\s*\}/u;
const TOKEN = /[^.\[\]]+(?:\[[^\]]+\])*/gu;
const INDEX = /^(.+?)\[(\d+)\]$/u;
const FILTER = /^(.+?)\[@(.+?)=["'](.+?)["']\]$/u;

/** Detecta uma expressão DSL canônica sem executar I/O. */
export function hasParserExpression(source: string): boolean {
  return source.length > 0 && DSL_EXPRESSION.test(source);
}

/** Resolve sincronamente um path canônico sobre dado estruturado carregado. */
export function resolveDslData(data: unknown, path: string): string | null {
  try {
    let current: unknown = data;
    const tokens = path.replace(/^\./u, '').match(TOKEN) ?? [];

    for (const token of tokens) {
      if (current === null || current === undefined) return null;

      const index = token.match(INDEX);
      if (index) {
        const container = getProperty(current, index[1] ?? '');
        if (!Array.isArray(container)) return null;
        const position = Number(index[2]);
        current = position < container.length ? container[position] : null;
        continue;
      }

      const filter = token.match(FILTER);
      if (filter) {
        const container = getProperty(current, filter[1] ?? '');
        if (!Array.isArray(container)) return null;
        const attribute = filter[2] ?? '';
        const expected = filter[3] ?? '';
        current = container.find((item) => String(getProperty(item, attribute)) === expected) ?? null;
        continue;
      }

      current = getProperty(current, token);
    }

    return current === null || current === undefined ? null : String(current);
  } catch {
    return null;
  }
}

/** Constrói resultado estruturado para integrações e transportes assíncronos. */
export function toDslResult(value: string | null, code = 'INVALID_PATH'): DslResult {
  return value === null
    ? { ok: false, value: null, error: { code, stage: 'resolve', message: 'DSL resolution failed' }, metadata: {} }
    : { ok: true, value, error: null, metadata: {} };
}

/** Lê propriedade própria sem permitir acesso à cadeia de protótipos. */
function getProperty(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null || !Object.prototype.hasOwnProperty.call(value, key)) return null;
  return (value as Record<string, unknown>)[key];
}
