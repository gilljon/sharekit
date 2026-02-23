import { describe, expect, it, vi, beforeEach } from "vitest";
import { drizzleStorage } from "./storage.js";
import { shareableShares } from "./schema.js";

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "share-id-1",
    type: "profile",
    token: "abc123",
    ownerId: "user-1",
    params: {},
    visibleFields: { name: true },
    viewCount: 0,
    createdAt: new Date("2025-01-01"),
    expiresAt: null,
    ...overrides,
  };
}

function createInsertChain(returningValue: unknown[]) {
  const returning = vi.fn().mockResolvedValue(returningValue);
  return {
    values: vi.fn().mockReturnThis(),
    get returning() {
      return returning;
    },
  };
}

function createSelectChain(limitValue: unknown[], orderByValue?: unknown[]) {
  const limit = vi.fn().mockResolvedValue(limitValue);
  const orderBy = vi.fn().mockResolvedValue(orderByValue ?? limitValue);
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get limit() {
      return limit;
    },
    get orderBy() {
      return orderBy;
    },
  };
}

function createUpdateChain(returningValue: unknown[]) {
  const returning = vi.fn().mockResolvedValue(returningValue);
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue({
      get returning() {
        return returning;
      },
    }),
  };
}

function createDeleteChain() {
  return {
    where: vi.fn().mockResolvedValue(undefined),
  };
}

describe("drizzleStorage", () => {
  let db: {
    insert: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const row = makeRow();
    db = {
      insert: vi.fn().mockReturnValue(createInsertChain([row])),
      select: vi.fn().mockReturnValue(createSelectChain([row])),
      update: vi.fn().mockReturnValue(createUpdateChain([row])),
      delete: vi.fn().mockReturnValue(createDeleteChain()),
    };
  });

  describe("createShare", () => {
    it("creates a share and returns mapped Share", async () => {
      const row = makeRow({ token: "new-token", ownerId: "user-2" });
      db.insert = vi.fn().mockReturnValue(createInsertChain([row]));

      const storage = drizzleStorage(db as never);
      const result = await storage.createShare({
        type: "profile",
        token: "new-token",
        ownerId: "user-2",
        params: {},
        visibleFields: { name: true },
      });

      expect(result).toMatchObject({
        id: "share-id-1",
        type: "profile",
        token: "new-token",
        ownerId: "user-2",
        params: {},
        visibleFields: { name: true },
        viewCount: 0,
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(db.insert).toHaveBeenCalledWith(shareableShares);
    });

    it("throws when insert returns no row", async () => {
      db.insert = vi.fn().mockReturnValue(createInsertChain([]));

      const storage = drizzleStorage(db as never);
      await expect(
        storage.createShare({
          type: "profile",
          token: "t",
          ownerId: "u",
          params: {},
          visibleFields: {},
        }),
      ).rejects.toThrow("Failed to create share");
    });
  });

  describe("getShare", () => {
    it("returns share when found", async () => {
      const row = makeRow();
      db.select = vi.fn().mockReturnValue(createSelectChain([row]));

      const storage = drizzleStorage(db as never);
      const result = await storage.getShare("abc123");

      expect(result).not.toBeNull();
      expect(result?.token).toBe("abc123");
      expect(result?.ownerId).toBe("user-1");
    });

    it("returns null when not found", async () => {
      db.select = vi.fn().mockReturnValue(createSelectChain([]));

      const storage = drizzleStorage(db as never);
      const result = await storage.getShare("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getSharesByOwner", () => {
    it("returns shares for owner", async () => {
      const rows = [makeRow({ id: "1" }), makeRow({ id: "2" })];
      db.select = vi.fn().mockReturnValue(createSelectChain([], rows));

      const storage = drizzleStorage(db as never);
      const result = await storage.getSharesByOwner("user-1");

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe("1");
      expect(result[1]?.id).toBe("2");
    });

    it("filters by type when provided", async () => {
      db.select = vi.fn().mockReturnValue(createSelectChain([], []));

      const storage = drizzleStorage(db as never);
      await storage.getSharesByOwner("user-1", "profile");

      expect(db.select).toHaveBeenCalled();
    });

    it("filters by params when filter.params provided", async () => {
      db.select = vi.fn().mockReturnValue(createSelectChain([], []));

      const storage = drizzleStorage(db as never);
      await storage.getSharesByOwner("user-1", "profile", { params: { chatId: "123" } });

      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("revokeShare", () => {
    it("deletes share by id and ownerId", async () => {
      const storage = drizzleStorage(db as never);
      await storage.revokeShare("share-id-1", "user-1");

      expect(db.delete).toHaveBeenCalledWith(shareableShares);
    });
  });

  describe("incrementViewCount", () => {
    it("updates view count for token", async () => {
      const storage = drizzleStorage(db as never);
      await storage.incrementViewCount("abc123");

      expect(db.update).toHaveBeenCalledWith(shareableShares);
    });
  });

  describe("updateShare", () => {
    it("updates visibleFields and returns Share", async () => {
      const updatedRow = makeRow({ visibleFields: { name: true, email: true } });
      db.update = vi.fn().mockReturnValue(createUpdateChain([updatedRow]));

      const storage = drizzleStorage(db as never);
      const result = await storage.updateShare("share-id-1", "user-1", {
        visibleFields: { name: true, email: true },
      });

      expect(result.visibleFields).toEqual({ name: true, email: true });
      expect(db.update).toHaveBeenCalledWith(shareableShares);
    });

    it("updates expiresAt when provided", async () => {
      const newExpiry = new Date("2026-01-01");
      const updatedRow = makeRow({ expiresAt: newExpiry });
      db.update = vi.fn().mockReturnValue(createUpdateChain([updatedRow]));

      const storage = drizzleStorage(db as never);
      const result = await storage.updateShare("share-id-1", "user-1", { expiresAt: newExpiry });

      expect(result.expiresAt).toEqual(newExpiry);
    });

    it("throws when share not found", async () => {
      db.update = vi.fn().mockReturnValue(createUpdateChain([]));

      const storage = drizzleStorage(db as never);
      await expect(storage.updateShare("bad-id", "user-1", { visibleFields: {} })).rejects.toThrow(
        "Share not found or unauthorized",
      );
    });
  });
});
