import { type ShareableInstance, handleRequestBase } from "@sharekit/core";

/**
 * Creates TanStack Start `server.handlers` for the shareable API.
 *
 * Mount at a catch-all route:
 * ```ts
 * // routes/api/shareable.$.tsx
 * export const Route = createFileRoute('/api/shareable/$')({
 *   server: {
 *     handlers: createTanStackHandler(shareable),
 *   },
 * })
 * ```
 *
 * IMPORTANT: This uses the `server: { handlers: {} }` pattern which is
 * safe for server-only imports. TanStack Router properly handles these
 * as server-only, so `db` can be imported directly in the shareable config.
 */
export function createTanStackHandler(instance: ShareableInstance) {
  async function handleRequest({ request }: { request: Request; params: Record<string, string> }) {
    const url = new URL(request.url);
    const pathPrefix = "/api/shareable/";
    const pathIdx = url.pathname.indexOf(pathPrefix);
    const wildcard = pathIdx >= 0 ? url.pathname.slice(pathIdx + pathPrefix.length) : "";
    const segments = wildcard.split("/").filter(Boolean);
    return handleRequestBase(instance, request, segments);
  }

  return {
    GET: handleRequest,
    POST: handleRequest,
    DELETE: handleRequest,
  };
}
