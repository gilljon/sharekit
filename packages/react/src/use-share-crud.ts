import type { Share, VisibleFields } from "@sharekit/core";
import { useShareCrudInternal } from "./use-share-crud-internal.js";

export interface CreateShareResult {
  token: string;
  url: string;
}

export interface UseShareCrudOptions {
  type: string;
  apiBasePath?: string;
  visibleFields: VisibleFields;
  params?: Record<string, unknown>;
}

export interface UseShareCrudReturn {
  shares: Share[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  createShare: (expiresAt?: Date) => Promise<CreateShareResult | null>;
  revokeShare: (shareId: string) => Promise<void>;
  copyLink: (token: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Standalone hook for share CRUD operations (list, create, revoke, copy).
 *
 * Decoupled from toggle state -- accepts `visibleFields` as a parameter
 * so it can be composed with `useToggleFields` or any other state source.
 * No provider wrapping required.
 */
export function useShareCrud({
  type,
  apiBasePath = "/api/shareable",
  visibleFields,
  params = {},
}: UseShareCrudOptions): UseShareCrudReturn {
  return useShareCrudInternal({ type, apiBasePath, visibleFields, params });
}
