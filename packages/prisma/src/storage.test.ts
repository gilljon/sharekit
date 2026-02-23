import { describe, expect, it, vi, beforeEach } from "vitest";
import { prismaStorage } from "./storage.js";

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

describe("prismaStorage", () => {
  let prisma: {
    shareableShare: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      shareableShare: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
      },
    };
  });

  describe("createShare", () => {
    it("creates a share and returns mapped Share", async () => {
      const row = makeRow({ token: "new-token", ownerId: "user-2" });
      prisma.shareableShare.create.mockResolvedValue(row);

      const storage = prismaStorage(prisma as never);
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
      expect(prisma.shareableShare.create).toHaveBeenCalledWith({
        data: {
          type: "profile",
          token: "new-token",
          ownerId: "user-2",
          params: {},
          visibleFields: { name: true },
          expiresAt: null,
        },
      });
    });
  });

  describe("getShare", () => {
    it("returns share when found", async () => {
      const row = makeRow();
      prisma.shareableShare.findUnique.mockResolvedValue(row);

      const storage = prismaStorage(prisma as never);
      const result = await storage.getShare("abc123");

      expect(result).not.toBeNull();
      expect(result?.token).toBe("abc123");
      expect(result?.ownerId).toBe("user-1");
      expect(prisma.shareableShare.findUnique).toHaveBeenCalledWith({ where: { token: "abc123" } });
    });

    it("returns null when not found", async () => {
      prisma.shareableShare.findUnique.mockResolvedValue(null);

      const storage = prismaStorage(prisma as never);
      const result = await storage.getShare("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getSharesByOwner", () => {
    it("returns shares for owner", async () => {
      const rows = [makeRow({ id: "1" }), makeRow({ id: "2" })];
      prisma.shareableShare.findMany.mockResolvedValue(rows);

      const storage = prismaStorage(prisma as never);
      const result = await storage.getSharesByOwner("user-1");

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe("1");
      expect(result[1]?.id).toBe("2");
      expect(prisma.shareableShare.findMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1" },
        orderBy: { createdAt: "asc" },
      });
    });

    it("filters by type when provided", async () => {
      prisma.shareableShare.findMany.mockResolvedValue([]);

      const storage = prismaStorage(prisma as never);
      await storage.getSharesByOwner("user-1", "profile");

      expect(prisma.shareableShare.findMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1", type: "profile" },
        orderBy: { createdAt: "asc" },
      });
    });

    it("filters by params when filter.params provided", async () => {
      prisma.shareableShare.findMany.mockResolvedValue([]);

      const storage = prismaStorage(prisma as never);
      await storage.getSharesByOwner("user-1", "profile", { params: { chatId: "123" } });

      expect(prisma.shareableShare.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: "user-1",
          type: "profile",
          params: { path: [], equals: { chatId: "123" } },
        },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("revokeShare", () => {
    it("deletes share by id and ownerId", async () => {
      prisma.shareableShare.delete.mockResolvedValue(undefined);

      const storage = prismaStorage(prisma as never);
      await storage.revokeShare("share-id-1", "user-1");

      expect(prisma.shareableShare.delete).toHaveBeenCalledWith({
        where: { id: "share-id-1", ownerId: "user-1" },
      });
    });
  });

  describe("incrementViewCount", () => {
    it("updates view count for token", async () => {
      prisma.shareableShare.update.mockResolvedValue(makeRow());

      const storage = prismaStorage(prisma as never);
      await storage.incrementViewCount("abc123");

      expect(prisma.shareableShare.update).toHaveBeenCalledWith({
        where: { token: "abc123" },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe("updateShare", () => {
    it("updates visibleFields and returns Share", async () => {
      const updatedRow = makeRow({ visibleFields: { name: true, email: true } });
      prisma.shareableShare.update.mockResolvedValue(updatedRow);

      const storage = prismaStorage(prisma as never);
      const result = await storage.updateShare("share-id-1", "user-1", {
        visibleFields: { name: true, email: true },
      });

      expect(result.visibleFields).toEqual({ name: true, email: true });
      expect(prisma.shareableShare.update).toHaveBeenCalledWith({
        where: { id: "share-id-1", ownerId: "user-1" },
        data: { visibleFields: { name: true, email: true } },
      });
    });

    it("updates expiresAt when provided", async () => {
      const newExpiry = new Date("2026-01-01");
      const updatedRow = makeRow({ expiresAt: newExpiry });
      prisma.shareableShare.update.mockResolvedValue(updatedRow);

      const storage = prismaStorage(prisma as never);
      const result = await storage.updateShare("share-id-1", "user-1", { expiresAt: newExpiry });

      expect(result.expiresAt).toEqual(newExpiry);
      expect(prisma.shareableShare.update).toHaveBeenCalledWith({
        where: { id: "share-id-1", ownerId: "user-1" },
        data: { expiresAt: newExpiry },
      });
    });

    it("updates both visibleFields and expiresAt when both provided", async () => {
      const newExpiry = new Date("2026-01-01");
      const updatedRow = makeRow({
        visibleFields: { name: true },
        expiresAt: newExpiry,
      });
      prisma.shareableShare.update.mockResolvedValue(updatedRow);

      const storage = prismaStorage(prisma as never);
      await storage.updateShare("share-id-1", "user-1", {
        visibleFields: { name: true },
        expiresAt: newExpiry,
      });

      expect(prisma.shareableShare.update).toHaveBeenCalledWith({
        where: { id: "share-id-1", ownerId: "user-1" },
        data: { visibleFields: { name: true }, expiresAt: newExpiry },
      });
    });
  });
});
