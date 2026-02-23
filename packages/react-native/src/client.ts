import type { Share, ShareAnalyticsData, SharedViewData, VisibleFields } from "@sharekit/core";

export interface ShareClientConfig {
  /** Absolute URL of the backend, e.g. "https://myapp.com" */
  baseUrl: string;
  /** API route prefix. Default: "/api/shareable" */
  apiPath?: string;
  /** Async callback that returns headers for every request (auth tokens, etc.) */
  getHeaders?: () => Promise<Record<string, string>>;
}

export interface ShareClient {
  create(
    type: string,
    visibleFields: VisibleFields,
    params?: Record<string, unknown>,
    expiresAt?: Date,
  ): Promise<{ share: Share; url: string }>;
  list(type: string): Promise<Share[]>;
  view(type: string, token: string): Promise<SharedViewData>;
  revoke(type: string, shareId: string): Promise<void>;
  analytics(type?: string): Promise<ShareAnalyticsData>;
}

export function createShareClient(config: ShareClientConfig): ShareClient {
  const { baseUrl, apiPath = "/api/shareable", getHeaders } = config;

  async function headers(): Promise<Record<string, string>> {
    const custom = getHeaders ? await getHeaders() : {};
    return { "Content-Type": "application/json", ...custom };
  }

  function url(path: string): string {
    return `${baseUrl}${apiPath}/${path}`;
  }

  async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    async create(type, visibleFields, params: Record<string, unknown> = {}, expiresAt?: Date) {
      const res = await fetch(url(type), {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify({
          action: "create",
          visibleFields,
          params,
          expiresAt: expiresAt?.toISOString(),
        }),
      });
      return handleResponse<{ share: Share; url: string }>(res);
    },

    async list(type) {
      const res = await fetch(url(`${type}?action=list`), {
        headers: await headers(),
      });
      const data = await handleResponse<{ shares: Share[] }>(res);
      return data.shares;
    },

    async view(type, token) {
      const res = await fetch(url(`${type}/${token}`), {
        headers: await headers(),
      });
      return handleResponse<SharedViewData>(res);
    },

    async revoke(type, shareId) {
      const res = await fetch(url(type), {
        method: "DELETE",
        headers: await headers(),
        body: JSON.stringify({ action: "revoke", shareId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to revoke share");
      }
    },

    async analytics(type) {
      const segment = type ?? "_all";
      const res = await fetch(url(`${segment}?action=analytics`), {
        headers: await headers(),
      });
      return handleResponse<ShareAnalyticsData>(res);
    },
  };
}
