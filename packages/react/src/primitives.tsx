import type { Share, ToggleItem, VisibleFields } from "@sharekit/core";
import type { ReactNode } from "react";

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
 * Headless toggle list that iterates toggle config and delegates rendering.
 * Handles checked state derivation, group all-on/some-on logic, and
 * dependency-based disabling.
 */
export function ToggleList({
  items,
  visibleFields,
  onToggle,
  renderItem,
  renderGroup,
}: ToggleListProps) {
  return (
    <>
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
              children: <>{children}</>,
            });
          }

          return <>{children}</>;
        }

        const disabled = item.requires != null && !visibleFields[item.requires];
        return renderItem(item, {
          checked: disabled ? false : (visibleFields[item.path] ?? item.defaultVisible),
          onChange: (val) => onToggle(item.path, val),
          disabled,
        });
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// ShareList
// ---------------------------------------------------------------------------

export interface ShareItemRenderProps {
  onCopy: () => void;
  onRevoke: () => void;
}

export interface ShareListProps {
  shares: Share[];
  onCopy: (token: string) => void;
  onRevoke: (shareId: string) => void;
  renderItem: (share: Share, props: ShareItemRenderProps) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderLoading?: () => ReactNode;
  isLoading?: boolean;
}

/**
 * Headless share list that iterates active shares and delegates rendering.
 */
export function ShareList({
  shares,
  onCopy,
  onRevoke,
  renderItem,
  renderEmpty,
  renderLoading,
  isLoading,
}: ShareListProps) {
  if (isLoading && renderLoading) return <>{renderLoading()}</>;
  if (shares.length === 0 && renderEmpty) return <>{renderEmpty()}</>;

  return (
    <>
      {shares.map((share) =>
        renderItem(share, {
          onCopy: () => onCopy(share.token),
          onRevoke: () => onRevoke(share.id),
        }),
      )}
    </>
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
 * Headless dependency warnings renderer. If no `renderWarning` is provided,
 * renders plain `<p>` elements with data attributes for styling.
 */
export function DependencyWarnings({ warnings, renderWarning }: DependencyWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <>
      {warnings.map((w) =>
        renderWarning ? (
          renderWarning(w)
        ) : (
          <p key={w.field} data-shareable-warning="">
            {w.message}
          </p>
        ),
      )}
    </>
  );
}
