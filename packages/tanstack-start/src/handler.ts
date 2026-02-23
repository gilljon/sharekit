import {
  type OGImageConfig,
  type ShareableAction,
  ShareableError,
  type ShareableInstance,
  type VisibleFields,
  handleAction,
  renderOGImage,
} from "@sharekit/core";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

/**
 * Parse the wildcard segment and method into a ShareableAction.
 *
 * Route: `/api/shareable/$`
 *
 * The wildcard `$` captures everything after `/api/shareable/`.
 * Patterns mirror the Next.js adapter:
 * - GET  /api/shareable/:type?action=list     -> list
 * - GET  /api/shareable/:type/:token          -> view
 * - GET  /api/shareable/:type/:token/og       -> og
 * - POST /api/shareable/:type                 -> create
 * - DELETE /api/shareable/:type               -> revoke
 */
function parseRoute(
  wildcard: string,
  method: string,
  searchParams: URLSearchParams,
  body?: Record<string, unknown>,
): ShareableAction | null {
  const segments = wildcard.split("/").filter(Boolean);
  const type = segments[0];
  if (!type) return null;

  if (method === "GET") {
    const action = searchParams.get("action");
    if (action === "list") return { kind: "list", type };
    if (action === "analytics") return { kind: "analytics", type };

    const token = segments[1];
    if (token && segments[2] === "og") return { kind: "og", token };
    if (token) return { kind: "view", token };

    return { kind: "list", type };
  }

  if (method === "POST") {
    return {
      kind: "create",
      type,
      visibleFields: (body?.visibleFields as VisibleFields) ?? {},
      params: (body?.params as Record<string, unknown>) ?? {},
      expiresAt: body?.expiresAt as string | undefined,
    };
  }

  if (method === "DELETE") {
    const shareId = body?.shareId as string;
    if (!shareId) return null;
    return { kind: "revoke", shareId };
  }

  return null;
}

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
    try {
      const url = new URL(request.url);
      const method = request.method;

      const pathPrefix = "/api/shareable/";
      const pathIdx = url.pathname.indexOf(pathPrefix);
      const wildcard = pathIdx >= 0 ? url.pathname.slice(pathIdx + pathPrefix.length) : "";

      let body: Record<string, unknown> | undefined;
      if (method === "POST" || method === "DELETE") {
        try {
          body = await request.json();
        } catch {
          body = {};
        }
      }

      const action = parseRoute(wildcard, method, url.searchParams, body);
      if (!action) return errorResponse("Invalid request", 400);

      const result = await handleAction(instance, action, request);

      if (action.kind === "og") {
        try {
          const ogConfig = result as OGImageConfig;
          const svg = await renderOGImage(ogConfig);
          return new Response(svg, {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
          });
        } catch {
          return jsonResponse(result, 200);
        }
      }

      return jsonResponse(result);
    } catch (err) {
      if (err instanceof ShareableError) {
        return errorResponse(err.message, err.status);
      }
      console.error("[shareable]", err);
      return errorResponse("Internal server error", 500);
    }
  }

  return {
    GET: handleRequest,
    POST: handleRequest,
    DELETE: handleRequest,
  };
}
