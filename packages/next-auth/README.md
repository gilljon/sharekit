# @sharekit/next-auth

NextAuth.js / Auth.js adapter for the Shareable SDK. Supports both NextAuth v4 and v5 (Auth.js).

## Installation

```bash
pnpm add @sharekit/next-auth @sharekit/core next-auth
```

## Usage

### NextAuth v5 (Auth.js)

```typescript
import { nextAuthProvider } from "@sharekit/next-auth";
import { auth } from "./auth"; // Your Auth.js config

const shareable = createShareable({
  auth: nextAuthProvider({ auth }),
  // ...
});
```

### NextAuth v4

```typescript
import { nextAuthProvider } from "@sharekit/next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

const shareable = createShareable({
  auth: nextAuthProvider({ getServerSession, authOptions }),
  // ...
});
```

### Options

- `auth` -- Auth.js v5 `auth()` function
- `getServerSession` -- NextAuth v4 `getServerSession` function
- `authOptions` -- NextAuth v4 auth options
- `idField` -- Which field to use as user ID: `"id"` (default) or `"email"` (for providers without a consistent ID)
