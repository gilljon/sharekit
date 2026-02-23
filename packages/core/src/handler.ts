import { formatOwnerName } from "./owner.js";
import { filterData, resolveDependencies } from "./privacy.js";
import { generateToken, validateToken } from "./token.js";
import type {
  ShareableAction,
  ShareableInstance,
  SharedViewData,
  VisibleFields,
} from "./types.js";

/**
 * Core request handler. Framework adapters call this with a parsed action and
 * optional Request (for auth). Returns a JSON-serialisable result or throws.
 */
export async function handleAction(
  instance: ShareableInstance,
  action: ShareableAction,
  request?: Request,
): Promise<unknown> {
  const { config } = instance;

  switch (action.kind) {
    case "create": {
      if (!request) throw new ShareableError("Authentication required", 401);
      const user = await config.auth.getUser(request);
      if (!user) throw new ShareableError("Authentication required", 401);

      const definition = instance.getDefinition(action.type);
      if (!definition) throw new ShareableError(`Unknown shareable type: ${action.type}`, 400);

      const resolved = resolveDependencies(action.visibleFields, definition.fields);
      const tokenLength = config.defaults?.tokenLength ?? 12;
      const token = generateToken(tokenLength);
      const baseUrl = config.baseUrl.replace(/\/$/, "");

      const share = await config.storage.createShare({
        type: action.type,
        token,
        ownerId: user.id,
        params: action.params,
        visibleFields: resolved,
        expiresAt: action.expiresAt ? new Date(action.expiresAt) : null,
      });

      return {
        share,
        url: `${baseUrl}/shared/${action.type}/${token}`,
      };
    }

    case "list": {
      if (!request) throw new ShareableError("Authentication required", 401);
      const user = await config.auth.getUser(request);
      if (!user) throw new ShareableError("Authentication required", 401);

      const shares = await config.storage.getSharesByOwner(user.id, action.type);
      return { shares };
    }

    case "get": {
      if (!validateToken(action.token)) {
        throw new ShareableError("Invalid share token", 400);
      }
      const share = await config.storage.getShare(action.token);
      if (!share) throw new ShareableError("Share not found", 404);

      if (share.expiresAt && share.expiresAt < new Date()) {
        throw new ShareableError("Share has expired", 410);
      }

      return { share };
    }

    case "revoke": {
      if (!request) throw new ShareableError("Authentication required", 401);
      const user = await config.auth.getUser(request);
      if (!user) throw new ShareableError("Authentication required", 401);

      await config.storage.revokeShare(action.shareId, user.id);
      return { success: true };
    }

    case "view": {
      if (!validateToken(action.token)) {
        throw new ShareableError("Invalid share token", 400);
      }

      const share = await config.storage.getShare(action.token);
      if (!share) throw new ShareableError("Share not found", 404);

      if (share.expiresAt && share.expiresAt < new Date()) {
        throw new ShareableError("Share has expired", 410);
      }

      const definition = instance.getDefinition(share.type);
      if (!definition) throw new ShareableError(`Unknown shareable type: ${share.type}`, 500);

      if (config.defaults?.trackViews !== false) {
        await config.storage.incrementViewCount(action.token);
      }

      const rawData = await definition.getData({
        ownerId: share.ownerId,
        params: share.params,
      });

      const resolved = resolveDependencies(share.visibleFields, definition.fields);
      let filteredData = filterData(rawData, resolved);

      if (definition.filterData) {
        filteredData = definition.filterData({
          data: filteredData,
          visibleFields: resolved,
        });
      }

      const ownerDisplay = config.defaults?.ownerDisplay ?? "first-name";
      const ownerUser = await config.auth.getUser(
        new Request("http://internal", {
          headers: { "x-shareable-owner-id": share.ownerId },
        }),
      ).catch(() => null);

      const ownerName = formatOwnerName(ownerUser?.name, ownerDisplay);

      const result: SharedViewData = {
        data: filteredData,
        visibleFields: resolved,
        ownerName,
        viewCount: share.viewCount + 1,
        type: share.type,
        createdAt: share.createdAt,
      };

      return result;
    }

    case "og": {
      if (!validateToken(action.token)) {
        throw new ShareableError("Invalid share token", 400);
      }

      const share = await config.storage.getShare(action.token);
      if (!share) throw new ShareableError("Share not found", 404);

      const definition = instance.getDefinition(share.type);
      if (!definition?.ogImage) throw new ShareableError("OG image not configured", 404);

      const rawData = await definition.getData({
        ownerId: share.ownerId,
        params: share.params,
      });

      const resolved = resolveDependencies(share.visibleFields, definition.fields);
      const filteredData = filterData(rawData, resolved);

      const ownerDisplay = config.defaults?.ownerDisplay ?? "first-name";
      const ownerUser = await config.auth.getUser(
        new Request("http://internal", {
          headers: { "x-shareable-owner-id": share.ownerId },
        }),
      ).catch(() => null);

      const ownerName = formatOwnerName(ownerUser?.name, ownerDisplay);

      const ogConfig = definition.ogImage({
        data: filteredData,
        visibleFields: resolved,
        ownerName,
      });

      return ogConfig;
    }
  }
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ShareableError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ShareableError";
  }
}
