/*
 * Origem: https://github.com/jcempro/DSLens
 * Autor: JeanCarloEM - https://jeancarloem.com
 * Licença: MPL-2.0 - https://mozilla.org/MPL/2.0/
 * Resumo: uso, cópia, modificação e distribuição conforme a MPL-2.0.
 */
export * from './core.js';
import { resolveDslData } from './core.js';
/** Resolve uma mensagem de worker sem depender de estado global. */
export function resolveWorkerRequest(request) {
    return {
        id: request.id,
        value: resolveDslData(request.data, request.path),
    };
}
//# sourceMappingURL=worker.js.map