import type { ShareAnalyticsData } from "@sharekit/core";
import { useCallback, useEffect, useState, type ReactNode } from "react";

export interface UseShareAnalyticsOptions {
  apiBasePath?: string;
  type?: string;
  /** Auto-fetch on mount. Defaults to true. */
  autoFetch?: boolean;
}

export interface UseShareAnalyticsReturn {
  data: ShareAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch share analytics data.
 *
 * ```tsx
 * const { data, isLoading, error } = useShareAnalytics({
 *   apiBasePath: '/api/shareable',
 *   type: 'progress', // optional: filter by type
 * })
 * ```
 */
export function useShareAnalytics(options: UseShareAnalyticsOptions = {}): UseShareAnalyticsReturn {
  const { apiBasePath = "/api/shareable", type, autoFetch = true } = options;
  const [data, setData] = useState<ShareAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const typeSegment = type ?? "_all";
      const url = `${apiBasePath}/${typeSegment}?action=analytics`;
      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Request failed: ${response.status}`);
      }

      const result = await response.json();
      setData(result as ShareAnalyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [apiBasePath, type]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  return { data, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// ShareAnalytics Component
// ---------------------------------------------------------------------------

export interface ShareAnalyticsProps {
  apiBasePath?: string;
  type?: string;
  children?: (analytics: UseShareAnalyticsReturn) => ReactNode;
}

/**
 * Headless analytics component with render prop pattern.
 *
 * ```tsx
 * <ShareAnalytics apiBasePath="/api/shareable" type="progress">
 *   {({ data, isLoading }) => (
 *     <div>
 *       {isLoading ? <Spinner /> : <p>{data?.totalShares} shares</p>}
 *     </div>
 *   )}
 * </ShareAnalytics>
 * ```
 */
export function ShareAnalytics({ apiBasePath, type, children }: ShareAnalyticsProps) {
  const analytics = useShareAnalytics({ apiBasePath, type });

  if (children) {
    return <>{children(analytics)}</>;
  }

  if (analytics.isLoading) {
    return <div data-shareable-analytics-loading="">Loading analytics...</div>;
  }

  if (analytics.error) {
    return <div data-shareable-analytics-error="">{analytics.error}</div>;
  }

  if (!analytics.data) return null;

  const { data } = analytics;

  return (
    <div data-shareable-analytics="">
      <div data-shareable-analytics-stats="">
        <div data-shareable-stat="">
          <span data-shareable-stat-value="">{data.totalShares}</span>
          <span data-shareable-stat-label="">Total Shares</span>
        </div>
        <div data-shareable-stat="">
          <span data-shareable-stat-value="">{data.totalViews}</span>
          <span data-shareable-stat-label="">Total Views</span>
        </div>
      </div>
      {data.sharesByType.length > 1 && (
        <div data-shareable-analytics-types="">
          <h4>By Type</h4>
          {data.sharesByType.map((t) => (
            <div key={t.type} data-shareable-analytics-type="">
              <span>{t.type}</span>
              <span>{t.count} shares</span>
              <span>{t.views} views</span>
            </div>
          ))}
        </div>
      )}
      {data.topShares.length > 0 && (
        <div data-shareable-analytics-top="">
          <h4>Most Viewed</h4>
          {data.topShares.slice(0, 5).map((s) => (
            <div key={s.id} data-shareable-analytics-top-item="">
              <span>#{s.rank}</span>
              <span>{s.type}</span>
              <span>{s.viewCount} views</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
