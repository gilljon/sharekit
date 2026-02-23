import type { ShareableDefinition, VisibleFields } from "@sharekit/core";
import type { ReactNode } from "react";
import type { ShareClient } from "./client.js";
import { Field, type FieldProps } from "./field.js";
import { ShareableProvider } from "./provider.js";
import { ShareButton, type ShareButtonProps } from "./share-button.js";
import { ShareManager, type ShareManagerProps } from "./share-manager.js";

export function defineShareableComponents<TData = unknown>(
  definition: ShareableDefinition<TData>,
  options?: { client?: ShareClient; baseUrl?: string },
) {
  const defaultClient = options?.client;
  const defaultBaseUrl = options?.baseUrl ?? "";

  function Provider({
    data,
    params = {},
    client,
    baseUrl,
    isShared,
    visibleFields,
    ownerName,
    viewCount,
    shareToken,
    children,
  }: {
    data: TData;
    params?: Record<string, unknown>;
    client?: ShareClient;
    baseUrl?: string;
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
        client={client ?? defaultClient}
        baseUrl={baseUrl ?? defaultBaseUrl}
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
