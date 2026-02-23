import type { CreateShareInput, Share, ShareableStorage } from "@shareable/core";
import { and, eq, sql } from "drizzle-orm";
import { shareableShares } from "./schema.js";

type DrizzleDb = {
  select: (...args: unknown[]) => unknown;
  insert: (...args: unknown[]) => unknown;
  update: (...args: unknown[]) => unknown;
  delete: (...args: unknown[]) => unknown;
};

function rowToShare(row: typeof shareableShares.$inferSelect): Share {
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
 * Creates a ShareableStorage backed by Drizzle ORM.
 *
 * ```ts
 * import { drizzleStorage } from '@shareable/drizzle'
 * const storage = drizzleStorage(db)
 * ```
 */
export function drizzleStorage(db: DrizzleDb): ShareableStorage {
  return {
    async createShare(input: CreateShareInput): Promise<Share> {
      const [row] = (await (db as any)
        .insert(shareableShares)
        .values({
          type: input.type,
          token: input.token,
          ownerId: input.ownerId,
          params: input.params,
          visibleFields: input.visibleFields,
          expiresAt: input.expiresAt ?? null,
        })
        .returning()) as (typeof shareableShares.$inferSelect)[];

      if (!row) throw new Error("Failed to create share");
      return rowToShare(row);
    },

    async getShare(token: string): Promise<Share | null> {
      const [row] = (await (db as any)
        .select()
        .from(shareableShares)
        .where(eq(shareableShares.token, token))
        .limit(1)) as (typeof shareableShares.$inferSelect)[];

      return row ? rowToShare(row) : null;
    },

    async getSharesByOwner(ownerId: string, type?: string): Promise<Share[]> {
      const conditions = [eq(shareableShares.ownerId, ownerId)];
      if (type) {
        conditions.push(eq(shareableShares.type, type));
      }

      const rows = (await (db as any)
        .select()
        .from(shareableShares)
        .where(and(...conditions))
        .orderBy(shareableShares.createdAt)) as (typeof shareableShares.$inferSelect)[];

      return rows.map(rowToShare);
    },

    async revokeShare(shareId: string, ownerId: string): Promise<void> {
      await (db as any)
        .delete(shareableShares)
        .where(and(eq(shareableShares.id, shareId), eq(shareableShares.ownerId, ownerId)));
    },

    async incrementViewCount(token: string): Promise<void> {
      await (db as any)
        .update(shareableShares)
        .set({ viewCount: sql`${shareableShares.viewCount} + 1` })
        .where(eq(shareableShares.token, token));
    },
  };
}
