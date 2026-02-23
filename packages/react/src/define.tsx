import type { ShareableDefinition, VisibleFields } from "@sharekit/core";
import type { ReactNode } from "react";
import { Field, type FieldProps } from "./field.js";
import { ShareableProvider } from "./provider.js";
import { ShareButton, type ShareButtonProps } from "./share-button.js";
import { ShareManager, type ShareManagerProps } from "./share-manager.js";

/**
 * Creates a typed set of React components bound to a specific ShareableDefinition.
 *
 * Usage:
 * ```tsx
 * const Profile = defineShareableComponents(profileDefinition)
 *
 * <Profile.Provider data={data}>
 *   <Profile.Field name="bio">...</Profile.Field>
 *   <Profile.ShareButton />
 * </Profile.Provider>
 * ```
 */
export function defineShareableComponents<TData = unknown>(
  definition: ShareableDefinition<TData>,
  options?: { apiBasePath?: string },
) {
  const apiBasePath = options?.apiBasePath ?? "/api/shareable";

  function Provider({
    data,
    params = {},
    isShared,
    visibleFields,
    ownerName,
    viewCount,
    shareToken,
    children,
  }: {
    data: TData;
    params?: Record<string, unknown>;
    isShared?: boolean;
    visibleFields?: VisibleFields;
    ownerName?: string;
    viewCount?: number;
    shareToken?: string;
    children: ReactNode;
  }) {
    return (
      <ShareableProvider
        type={definition.id}
        schema={definition.fields}
        data={data}
        params={params}
        apiBasePath={apiBasePath}
        isShared={isShared}
        visibleFields={visibleFields}
        ownerName={ownerName}
        viewCount={viewCount}
        shareToken={shareToken}
      >
        {children}
      </ShareableProvider>
    );
  }

  function BoundField(props: FieldProps) {
    return <Field {...props} />;
  }

  function BoundShareButton(props: ShareButtonProps) {
    return <ShareButton {...props} />;
  }

  function BoundShareManager(props: ShareManagerProps) {
    return <ShareManager {...props} />;
  }

  return {
    Provider,
    Field: BoundField,
    ShareButton: BoundShareButton,
    ShareManager: BoundShareManager,
    definition,
  };
}
