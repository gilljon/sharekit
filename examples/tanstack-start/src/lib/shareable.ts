import { createShareable } from "@sharekit/core";
import { drizzleStorage } from "@sharekit/drizzle";
import { betterAuthProvider } from "@sharekit/better-auth";

declare const db: import("drizzle-orm").PgDatabase;
declare const auth: { api: { getSession: (opts: { headers: Headers }) => Promise<{ user?: { id: string; name?: string } } | null> } };

export const shareable = createShareable({
  storage: drizzleStorage(db),
  auth: betterAuthProvider(auth),
  baseUrl: process.env.APP_URL ?? "http://localhost:3000",
  defaults: {
    tokenLength: 12,
    ownerDisplay: "first-name",
    trackViews: true,
  },
});
