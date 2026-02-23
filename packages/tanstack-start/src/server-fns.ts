import {
  type ShareAnalyticsData,
  type ShareableInstance,
  type SharedViewData,
  type VisibleFields,
  handleAction,
} from "@sharekit/core";

/**
 * Creates individual server function handlers for each shareable action.
 *
 * Use this pattern instead of `createTanStackHandler` when you want to
 * call shareable operations from `createServerFn()` rather than catch-all
 * API routes. This works better with TanStack Start's module replacement
 * and avoids server-only import leaks.
 *
 * ```ts
 * // lib/shareable-fns.ts
 * import { createServerFn } from '@tanstack/start'
 * import { createShareServerFns } from '@sharekit/tanstack-start'
 * import { shareable } from './shareable'
 *
 * const fns = createShareServerFns(shareable)
 *
 * export const createShare = createServerFn({ method: 'POST' })
 *   .handler(async ({ data, request }) => fns.create(request!, data))
 *
 * export const listShares = createServerFn({ method: 'GET' })
 *   .handler(async ({ request }) => fns.list(request!))
 *
 * export const revokeShare = createServerFn({ method: 'POST' })
 *   .handler(async ({ data, request }) => fns.revoke(request!, data.shareId))
 *
 * export const viewShare = createServerFn({ method: 'GET' })
 *   .handler(async ({ data }) => fns.view(data.token))
 * ```
 */
export function createShareServerFns(instance: ShareableInstance) {
  return {
    async create(
      request: Request,
      input: {
        type: string;
        visibleFields: VisibleFields;
        params: Record<string, unknown>;
        expiresAt?: string;
      },
    ) {
      return handleAction(
        instance,
        {
          kind: "create",
          type: input.type,
          visibleFields: input.visibleFields,
          params: input.params,
          expiresAt: input.expiresAt,
        },
        request,
      );
    },

    async list(request: Request, type?: string) {
      return handleAction(instance, { kind: "list", type }, request);
    },

    async revoke(request: Request, shareId: string) {
      return handleAction(instance, { kind: "revoke", shareId }, request);
    },

    async view(token: string): Promise<SharedViewData> {
      return handleAction(instance, { kind: "view", token }) as Promise<SharedViewData>;
    },

    async og(token: string) {
      return handleAction(instance, { kind: "og", token });
    },

    async analytics(request: Request, type?: string): Promise<ShareAnalyticsData> {
      return handleAction(
        instance,
        { kind: "analytics", type },
        request,
      ) as Promise<ShareAnalyticsData>;
    },
  };
}
