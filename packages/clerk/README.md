# @sharekit/clerk

Clerk adapter for the Shareable SDK.

## Installation

```bash
pnpm add @sharekit/clerk @sharekit/core @clerk/nextjs
```

## Usage

```typescript
import { clerkProvider } from "@sharekit/clerk";
import { auth, currentUser } from "@clerk/nextjs/server";

const shareable = createShareable({
  auth: clerkProvider({ auth, currentUser }),
  // ...
});
```

The adapter calls Clerk's `auth()` to get the current user ID, then `currentUser()` to resolve the display name. The `auth` and `currentUser` functions are passed in as options to avoid a hard dependency on `@clerk/nextjs`.
