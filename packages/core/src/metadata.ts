import { handleAction } from "./handler.js";
import { validateToken } from "./token.js";
import type { OGImageConfig, ShareableInstance } from "./types.js";

/**
 * Fetch share metadata (title, description, OG image URL) for a given token.
 *
 * Returns `null` if the token is invalid, the share doesn't exist, or it has expired.
 * Framework adapters can re-export this directly or wrap it to produce
 * framework-specific metadata objects (e.g. Next.js `Metadata`).
 */
export async function getShareMeta(
  instance: ShareableInstance,
  type: string,
  token: string,
): Promise<{ title: string; description?: string; ogImageUrl: string } | null> {
  if (!validateToken(token)) return null;

  const share = await instance.config.storage.getShare(token);
  if (!share) return null;
  if (share.expiresAt && share.expiresAt < new Date()) return null;

  const definition = instance.getDefinition(share.type);
  if (!definition) return null;

  if (!definition.ogImage) {
    return {
      title: `Shared ${type}`,
      ogImageUrl: "",
    };
  }

  try {
    const ogConfig = (await handleAction(instance, { kind: "og", token })) as OGImageConfig;
    const baseUrl = instance.config.baseUrl.replace(/\/$/, "");
    const ogImageUrl = `${baseUrl}/api/shareable/${type}/${token}/og`;
    return {
      title: ogConfig.title,
      description: ogConfig.subtitle,
      ogImageUrl,
    };
  } catch {
    return null;
  }
}
