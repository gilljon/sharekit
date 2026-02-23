# @sharekit/prisma

Prisma ORM storage adapter for the Shareable SDK.

## Installation

```bash
pnpm add @sharekit/prisma @sharekit/core @prisma/client
```

## Usage

### 1. Add the model to your Prisma schema

Copy the model from `prisma/shareable.prisma` into your `schema.prisma`:

```prisma
model ShareableShare {
  id            String    @id @default(uuid())
  type          String
  token         String    @unique
  ownerId       String    @map("owner_id")
  params        Json      @default("{}")
  visibleFields Json      @default("{}") @map("visible_fields")
  viewCount     Int       @default(0) @map("view_count")
  createdAt     DateTime  @default(now()) @map("created_at")
  expiresAt     DateTime? @map("expires_at")

  @@map("shareable_shares")
}
```

### 2. Run the migration

```bash
npx prisma migrate dev --name add-shareable-shares
```

### 3. Create the storage adapter

```typescript
import { prismaStorage } from "@sharekit/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const storage = prismaStorage(prisma);
```

### 4. Pass to createShareable

```typescript
import { createShareable } from "@sharekit/core";

const shareable = createShareable({
  storage: prismaStorage(prisma),
  // ...
});
```
