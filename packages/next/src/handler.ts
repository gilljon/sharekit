import { type ShareableInstance, handleRequestBase } from "@sharekit/core";

/**
 * Creates Next.js App Router route handlers for the shareable API.
 *
 * Mount at: `app/api/shareable/[...shareable]/route.ts`
 *
 * ```ts
 * import { createNextHandler } from '@sharekit/next'
 * import { shareable } from '../../../../lib/shareable'
 * export const { GET, POST, DELETE } = createNextHandler(shareable)
 * ```
 */
export function createNextHandler(instance: ShareableInstance) {
  async function handleRequest(
    request: Request,
    context: { params: Promise<{ shareable: string[] }> | { shareable: string[] } },
  ) {
    const resolvedParams =
      context.params instanceof Promise ? await context.params : context.params;
    return handleRequestBase(instance, request, resolvedParams.shareable);
  }

  return {
    GET: handleRequest,
    POST: handleRequest,
    DELETE: handleRequest,
  };
}
