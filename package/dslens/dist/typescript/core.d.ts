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
export interface DslEnvReference {
    readonly env: string;
}
export interface DslRequest {
    readonly method: 'GET' | 'POST';
    readonly query: Readonly<Record<string, string | number | boolean>>;
    readonly headers: Readonly<Record<string, string | DslEnvReference>>;
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
export declare function parseDslExpression(source: string): ParsedDslExpression | null;
/** Detecta uma expressão DSL canônica sem executar I/O. */
export declare function hasParserExpression(source: string): boolean;
/** Resolve sincronamente um path canônico sobre dado estruturado carregado. */
export declare function resolveDslData(data: unknown, path: string): string | null;
/** Constrói resultado estruturado para integrações e transportes assíncronos. */
export declare function toDslResult(value: string | null, code?: string): DslResult;
//# sourceMappingURL=core.d.ts.map