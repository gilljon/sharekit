# @sharekit

[![npm](https://img.shields.io/npm/v/@sharekit/core?label=%40shareable%2Fcore)](https://www.npmjs.com/package/@sharekit/core)
[![CI](https://github.com/gilljon/sharekit/actions/workflows/ci.yml/badge.svg)](https://github.com/gilljon/sharekit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Privacy-aware content sharing for React. One component, full sharing.

Wrap any React component in `<Field>`, define a privacy schema, and get token management, granular privacy toggles, server-side data filtering, public views, OG images, and share lifecycle management -- in under 5 minutes.

## Quick Start

### 1. Install

```bash
# Core + React (always needed)
pnpm add @sharekit/core @sharekit/react

# Framework adapter (pick one)
pnpm add @sharekit/next              # Next.js
pnpm add @sharekit/tanstack-start    # TanStack Start
pnpm add @sharekit/remix             # Remix

# Storage adapter (pick one)
pnpm add @sharekit/drizzle           # Drizzle ORM
pnpm add @sharekit/prisma            # Prisma

# Auth adapter (pick one)
pnpm add @sharekit/better-auth       # Better Auth
pnpm add @sharekit/next-auth         # NextAuth / Auth.js
pnpm add @sharekit/clerk             # Clerk
```

### 2. Configure

```typescript
// lib/shareable.ts
import { createShareable } from "@sharekit/core";
import { drizzleStorage } from "@sharekit/drizzle";
import { betterAuthProvider } from "@sharekit/better-auth";

export const shareable = createShareable({
  storage: drizzleStorage(db),
  auth: betterAuthProvider(auth),
  baseUrl: process.env.APP_URL!,
  defaults: {
    tokenLength: 12,
    ownerDisplay: "first-name",
    trackViews: true,
  },
});
```

### 3. Define a shareable content type

```typescript
// shareables/profile.ts
import { shareable } from "../lib/shareable";

export const profileShare = shareable.define("profile", {
  fields: {
    bio: { label: "Bio", default: true },
    followerCount: { label: "Follower Count", default: true },
    earnings: { label: "Earnings", default: false },
    analytics: {
      label: "Analytics",
      type: "group",
      children: {
        viewsOverTime: { label: "Views Over Time", default: true },
        earningsBreakdown: { label: "Earnings Breakdown", default: false, requires: "earnings" },
      },
    },
  },
  getData: async ({ ownerId, params }) => {
    return await fetchProfileData(ownerId, params);
  },
  ogImage: ({ data, visibleFields, ownerName }) => ({
    title: `${ownerName}'s Profile`,
    metrics: [
      visibleFields.followerCount && { label: "Followers", value: `${data.followerCount}` },
    ].filter(Boolean),
  }),
});
```

### 4. Wrap your components

```tsx
import { defineShareableComponents } from "@sharekit/react";
import { profileShare } from "../shareables/profile";

const Profile = defineShareableComponents(profileShare);

function ProfilePage({ data }) {
  return (
    <Profile.Provider data={data}>
      <h1>My Profile</h1>

      <Profile.Field name="bio">
        <BioCard bio={data.bio} />
      </Profile.Field>

      <Profile.Field name="earnings">
        <EarningsCard amount={data.earnings} />
      </Profile.Field>

      <Profile.Field name="analytics.viewsOverTime">
        <ViewsChart data={data.viewsOverTime} />
      </Profile.Field>

      <Profile.ShareButton />
    </Profile.Provider>
  );
}
```

### 5. Mount API routes

**Next.js:**

```typescript
// app/api/shareable/[...shareable]/route.ts
import { createNextHandler } from "@sharekit/next";
import { shareable } from "../../../../lib/shareable";

export const { GET, POST, DELETE } = createNextHandler(shareable);
```

**TanStack Start:**

```typescript
// routes/api/shareable.$.tsx
import { createTanStackHandler } from "@sharekit/tanstack-start";
import { shareable } from "../../lib/shareable";

export const Route = createFileRoute("/api/shareable/$")({
  server: { handlers: createTanStackHandler(shareable) },
});
```

**Remix:**

```typescript
// app/routes/api.shareable.$.tsx
import { createRemixLoader, createRemixAction } from "@sharekit/remix";
import { shareable } from "../../lib/shareable";

export const loader = createRemixLoader(shareable);
export const action = createRemixAction(shareable);
```

### 6. Add the public view route

```tsx
// Next.js: app/shared/[type]/[token]/page.tsx
import { SharedView, getSharedMetadata } from "@sharekit/next";
import { shareable } from "../../../../lib/shareable";

export async function generateMetadata({ params }) {
  return getSharedMetadata(shareable, params.type, params.token);
}

export default function SharedPage({ params }) {
  return <SharedView config={shareable} type={params.type} token={params.token} />;
}
```

### 7. Add the database table

**Drizzle:**

```typescript
// db/schema.ts
export { shareableShares } from "@sharekit/drizzle";
// Then run: npx drizzle-kit generate
```

**Prisma:** Copy the model from `@sharekit/prisma/prisma/shareable.prisma` into your schema, then `npx prisma migrate dev`.

## Packages

### Core

| Package | Description |
|---------|-------------|
| `@sharekit/core` | Token engine, privacy engine, types, OG image renderer, analytics |
| `@sharekit/react` | React components: Provider, Field, ShareButton, ShareModal, ShareManager, ShareAnalytics |

### Framework Adapters

| Package | Description |
|---------|-------------|
| `@sharekit/next` | Next.js App Router: route handlers, SharedView, metadata |
| `@sharekit/tanstack-start` | TanStack Start: server handlers, server fns, SharedView with loader pattern |
| `@sharekit/remix` | Remix: loader/action handlers, SharedView with useLoaderData |

### Storage Adapters

| Package | Description |
|---------|-------------|
| `@sharekit/drizzle` | Drizzle ORM storage adapter |
| `@sharekit/prisma` | Prisma ORM storage adapter |

### Auth Adapters

| Package | Description |
|---------|-------------|
| `@sharekit/better-auth` | Better Auth integration |
| `@sharekit/next-auth` | NextAuth.js v4 and v5 (Auth.js) integration |
| `@sharekit/clerk` | Clerk integration |

## How It Works

### Privacy Schema

Define what content can be toggled when sharing. Each field has a label, default visibility, and optional dependencies:

```typescript
fields: {
  earnings: { label: "Earnings", default: false },
  analytics: {
    label: "Analytics",
    type: "group",
    children: {
      earningsBreakdown: { label: "Earnings Breakdown", default: false, requires: "earnings" },
    },
  },
}
```

- `default: false` -- sensitive fields hidden by default
- `requires: "earnings"` -- Earnings Breakdown is auto-disabled when Earnings is hidden
- Groups collapse/expand in the share modal UI

### The `<Field>` Component

The same component tree renders both authenticated and shared views:

- **Authenticated view** (`isShared=false`): all fields render
- **Shared view** (`isShared=true`): only fields where `visibleFields[name] === true` render

Server-side data filtering removes hidden field data before it reaches the client. The `<Field>` component is a rendering concern; the real security is server-side.

### Share Lifecycle

1. **Create** -- User toggles privacy fields, clicks "Create Share Link"
2. **Token** -- 12-character hex token generated, stored with privacy config
3. **View** -- Public page fetches data, filters by privacy config, renders
4. **Track** -- View count incremented atomically
5. **Revoke** -- Owner can revoke any share at any time

### OG Images

The SDK generates Open Graph images for shared links using satori. Supports multiple layouts (`metrics`, `card`, `minimal`, `custom`), branding options, gradient backgrounds, custom Google Fonts via `loadGoogleFont()`, and optional PNG output via `@resvg/resvg-js`.

### Analytics

Track share performance with the built-in analytics system:

```tsx
import { useShareAnalytics, ShareAnalytics } from "@sharekit/react";

// Hook
const { data, isLoading } = useShareAnalytics({ type: "profile" });

// Component (headless render props)
<ShareAnalytics type="profile">
  {({ data }) => <MyDashboard stats={data} />}
</ShareAnalytics>
```

### Headless UI

The built-in ShareButton/ShareModal use data attributes for styling, making them fully customisable with CSS. For complete control, use the render-prop API:

```tsx
<Profile.ShareManager>
  {({ shares, visibleFields, setFieldVisible, create, revoke, copyLink }) => (
    <MyCustomShareUI ... />
  )}
</Profile.ShareManager>
```

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, development workflow, and guidelines for adding new adapters.

For security issues, see [SECURITY.md](SECURITY.md).

## License

MIT
