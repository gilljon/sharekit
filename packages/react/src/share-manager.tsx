import type { ReactNode } from "react";
import {
  ShareManagerContext,
  type ShareManagerContextValue,
  useShareableContext,
} from "./context.js";
import { useShareCrudInternal } from "./use-share-crud-internal.js";
import { useToggleFields } from "./use-toggle-fields.js";

export interface ShareManagerProps {
  children: ReactNode | ((ctx: ShareManagerContextValue) => ReactNode);
}

/**
 * Manages share CRUD operations. Provides state for creating/listing/revoking
 * shares, and exposes privacy field toggles.
 *
 * Can be used with render props for full customisation, or as a provider
 * for the built-in ShareButton/ShareModal components.
 */
export function ShareManager({ children }: ShareManagerProps) {
  const { type, schema, apiBasePath, params } = useShareableContext();

  const { visibleFields, setFieldVisible, setAllFieldsVisible } = useToggleFields(schema);

  const { shares, isLoading, isCreating, error, createShare, revokeShare, copyLink } =
    useShareCrudInternal({
      type,
      apiBasePath,
      visibleFields,
      params: params ?? {},
    });

  const value: ShareManagerContextValue = {
    shares,
    isLoading,
    error,
    visibleFields,
    setFieldVisible,
    setAllFieldsVisible,
    createShare,
    revokeShare,
    copyLink,
    isCreating,
  };

  return (
    <ShareManagerContext value={value}>
      {typeof children === "function" ? children(value) : children}
    </ShareManagerContext>
  );
}
