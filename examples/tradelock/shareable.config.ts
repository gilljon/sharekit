/**
 * Example: How Tradelock would configure @shareable
 *
 * This shows the full integration pattern for a trading journal app with
 * progress sharing and coach chat sharing.
 */
import { createShareable } from "@shareable/core";
import { drizzleStorage } from "@shareable/drizzle";
import { betterAuthProvider } from "@shareable/better-auth";

// These would come from your app's existing setup
declare const db: any;
declare const auth: any;

export const shareable = createShareable({
  storage: drizzleStorage(db),
  auth: betterAuthProvider(auth),
  baseUrl: process.env.BETTER_AUTH_URL ?? "https://refinetrade.app",
  defaults: {
    tokenLength: 12,
    ownerDisplay: "first-name",
    trackViews: true,
  },
});
