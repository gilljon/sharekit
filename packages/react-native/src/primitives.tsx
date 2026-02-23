import type { Share, ToggleItem, VisibleFields } from "@sharekit/core";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

// ---------------------------------------------------------------------------
// ToggleList
// ---------------------------------------------------------------------------

export interface ToggleItemRenderProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}

export interface ToggleGroupRenderProps {
  allChecked: boolean;
  someChecked: boolean;
  onToggleAll: (checked: boolean) => void;
  children: ReactNode;
}

export interface ToggleListProps {
  items: ToggleItem[];
  visibleFields: VisibleFields;
  onToggle: (path: string, visible: boolean) => void;
  renderItem: (item: ToggleItem, props: ToggleItemRenderProps) => ReactNode;
  renderGroup?: (group: ToggleItem, props: ToggleGroupRenderProps) => ReactNode;
}

/**
 * Headless toggle list for React Native that iterates toggle config
 * and delegates rendering. Handles checked state derivation, group
 * all-on/some-on logic, and dependency-based disabling.
 */
export function ToggleList({
  items,
  visibleFields,
  onToggle,
  renderItem,
  renderGroup,
}: ToggleListProps) {
  return (
    <View>
      {items.map((item) => {
        if (item.type === "group" && item.children) {
          const allChecked = item.children.every((c) => visibleFields[c.path]);
          const someChecked = item.children.some((c) => visibleFields[c.path]);

          const children = item.children.map((child) => {
            const disabled = child.requires != null && !visibleFields[child.requires];
            return renderItem(child, {
              checked: disabled ? false : (visibleFields[child.path] ?? child.defaultVisible),
              onChange: (val) => onToggle(child.path, val),
              disabled,
            });
          });

          if (renderGroup) {
            return renderGroup(item, {
              allChecked,
              someChecked,
              onToggleAll: (val) => {
                for (const child of item.children ?? []) {
                  onToggle(child.path, val);
                }
              },
              children: <View>{children}</View>,
            });
          }

          return <View key={item.path}>{children}</View>;
        }

        const disabled = item.requires != null && !visibleFields[item.requires];
        return renderItem(item, {
          checked: disabled ? false : (visibleFields[item.path] ?? item.defaultVisible),
          onChange: (val) => onToggle(item.path, val),
          disabled,
        });
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ShareList
// ---------------------------------------------------------------------------

export interface ShareItemRenderProps {
  onCopy: () => void;
  onRevoke: () => void;
  onShare: () => void;
}

export interface ShareListProps {
  shares: Share[];
  onCopy: (token: string) => void;
  onRevoke: (shareId: string) => void;
  onShare?: (token: string) => void;
  renderItem: (share: Share, props: ShareItemRenderProps) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderLoading?: () => ReactNode;
  isLoading?: boolean;
}

/**
 * Headless share list for React Native that iterates active shares
 * and delegates rendering. Includes an `onShare` prop for native sharing.
 */
export function ShareList({
  shares,
  onCopy,
  onRevoke,
  onShare,
  renderItem,
  renderEmpty,
  renderLoading,
  isLoading,
}: ShareListProps) {
  if (isLoading && renderLoading) return <>{renderLoading()}</>;
  if (shares.length === 0 && renderEmpty) return <>{renderEmpty()}</>;

  return (
    <View>
      {shares.map((share) =>
        renderItem(share, {
          onCopy: () => onCopy(share.token),
          onRevoke: () => onRevoke(share.id),
          onShare: () => onShare?.(share.token),
        }),
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// DependencyWarnings
// ---------------------------------------------------------------------------

export interface DependencyWarning {
  field: string;
  requires: string;
  message: string;
}

export interface DependencyWarningsProps {
  warnings: DependencyWarning[];
  renderWarning?: (warning: DependencyWarning) => ReactNode;
}

/**
 * Headless dependency warnings renderer for React Native.
 * Falls back to plain `Text` elements if no custom renderer is provided.
 */
export function DependencyWarnings({ warnings, renderWarning }: DependencyWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <View>
      {warnings.map((w) =>
        renderWarning ? renderWarning(w) : <Text key={w.field}>{w.message}</Text>,
      )}
    </View>
  );
}
