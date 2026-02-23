# @sharekit SDK

Privacy-aware content sharing for React. Full-stack SDK with token management, granular privacy controls, server-side data filtering, and framework adapters.

## Monorepo Structure

```
shareable/
  packages/
    core/           # @sharekit/core -- token engine, privacy engine, types, handler, OG images
    react/          # @sharekit/react -- Provider, Field, ShareButton, ShareModal, ShareManager
    next/           # @sharekit/next -- Next.js App Router adapter
    tanstack-start/ # @sharekit/tanstack-start -- TanStack Start adapter
    remix/          # @sharekit/remix -- Remix adapter
    drizzle/        # @sharekit/drizzle -- Drizzle ORM storage adapter
    prisma/         # @sharekit/prisma -- Prisma ORM storage adapter
    better-auth/    # @sharekit/better-auth -- Better Auth adapter
    next-auth/      # @sharekit/next-auth -- NextAuth.js / Auth.js adapter
    clerk/          # @sharekit/clerk -- Clerk adapter
  examples/
    blog-platform/  # Integration example for a blog platform
```

- **Package manager:** pnpm 9.15+ (workspace-based)
- **Node version:** 22+
- **TypeScript:** 5.7+
- **Build:** tsup (ESM + CJS + DTS)
- **Testing:** Vitest
- **Versioning:** Changesets
- **Linting:** Biome

## Core Interfaces

Everything in the SDK builds on three contracts defined in `packages/core/src/types.ts`:

### ShareableStorage

```typescript
interface ShareableStorage {
  createShare(input: CreateShareInput): Promise<Share>;
  getShare(token: string): Promise<Share | null>;
  getSharesByOwner(ownerId: string, type?: string): Promise<Share[]>;
  revokeShare(shareId: string, ownerId: string): Promise<void>;
  incrementViewCount(token: string): Promise<void>;
}
```

### ShareableAuthProvider

```typescript
interface ShareableAuthProvider {
  getUser(request: Request): Promise<ShareableUser | null>;
}
```

Auth adapters must handle the `x-shareable-owner-id` header for internal owner lookups (used by the core handler when fetching owner names for shared views).

### ShareableInstance

```typescript
interface ShareableInstance {
  config: ShareableConfig;
  definitions: Map<string, ShareableDefinition>;
  define(id, input): ShareableDefinition;
  getDefinition(id): ShareableDefinition | undefined;
}
```

## How to Add a New Adapter

### Storage Adapter (e.g., @sharekit/prisma)

1. Create `packages/<name>/` with standard package.json, tsconfig, tsup config
2. Implement `ShareableStorage` interface -- all 5 methods
3. Export a factory function: `<name>Storage(client) => ShareableStorage`
4. Map database rows to the `Share` type from `@sharekit/core`
5. Peer-depend on the ORM/client library

**Template:** `packages/drizzle/src/storage.ts`

### Auth Adapter (e.g., @sharekit/clerk)

1. Create `packages/<name>/` with standard config
2. Implement `ShareableAuthProvider` interface -- just `getUser(request)`
3. Always check `request.headers.get("x-shareable-owner-id")` first (for internal lookups)
4. Fall back to the auth library's session resolution
5. Return `{ id, name? }` or `null`
6. Peer-depend on the auth library

**Template:** `packages/better-auth/src/index.ts`

### Framework Adapter (e.g., @sharekit/next)

1. Create `packages/<name>/` with standard config
2. Export a handler creator that:
   - Parses framework-specific request/context into a `ShareableAction`
   - Calls `handleAction()` from `@sharekit/core`
   - Handles OG image rendering (SVG via `renderOGImage()`)
   - Returns framework-specific responses
3. Export a `SharedView` component for public pages
4. Export a metadata helper for OG tags

**Template:** `packages/next/src/handler.ts`

## Privacy Engine

The privacy engine in `packages/core/src/privacy.ts` handles:

- **Schema flattening:** Nested `FieldSchema` (with groups) flattens to dot-path `FlatField[]`
- **Defaults:** `getDefaults(schema)` builds the initial `VisibleFields` map
- **Dependencies:** `resolveDependencies(visible, schema)` forces dependent fields off when required fields are hidden
- **Data filtering:** `filterData(data, visible)` removes hidden keys from objects (supports dot-paths for nested data)
- **Toggle config:** `getToggleConfig(schema)` generates the UI structure for the share modal

Key rule: **server-side filtering is the security boundary**, not the `<Field>` component. The component is a rendering concern only.

## React Component Architecture

```
ShareableProvider (context)
  +-- Field (conditional render based on visibleFields)
  +-- ShareButton
       +-- ShareManager (CRUD state for shares)
            +-- ShareModal (toggle UI, create/revoke)
```

- `defineShareableComponents(definition)` creates a typed component set bound to a specific shareable definition
- `useShareableContext()` reads the provider context
- `useShareManager()` reads the share CRUD state

## Commands

```bash
pnpm build          # Build all packages
pnpm test:run       # Run all tests
pnpm lint           # Check with Biome
pnpm lint:fix       # Auto-fix lint issues
pnpm changeset      # Create a changeset for publishing
pnpm release        # Build + publish all changed packages
```

## Conventions

- All packages export from a single `src/index.ts` entry point
- Use `.js` extensions in imports (for ESM compatibility with tsup)
- External dependencies go in `peerDependencies`, not `dependencies`
- Factory functions follow the pattern: `<provider>Storage(client)`, `<provider>Provider(auth)`
- Types are re-exported from `@sharekit/core` -- adapters should import from there
- The `Share` type is the universal share record shape across all storage adapters
- Error handling uses `ShareableError(message, status)` from core
- OG image rendering returns SVG strings (satori); PNG conversion is opt-in via `@resvg/resvg-js`
