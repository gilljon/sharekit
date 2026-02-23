---
name: integrate-shareable
description: Integrate @sharekit SDK to add privacy-aware content sharing to a React app. Use when the user asks to "add sharing", "make shareable", "share content", "privacy-aware sharing", "integrate @sharekit", "share page", "shareable link", or "public link with privacy".
---

# Integrating @sharekit

## Overview

@sharekit is a full-stack SDK that adds privacy-aware content sharing to React apps. Developers define a privacy schema, wrap components in `<Field>` primitives, and the SDK handles token management, toggle UI, server-side filtering, public views, and OG images.

## Integration Checklist

Follow these steps in order:

### 1. Detect the Stack

Identify the consumer's framework, ORM, and auth provider:

| Layer | Options | Package |
|-------|---------|---------|
| Framework | Next.js | `@sharekit/next` |
| Framework | TanStack Start | `@sharekit/tanstack-start` |
| Framework | Remix | `@sharekit/remix` |
| Storage | Drizzle ORM | `@sharekit/drizzle` |
| Storage | Prisma | `@sharekit/prisma` |
| Auth | Better Auth | `@sharekit/better-auth` |
| Auth | NextAuth / Auth.js | `@sharekit/next-auth` |
| Auth | Clerk | `@sharekit/clerk` |

### 2. Install Packages

```bash
pnpm add @sharekit/core @sharekit/react @sharekit/<framework> @sharekit/<storage> @sharekit/<auth>
```

### 3. Create shareable.config.ts

```typescript
import { createShareable } from "@sharekit/core";
import { drizzleStorage } from "@sharekit/drizzle"; // or prismaStorage
import { betterAuthProvider } from "@sharekit/better-auth"; // or nextAuthProvider, clerkProvider

export const shareable = createShareable({
  storage: drizzleStorage(db),
  auth: betterAuthProvider(auth),
  baseUrl: process.env.APP_URL!,
  defaults: {
    tokenLength: 12,
    ownerDisplay: "first-name", // "first-name" | "full" | "anonymous"
    trackViews: true,
  },
});
```

### 4. Define Shareable Content Types

For each type of content the user wants to share, create a definition:

```typescript
export const myShareable = shareable.define("my-content", {
  fields: {
    // Simple fields
    summary: { label: "Summary", default: true },
    revenue: { label: "Revenue", default: false },  // sensitive: off by default

    // Grouped fields
    charts: {
      label: "Charts",
      type: "group",
      children: {
        trend: { label: "Trend Chart", default: true },
        breakdown: { label: "Breakdown", default: true, requires: "revenue" },
      },
    },
  },

  getData: async ({ ownerId, params }) => {
    return await fetchData(ownerId, params);
  },

  // Optional: OG image for social sharing
  ogImage: ({ data, visibleFields, ownerName }) => ({
    title: `${ownerName}'s Report`,
    metrics: [
      visibleFields.summary && { label: "Score", value: `${data.score}%` },
    ].filter(Boolean),
  }),
});
```

### 5. Wrap Page Components

```tsx
import { defineShareableComponents } from "@sharekit/react";

const Content = defineShareableComponents(myShareable);

function MyPage({ data }) {
  return (
    <Content.Provider data={data} params={{ dateFrom, dateTo }}>
      <Content.Field name="summary">
        <SummaryCard data={data.summary} />
      </Content.Field>

      <Content.Field name="revenue">
        <RevenueChart data={data.revenue} />
      </Content.Field>

      <Content.Field name="charts.trend">
        <TrendChart data={data.charts.trend} />
      </Content.Field>

      <Content.ShareButton />
    </Content.Provider>
  );
}
```

### 6. Mount API Routes

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
export const Route = createFileRoute('/api/shareable/$')({
  server: { handlers: createTanStackHandler(shareable) },
});
```

### 7. Add Public View Route

**Next.js:**
```tsx
// app/shared/[type]/[token]/page.tsx
import { SharedView, getSharedMetadata } from "@sharekit/next";
import { shareable } from "../../../../lib/shareable";

export async function generateMetadata({ params }) {
  return getSharedMetadata(shareable, params.type, params.token);
}

export default function SharedPage({ params }) {
  return <SharedView config={shareable} type={params.type} token={params.token} />;
}
```

### 8. Add Database Table

**Drizzle:** Add `export { shareableShares } from "@sharekit/drizzle"` to your schema, then `npx drizzle-kit generate`.

**Prisma:** Copy the model from `@sharekit/prisma/prisma/shareable.prisma` into your schema, then `npx prisma migrate dev`.

## Privacy Schema Patterns

### Blog / Content Platforms
```typescript
fields: {
  bio: { label: "Bio", default: true },
  followerCount: { label: "Follower Count", default: true },
  earnings: { label: "Earnings", default: false },
  analytics: {
    type: "group", label: "Analytics",
    children: {
      earningsBreakdown: { label: "Earnings Breakdown", default: false, requires: "earnings" },
    },
  },
}
```

### User Profiles
```typescript
fields: {
  bio: { label: "Bio", default: true },
  stats: { label: "Statistics", default: true },
  activity: { label: "Activity History", default: false },
  email: { label: "Email", default: false },
}
```

### Analytics Dashboards
```typescript
fields: {
  overview: { label: "Overview", default: true },
  metrics: { label: "Detailed Metrics", default: false },
  rawData: { label: "Raw Data Export", default: false },
}
```

## Headless Customization

For full control over the share UI, use render props:

```tsx
<Content.ShareManager>
  {({ shares, visibleFields, setFieldVisible, createShare, revokeShare, copyLink, isCreating }) => (
    <YourCustomShareUI />
  )}
</Content.ShareManager>
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "useShareableContext must be used within ShareableProvider" | Component outside Provider | Wrap in `<Content.Provider>` |
| 401 on create/list/revoke | Auth adapter not resolving user | Check auth config, verify session cookies are sent |
| Fields always render in shared view | `isShared` not set | Ensure SharedView sets `isShared={true}` on Provider |
| "Unknown shareable type" | Definition not registered | Call `shareable.define()` before handler processes requests |
| OG image blank | No fonts loaded | Ensure network access to Google Fonts CDN, or provide custom fonts |
