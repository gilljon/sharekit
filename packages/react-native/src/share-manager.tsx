import { type Share, type VisibleFields, getDefaults } from "@sharekit/core";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useShareableContext } from "./context.js";
import { ShareManagerContext, type ShareManagerContextValue } from "./context.js";

export interface ShareManagerProps {
  children: ReactNode | ((ctx: ShareManagerContextValue) => ReactNode);
}

async function tryClipboardCopy(text: string): Promise<void> {
  try {
    const Clipboard = await import("expo-clipboard");
    await Clipboard.setStringAsync(text);
  } catch {
    /* expo-clipboard not installed -- silently skip */
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
    /* expo-sharing not installed -- silently skip */
  }
}

export function ShareManager({ children }: ShareManagerProps) {
  const shareableCtx = useShareableContext();
  const { type, schema, client, params, baseUrl } = shareableCtx;

  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleFields, setVisibleFieldsState] = useState<VisibleFields>(() => getDefaults(schema));

  const fetchShares = useCallback(async () => {
    if (!client) return;
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
      if (!client) return null;
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
      if (!client) return;
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

  const buildShareUrl = useCallback(
    (token: string) => `${baseUrl}/shared/${type}/${token}`,
    [baseUrl, type],
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
    shareNative,
    isCreating,
  };

  return (
    <ShareManagerContext value={value}>
      {typeof children === "function" ? children(value) : children}
    </ShareManagerContext>
  );
}
