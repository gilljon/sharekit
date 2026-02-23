# Next.js Example

Minimal reference example showing @sharekit integration with Next.js App Router, Prisma, and NextAuth.

## What This Demonstrates

- Shareable configuration with `prismaStorage` and `nextAuthProvider`
- Blog post shareable definition with privacy schema (content, authorBio, comments, stats group)
- Catch-all API route using `createNextHandler`
- Blog page with `ShareableProvider`, `Field`, and `ShareButton`
- Shared view page using `SharedView` and `getSharedMetadata` for OG tags

## File Organization

```
src/
  lib/shareable.ts              -- createShareable config (storage, auth, baseUrl)
  shareables/blog-post.ts        -- blog-post definition (fields, getData, ogImage)
  app/
    api/shareable/[...shareable]/route.ts  -- catch-all API route
    blog/[id]/page.tsx           -- owner view with share UI
    shared/[type]/[token]/page.tsx -- public shared view
```

## Key Integration Points

1. **Config** (`lib/shareable.ts`): Replace `prisma` and `auth` placeholders with your Prisma client and NextAuth instance.
2. **API route** (`api/shareable/[...shareable]/route.ts`): Exports `GET`, `POST`, `DELETE` from `createNextHandler(shareable)`.
3. **Shared view**: Uses async `SharedView` server component; `generateMetadata` calls `getSharedMetadata` for OG tags.
4. **Styles**: Import `@sharekit/react/styles.css` for ShareModal/ToggleList styling.

## Note

This is a reference example, not a runnable template. You need a real database (with `ShareableShare` model) and NextAuth setup to run it. Add the Prisma model from `@sharekit/prisma` and run migrations.
