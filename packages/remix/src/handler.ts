import {
  handleAction,
  ShareableError,
  renderOGImage,
  type ShareableAction,
  type ShareableInstance,
  type OGImageConfig,
  type VisibleFields,
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

async function handleRequest(instance: ShareableInstance, request: Request, wildcard: string) {
  try {
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

/**
 * Creates a Remix `loader` function for the shareable API.
 *
 * Handles GET requests: list shares, view shared data, OG images.
 *
 * ```ts
 * // app/routes/api.shareable.$.tsx
 * import { createRemixLoader, createRemixAction } from '@sharekit/remix'
 * import { shareable } from '../../lib/shareable'
 *
 * export const loader = createRemixLoader(shareable)
 * export const action = createRemixAction(shareable)
 * ```
 */
export function createRemixLoader(instance: ShareableInstance) {
  return async ({ request, params }: { request: Request; params: { "*"?: string } }) => {
    return handleRequest(instance, request, params["*"] ?? "");
  };
}

/**
 * Creates a Remix `action` function for the shareable API.
 *
 * Handles POST (create) and DELETE (revoke) requests.
 */
export function createRemixAction(instance: ShareableInstance) {
  return async ({ request, params }: { request: Request; params: { "*"?: string } }) => {
    return handleRequest(instance, request, params["*"] ?? "");
  };
}
