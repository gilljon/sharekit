# TanStack Start Example

Minimal reference example showing @sharekit integration with TanStack Start, Drizzle, and Better Auth.

## What This Demonstrates

- Shareable configuration with `drizzleStorage` and `betterAuthProvider`
- Profile shareable definition with privacy schema (bio, followerCount, earnings, analytics group)
- Catch-all API route using `createTanStackHandler`
- Profile page with `ShareableProvider`, `Field`, and `ShareButton`
- Shared view page with loader-based data fetch, type-specific rendering, and `getShareMeta` for OG metadata

## File Organization

```
src/
  lib/shareable.ts       -- createShareable config (storage, auth, baseUrl)
  shareables/profile.ts  -- profile definition (fields, getData, ogImage)
  routes/
    api/shareable.$.tsx   -- catch-all API route
    profile.tsx           -- owner view with share UI
    shared.$type.$token.tsx -- public shared view
```

## Key Integration Points

1. **Config** (`lib/shareable.ts`): Replace `db` and `auth` placeholders with your Drizzle client and Better Auth instance.
2. **API route** (`api/shareable.$.tsx`): Uses `server: { handlers: createTanStackHandler(shareable) }` for server-only handling.
3. **Shared view**: Loader calls `createShareServerFns(shareable).view(token)`; `head` uses `getShareMeta` for meta tags.
4. **Styles**: Import `@sharekit/react/styles.css` for ShareModal/ToggleList styling.

## Note

This is a reference example, not a runnable template. You need a real database (with `shareable_shares` table) and auth setup to run it. Add the Drizzle schema from `@sharekit/drizzle` and run migrations.
