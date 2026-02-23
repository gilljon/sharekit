# Tradelock Integration Example

This example shows how [Tradelock](https://refinetrade.app) -- a professional trading journal -- would integrate `@shareable` to replace its hand-built sharing system.

## Before vs After

### Before (hand-built)
- `progress_shares` table with 7 boolean columns + chartConfig JSONB
- `createProgressShare()` / `getProgressShares()` / `revokeProgressShare()` server functions
- `getSharedProgressByToken()` with manual privacy filtering (~60 lines of conditional logic)
- Hand-built ShareModal with ~800 lines of toggle UI code
- Separate shared view page duplicating layout
- Separate OG image generation function

### After (@shareable)
- **`shareable.config.ts`** -- 15 lines to configure storage, auth, base URL
- **`progress-shareable.ts`** -- ~80 lines: privacy schema + data loader + OG config
- **`progress-page.tsx`** -- Wrap existing components in `<Field>`, add `<ShareButton>`
- No separate shared view page (same component tree, auto-filtered)
- No manual privacy filtering (SDK handles it)
- No hand-built toggle UI (auto-generated from schema)

## Key Mapping

| Tradelock concept | @shareable equivalent |
|---|---|
| `showPnl`, `showWinRate`, etc. | `fields: { pnl: { default: false }, ... }` |
| `chartConfig` JSONB | `charts: { type: "group", children: { ... } }` |
| P&L-dependent charts | `requires: "pnl"` on chart fields |
| `createProgressShare()` | `<ShareButton />` (auto-creates via API) |
| `getSharedProgressByToken()` | `handleAction(instance, { kind: "view" })` |
| Manual privacy filtering | `filterData()` + `resolveDependencies()` |
| ShareModal toggle grid | Auto-generated from field schema |
| `generateProgressOGImage()` | `ogImage` function on shareable definition |

## Files

- `shareable.config.ts` -- SDK configuration
- `progress-shareable.ts` -- Progress sharing definition
- `chat-shareable.ts` -- Coach chat sharing definition
- `progress-page.tsx` -- Page component integration

## Note

Tradelock uses TanStack Start, not Next.js. The `@shareable/tanstack-start` adapter
is planned for v2. The core SDK, React components, and Drizzle adapter work with
any framework -- only the API route handler and shared view page need the framework adapter.
