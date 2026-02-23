---
"@sharekit/core": major
"@sharekit/react": minor
"@sharekit/react-native": minor
"@sharekit/drizzle": minor
"@sharekit/prisma": minor
"@sharekit/tanstack-start": minor
"@sharekit/remix": minor
---

### @sharekit/core

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
