import type { CreateShareInput, Share, ShareableStorage, VisibleFields } from "@sharekit/core";

interface PrismaShareableShare {
  id: string;
  type: string;
  token: string;
  ownerId: string;
  params: unknown;
  visibleFields: unknown;
  viewCount: number;
  createdAt: Date;
  expiresAt: Date | null;
}

interface PrismaDelegate {
  create(args: { data: Record<string, unknown> }): Promise<PrismaShareableShare>;
  findUnique(args: { where: Record<string, unknown> }): Promise<PrismaShareableShare | null>;
  findMany(args: {
    where: Record<string, unknown>;
    orderBy?: Record<string, string>;
  }): Promise<PrismaShareableShare[]>;
  delete(args: { where: Record<string, unknown> }): Promise<unknown>;
  update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<unknown>;
}

interface PrismaClient {
  shareableShare: PrismaDelegate;
}

function rowToShare(row: PrismaShareableShare): Share {
  return {
    id: row.id,
    type: row.type,
    token: row.token,
    ownerId: row.ownerId,
    params: (row.params as Record<string, unknown>) ?? {},
    visibleFields: (row.visibleFields as Record<string, boolean>) ?? {},
    viewCount: row.viewCount,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

/**
 * Creates a ShareableStorage backed by Prisma ORM.
 *
 * Requires a `ShareableShare` model in your Prisma schema.
 * See `prisma/shareable.prisma` for the model definition.
 *
 * ```ts
 * import { prismaStorage } from '@sharekit/prisma'
 * const storage = prismaStorage(prisma)
 * ```
 */
export function prismaStorage(prisma: PrismaClient): ShareableStorage {
  return {
    async createShare(input: CreateShareInput): Promise<Share> {
      const row = await prisma.shareableShare.create({
        data: {
          type: input.type,
          token: input.token,
          ownerId: input.ownerId,
          params: input.params,
          visibleFields: input.visibleFields,
          expiresAt: input.expiresAt ?? null,
        },
      });
      return rowToShare(row);
    },

    async getShare(token: string): Promise<Share | null> {
      const row = await prisma.shareableShare.findUnique({
        where: { token },
      });
      return row ? rowToShare(row) : null;
    },

    async getSharesByOwner(
      ownerId: string,
      type?: string,
      filter?: { params?: Record<string, unknown> },
    ): Promise<Share[]> {
      const where: Record<string, unknown> = { ownerId };
      if (type) where.type = type;
      if (filter?.params) {
        where.params = { path: [], equals: filter.params };
      }

      const rows = await prisma.shareableShare.findMany({
        where,
        orderBy: { createdAt: "asc" },
      });
      return rows.map(rowToShare);
    },

    async revokeShare(shareId: string, ownerId: string): Promise<void> {
      await prisma.shareableShare.delete({
        where: { id: shareId, ownerId },
      });
    },

    async incrementViewCount(token: string): Promise<void> {
      await prisma.shareableShare.update({
        where: { token },
        data: { viewCount: { increment: 1 } as unknown as number },
      });
    },

    async updateShare(
      shareId: string,
      ownerId: string,
      updates: { visibleFields?: VisibleFields; expiresAt?: Date },
    ): Promise<Share> {
      const data: Record<string, unknown> = {};
      if (updates.visibleFields !== undefined) data.visibleFields = updates.visibleFields;
      if (updates.expiresAt !== undefined) data.expiresAt = updates.expiresAt;

      const row = await prisma.shareableShare.update({
        where: { id: shareId, ownerId },
        data,
      });
      return rowToShare(row as PrismaShareableShare);
    },
  };
}
