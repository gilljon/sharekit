import {
  handleAction,
  ShareableError,
  type ShareableInstance,
  type OGImageConfig,
} from "@shareable/core";

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
export async function getSharedMetadata(
  instance: ShareableInstance,
  type: string,
  token: string,
  options?: { baseUrl?: string },
) {
  try {
    const ogConfig = (await handleAction(instance, { kind: "og", token })) as OGImageConfig;
    const baseUrl = options?.baseUrl ?? instance.config.baseUrl;
    const ogImageUrl = `${baseUrl}/api/shareable/${type}/${token}/og`;

    return {
      title: ogConfig.title,
      description: ogConfig.subtitle,
      openGraph: {
        title: ogConfig.title,
        description: ogConfig.subtitle,
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image" as const,
        title: ogConfig.title,
        description: ogConfig.subtitle,
        images: [ogImageUrl],
      },
    };
  } catch (err) {
    if (err instanceof ShareableError) {
      return { title: "Share not found" };
    }
    return { title: "Shared Content" };
  }
}
