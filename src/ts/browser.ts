/*
 * Origem: https://github.com/jcempro/DSLens
 * Autor: JeanCarloEM - https://jeancarloem.com
 * Licença: MPL-2.0 - https://mozilla.org/MPL/2.0/
 * Resumo: uso, cópia, modificação e distribuição conforme a MPL-2.0.
 */

export * from './core.js';
import { parseDslExpression, resolveDslData } from './core.js';

/** Opções da fachada assíncrona client-side. */
export interface ResolveSourceOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly fetcher?: typeof fetch;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

/** Obtém JSON por GET e resolve o path com o núcleo síncrono. */
export async function resolveParserExpression(
  source: string,
  options: ResolveSourceOptions = {},
): Promise<string | null> {
  const expression = parseDslExpression(source);
  if (!expression) return null;
  const request = expression.request;
  const url = new URL(expression.url);
  for (const [key, value] of Object.entries(request?.query ?? {}))
    url.searchParams.append(key, String(value));
  const headers: Record<string, string> = {
    accept: 'application/json',
  };
  for (const [key, value] of Object.entries(request?.headers ?? {})) {
    if (typeof value === 'string') headers[key] = value;
    else {
      const resolved = options.env?.[value.env];
      if (resolved === undefined) return null;
      headers[key] = resolved;
    }
  }
  let body: string | undefined;
  if (request?.body) {
    if (request.body.encoding === 'json') {
      body = JSON.stringify(request.body.value);
      headers['content-type'] ??= 'application/json';
    } else if (request.body.encoding === 'form') {
      if (
        !request.body.value ||
        typeof request.body.value !== 'object'
      )
        return null;
      body = new URLSearchParams(
        Object.entries(
          request.body.value as Record<string, unknown>,
        ).map(([key, value]) => [key, String(value)]),
      ).toString();
      headers['content-type'] ??= 'application/x-www-form-urlencoded';
    } else body = String(request.body.value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 30_000,
  );
  const signal = options.signal ?? controller.signal;
  try {
    const response = await (options.fetcher ?? fetch)(url, {
      method: request?.method ?? 'GET',
      signal,
      headers,
      ...(body === undefined ? {} : { body }),
      redirect:
        (
          Object.keys(headers).some((key) =>
            /^(authorization|cookie|proxy-authorization)$/iu.test(
              key,
            ),
          )
        ) ?
          'error'
        : 'follow',
    });
    if (!response.ok) return null;
    return resolveDslData(await response.json(), expression.path);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
