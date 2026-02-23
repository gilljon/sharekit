# @sharekit/drizzle

Drizzle ORM storage adapter for the Shareable SDK.

## Installation

```bash
pnpm add @sharekit/drizzle @sharekit/core drizzle-orm
```

## Usage

### 1. Add the schema to your Drizzle config

```typescript
// db/schema.ts
export { shareableShares } from "@sharekit/drizzle";
```

### 2. Generate the migration

```bash
npx drizzle-kit generate
```

### 3. Create the storage adapter

```typescript
import { drizzleStorage } from "@sharekit/drizzle";
import { db } from "./db";

const storage = drizzleStorage(db);
```

### 4. Pass to createShareable

```typescript
import { createShareable } from "@sharekit/core";

const shareable = createShareable({
  storage: drizzleStorage(db),
  // ...
});
```

## Schema

The `shareableShares` table stores:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| type | text | Shareable type (e.g. "progress") |
| token | text | Unique share token |
| owner_id | text | Owner user ID |
| params | jsonb | Share parameters (date ranges, filters) |
| visible_fields | jsonb | Privacy toggle state |
| view_count | integer | Number of views |
| created_at | timestamp | Creation time |
| expires_at | timestamp | Optional expiration |
