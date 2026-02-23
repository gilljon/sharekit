import { getDefaults, type Share, type VisibleFields } from "@sharekit/core";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useShareableContext } from "./context.js";
import { ShareManagerContext, type ShareManagerContextValue } from "./context.js";

export interface ShareManagerProps {
  children: ReactNode | ((ctx: ShareManagerContextValue) => ReactNode);
}

/**
 * Manages share CRUD operations. Provides state for creating/listing/revoking
 * shares, and exposes privacy field toggles.
 *
 * Can be used with render props for full customisation, or as a provider
 * for the built-in ShareButton/ShareModal components.
 */
export function ShareManager({ children }: ShareManagerProps) {
  const shareableCtx = useShareableContext();
  const { type, schema, apiBasePath, params } = shareableCtx;

  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleFields, setVisibleFieldsState] = useState<VisibleFields>(() => getDefaults(schema));

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

  const setFieldVisible = useCallback((path: string, visible: boolean) => {
    setVisibleFieldsState((prev) => ({ ...prev, [path]: visible }));
  }, []);

  const setAllFieldsVisible = useCallback(
    (visible: boolean) => {
      const defaults = getDefaults(schema);
      const updated: VisibleFields = {};
      for (const key of Object.keys(defaults)) {
        updated[key] = visible;
      }
      setVisibleFieldsState(updated);
    },
    [schema],
  );

  const createShare = useCallback(
    async (expiresAt?: Date) => {
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

  const value: ShareManagerContextValue = {
    shares,
    isLoading,
    error,
    visibleFields,
    setFieldVisible,
    setAllFieldsVisible,
    createShare,
    revokeShare,
    copyLink,
    isCreating,
  };

  return (
    <ShareManagerContext value={value}>
      {typeof children === "function" ? children(value) : children}
    </ShareManagerContext>
  );
}
