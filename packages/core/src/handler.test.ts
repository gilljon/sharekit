import { describe, expect, it, vi } from "vitest";
import { ShareableError, handleAction } from "./handler.js";
import type {
  Share,
  ShareableAction,
  ShareableAuthProvider,
  ShareableConfig,
  ShareableDefinition,
  ShareableInstance,
  ShareableStorage,
} from "./types.js";

// biome-ignore lint/suspicious/noExplicitAny: test helper -- handleAction returns unknown, tests need property access
type Result = Record<string, any>;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeShare(overrides: Partial<Share> = {}): Share {
  return {
    id: "share-1",
    type: "profile",
    token: "abcdef123456",
    ownerId: "user-1",
    params: {},
    visibleFields: { name: true, email: false },
    viewCount: 5,
    createdAt: new Date("2025-01-01"),
    expiresAt: null,
    ...overrides,
  };
}

function makeStorage(overrides: Partial<ShareableStorage> = {}): ShareableStorage {
  return {
    createShare: vi.fn(async (input) =>
      makeShare({
        token: input.token,
        ownerId: input.ownerId,
        type: input.type,
        visibleFields: input.visibleFields,
        params: input.params,
      }),
    ),
    getShare: vi.fn(async () => makeShare()),
    getSharesByOwner: vi.fn(async () => [makeShare()]),
    revokeShare: vi.fn(async () => {}),
    incrementViewCount: vi.fn(async () => {}),
    ...overrides,
  };
}

function makeAuth(user = { id: "user-1", name: "Test User" }): ShareableAuthProvider {
  return {
    getUser: vi.fn(async (req: Request) => {
      const ownerHeader = req.headers.get("x-shareable-owner-id");
      if (ownerHeader) return { id: ownerHeader, name: "Test User" };
      return user;
    }),
  };
}

function makeDefinition(overrides: Partial<ShareableDefinition> = {}): ShareableDefinition {
  return {
    id: "profile",
    fields: {
      name: { label: "Name", default: true },
      email: { label: "Email", default: false },
      bio: { label: "Bio", default: true, requires: "name" },
    },
    getData: vi.fn(async () => ({ name: "Test", email: "test@example.com", bio: "Hello" })),
    ...overrides,
  };
}

function makeInstance(
  overrides: {
    storage?: ShareableStorage;
    auth?: ShareableAuthProvider;
    definitions?: Map<string, ShareableDefinition>;
    defaults?: ShareableConfig["defaults"];
  } = {},
): ShareableInstance {
  const storage = overrides.storage ?? makeStorage();
  const auth = overrides.auth ?? makeAuth();
  const definitions = overrides.definitions ?? new Map([["profile", makeDefinition()]]);
  const config: ShareableConfig = {
    storage,
    auth,
    baseUrl: "https://example.com",
    defaults: overrides.defaults,
  };
  return {
    config,
    definitions,
    define: vi.fn(),
    getDefinition: (id: string) => definitions.get(id),
  };
}

function makeRequest(): Request {
  return new Request("https://example.com/api/shareable/profile", {
    headers: { cookie: "session=abc" },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleAction", () => {
  describe("create", () => {
    it("creates a share with resolved dependencies", async () => {
      const storage = makeStorage();
      const instance = makeInstance({ storage });
      const action: ShareableAction = {
        kind: "create",
        type: "profile",
        visibleFields: { name: true, email: false, bio: true },
        params: {},
      };

      const result = (await handleAction(instance, action, makeRequest())) as Result;
      expect(result.share).toBeDefined();
      expect(result.url).toContain("https://example.com/shared/profile/");
      expect(storage.createShare).toHaveBeenCalledOnce();
    });

    it("throws 401 without request", async () => {
      const instance = makeInstance();
      const action: ShareableAction = {
        kind: "create",
        type: "profile",
        visibleFields: { name: true },
        params: {},
      };

      await expect(handleAction(instance, action)).rejects.toThrow(ShareableError);
      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 401 });
    });

    it("throws 401 when auth returns null", async () => {
      const auth: ShareableAuthProvider = { getUser: vi.fn(async () => null) };
      const instance = makeInstance({ auth });
      const action: ShareableAction = {
        kind: "create",
        type: "profile",
        visibleFields: { name: true },
        params: {},
      };

      await expect(handleAction(instance, action, makeRequest())).rejects.toMatchObject({
        status: 401,
      });
    });

    it("throws 400 for unknown type", async () => {
      const instance = makeInstance();
      const action: ShareableAction = {
        kind: "create",
        type: "nonexistent",
        visibleFields: {},
        params: {},
      };

      await expect(handleAction(instance, action, makeRequest())).rejects.toMatchObject({
        status: 400,
      });
    });

    it("resolves field dependencies before storing", async () => {
      const storage = makeStorage();
      const instance = makeInstance({ storage });
      const action: ShareableAction = {
        kind: "create",
        type: "profile",
        visibleFields: { name: false, email: false, bio: true },
        params: {},
      };

      await handleAction(instance, action, makeRequest());

      const call = vi.mocked(storage.createShare).mock.calls[0][0];
      expect(call.visibleFields.bio).toBe(false);
    });

    it("strips trailing slash from baseUrl", async () => {
      const instance = makeInstance();
      instance.config.baseUrl = "https://example.com/";

      const action: ShareableAction = {
        kind: "create",
        type: "profile",
        visibleFields: { name: true },
        params: {},
      };

      const result = (await handleAction(instance, action, makeRequest())) as Result;
      expect(result.url).not.toContain("//shared");
    });
  });

  describe("list", () => {
    it("returns shares for authenticated user", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "list", type: "profile" };

      const result = (await handleAction(instance, action, makeRequest())) as Result;
      expect(result.shares).toHaveLength(1);
    });

    it("throws 401 without auth", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "list" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 401 });
    });

    it("passes type filter to storage", async () => {
      const storage = makeStorage();
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "list", type: "profile" };

      await handleAction(instance, action, makeRequest());
      expect(storage.getSharesByOwner).toHaveBeenCalledWith("user-1", "profile", undefined);
    });

    it("passes params filter to storage when provided", async () => {
      const storage = makeStorage();
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "list", type: "profile", params: { chatId: "123" } };

      await handleAction(instance, action, makeRequest());
      expect(storage.getSharesByOwner).toHaveBeenCalledWith("user-1", "profile", {
        params: { chatId: "123" },
      });
    });
  });

  describe("get", () => {
    it("returns a share by token", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "get", token: "abcdef123456" };

      const result = (await handleAction(instance, action)) as Result;
      expect(result.share.token).toBe("abcdef123456");
    });

    it("throws 400 for invalid token format", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "get", token: "bad" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 400 });
    });

    it("throws 404 when share not found", async () => {
      const storage = makeStorage({ getShare: vi.fn(async () => null) });
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "get", token: "abcdef123456" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 404 });
    });

    it("throws 410 for expired shares", async () => {
      const storage = makeStorage({
        getShare: vi.fn(async () => makeShare({ expiresAt: new Date("2020-01-01") })),
      });
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "get", token: "abcdef123456" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 410 });
    });
  });

  describe("revoke", () => {
    it("revokes a share", async () => {
      const storage = makeStorage();
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "revoke", shareId: "share-1" };

      const result = (await handleAction(instance, action, makeRequest())) as Result;
      expect(result.success).toBe(true);
      expect(storage.revokeShare).toHaveBeenCalledWith("share-1", "user-1");
    });

    it("throws 401 without auth", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "revoke", shareId: "share-1" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 401 });
    });
  });

  describe("update", () => {
    it("updates a share's visible fields", async () => {
      const updatedShare = makeShare({ visibleFields: { name: true, email: true } });
      const storage = makeStorage({
        updateShare: vi.fn(async () => updatedShare),
      });
      const instance = makeInstance({ storage });
      const action: ShareableAction = {
        kind: "update",
        shareId: "share-1",
        visibleFields: { name: true, email: true },
      };

      const result = (await handleAction(instance, action, makeRequest())) as Result;
      expect(result.share.visibleFields).toEqual({ name: true, email: true });
      expect(storage.updateShare).toHaveBeenCalledWith("share-1", "user-1", {
        visibleFields: { name: true, email: true },
      });
    });

    it("throws 401 without auth", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "update", shareId: "share-1", visibleFields: {} };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 401 });
    });

    it("throws 501 when storage does not support update", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "update", shareId: "share-1", visibleFields: {} };

      await expect(handleAction(instance, action, makeRequest())).rejects.toMatchObject({
        status: 501,
      });
    });
  });

  describe("view", () => {
    it("returns filtered data with owner info", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      const result = (await handleAction(instance, action)) as Result;
      expect(result.data).toBeDefined();
      expect(result.visibleFields).toBeDefined();
      expect(result.ownerName).toBe("Test");
      expect(result.viewCount).toBe(6);
      expect(result.type).toBe("profile");
    });

    it("increments view count", async () => {
      const storage = makeStorage();
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      await handleAction(instance, action);
      expect(storage.incrementViewCount).toHaveBeenCalledWith("abcdef123456");
    });

    it("skips view count when trackViews is false", async () => {
      const storage = makeStorage();
      const instance = makeInstance({ storage, defaults: { trackViews: false } });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      await handleAction(instance, action);
      expect(storage.incrementViewCount).not.toHaveBeenCalled();
    });

    it("filters data based on visible fields", async () => {
      const definition = makeDefinition({
        getData: vi.fn(async () => ({ name: "Test", email: "secret@test.com", bio: "Hello" })),
      });
      const storage = makeStorage({
        getShare: vi.fn(async () =>
          makeShare({ visibleFields: { name: true, email: false, bio: true } }),
        ),
      });
      const instance = makeInstance({
        storage,
        definitions: new Map([["profile", definition]]),
      });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      const result = (await handleAction(instance, action)) as Result;
      expect(result.data.email).toBeUndefined();
      expect(result.data.name).toBe("Test");
    });

    it("applies custom filterData when defined", async () => {
      const definition = makeDefinition({
        filterData: vi.fn(({ data }) => ({ ...data, custom: true })),
      });
      const instance = makeInstance({
        definitions: new Map([["profile", definition]]),
      });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      const result = (await handleAction(instance, action)) as Result;
      expect(result.data.custom).toBe(true);
      expect(definition.filterData).toHaveBeenCalledOnce();
    });

    it("throws 400 for invalid token", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "view", token: "bad" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 400 });
    });

    it("throws 404 when share not found", async () => {
      const storage = makeStorage({ getShare: vi.fn(async () => null) });
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 404 });
    });

    it("throws 410 for expired share", async () => {
      const storage = makeStorage({
        getShare: vi.fn(async () => makeShare({ expiresAt: new Date("2020-01-01") })),
      });
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 410 });
    });

    it("throws 500 for unknown definition type", async () => {
      const storage = makeStorage({
        getShare: vi.fn(async () => makeShare({ type: "unknown" })),
      });
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 500 });
    });

    it("returns 'Someone' when owner lookup fails", async () => {
      const auth: ShareableAuthProvider = {
        getUser: vi.fn(async (req: Request) => {
          if (req.headers.get("x-shareable-owner-id")) throw new Error("lookup failed");
          return { id: "user-1", name: "Test User" };
        }),
      };
      const instance = makeInstance({ auth });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      const result = (await handleAction(instance, action)) as Result;
      expect(result.ownerName).toBe("Someone");
    });

    it("uses full owner name when ownerDisplay is 'full'", async () => {
      const instance = makeInstance({ defaults: { ownerDisplay: "full" } });
      const action: ShareableAction = { kind: "view", token: "abcdef123456" };

      const result = (await handleAction(instance, action)) as Result;
      expect(result.ownerName).toBe("Test User");
    });
  });

  describe("og", () => {
    it("returns OG image config", async () => {
      const definition = makeDefinition({
        ogImage: ({ ownerName }) => ({
          title: `${ownerName}'s Profile`,
          subtitle: "Shared content",
          metrics: [{ label: "Views", value: "100" }],
        }),
      });
      const instance = makeInstance({
        definitions: new Map([["profile", definition]]),
      });
      const action: ShareableAction = { kind: "og", token: "abcdef123456" };

      const result = (await handleAction(instance, action)) as Result;
      expect(result.title).toContain("Profile");
      expect(result.metrics).toHaveLength(1);
    });

    it("throws 404 when ogImage is not configured", async () => {
      const definition = makeDefinition({ ogImage: undefined });
      const instance = makeInstance({
        definitions: new Map([["profile", definition]]),
      });
      const action: ShareableAction = { kind: "og", token: "abcdef123456" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 404 });
    });

    it("throws 400 for invalid token", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "og", token: "bad" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 400 });
    });

    it("throws 404 when share not found", async () => {
      const storage = makeStorage({ getShare: vi.fn(async () => null) });
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "og", token: "abcdef123456" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("analytics", () => {
    it("uses storage getAnalytics when available", async () => {
      const analyticsData = {
        totalShares: 10,
        totalViews: 100,
        sharesByType: [{ type: "profile", count: 10, views: 100 }],
        topShares: [],
        recentActivity: [],
      };
      const storage = makeStorage({
        getAnalytics: vi.fn(async () => analyticsData),
      });
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "analytics", type: "profile" };

      const result = await handleAction(instance, action, makeRequest());
      expect(result).toEqual(analyticsData);
      expect(storage.getAnalytics).toHaveBeenCalledWith("user-1", "profile");
    });

    it("derives analytics from shares when getAnalytics not implemented", async () => {
      const shares = [
        makeShare({ id: "s1", viewCount: 10 }),
        makeShare({ id: "s2", viewCount: 20 }),
      ];
      const storage = makeStorage({
        getSharesByOwner: vi.fn(async () => shares),
      });
      const instance = makeInstance({ storage });
      const action: ShareableAction = { kind: "analytics" };

      const result = (await handleAction(instance, action, makeRequest())) as Result;
      expect(result.totalShares).toBe(2);
      expect(result.totalViews).toBe(30);
      expect(result.topShares).toHaveLength(2);
      expect(result.topShares[0].viewCount).toBe(20);
    });

    it("throws 401 without auth", async () => {
      const instance = makeInstance();
      const action: ShareableAction = { kind: "analytics" };

      await expect(handleAction(instance, action)).rejects.toMatchObject({ status: 401 });
    });
  });
});
