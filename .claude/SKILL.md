---
name: sharekit-development
description: Develop and maintain the @sharekit SDK monorepo -- adding adapters, extending core, writing tests, publishing packages. Use when working on any package in the sharekit repo, adding new adapters (storage, auth, framework), modifying the privacy engine, or publishing releases.
---

# @sharekit SDK Development

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm build` | Build all packages |
| `pnpm test:run` | Run all tests |
| `pnpm lint` | Check with Biome |
| `pnpm lint:fix` | Auto-fix lint + format |
| `pnpm changeset` | Create a changeset for versioning |
| `pnpm release` | Build + publish changed packages |
| `pnpm -r exec tsc --noEmit` | Typecheck all packages |

CI runs: lint, test, build, typecheck. All four must pass.

## Package Architecture

```
@sharekit/core           -- Token engine, privacy engine, handler, OG images, all shared types
@sharekit/react          -- Provider, Field, ShareButton, ShareModal, ShareManager
@sharekit/next           -- Next.js App Router adapter (handler + SharedView)
@sharekit/tanstack-start -- TanStack Start adapter
@sharekit/remix          -- Remix adapter
@sharekit/drizzle        -- Drizzle ORM storage adapter
@sharekit/prisma         -- Prisma ORM storage adapter
@sharekit/better-auth    -- Better Auth provider adapter
@sharekit/next-auth      -- NextAuth.js / Auth.js adapter
@sharekit/clerk          -- Clerk adapter
```

**Dependency direction:** adapters depend on `@sharekit/core` (via `workspace:*`). React package also depends on core. Framework adapters depend on both core and react.

## Core Interfaces

Every adapter implements one of these (defined in `packages/core/src/types.ts`):

**ShareableStorage** (5 methods): `createShare`, `getShare`, `getSharesByOwner`, `revokeShare`, `incrementViewCount`

**ShareableAuthProvider** (1 method): `getUser(request)` -- must check `x-shareable-owner-id` header first, then fall back to session resolution.

**ShareableInstance**: Created by `createShareable()`, holds config and definitions.

## Adding a New Adapter

### Scaffold

Every adapter package needs:

```
packages/<name>/
  src/index.ts        # Single entry point, re-exports everything
  package.json        # @sharekit/<name>, workspace:* dep on core
  tsconfig.json
  tsup.config.ts      # entry: ["src/index.ts"], format: ["esm", "cjs"], dts: true
  README.md
```

**package.json template** (copy from an existing adapter, update name/description/peerDependencies):
- `"type": "module"`
- Dual exports: `"import": "./dist/index.js"`, `"require": "./dist/index.cjs"`, `"types": "./dist/index.d.ts"`
- `"files": ["dist", "README.md"]`
- External libraries go in `peerDependencies`, NOT `dependencies`
- `@sharekit/core` goes in `dependencies` as `"workspace:*"`

### Storage adapter

Template: `packages/drizzle/src/storage.ts`

1. Implement all 5 `ShareableStorage` methods
2. Export factory: `export function <name>Storage(client): ShareableStorage`
3. Map database rows to the `Share` type from core

### Auth adapter

Template: `packages/better-auth/src/index.ts`

1. Implement `ShareableAuthProvider.getUser(request)`
2. Always check `request.headers.get("x-shareable-owner-id")` first
3. Fall back to auth library's session resolution
4. Return `{ id, name? }` or `null`

### Framework adapter

Template: `packages/next/src/handler.ts`

1. Parse framework request into `ShareableAction`
2. Call `handleAction()` from core
3. Handle OG image route (SVG via `renderOGImage()`)
4. Export `SharedView` component and metadata helper

## Conventions

- `.js` extensions in all local imports (ESM compatibility with tsup)
- Single `src/index.ts` entry point per package
- Types re-exported from `@sharekit/core` -- never re-define them
- Errors use `ShareableError(message, status)` from core
- Factory naming: `<provider>Storage(client)`, `<provider>Provider(options)`
- Biome handles formatting and linting (2-space indent, 100 char line width)

## Testing

Tests use Vitest and live alongside source as `*.test.ts`. Current tests are in `packages/core/src/`.

- **Core:** Privacy engine (schema parsing, dependency resolution, data filtering), token generation
- **Adapters:** Mock the ORM/auth client, test mapping logic
- **React:** Test component rendering with different context states

## Changesets

Every PR that changes published code needs a changeset:

```bash
pnpm changeset
# Select packages, choose bump type (patch/minor/major), write summary
```

- One changeset per logical change
- Each package is versioned independently
- Release happens automatically on merge to `main` via the changesets GitHub Action

## Privacy Engine

Located in `packages/core/src/privacy.ts`. Key functions:

- `flattenSchema(schema)` -- nested `FieldSchema` to flat dot-path `FlatField[]`
- `getDefaults(schema)` -- builds initial `VisibleFields` map from schema defaults
- `resolveDependencies(visible, schema)` -- forces dependent fields off when required fields are hidden
- `filterData(data, visible)` -- removes hidden keys server-side (the security boundary)
- `getToggleConfig(schema)` -- generates UI toggle structure for the share modal

**Server-side `filterData()` is the security boundary.** The `<Field>` component is a rendering concern only.
