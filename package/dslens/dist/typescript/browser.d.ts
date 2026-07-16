export * from './core.js';
import { type DslCallback } from './core.js';
/** Opções da fachada assíncrona client-side. */
export interface ResolveSourceOptions {
    readonly signal?: AbortSignal;
    readonly timeoutMs?: number;
    readonly fetcher?: typeof fetch;
    readonly env?: Readonly<Record<string, string | undefined>>;
}
/** Obtém JSON por GET e resolve o path com o núcleo síncrono. */
export declare function resolveParserExpression(source: string, options?: ResolveSourceOptions, callback?: DslCallback): Promise<string | null>;
//# sourceMappingURL=browser.d.ts.map