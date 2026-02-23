# @shareable/better-auth

Better Auth adapter for the Shareable SDK.

## Installation

```bash
pnpm add @shareable/better-auth @shareable/core better-auth
```

## Usage

```typescript
import { betterAuthProvider } from "@shareable/better-auth";
import { auth } from "./auth";

const shareable = createShareable({
  auth: betterAuthProvider(auth),
  // ...
});
```

The adapter calls `auth.api.getSession()` to resolve the current user from the request headers. It returns `{ id, name }` for the shareable system to use for ownership verification and owner name display.
