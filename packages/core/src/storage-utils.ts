import type { Share } from "./types.js";

export interface ShareRow {
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

/**
 * Maps a raw database row into a normalised `Share` object.
 *
 * Used by storage adapters (Drizzle, Prisma, etc.) to avoid duplicating
 * the same casting/defaulting logic in every adapter.
 */
export function mapRowToShare(row: ShareRow): Share {
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
