export * from './core.js';
/** Mensagem aceita pelo adaptador Web Worker. */
export interface WorkerRequest {
    readonly id: string;
    readonly data: unknown;
    readonly path: string;
}
/** Resolve uma mensagem de worker sem depender de estado global. */
export declare function resolveWorkerRequest(request: WorkerRequest): Readonly<{
    id: string;
    value: string | null;
}>;
//# sourceMappingURL=worker.d.ts.map