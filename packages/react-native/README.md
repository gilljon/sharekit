# @sharekit/react-native

React Native components and API client for the [Shareable SDK](https://github.com/gilljon/sharekit). Add privacy-aware content sharing to Expo and React Native apps.

## How It Works

This is a **client-only** package. Your backend runs one of the server adapters (`@sharekit/next`, `@sharekit/tanstack-start`, or `@sharekit/remix`) to handle share creation, storage, and access control. This package provides:

- A typed **API client** that talks to your backend
- React Native **UI components** (Provider, Field, ShareButton, ShareModal, ShareManager)
- **Clipboard** integration via `expo-clipboard`
- **Native share sheet** via `expo-sharing`

```
React Native App                    Backend
+------------------------+          +-------------------------+
| @sharekit/react-native | --HTTP-> | @sharekit/next (etc.)   |
|  - ShareButton         |          |  - handleAction()       |
|  - ShareModal          |          |  - @sharekit/core       |
|  - ShareManager        |          |  - @sharekit/drizzle    |
+------------------------+          +-------------------------+
```

## Installation

```bash
npx expo install @sharekit/react-native @sharekit/core

# Optional: clipboard and native sharing
npx expo install expo-clipboard expo-sharing
```

## Setup

### 1. Create the API Client

```typescript
// lib/shareable.ts
import { createShareClient } from "@sharekit/react-native";
import { getAuthToken } from "./auth";

export const shareClient = createShareClient({
  baseUrl: "https://myapp.com",
  apiPath: "/api/shareable",
  getHeaders: async () => ({
    Authorization: `Bearer ${await getAuthToken()}`,
  }),
});
```

### 2. Define Shareable Content

```typescript
// lib/shareable.ts
import { defineShareableComponents } from "@sharekit/react-native";
import { myContentDefinition } from "./definitions";

export const Content = defineShareableComponents(myContentDefinition, {
  client: shareClient,
  baseUrl: "https://myapp.com",
});
```

### 3. Use in Your Screens

```tsx
import { Content } from "../lib/shareable";

function ContentScreen({ data }) {
  return (
    <Content.Provider data={data}>
      <Content.Field name="summary">
        <SummaryCard data={data.summary} />
      </Content.Field>

      <Content.Field name="revenue">
        <RevenueChart data={data.revenue} />
      </Content.Field>

      <Content.ShareButton
        label="Share"
        style={{ backgroundColor: "#111", borderRadius: 10, padding: 14 }}
        textStyle={{ color: "#fff", textAlign: "center", fontWeight: "600" }}
      />
    </Content.Provider>
  );
}
```

## Components

### `ShareableProvider`

Context provider that wraps your content. Accepts `client`, `baseUrl`, `type`, `schema`, `data`, and shared-view props.

### `Field`

Conditionally renders children based on field visibility. In authenticated views, always renders. In shared views, respects the visibility map.

```tsx
<Content.Field name="revenue" fallback={<Text>Hidden</Text>}>
  <RevenueChart />
</Content.Field>
```

### `ShareButton`

Self-contained button that opens the share modal. Wraps itself in a `ShareManager` for state.

```tsx
<Content.ShareButton
  label="Share Report"
  style={styles.button}
  textStyle={styles.buttonText}
  renderModal={({ visible, onClose }) => (
    <YourCustomModal visible={visible} onClose={onClose} />
  )}
/>
```

### `ShareModal`

Bottom-sheet modal with:
- **New Share** tab: privacy toggle switches, create button
- **Active** tab: list of shares with copy, share (native sheet), and revoke actions

### `ShareManager`

Render-prop component for full control over the share UI:

```tsx
<Content.ShareManager>
  {({ shares, visibleFields, setFieldVisible, createShare, revokeShare, copyLink, shareNative, isCreating }) => (
    <YourCustomShareUI />
  )}
</Content.ShareManager>
```

## API Client

`createShareClient` returns a typed client with these methods:

```typescript
const client = createShareClient({
  baseUrl: "https://myapp.com",
  getHeaders: async () => ({ Authorization: `Bearer ${token}` }),
});

// Create a share
const { share, url } = await client.create("report", visibleFields, params);

// List shares
const shares = await client.list("report");

// View shared content (for rendering shared views)
const data = await client.view("report", token);

// Revoke a share
await client.revoke("report", shareId);

// Get analytics
const analytics = await client.analytics("report");
```

## Deep Linking with Expo Router

Set up routes to handle shared view links:

```
app/
  shared/
    [type]/
      [token].tsx
```

```tsx
// app/shared/[type]/[token].tsx
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { shareClient, Content } from "../../lib/shareable";

export default function SharedViewScreen() {
  const { type, token } = useLocalSearchParams<{ type: string; token: string }>();
  const [data, setData] = useState(null);

  useEffect(() => {
    shareClient.view(type, token).then(setData);
  }, [type, token]);

  if (!data) return <ActivityIndicator />;

  return (
    <Content.Provider
      data={data.data}
      isShared
      visibleFields={data.visibleFields}
      ownerName={data.ownerName}
      viewCount={data.viewCount}
      shareToken={token}
    >
      <Content.Field name="summary">
        <SummaryCard data={data.data.summary} />
      </Content.Field>
      <Content.Field name="revenue">
        <RevenueChart data={data.data.revenue} />
      </Content.Field>
    </Content.Provider>
  );
}
```

For universal links, configure your `app.json`:

```json
{
  "expo": {
    "scheme": "myapp",
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      ["expo-router", {
        "origin": "https://myapp.com"
      }]
    ]
  }
}
```

## Differences from @sharekit/react

| Feature | @sharekit/react (Web) | @sharekit/react-native |
|---------|----------------------|----------------------|
| API calls | Relative `fetch` to same origin | `createShareClient` with configurable `baseUrl` |
| Clipboard | `navigator.clipboard` | `expo-clipboard` (optional) |
| Share | Copy link only | Native share sheet via `expo-sharing` |
| Modal | HTML `<dialog>` | React Native `Modal` (bottom sheet) |
| Toggles | HTML `<input type="checkbox">` | React Native `Switch` |
| Styling | CSS data attributes | `StyleSheet` (unstyled by default) |
| Auth | Session cookies (automatic) | `getHeaders` callback (Bearer tokens) |

## License

MIT
