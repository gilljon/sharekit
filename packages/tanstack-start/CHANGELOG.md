# @sharekit/tanstack-start

## 0.3.1

### Patch Changes

- c0b9deb: DRY refactor across the SDK and ShareModal description rendering

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

- Updated dependencies [c0b9deb]
  - @sharekit/core@1.1.0
  - @sharekit/react@0.5.0

## 0.3.0

### Minor Changes

- 64228a1: ### @sharekit/core

  **BREAKING:** `renderOGImagePng` has been moved to a dedicated subpath export `@sharekit/core/png`. This keeps `@resvg/resvg-js` out of consumer client bundles entirely, eliminating the need for Vite/Rollup `external` configuration.

  ```diff
  - import { renderOGImagePng } from '@sharekit/core'
  + import { renderOGImagePng } from '@sharekit/core/png'
  ```

  - Replaced `node:crypto` with Web Crypto API (`globalThis.crypto.randomUUID()`) in the token engine. Consumers no longer need a crypto browser shim plugin in their bundler config.
  - Fixed `filterData` to correctly strip hidden fields at any nesting depth (previously only handled 2 levels).
  - Fixed `resolveDependencies` to resolve transitive dependency chains by iterating until stable (previously single-pass, missing indirect dependencies).
  - Added `update` action to the handler for modifying share visibility fields and expiration.
  - Added optional `updateShare` method to `ShareableStorage` interface.
  - `getSharesByOwner` now accepts an optional `filter` parameter for filtering by `params`.

  ### @sharekit/react

  - Redesigned `ShareModal` with improved structure: header, toggle switches with indeterminate state, field descriptions, select all/deselect all, expiration picker, copy-to-clipboard URL display, lazy-loaded active shares list, and revoke confirmation.
  - Added default styles via `@sharekit/react/styles.css` with CSS custom properties for theming.
  - `ShareButton` `renderModal` prop now receives `visible` boolean for controlled rendering.
  - `setAllFieldsVisible` now resolves dependencies after toggling (prevents orphaned dependent fields).
  - Added `resetToDefaults` to `ShareManager` context and `useToggleFields` hook.

  ### @sharekit/react-native

  - `setAllFieldsVisible` now resolves dependencies after toggling.
  - Added `resetToDefaults` to `ShareManager` context and `useToggleFields` hook.
  - Added `useShareAnalytics` hook for fetching share analytics data.

  ### @sharekit/drizzle

  - Implemented `updateShare` for modifying existing shares.
  - `getSharesByOwner` now supports JSONB `params` filtering.
  - Relaxed `PgDatabase` type parameter to remove unnecessary `as any` casts.

  ### @sharekit/prisma

  - Implemented `updateShare` for modifying existing shares.
  - `getSharesByOwner` now supports `params` filtering.

  ### @sharekit/tanstack-start

  - Handler now supports `PATCH` method for the `update` action.
  - `list` action passes `params` filter through to storage.
  - Added `getShareMeta` metadata helper for shared view pages.

  ### @sharekit/remix

  - Added `getShareMeta` metadata helper for shared view pages.

### Patch Changes

- Updated dependencies [64228a1]
  - @sharekit/core@1.0.0
  - @sharekit/react@0.4.0

## 0.2.1

### Patch Changes

- Updated dependencies [a836ec9]
  - @sharekit/core@0.3.0
  - @sharekit/react@0.3.0

## 0.2.0

### Minor Changes

- 33b1f70: Initial release of the ShareKit SDK.

  Privacy-aware content sharing for React with token management, granular privacy controls, server-side data filtering, OG image generation, and share analytics.

  Includes framework adapters (Next.js, TanStack Start, Remix), storage adapters (Drizzle, Prisma), and auth adapters (Better Auth, NextAuth, Clerk).

### Patch Changes

- Updated dependencies [33b1f70]
  - @sharekit/core@0.2.0
  - @sharekit/react@0.2.0
