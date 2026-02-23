import type { Share, VisibleFields } from "@sharekit/core";
import { useCallback, useEffect, useState } from "react";
import type { ShareClient } from "./client.js";

export interface CreateShareResult {
  token: string;
  url: string;
}

export interface UseShareCrudOptions {
  type: string;
  client: ShareClient;
  baseUrl: string;
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
  shareNative: (token: string) => Promise<void>;
  refresh: () => Promise<void>;
}

async function tryClipboardCopy(text: string): Promise<void> {
  try {
    const Clipboard = await import("expo-clipboard");
    await Clipboard.setStringAsync(text);
  } catch {
    /* expo-clipboard not installed */
  }
}

async function tryNativeShare(url: string): Promise<void> {
  try {
    const Sharing = await import("expo-sharing");
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(url, { dialogTitle: "Share link" });
    }
  } catch {
    /* expo-sharing not installed */
  }
}

/**
 * Standalone hook for share CRUD operations on React Native.
 *
 * Uses a `ShareClient` instance for network calls and Expo modules
 * for clipboard/native sharing. Decoupled from toggle state -- accepts
 * `visibleFields` as a parameter so it can be composed with `useToggleFields`.
 * No provider wrapping required.
 */
export function useShareCrud({
  type,
  client,
  baseUrl,
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
      const data = await client.list(type);
      setShares(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [client, type]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const buildShareUrl = useCallback(
    (token: string) => `${baseUrl}/shared/${type}/${token}`,
    [baseUrl, type],
  );

  const createShare = useCallback(
    async (expiresAt?: Date): Promise<CreateShareResult | null> => {
      setIsCreating(true);
      setError(null);
      try {
        const data = await client.create(type, visibleFields, params, expiresAt);
        await fetchShares();
        return { token: data.share.token, url: data.url };
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [client, type, visibleFields, params, fetchShares],
  );

  const revokeShare = useCallback(
    async (shareId: string) => {
      setError(null);
      try {
        await client.revoke(type, shareId);
        await fetchShares();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    },
    [client, type, fetchShares],
  );

  const copyLink = useCallback(
    async (token: string) => {
      await tryClipboardCopy(buildShareUrl(token));
    },
    [buildShareUrl],
  );

  const shareNative = useCallback(
    async (token: string) => {
      await tryNativeShare(buildShareUrl(token));
    },
    [buildShareUrl],
  );

  return {
    shares,
    isLoading,
    isCreating,
    error,
    createShare,
    revokeShare,
    copyLink,
    shareNative,
    refresh: fetchShares,
  };
}
