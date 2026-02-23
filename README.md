# @shareable

Privacy-aware content sharing for React. One component, full sharing.

Wrap any React component in `<Field>`, define a privacy schema, and get token management, granular privacy toggles, server-side data filtering, public views, OG images, and share lifecycle management -- in under 5 minutes.

## Quick Start

### 1. Install

```bash
# Core + React
pnpm add @shareable/core @shareable/react

# Framework adapter (pick one)
pnpm add @shareable/next

# Storage adapter (pick one)
pnpm add @shareable/drizzle

# Auth adapter (pick one)
pnpm add @shareable/better-auth
```

### 2. Configure

```typescript
// lib/shareable.ts
import { createShareable } from "@shareable/core";
import { drizzleStorage } from "@shareable/drizzle";
import { betterAuthProvider } from "@shareable/better-auth";

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
// shareables/progress.ts
import { shareable } from "../lib/shareable";

export const progressShare = shareable.define("progress", {
  fields: {
    winRate: { label: "Win Rate", default: true },
    pnl: { label: "P&L Amounts", default: false },
    streaks: { label: "Streaks", default: true },
    charts: {
      label: "Charts",
      type: "group",
      children: {
        equityCurve: { label: "Equity Curve", default: true, requires: "pnl" },
        calendar: { label: "Calendar", default: true },
      },
    },
  },
  getData: async ({ ownerId, params }) => {
    return await fetchProgressData(ownerId, params);
  },
  ogImage: ({ data, visibleFields, ownerName }) => ({
    title: `${ownerName}'s Progress`,
    metrics: [
      visibleFields.winRate && { label: "Win Rate", value: `${data.winRate}%` },
    ].filter(Boolean),
  }),
});
```

### 4. Wrap your components

```tsx
// pages/progress.tsx
import { defineShareableComponents } from "@shareable/react";
import { progressShare } from "../shareables/progress";

const Progress = defineShareableComponents(progressShare);

function ProgressPage({ data }) {
  return (
    <Progress.Provider data={data}>
      <h1>My Progress</h1>

      <Progress.Field name="winRate">
        <WinRateCard value={data.winRate} />
      </Progress.Field>

      <Progress.Field name="pnl">
        <PnLChart data={data.pnl} />
      </Progress.Field>

      <Progress.Field name="charts.equityCurve">
        <EquityCurveChart data={data.equityCurve} />
      </Progress.Field>

      <Progress.ShareButton />
    </Progress.Provider>
  );
}
```

### 5. Mount API routes (Next.js)

```typescript
// app/api/shareable/[...shareable]/route.ts
import { createNextHandler } from "@shareable/next";
import { shareable } from "../../../../lib/shareable";

export const { GET, POST, DELETE } = createNextHandler(shareable);
```

### 6. Add the public view route

```tsx
// app/shared/[type]/[token]/page.tsx
import { SharedView, getSharedMetadata } from "@shareable/next";
import { shareable } from "../../../../lib/shareable";

export async function generateMetadata({ params }) {
  return getSharedMetadata(shareable, params.type, params.token);
}

export default function SharedPage({ params }) {
  return <SharedView config={shareable} type={params.type} token={params.token} />;
}
```

### 7. Add the database table

```typescript
// db/schema.ts
export { shareableShares } from "@shareable/drizzle";

// Then run: npx drizzle-kit generate
```

## Packages

| Package | Description |
|---------|-------------|
| `@shareable/core` | Token engine, privacy engine, types, OG image renderer |
| `@shareable/react` | React components: Provider, Field, ShareButton, ShareModal, ShareManager |
| `@shareable/next` | Next.js App Router adapter: route handlers, SharedView, metadata |
| `@shareable/drizzle` | Drizzle ORM storage adapter |
| `@shareable/better-auth` | Better Auth integration |

## How It Works

### Privacy Schema

Define what content can be toggled when sharing. Each field has a label, default visibility, and optional dependencies:

```typescript
fields: {
  pnl: { label: "P&L Amounts", default: false },
  charts: {
    label: "Charts",
    type: "group",
    children: {
      equityCurve: { label: "Equity Curve", default: true, requires: "pnl" },
    },
  },
}
```

- `default: false` -- sensitive fields hidden by default
- `requires: "pnl"` -- Equity Curve is auto-disabled when P&L is hidden
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

### Headless UI

The built-in ShareButton/ShareModal use data attributes for styling, making them fully customisable with CSS. For complete control, use the render-prop API:

```tsx
<Progress.ShareManager>
  {({ shares, visibleFields, setFieldVisible, create, revoke, copyLink }) => (
    <MyCustomShareUI ... />
  )}
</Progress.ShareManager>
```

## License

MIT
