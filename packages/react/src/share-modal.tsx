import {
  getDependencyWarnings,
  getToggleConfig,
  type Share,
  type ToggleItem,
} from "@sharekit/core";
import { useCallback, useState } from "react";
import { useShareableContext } from "./context.js";
import { useShareManager } from "./context.js";

// ---------------------------------------------------------------------------
// ShareModal -- headless modal content component
// ---------------------------------------------------------------------------

export interface ShareModalProps {
  onClose?: () => void;
}

export function ShareModal({ onClose }: ShareModalProps) {
  const { schema } = useShareableContext();
  const manager = useShareManager();
  const [tab, setTab] = useState<"new" | "active">("new");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const toggleConfig = getToggleConfig(schema);
  const warnings = getDependencyWarnings(manager.visibleFields, schema);

  const handleCreate = useCallback(async () => {
    const result = await manager.createShare();
    if (result) {
      setCreatedUrl(result.url);
      await navigator.clipboard.writeText(result.url);
      setCopiedToken(result.token);
      setTab("active");
    }
  }, [manager]);

  const handleCopy = useCallback(
    async (token: string) => {
      await manager.copyLink(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    },
    [manager],
  );

  return (
    <div data-shareable-modal="" role="dialog" aria-label="Share">
      {/* Tab header */}
      <div data-shareable-tabs="">
        <button
          type="button"
          data-shareable-tab=""
          data-active={tab === "new" || undefined}
          onClick={() => setTab("new")}
        >
          New Share
        </button>
        <button
          type="button"
          data-shareable-tab=""
          data-active={tab === "active" || undefined}
          onClick={() => setTab("active")}
        >
          Active ({manager.shares.length})
        </button>
      </div>

      {/* New share tab */}
      {tab === "new" && (
        <div data-shareable-tab-content="">
          <div data-shareable-toggles="">
            {toggleConfig.map((item) => (
              <ToggleRow key={item.path} item={item} manager={manager} />
            ))}
          </div>

          {warnings.length > 0 && (
            <div data-shareable-warnings="">
              {warnings.map((w) => (
                <p key={w.field} data-shareable-warning="">
                  {w.message}
                </p>
              ))}
            </div>
          )}

          {manager.error && (
            <p data-shareable-error="">{manager.error}</p>
          )}

          <button
            type="button"
            data-shareable-create-btn=""
            disabled={manager.isCreating}
            onClick={handleCreate}
          >
            {manager.isCreating ? "Creating..." : "Create Share Link"}
          </button>

          {createdUrl && (
            <p data-shareable-success="">Link copied to clipboard</p>
          )}
        </div>
      )}

      {/* Active shares tab */}
      {tab === "active" && (
        <div data-shareable-tab-content="">
          {manager.isLoading && <p>Loading...</p>}
          {!manager.isLoading && manager.shares.length === 0 && (
            <p data-shareable-empty="">No active shares</p>
          )}
          {manager.shares.map((share) => (
            <ShareRow
              key={share.id}
              share={share}
              onCopy={() => handleCopy(share.token)}
              onRevoke={() => manager.revokeShare(share.id)}
              isCopied={copiedToken === share.token}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToggleRow({
  item,
  manager,
}: {
  item: ToggleItem;
  manager: ReturnType<typeof useShareManager>;
}) {
  if (item.type === "group") {
    const allOn = item.children?.every((c) => manager.visibleFields[c.path]) ?? false;
    return (
      <div data-shareable-toggle-group="">
        <label data-shareable-toggle="">
          <input
            type="checkbox"
            checked={allOn}
            onChange={(e) => {
              for (const child of item.children ?? []) {
                manager.setFieldVisible(child.path, e.target.checked);
              }
            }}
          />
          <span>{item.label}</span>
        </label>
        <div data-shareable-toggle-children="">
          {item.children?.map((child) => (
            <label key={child.path} data-shareable-toggle="">
              <input
                type="checkbox"
                checked={manager.visibleFields[child.path] ?? child.defaultVisible}
                onChange={(e) => manager.setFieldVisible(child.path, e.target.checked)}
              />
              <span>{child.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <label data-shareable-toggle="">
      <input
        type="checkbox"
        checked={manager.visibleFields[item.path] ?? item.defaultVisible}
        onChange={(e) => manager.setFieldVisible(item.path, e.target.checked)}
      />
      <span>{item.label}</span>
    </label>
  );
}

function ShareRow({
  share,
  onCopy,
  onRevoke,
  isCopied,
}: {
  share: Share;
  onCopy: () => void;
  onRevoke: () => void;
  isCopied: boolean;
}) {
  return (
    <div data-shareable-share-row="">
      <div data-shareable-share-info="">
        <span data-shareable-share-date="">
          {new Date(share.createdAt).toLocaleDateString()}
        </span>
        <span data-shareable-share-views="">
          {share.viewCount} view{share.viewCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div data-shareable-share-actions="">
        <button type="button" data-shareable-copy-btn="" onClick={onCopy}>
          {isCopied ? "Copied" : "Copy Link"}
        </button>
        <button type="button" data-shareable-revoke-btn="" onClick={onRevoke}>
          Revoke
        </button>
      </div>
    </div>
  );
}
