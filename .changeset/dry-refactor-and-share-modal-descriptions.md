---
"@sharekit/core": minor
"@sharekit/react": minor
"@sharekit/drizzle": patch
"@sharekit/prisma": patch
"@sharekit/next": patch
"@sharekit/tanstack-start": patch
"@sharekit/remix": patch
"@sharekit/better-auth": patch
"@sharekit/next-auth": patch
"@sharekit/clerk": patch
---

DRY refactor across the SDK and ShareModal description rendering

**@sharekit/core**

- New `handleRequestBase()` consolidates all HTTP request handling (route parsing, body parsing, OG image responses, error handling) into a single function. Framework adapters now delegate to this instead of duplicating ~100 lines each.
- New `parseRoute()`, `jsonResponse()`, `errorResponse()`, `parseBody()` utilities exported for custom handler implementations.
- New `getShareMeta()` for fetching share metadata (title, description, OG image URL). Previously duplicated identically in `@sharekit/tanstack-start` and `@sharekit/remix`.
- New `mapRowToShare()` and `ShareRow` type for storage adapters to normalise database rows into `Share` objects without duplicating the mapping logic.
- New `checkOwnerIdHeader()` for auth adapters to handle the internal `x-shareable-owner-id` header lookup.
- Internal handler helpers (`requireAuth`, `requireValidToken`, `requireNotExpired`, `resolveOwnerName`, `getFilteredData`) eliminate repeated patterns across action cases.

**@sharekit/react**

- New `DefaultSharedView`, `DefaultNotFound`, `DefaultExpired`, `DefaultError` components exported for framework adapters and custom shared pages.
- `ShareModal` now renders field descriptions from the toggle schema. Previously only labels were shown, requiring custom modal implementations to display descriptions.
- `ShareManager` now uses `useToggleFields()` internally instead of reimplementing toggle logic. Fixes a subtle bug where initial visible fields were not run through `resolveDependencies()`.
- Internal `useShareCrudInternal` hook eliminates CRUD logic duplication between `ShareManager` and `useShareCrud`.

**Framework adapters** (`@sharekit/next`, `@sharekit/tanstack-start`, `@sharekit/remix`)

- Handler files reduced from ~140-150 lines to ~20-35 lines by delegating to `handleRequestBase()`.
- SharedView components now import `DefaultSharedView` from `@sharekit/react` instead of defining their own copies.
- `getShareMeta()` re-exported from `@sharekit/core` (TanStack Start and Remix previously had identical 42-line copies).

**Storage adapters** (`@sharekit/drizzle`, `@sharekit/prisma`)

- Use `mapRowToShare()` from `@sharekit/core` instead of local `rowToShare()` functions.

**Auth adapters** (`@sharekit/better-auth`, `@sharekit/next-auth`, `@sharekit/clerk`)

- Use `checkOwnerIdHeader()` from `@sharekit/core` instead of inlining the header check.
