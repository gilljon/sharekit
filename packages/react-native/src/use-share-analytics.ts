import type { ShareAnalyticsData } from "@sharekit/core";
import { useCallback, useEffect, useState } from "react";
import { useShareableContext } from "./context.js";

export interface UseShareAnalyticsOptions {
  type?: string;
  autoFetch?: boolean;
}

export interface UseShareAnalyticsReturn {
  data: ShareAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useShareAnalytics(
  options: UseShareAnalyticsOptions = {},
): UseShareAnalyticsReturn {
  const { type, autoFetch = true } = options;
  const { client } = useShareableContext();
  const [data, setData] = useState<ShareAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!client) {
      setError("Share client not configured");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.analytics(type);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [client, type]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  return { data, isLoading, error, refetch };
}
