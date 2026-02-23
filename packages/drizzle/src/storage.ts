import type { CreateShareInput, Share, ShareableStorage, VisibleFields } from "@sharekit/core";
import { mapRowToShare } from "@sharekit/core";
import { and, eq, sql } from "drizzle-orm";
import { shareableShares } from "./schema.js";

type DrizzleDb = {
  select: (...args: unknown[]) => unknown;
  insert: (...args: unknown[]) => unknown;
  update: (...args: unknown[]) => unknown;
  delete: (...args: unknown[]) => unknown;
};

/**
 * Creates a ShareableStorage backed by Drizzle ORM.
 *
 * ```ts
 * import { drizzleStorage } from '@sharekit/drizzle'
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
      return mapRowToShare(row);
    },

    async getShare(token: string): Promise<Share | null> {
      const [row] = (await (db as any)
        .select()
        .from(shareableShares)
        .where(eq(shareableShares.token, token))
        .limit(1)) as (typeof shareableShares.$inferSelect)[];

      return row ? mapRowToShare(row) : null;
    },

    async getSharesByOwner(
      ownerId: string,
      type?: string,
      filter?: { params?: Record<string, unknown> },
    ): Promise<Share[]> {
      const conditions = [eq(shareableShares.ownerId, ownerId)];
      if (type) {
        conditions.push(eq(shareableShares.type, type));
      }
      if (filter?.params) {
        conditions.push(sql`${shareableShares.params} @> ${JSON.stringify(filter.params)}::jsonb`);
      }

      const rows = (await (db as any)
        .select()
        .from(shareableShares)
        .where(and(...conditions))
        .orderBy(shareableShares.createdAt)) as (typeof shareableShares.$inferSelect)[];

      return rows.map(mapRowToShare);
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

    async updateShare(
      shareId: string,
      ownerId: string,
      updates: { visibleFields?: VisibleFields; expiresAt?: Date },
    ): Promise<Share> {
      const data: Record<string, unknown> = {};
      if (updates.visibleFields !== undefined) data.visibleFields = updates.visibleFields;
      if (updates.expiresAt !== undefined) data.expiresAt = updates.expiresAt;

      const [row] = (await (db as any)
        .update(shareableShares)
        .set(data)
        .where(and(eq(shareableShares.id, shareId), eq(shareableShares.ownerId, ownerId)))
        .returning()) as (typeof shareableShares.$inferSelect)[];

      if (!row) throw new Error("Share not found or unauthorized");
      return mapRowToShare(row);
    },
  };
}
