import {
  type OGImageConfig,
  type ShareableInstance,
  handleAction,
  validateToken,
} from "@sharekit/core";

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
