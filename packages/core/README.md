# @shareable/core

Core engine for the Shareable SDK. Framework-agnostic -- contains the token engine, privacy engine, data filtering, types, and OG image renderer.

## Installation

```bash
pnpm add @shareable/core
```

## API

### `createShareable(config)`

Creates a shareable instance. This is the entry point for the SDK.

```typescript
import { createShareable } from "@shareable/core";

const shareable = createShareable({
  storage: yourStorageAdapter,
  auth: yourAuthAdapter,
  baseUrl: "https://yourapp.com",
});
```

### `instance.define(id, definition)`

Registers a shareable content type with a privacy schema and data loader.

### Privacy Engine

- `flattenSchema(schema)` -- Flatten nested field schema to dot-paths
- `getDefaults(schema)` -- Get default visibility map
- `resolveDependencies(visibleFields, schema)` -- Resolve field dependencies
- `getDependencyWarnings(visibleFields, schema)` -- Get human-readable warnings
- `filterData(data, visibleFields)` -- Remove hidden fields from data
- `getToggleConfig(schema)` -- Generate toggle UI configuration

### Token Engine

- `generateToken(length?)` -- Generate a cryptographically random hex token
- `validateToken(token)` -- Validate token format and minimum length

### OG Image

- `renderOGImage(config, options?)` -- Render an OG image config to SVG using satori

### Interfaces

- `ShareableStorage` -- Storage adapter interface
- `ShareableAuthProvider` -- Auth adapter interface
- `ShareableDefinition` -- Content type definition
- `FieldSchema` -- Privacy field schema
