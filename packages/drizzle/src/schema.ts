import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Drizzle schema for the shareable_shares table.
 *
 * Users should add this to their Drizzle schema and run `drizzle-kit generate`
 * to create the migration.
 *
 * ```ts
 * // db/schema.ts
 * export { shareableShares } from '@shareable/drizzle'
 * ```
 */
export const shareableShares = pgTable("shareable_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  token: text("token").notNull().unique(),
  ownerId: text("owner_id").notNull(),
  params: jsonb("params").notNull().$type<Record<string, unknown>>().default({}),
  visibleFields: jsonb("visible_fields").notNull().$type<Record<string, boolean>>().default({}),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});
