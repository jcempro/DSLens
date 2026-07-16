/*
 * Origem: https://github.com/jcempro/DSLens
 * Autor: JeanCarloEM - https://jeancarloem.com
 * Licença: MPL-2.0 - https://mozilla.org/MPL/2.0/
 * Resumo: uso, cópia, modificação e distribuição conforme a MPL-2.0.
 */
export * from './core.js';
import { resolveDslData } from './core.js';
const EXPRESSION = /^\$\{\s*(["'])(?<source>.*?)\1\s*\}(?<path>[.\[].*)$/u;
/** Obtém JSON por GET e resolve o path com o núcleo síncrono. */
export async function resolveParserExpression(source, options = {}) {
    const match = source.match(EXPRESSION);
    const url = match?.groups?.source;
    const path = match?.groups?.path;
    if (!url || !path || !/^https?:\/\//u.test(url))
        return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);
    const signal = options.signal ?? controller.signal;
    try {
        const response = await (options.fetcher ?? fetch)(url, {
            method: 'GET',
            signal,
            headers: { accept: 'application/json' },
        });
        if (!response.ok)
            return null;
        return resolveDslData(await response.json(), path);
    }
    catch {
        return null;
    }
    finally {
        clearTimeout(timeout);
    }
}
//# sourceMappingURL=browser.js.map