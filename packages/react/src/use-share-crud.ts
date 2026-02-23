import type { Share, VisibleFields } from "@sharekit/core";
import { useCallback, useEffect, useState } from "react";

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
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBasePath}/${type}?action=list`);
      if (!res.ok) throw new Error("Failed to load shares");
      const data = await res.json();
      setShares(data.shares ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [apiBasePath, type]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const createShare = useCallback(
    async (expiresAt?: Date): Promise<CreateShareResult | null> => {
      setIsCreating(true);
      setError(null);
      try {
        const res = await fetch(`${apiBasePath}/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            visibleFields,
            params,
            expiresAt: expiresAt?.toISOString(),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create share");
        }
        const data = await res.json();
        await fetchShares();
        return { token: data.share.token, url: data.url };
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [apiBasePath, type, visibleFields, params, fetchShares],
  );

  const revokeShare = useCallback(
    async (shareId: string) => {
      setError(null);
      try {
        const res = await fetch(`${apiBasePath}/${type}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke", shareId }),
        });
        if (!res.ok) throw new Error("Failed to revoke share");
        await fetchShares();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    },
    [apiBasePath, type, fetchShares],
  );

  const copyLink = useCallback(
    async (token: string) => {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/shared/${type}/${token}`;
      await navigator.clipboard.writeText(url);
    },
    [type],
  );

  return {
    shares,
    isLoading,
    isCreating,
    error,
    createShare,
    revokeShare,
    copyLink,
    refresh: fetchShares,
  };
}
