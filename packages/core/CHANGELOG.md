# @sharekit/core

## 0.3.0

### Minor Changes

- a836ec9: Add composable share primitives: standalone `useToggleFields` and `useShareCrud` hooks, headless render-prop components (`ToggleList`, `ShareList`, `DependencyWarnings`), optional `description` field on `FieldDefinition`, and fix `ShareManager.setFieldVisible` to automatically resolve dependencies.

## 0.2.0

### Minor Changes

- 33b1f70: Initial release of the ShareKit SDK.

  Privacy-aware content sharing for React with token management, granular privacy controls, server-side data filtering, OG image generation, and share analytics.

  Includes framework adapters (Next.js, TanStack Start, Remix), storage adapters (Drizzle, Prisma), and auth adapters (Better Auth, NextAuth, Clerk).
