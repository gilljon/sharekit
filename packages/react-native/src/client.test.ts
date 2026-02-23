import { beforeEach, describe, expect, it, vi } from "vitest";
import { createShareClient } from "./client.js";

const mockShare = {
  id: "share-1",
  type: "progress",
  token: "abc123",
  ownerId: "user-1",
  params: {},
  visibleFields: { summary: true, revenue: false },
  viewCount: 5,
  createdAt: new Date("2025-01-01"),
  expiresAt: null,
};

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

describe("createShareClient", () => {
  const client = createShareClient({
    baseUrl: "https://myapp.com",
  });

  it("creates a share with POST", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ share: mockShare, url: "https://myapp.com/shared/progress/abc123" }),
    });

    const result = await client.create("progress", { summary: true }, { key: "val" });

    expect(mockFetch).toHaveBeenCalledWith("https://myapp.com/api/shareable/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        visibleFields: { summary: true },
        params: { key: "val" },
        expiresAt: undefined,
      }),
    });
    expect(result.share.token).toBe("abc123");
    expect(result.url).toBe("https://myapp.com/shared/progress/abc123");
  });

  it("lists shares with GET", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shares: [mockShare] }),
    });

    const shares = await client.list("progress");

    expect(mockFetch).toHaveBeenCalledWith("https://myapp.com/api/shareable/progress?action=list", {
      headers: { "Content-Type": "application/json" },
    });
    expect(shares).toHaveLength(1);
    expect(shares[0]?.token).toBe("abc123");
  });

  it("views shared content with GET", async () => {
    const viewData = {
      data: { summary: "test" },
      visibleFields: { summary: true },
      ownerName: "Jon",
      viewCount: 5,
      type: "progress",
      createdAt: new Date("2025-01-01"),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => viewData,
    });

    const result = await client.view("progress", "abc123");

    expect(mockFetch).toHaveBeenCalledWith("https://myapp.com/api/shareable/progress/abc123", {
      headers: { "Content-Type": "application/json" },
    });
    expect(result.ownerName).toBe("Jon");
  });

  it("revokes a share with DELETE", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await client.revoke("progress", "share-1");

    expect(mockFetch).toHaveBeenCalledWith("https://myapp.com/api/shareable/progress", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", shareId: "share-1" }),
    });
  });

  it("throws on non-ok response with error message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: "Forbidden" }),
    });

    await expect(client.list("progress")).rejects.toThrow("Forbidden");
  });

  it("throws with status code when no error body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("no json");
      },
    });

    await expect(client.list("progress")).rejects.toThrow("Request failed: 500");
  });

  it("uses custom apiPath", async () => {
    const customClient = createShareClient({
      baseUrl: "https://myapp.com",
      apiPath: "/v2/shares",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shares: [] }),
    });

    await customClient.list("progress");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://myapp.com/v2/shares/progress?action=list",
      expect.objectContaining({}),
    );
  });

  it("passes custom headers from getHeaders", async () => {
    const authedClient = createShareClient({
      baseUrl: "https://myapp.com",
      getHeaders: async () => ({ Authorization: "Bearer tok_123" }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shares: [] }),
    });

    await authedClient.list("progress");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { "Content-Type": "application/json", Authorization: "Bearer tok_123" },
      }),
    );
  });

  it("fetches analytics", async () => {
    const analyticsData = {
      totalShares: 10,
      totalViews: 50,
      sharesByType: [{ type: "progress", count: 10, views: 50 }],
      topShares: [],
      recentActivity: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => analyticsData,
    });

    const result = await client.analytics("progress");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://myapp.com/api/shareable/progress?action=analytics",
      expect.objectContaining({}),
    );
    expect(result.totalShares).toBe(10);
  });

  it("uses _all segment when analytics type is omitted", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalShares: 0,
        totalViews: 0,
        sharesByType: [],
        topShares: [],
        recentActivity: [],
      }),
    });

    await client.analytics();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://myapp.com/api/shareable/_all?action=analytics",
      expect.objectContaining({}),
    );
  });
});
