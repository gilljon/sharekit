import {
  type Share,
  type ToggleItem,
  getDependencyWarnings,
  getToggleConfig,
} from "@sharekit/core";
import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useShareableContext } from "./context.js";
import { useShareManager } from "./context.js";

export interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ShareModal({ visible, onClose }: ShareModalProps) {
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
      await manager.copyLink(result.token);
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

  const handleShare = useCallback(
    async (token: string) => {
      await manager.shareNative(token);
    },
    [manager],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Tab bar */}
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, tab === "new" && styles.tabActive]}
              onPress={() => setTab("new")}
            >
              <Text style={[styles.tabText, tab === "new" && styles.tabTextActive]}>New Share</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === "active" && styles.tabActive]}
              onPress={() => setTab("active")}
            >
              <Text style={[styles.tabText, tab === "active" && styles.tabTextActive]}>
                Active ({manager.shares.length})
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {tab === "new" && (
              <>
                {toggleConfig.map((item) => (
                  <ToggleRow key={item.path} item={item} manager={manager} />
                ))}

                {warnings.length > 0 && (
                  <View style={styles.warnings}>
                    {warnings.map((w) => (
                      <Text key={w.field} style={styles.warningText}>
                        {w.message}
                      </Text>
                    ))}
                  </View>
                )}

                {manager.error && <Text style={styles.errorText}>{manager.error}</Text>}

                <Pressable
                  style={[styles.createBtn, manager.isCreating && styles.createBtnDisabled]}
                  onPress={handleCreate}
                  disabled={manager.isCreating}
                >
                  <Text style={styles.createBtnText}>
                    {manager.isCreating ? "Creating..." : "Create Share Link"}
                  </Text>
                </Pressable>

                {createdUrl && <Text style={styles.successText}>Link copied to clipboard</Text>}
              </>
            )}

            {tab === "active" && (
              <>
                {manager.isLoading && <Text style={styles.emptyText}>Loading...</Text>}
                {!manager.isLoading && manager.shares.length === 0 && (
                  <Text style={styles.emptyText}>No active shares</Text>
                )}
                {manager.shares.map((share) => (
                  <ShareRow
                    key={share.id}
                    share={share}
                    onCopy={() => handleCopy(share.token)}
                    onShare={() => handleShare(share.token)}
                    onRevoke={() => manager.revokeShare(share.id)}
                    isCopied={copiedToken === share.token}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
      <View style={styles.toggleGroup}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{item.label}</Text>
          <Switch
            value={allOn}
            onValueChange={(val) => {
              for (const child of item.children ?? []) {
                manager.setFieldVisible(child.path, val);
              }
            }}
          />
        </View>
        <View style={styles.toggleChildren}>
          {item.children?.map((child) => (
            <View key={child.path} style={styles.toggleRow}>
              <Text style={styles.toggleLabelChild}>{child.label}</Text>
              <Switch
                value={manager.visibleFields[child.path] ?? child.defaultVisible}
                onValueChange={(val) => manager.setFieldVisible(child.path, val)}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{item.label}</Text>
      <Switch
        value={manager.visibleFields[item.path] ?? item.defaultVisible}
        onValueChange={(val) => manager.setFieldVisible(item.path, val)}
      />
    </View>
  );
}

function ShareRow({
  share,
  onCopy,
  onShare,
  onRevoke,
  isCopied,
}: {
  share: Share;
  onCopy: () => void;
  onShare: () => void;
  onRevoke: () => void;
  isCopied: boolean;
}) {
  return (
    <View style={styles.shareRow}>
      <View style={styles.shareInfo}>
        <Text style={styles.shareDate}>{new Date(share.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.shareViews}>
          {share.viewCount} view{share.viewCount !== 1 ? "s" : ""}
        </Text>
      </View>
      <View style={styles.shareActions}>
        <Pressable style={styles.actionBtn} onPress={onCopy}>
          <Text style={styles.actionBtnText}>{isCopied ? "Copied" : "Copy"}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onShare}>
          <Text style={styles.actionBtnText}>Share</Text>
        </Pressable>
        <Pressable style={styles.revokeBtn} onPress={onRevoke}>
          <Text style={styles.revokeBtnText}>Revoke</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#111827",
  },
  content: {
    flexGrow: 0,
  },
  contentInner: {
    padding: 16,
  },
  toggleGroup: {
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  toggleLabelChild: {
    fontSize: 14,
    color: "#374151",
  },
  toggleChildren: {
    paddingLeft: 16,
  },
  warnings: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#92400e",
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 8,
  },
  successText: {
    fontSize: 13,
    color: "#059669",
    marginTop: 8,
    textAlign: "center",
  },
  createBtn: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 24,
  },
  shareRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  shareInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  shareDate: {
    fontSize: 14,
    color: "#374151",
  },
  shareViews: {
    fontSize: 13,
    color: "#6b7280",
  },
  shareActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  revokeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    alignItems: "center",
  },
  revokeBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#dc2626",
  },
});
