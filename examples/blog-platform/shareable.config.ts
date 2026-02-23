/**
 * Example: Configuring @sharekit for a blog platform
 *
 * This shows the full integration pattern for an app where users
 * can share their profile stats and individual blog posts with
 * granular privacy controls.
 */
import { createShareable } from "@sharekit/core";
import { drizzleStorage } from "@sharekit/drizzle";
import { betterAuthProvider } from "@sharekit/better-auth";

declare const db: any;
declare const auth: any;

export const shareable = createShareable({
  storage: drizzleStorage(db),
  auth: betterAuthProvider(auth),
  baseUrl: process.env.APP_URL ?? "https://example.com",
  defaults: {
    tokenLength: 12,
    ownerDisplay: "first-name",
    trackViews: true,
  },
});
