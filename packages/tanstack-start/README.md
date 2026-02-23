# @sharekit/tanstack-start

TanStack Start adapter for the Shareable SDK.

## Installation

```bash
pnpm add @sharekit/tanstack-start @sharekit/core @sharekit/react
```

## Two Integration Patterns

### Pattern 1: Catch-all API Route (simpler)

```typescript
// routes/api/shareable.$.tsx
import { createFileRoute } from '@tanstack/react-router'
import { createTanStackHandler } from '@sharekit/tanstack-start'
import { shareable } from '../../lib/shareable'

export const Route = createFileRoute('/api/shareable/$')({
  server: {
    handlers: createTanStackHandler(shareable),
  },
})
```

Uses `server: { handlers: {} }` which is safe for server-only imports.

### Pattern 2: Server Functions (avoids catch-all)

```typescript
// lib/shareable-fns.ts
import { createServerFn } from '@tanstack/start'
import { createShareServerFns } from '@sharekit/tanstack-start'
import { shareable } from './shareable'

const fns = createShareServerFns(shareable)

export const createShare = createServerFn({ method: 'POST' })
  .handler(async ({ data, request }) => fns.create(request!, data))

export const listShares = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => fns.list(request!))
```

Better for module replacement and avoiding server-only import leaks.

## Shared View

```tsx
// routes/shared.$type.$token.tsx
import { TanStackSharedView } from '@sharekit/tanstack-start'

export const Route = createFileRoute('/shared/$type/$token')({
  loader: async ({ params }) => {
    const fns = createShareServerFns(shareable)
    return fns.view(params.token)
  },
  component: SharedPage,
})

function SharedPage() {
  const data = Route.useLoaderData()
  const { type, token } = Route.useParams()
  return (
    <TanStackSharedView config={shareable} data={data} token={token}>
      {(viewData) => <MyCustomSharedView data={viewData} />}
    </TanStackSharedView>
  )
}
```
