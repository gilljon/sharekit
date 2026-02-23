# Contributing to @sharekit

Thank you for your interest in contributing. This guide covers everything you need to get started.

## Getting Started

```bash
git clone https://github.com/gilljon/sharekit.git
cd shareable
pnpm install
pnpm build
pnpm test:run
```

**Requirements:** Node.js 22+, pnpm 9.15+

## Project Structure

```
packages/
  core/           -- Token engine, privacy engine, types, OG images
  react/          -- Provider, Field, ShareButton, ShareModal, ShareManager
  next/           -- Next.js App Router adapter
  tanstack-start/ -- TanStack Start adapter
  remix/          -- Remix adapter
  drizzle/        -- Drizzle ORM storage adapter
  prisma/         -- Prisma ORM storage adapter
  better-auth/    -- Better Auth adapter
  next-auth/      -- NextAuth.js / Auth.js adapter
  clerk/          -- Clerk adapter
```

For full architecture details, see [AGENTS.md](AGENTS.md).

## Development Workflow

1. Create a branch from `main`
2. Make your changes
3. Run `pnpm lint && pnpm test:run && pnpm build`
4. Add a changeset: `pnpm changeset`
5. Open a pull request

## Adding a New Adapter

The SDK is designed to be extended with adapters. There are three types:

### Storage Adapter

Implements `ShareableStorage` from `@sharekit/core` (5 methods: `createShare`, `getShare`, `getSharesByOwner`, `revokeShare`, `incrementViewCount`).

**Reference:** `packages/drizzle/src/storage.ts`, `packages/prisma/src/storage.ts`

Steps:
1. Create `packages/<name>/` with `package.json`, `tsconfig.json`, `tsup.config.ts`
2. Export a factory function: `<name>Storage(client) => ShareableStorage`
3. Map your ORM/database rows to the `Share` type
4. Add the ORM/database client as a `peerDependency`
5. Add a `README.md` with installation and usage examples

### Auth Adapter

Implements `ShareableAuthProvider` from `@sharekit/core` (1 method: `getUser(request)`).

**Reference:** `packages/better-auth/src/index.ts`, `packages/clerk/src/index.ts`

Steps:
1. Create `packages/<name>/` with standard config
2. Export a factory function: `<name>Provider(options) => ShareableAuthProvider`
3. Always check `request.headers.get("x-shareable-owner-id")` first for internal lookups
4. Fall back to the auth library's session resolution
5. Return `{ id, name? }` or `null`

### Framework Adapter

Adapts `handleAction()` from core to framework-specific routing.

**Reference:** `packages/next/src/handler.ts`, `packages/tanstack-start/src/handler.ts`

Steps:
1. Create `packages/<name>/` with standard config
2. Export a handler creator that parses framework requests into `ShareableAction` and calls `handleAction()`
3. Export a `SharedView` component for rendering public shared pages
4. Handle OG image rendering (SVG via `renderOGImage()`)

## Writing Tests

We use [Vitest](https://vitest.dev/) for testing. Tests live alongside source files as `*.test.ts`.

- **Core package:** Test the privacy engine (schema parsing, dependency resolution, data filtering) and token generation
- **Adapters:** Test the mapping logic between the adapter's library and the shareable interfaces (use mocked clients)
- **React package:** Test component rendering behavior with different context states

Run tests:

```bash
pnpm test:run          # All packages
pnpm test:run -- --filter @sharekit/core  # Single package
```

## Changesets

Every PR that changes published code should include a changeset. This tracks what changed and determines version bumps.

```bash
pnpm changeset
```

You'll be prompted to:
1. Select which packages changed
2. Choose a bump type (`patch`, `minor`, `major`)
3. Write a summary of the change

One changeset per logical change. If a single PR fixes a bug in core and adds a feature to react, create two changesets.

**Versioning:** Each package is versioned independently. Use semver:
- `patch` -- bug fixes, internal refactors
- `minor` -- new features, new exports
- `major` -- breaking API changes

## Code Style

- **Formatting/Linting:** [Biome](https://biomejs.dev/) handles both. Run `pnpm lint:fix` to auto-fix.
- **Imports:** Use `.js` extensions for local imports (required for ESM compatibility with tsup)
- **Exports:** All packages export from a single `src/index.ts` entry point
- **Dependencies:** External libraries go in `peerDependencies`, not `dependencies`
- **Naming:** Factory functions follow `<provider>Storage(client)` or `<provider>Provider(options)`
- **Types:** Re-export types from `@sharekit/core` rather than re-defining them
- **Errors:** Use `ShareableError(message, status)` from core

## Pull Requests

A good PR:
- Has a clear description of what changed and why
- Includes a changeset (if it changes published code)
- Passes CI (lint, test, build, typecheck)
- Adds or updates tests for new behavior
- Keeps scope focused -- one logical change per PR

## Questions?

Open an issue or start a discussion. We're happy to help with adapter development, integration questions, or feature proposals.
