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
@sharekit/core              -- Token engine, privacy engine, handler, OG images, all shared types
@sharekit/react             -- Web: Provider, Field, ShareButton, ShareModal, ShareManager
@sharekit/react-native      -- RN: Provider, Field, ShareButton, ShareModal, ShareManager, API client
@sharekit/next              -- Next.js App Router adapter (handler + SharedView)
@sharekit/tanstack-start    -- TanStack Start adapter
@sharekit/remix             -- Remix adapter
@sharekit/drizzle           -- Drizzle ORM storage adapter
@sharekit/prisma            -- Prisma ORM storage adapter
@sharekit/better-auth       -- Better Auth provider adapter
@sharekit/next-auth         -- NextAuth.js / Auth.js adapter
@sharekit/clerk             -- Clerk adapter
```

**Dependency direction:** adapters depend on `@sharekit/core` (via `workspace:*`). React and React Native packages also depend on core. Framework adapters depend on both core and react.

**Web vs React Native:** `@sharekit/react` uses web APIs (HTML elements, `navigator.clipboard`, `window.location`). `@sharekit/react-native` is a separate client-only package that makes HTTP requests to a backend running one of the server adapters. It uses RN primitives (`View`, `Text`, `Pressable`, `Modal`, `Switch`) and optional `expo-clipboard` / `expo-sharing`.

## Core Interfaces

Every adapter implements one of these (defined in `packages/core/src/types.ts`):

**ShareableStorage** (5 methods): `createShare`, `getShare`, `getSharesByOwner`, `revokeShare`, `incrementViewCount`

**ShareableAuthProvider** (1 method): `getUser(request)` -- must check `x-shareable-owner-id` header first, then fall back to session resolution.

**ShareableInstance**: Created by `createShareable()`, holds config and definitions.

## Core Exports: Client-Safe vs Server-Only

Not all core exports can be used in client-side code (browser or React Native):

**Client-safe** (pure logic, no Node APIs):
- Privacy engine: `flattenSchema`, `getDefaults`, `getGroups`, `resolveDependencies`, `getDependencyWarnings`, `filterData`, `getToggleConfig`
- Utilities: `formatOwnerName`, `validateToken`, `createShareable`
- All types

**Server-only** (Node APIs, server dependencies):
- `handleAction` -- requires storage + auth
- `generateToken` -- uses `node:crypto`
- `renderOGImage`, `renderOGImagePng`, `loadGoogleFont` -- uses `satori` / `@resvg/resvg-js`

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

### Framework adapter (server-side)

Template: `packages/next/src/handler.ts`

1. Parse framework request into `ShareableAction`
2. Call `handleAction()` from core
3. Handle OG image route (SVG via `renderOGImage()`)
4. Export `SharedView` component and metadata helper

### Client adapter (React Native)

Template: `packages/react-native/src/`

Unlike framework adapters, this is client-only. It does NOT handle server routes or call `handleAction()` directly. Instead:

1. Export a `createShareClient(config)` that makes HTTP requests to a backend
2. Port UI components to RN primitives (`View`, `Text`, `Pressable`, `Modal`, `Switch`)
3. Use `expo-clipboard` and `expo-sharing` (optional peer deps)
4. Provider accepts `client` and `baseUrl` props instead of `apiBasePath`

## Real-World Examples

### Trading Journal Sharing (Tradelock)

A trading journal app where users share coaching sessions with privacy controls over financial data:

```typescript
// Server: shareable definition
const coachingSession = shareable.define("coaching-session", {
  fields: {
    summary: { label: "Session Summary", default: true },
    trades: { label: "Referenced Trades", default: false },
    pnl: { label: "P&L Data", default: false },
    commitments: { label: "Action Items", default: true },
    analysis: {
      label: "Analysis",
      type: "group",
      children: {
        patterns: { label: "Pattern Analysis", default: true },
        equity: { label: "Equity Curve", default: false, requires: "pnl" },
      },
    },
  },
  getData: async ({ ownerId, params }) => {
    const session = await getCoachingSession(ownerId, params.sessionId);
    return { ...session, trades: await getSessionTrades(session.id) };
  },
  ogImage: ({ data, visibleFields, ownerName }) => ({
    title: `${ownerName}'s Coaching Session`,
    subtitle: data.topic,
    metrics: [
      { label: "Duration", value: `${data.durationMinutes}m` },
      visibleFields.commitments && { label: "Actions", value: `${data.commitments.length}` },
    ].filter(Boolean),
  }),
});
```

### SaaS Dashboard Sharing

An analytics platform where users share dashboards with clients:

```typescript
const dashboard = shareable.define("dashboard", {
  fields: {
    overview: { label: "Overview Metrics", default: true },
    revenue: { label: "Revenue", default: false },
    costs: { label: "Cost Breakdown", default: false },
    projections: { label: "Projections", default: true },
    rawData: { label: "Raw Data Export", default: false, requires: "revenue" },
  },
  getData: async ({ ownerId, params }) => {
    return await getDashboardData(ownerId, params.dateRange);
  },
});
```

### Blog Platform Profile Sharing

A publishing platform where authors share profile stats:

```typescript
const authorProfile = shareable.define("author-profile", {
  fields: {
    bio: { label: "Bio", default: true },
    articles: { label: "Published Articles", default: true },
    followers: { label: "Follower Count", default: true },
    earnings: { label: "Earnings", default: false },
    analytics: {
      label: "Analytics",
      type: "group",
      children: {
        readTime: { label: "Avg Read Time", default: true },
        topArticles: { label: "Top Articles", default: true },
        earningsBreakdown: { label: "Earnings by Article", default: false, requires: "earnings" },
      },
    },
  },
  getData: async ({ ownerId }) => {
    const [profile, articles, stats] = await Promise.all([
      getAuthorProfile(ownerId),
      getPublishedArticles(ownerId),
      getAuthorStats(ownerId),
    ]);
    return { profile, articles, stats };
  },
});
```

## Common Development Scenarios

### Adding a field to a privacy schema

1. Add the field in the definition's `fields` object
2. If it depends on another field, add `requires: "fieldName"`
3. If grouping, nest under a `type: "group"` parent
4. The toggle UI auto-generates from the schema -- no component changes needed
5. Update `getData` if the new field needs data fetching
6. Run tests: privacy engine tests cover schema parsing and dependency resolution

### Adding a new shareable content type

1. Create the definition with `shareable.define("type-id", { ... })`
2. Wrap the page content with `<Provider>` and `<Field>` components
3. Add a `<ShareButton />` to the page
4. The handler auto-routes by type -- no route changes needed
5. Optionally add an `ogImage` function for social sharing previews

### Debugging data filtering issues

Data appears in shared views that should be hidden:

1. Check `filterData()` is called server-side (this is the security boundary, not `<Field>`)
2. Verify `visibleFields` map matches the field paths in your data object (dot-notation for nested)
3. Check `resolveDependencies()` -- if a `requires` field is hidden, dependents should auto-hide
4. Run `getDependencyWarnings(visibleFields, schema)` to see if dependencies are misconfigured

### Cross-package changes

When modifying core interfaces:

1. **Adding a new action kind to `ShareableAction`**: Update the union in `core/src/types.ts`, handle it in `core/src/handler.ts`, then update every framework adapter's request parser to map to the new action
2. **Adding a new `ShareableStorage` method**: Add to the interface in `core/src/types.ts`, implement in both `drizzle` and `prisma` adapters, update `handleAction` if needed
3. **Changing privacy engine behavior**: Update `core/src/privacy.ts`, add tests in `core/src/privacy.test.ts`, verify toggle UI still works in both `react` and `react-native` packages

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
- **React / React Native:** Test component rendering with different context states

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
