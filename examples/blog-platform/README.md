# Blog Platform Example

This example shows how a blog platform would integrate `@sharekit` to let authors share their profile stats and individual posts with privacy controls.

## Use Case

Authors want to share their blog profile on social media, but may not want to expose all metrics:

- **Public by default:** Bio, follower count, post count, top posts
- **Private by default:** Earnings, reader demographics, referral sources
- **Dependencies:** Earnings breakdown requires earnings to be visible

## Files

- `shareable.config.ts` -- SDK configuration (storage, auth, base URL)
- `profile-shareable.ts` -- Profile sharing definition with privacy schema
- `post-shareable.ts` -- Blog post sharing definition
- `profile-page.tsx` -- Profile page with `<Field>` components

## Privacy Schema Highlights

```typescript
fields: {
  earnings: { label: "Earnings", default: false },
  analytics: {
    type: "group",
    children: {
      earningsBreakdown: {
        label: "Earnings Breakdown",
        default: false,
        requires: "earnings",  // auto-disabled when earnings is hidden
      },
    },
  },
}
```

The `requires` field creates a dependency chain -- if a user hides their earnings, the earnings breakdown chart is automatically hidden too.
