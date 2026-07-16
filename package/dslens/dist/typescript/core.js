/*
 * Origem: https://github.com/jcempro/DSLens
 * Autor: JeanCarloEM - https://jeancarloem.com
 * Licença: MPL-2.0 - https://mozilla.org/MPL/2.0/
 * Resumo: uso, cópia, modificação e distribuição conforme a MPL-2.0.
 */
const DSL_EXPRESSION = /\$\{\s*(["']).+?\1\s*\}/u;
const TOKEN = /[^.\[\]]+(?:\[[^\]]+\])*/gu;
const INDEX = /^(.+?)\[(\d+)\]$/u;
const FILTER = /^(.+?)\[@(.+?)=["'](.+?)["']\]$/u;
const BLOCKED_HEADERS = new Set([
    'connection',
    'content-length',
    'host',
    'transfer-encoding',
]);
/** Interpreta a origem e o request opcional sem executar I/O. */
export function parseDslExpression(source) {
    const prefix = source.match(/^\$\{\s*(["'])(.*?)\1/u);
    if (!prefix)
        return null;
    const url = prefix[2] ?? '';
    let cursor = prefix[0].length;
    while (/\s/u.test(source[cursor] ?? ''))
        cursor += 1;
    let request = null;
    if (source[cursor] === ';') {
        const close = findExpressionClose(source, cursor + 1);
        if (close < 0)
            return null;
        let parameter = source.slice(cursor + 1, close).trim();
        if (parameter.startsWith('request='))
            parameter = parameter.slice('request='.length).trim();
        else if (!parameter.startsWith('{'))
            return null;
        try {
            request = validateRequest(JSON.parse(parameter));
        }
        catch {
            return null;
        }
        cursor = close;
    }
    if (source[cursor] !== '}')
        return null;
    const path = source.slice(cursor + 1);
    if (!url || !/^https?:\/\//u.test(url) || !/^[.[]/u.test(path))
        return null;
    return { url, path, request };
}
/** Localiza o fechamento externo, ignorando chaves dentro de strings JSON. */
function findExpressionClose(source, start) {
    let depth = 1;
    let quote = '';
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
        const character = source[index] ?? '';
        if (quote) {
            if (escaped)
                escaped = false;
            else if (character === '\\')
                escaped = true;
            else if (character === quote)
                quote = '';
            continue;
        }
        if (character === '"')
            quote = character;
        else if (character === '{')
            depth += 1;
        else if (character === '}' && --depth === 0)
            return index;
    }
    return -1;
}
/** Valida o objeto request e aplica defaults sem coerção silenciosa. */
function validateRequest(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new TypeError('request inválido');
    const input = value;
    if (Object.keys(input).some((key) => !['method', 'query', 'headers', 'body'].includes(key)))
        throw new TypeError('campo request desconhecido');
    const method = input.method ?? 'GET';
    if (method !== 'GET' && method !== 'POST')
        throw new TypeError('método inválido');
    const query = validateScalarRecord(input.query ?? {});
    const headers = validateHeaders(input.headers ?? {});
    const body = input.body;
    if (body !== undefined) {
        if (method !== 'POST' ||
            !body ||
            typeof body !== 'object' ||
            Array.isArray(body))
            throw new TypeError('body inválido');
        const bodyObject = body;
        if (!['json', 'form', 'text'].includes(String(bodyObject.encoding)))
            throw new TypeError('encoding inválido');
        if (!Object.prototype.hasOwnProperty.call(bodyObject, 'value'))
            throw new TypeError('body sem value');
        return {
            method,
            query,
            headers,
            body: {
                encoding: bodyObject.encoding,
                value: bodyObject.value,
            },
        };
    }
    return { method, query, headers };
}
function validateScalarRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new TypeError('query inválida');
    const result = {};
    for (const [key, item] of Object.entries(value)) {
        if (!['string', 'number', 'boolean'].includes(typeof item))
            throw new TypeError('query não escalar');
        result[key] = item;
    }
    return result;
}
function validateHeaders(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new TypeError('headers inválido');
    const result = {};
    for (const [key, item] of Object.entries(value)) {
        if (BLOCKED_HEADERS.has(key.toLowerCase()))
            throw new TypeError('header controlado pelo runtime');
        if (typeof item === 'string')
            result[key] = item;
        else if (item &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            typeof item.env === 'string' &&
            Object.keys(item).length === 1)
            result[key] = { env: item.env };
        else
            throw new TypeError('valor de header inválido');
    }
    return result;
}
/** Detecta uma expressão DSL canônica sem executar I/O. */
export function hasParserExpression(source) {
    return source.length > 0 && DSL_EXPRESSION.test(source);
}
/** Resolve sincronamente um path canônico sobre dado estruturado carregado. */
export function resolveDslData(data, path) {
    try {
        let current = data;
        const tokens = path.replace(/^\./u, '').match(TOKEN) ?? [];
        for (const token of tokens) {
            if (current === null || current === undefined)
                return null;
            const index = token.match(INDEX);
            if (index) {
                const container = getProperty(current, index[1] ?? '');
                if (!Array.isArray(container))
                    return null;
                const position = Number(index[2]);
                current =
                    position < container.length ? container[position] : null;
                continue;
            }
            const filter = token.match(FILTER);
            if (filter) {
                const container = getProperty(current, filter[1] ?? '');
                if (!Array.isArray(container))
                    return null;
                const attribute = filter[2] ?? '';
                const expected = filter[3] ?? '';
                current =
                    container.find((item) => String(getProperty(item, attribute)) === expected) ?? null;
                continue;
            }
            current = getProperty(current, token);
        }
        return current === null || current === undefined ?
            null
            : String(current);
    }
    catch {
        return null;
    }
}
/** Constrói resultado estruturado para integrações e transportes assíncronos. */
export function toDslResult(value, code = 'INVALID_PATH') {
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
function getProperty(value, key) {
    if (typeof value !== 'object' ||
        value === null ||
        !Object.prototype.hasOwnProperty.call(value, key))
        return null;
    return value[key];
}
//# sourceMappingURL=core.js.map