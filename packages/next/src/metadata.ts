import { ShareableError, type ShareableInstance, getShareMeta } from "@sharekit/core";

/**
 * Generate Next.js metadata for a shared page, including OG image tags.
 *
 * Usage:
 * ```ts
 * // app/shared/[type]/[token]/page.tsx
 * export async function generateMetadata({ params }) {
 *   return getSharedMetadata(shareable, params.type, params.token)
 * }
 * ```
 */
export async function getSharedMetadata(instance: ShareableInstance, type: string, token: string) {
  try {
    const meta = await getShareMeta(instance, type, token);
    if (!meta) return { title: "Share not found" };

    return {
      title: meta.title,
      description: meta.description,
      openGraph: {
        title: meta.title,
        description: meta.description,
        images: meta.ogImageUrl ? [{ url: meta.ogImageUrl, width: 1200, height: 630 }] : [],
      },
      twitter: {
        card: "summary_large_image" as const,
        title: meta.title,
        description: meta.description,
        images: meta.ogImageUrl ? [meta.ogImageUrl] : [],
      },
    };
  } catch (err) {
    if (err instanceof ShareableError) {
      return { title: "Share not found" };
    }
    return { title: "Shared Content" };
  }
}
