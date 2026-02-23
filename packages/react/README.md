# @sharekit/react

React components and hooks for the Shareable SDK.

## Installation

```bash
pnpm add @sharekit/react @sharekit/core
```

## Components

### `<ShareableProvider>`

Context provider that wraps shareable content. Sets the sharing mode (authenticated vs shared).

### `<Field name="...">`

Conditionally renders children based on field visibility. In authenticated view, always renders. In shared view, only renders if the field's privacy toggle is enabled.

```tsx
<Field name="pnl">
  <PnLChart data={data.pnl} />
</Field>
```

### `<ShareButton>`

Self-contained button that opens the share modal. Includes privacy toggles auto-generated from the field schema, active share management, copy/revoke actions.

### `<ShareModal>`

The modal content component. Used inside ShareButton or independently.

### `<ShareManager>`

State management for share CRUD. Supports render props for full customisation:

```tsx
<ShareManager>
  {({ shares, visibleFields, setFieldVisible, create, revoke, copyLink }) => (
    <YourCustomUI />
  )}
</ShareManager>
```

### `defineShareableComponents(definition)`

Creates a typed set of components bound to a specific shareable definition:

```tsx
const Progress = defineShareableComponents(progressShare);
// Progress.Provider, Progress.Field, Progress.ShareButton, Progress.ShareManager
```

## Hooks

- `useShareableContext()` -- Access the shareable context (isShared, visibleFields, etc.)
- `useShareManager()` -- Access the share manager state (shares, create, revoke, etc.)
