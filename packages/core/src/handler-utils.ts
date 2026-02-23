import { ShareableError, handleAction } from "./handler.js";
import { renderOGImage } from "./og-image.js";
import type { OGImageConfig, ShareableAction, ShareableInstance } from "./types.js";

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

export async function parseBody(request: Request): Promise<Record<string, unknown>> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/**
 * Parse URL segments + method into a ShareableAction.
 *
 * Segments are the path parts after the API base, e.g. `["profile", "abc123", "og"]`.
 * All framework adapters normalise their routing conventions into this format
 * before calling this function.
 */
export function parseRoute(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  body?: Record<string, unknown>,
): ShareableAction | null {
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
 * Shared request handler that all framework adapters delegate to.
 *
 * Accepts pre-normalised `segments` (path parts after the API base path).
 * Framework adapters are responsible only for extracting segments from their
 * routing convention and calling this function.
 */
export async function handleRequestBase(
  instance: ShareableInstance,
  request: Request,
  segments: string[],
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const method = request.method;

    let body: Record<string, unknown> | undefined;
    if (method === "POST" || method === "DELETE") {
      body = await parseBody(request);
    }

    const action = parseRoute(segments, method, url.searchParams, body);
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
