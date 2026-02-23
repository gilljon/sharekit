import {
  handleAction,
  ShareableError,
  renderOGImage,
  type ShareableAction,
  type ShareableInstance,
  type OGImageConfig,
} from "@shareable/core";

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
 * Parse the shareable type and action from the Next.js catch-all route params.
 *
 * Route: `/api/shareable/[...shareable]`
 *
 * Patterns:
 * - GET  /api/shareable/:type?action=list     -> list shares
 * - GET  /api/shareable/:type/:token          -> view share data
 * - GET  /api/shareable/:type/:token/og       -> OG image config
 * - POST /api/shareable/:type                 -> create share
 * - DELETE /api/shareable/:type               -> revoke share
 */
function parseRoute(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  body?: Record<string, unknown>,
): ShareableAction | null {
  const type = segments[0];
  if (!type) return null;

  if (method === "GET") {
    const action = searchParams.get("action");
    if (action === "list") {
      return { kind: "list", type };
    }

    const token = segments[1];
    if (token && segments[2] === "og") {
      return { kind: "og", token };
    }
    if (token) {
      return { kind: "view", token };
    }

    return { kind: "list", type };
  }

  if (method === "POST") {
    return {
      kind: "create",
      type,
      visibleFields: (body?.visibleFields as Record<string, boolean>) ?? {},
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
 * Creates Next.js App Router route handlers for the shareable API.
 *
 * Mount at: `app/api/shareable/[...shareable]/route.ts`
 *
 * ```ts
 * import { createNextHandler } from '@shareable/next'
 * import { shareable } from '../../../../lib/shareable'
 * export const { GET, POST, DELETE } = createNextHandler(shareable)
 * ```
 */
export function createNextHandler(instance: ShareableInstance) {
  async function handleRequest(request: Request, context: { params: Promise<{ shareable: string[] }> | { shareable: string[] } }) {
    try {
      const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
      const segments = resolvedParams.shareable;
      const url = new URL(request.url);
      const method = request.method;

      let body: Record<string, unknown> | undefined;
      if (method === "POST" || method === "DELETE") {
        try {
          body = await request.json();
        } catch {
          body = {};
        }
      }

      const action = parseRoute(segments, method, url.searchParams, body);
      if (!action) {
        return errorResponse("Invalid request", 400);
      }

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
