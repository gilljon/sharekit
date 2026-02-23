# @sharekit/remix

Remix adapter for the Shareable SDK.

## Installation

```bash
pnpm add @sharekit/remix @sharekit/core @sharekit/react
```

## Usage

### API Route


```typescript
// app/routes/api.shareable.$.tsx
import { createRemixLoader, createRemixAction } from "@sharekit/remix";
import { shareable } from "../../lib/shareable";

export const loader = createRemixLoader(shareable);
export const action = createRemixAction(shareable);
```

The `$` splat route captures the shareable type, token, and action from the URL.

### Shared View

```tsx
// app/routes/shared.$type.$token.tsx
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { handleAction } from "@sharekit/core";
import { RemixSharedView } from "@sharekit/remix";
import { shareable } from "../../lib/shareable";

export async function loader({ params }) {
  const result = await handleAction(shareable, { kind: "view", token: params.token });
  return json(result);
}

export default function SharedPage() {
  const data = useLoaderData<typeof loader>();
  const { token } = useParams();

  return (
    <RemixSharedView config={shareable} data={data} token={token!}>
      {(viewData) => <MyCustomSharedView data={viewData} />}
    </RemixSharedView>
  );
}
```
