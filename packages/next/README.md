# @shareable/next

Next.js App Router adapter for the Shareable SDK.

## Installation

```bash
pnpm add @shareable/next @shareable/core @shareable/react
```

## API

### `createNextHandler(instance)`

Creates Next.js route handlers for the shareable API. Mount as a catch-all route:

```typescript
// app/api/shareable/[...shareable]/route.ts
import { createNextHandler } from "@shareable/next";
import { shareable } from "../../../../lib/shareable";

export const { GET, POST, DELETE } = createNextHandler(shareable);
```

### `<SharedView>`

Async server component that fetches and renders shared content:

```tsx
// app/shared/[type]/[token]/page.tsx
import { SharedView } from "@shareable/next";

export default function SharedPage({ params }) {
  return <SharedView config={shareable} type={params.type} token={params.token} />;
}
```

Supports custom rendering via children render prop:

```tsx
<SharedView config={shareable} type={type} token={token}>
  {(data) => <MyCustomSharedView data={data} />}
</SharedView>
```

### `getSharedMetadata(instance, type, token)`

Generates Next.js metadata with OG image tags for shared pages:

```typescript
export async function generateMetadata({ params }) {
  return getSharedMetadata(shareable, params.type, params.token);
}
```
