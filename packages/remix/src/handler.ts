import { type ShareableInstance, handleRequestBase } from "@sharekit/core";

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
    const segments = (params["*"] ?? "").split("/").filter(Boolean);
    return handleRequestBase(instance, request, segments);
  };
}

/**
 * Creates a Remix `action` function for the shareable API.
 *
 * Handles POST (create) and DELETE (revoke) requests.
 */
export function createRemixAction(instance: ShareableInstance) {
  return async ({ request, params }: { request: Request; params: { "*"?: string } }) => {
    const segments = (params["*"] ?? "").split("/").filter(Boolean);
    return handleRequestBase(instance, request, segments);
  };
}
