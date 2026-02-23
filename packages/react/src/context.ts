import type { FieldSchema, Share, VisibleFields } from "@sharekit/core";
import { createContext, useContext } from "react";

export interface ShareableContextValue {
  /** True when rendering inside a shared/public view */
  isShared: boolean;
  /** Current visibility state of all fields */
  visibleFields: VisibleFields;
  /** The shareable type id (e.g. "progress") */
  type: string;
  /** Field schema for generating toggles */
  schema: FieldSchema;
  /** Owner name (only set in shared view) */
  ownerName: string | null;
  /** View count (only set in shared view) */
  viewCount: number | null;
  /** Share token (only set in shared view) */
  shareToken: string | null;
  /** The data for this shareable */
  data: unknown;
  /** Additional params (date ranges, filters) */
  params: Record<string, unknown>;
  /** API base path for share operations */
  apiBasePath: string;
}

export const ShareableContext = createContext<ShareableContextValue | null>(null);

export function useShareableContext(): ShareableContextValue {
  const ctx = useContext(ShareableContext);
  if (!ctx) {
    throw new Error("useShareableContext must be used within a <ShareableProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Share manager context -- manages share CRUD state
// ---------------------------------------------------------------------------

export interface ShareManagerContextValue {
  shares: Share[];
  isLoading: boolean;
  error: string | null;
  visibleFields: VisibleFields;
  setFieldVisible: (path: string, visible: boolean) => void;
  setAllFieldsVisible: (visible: boolean) => void;
  createShare: (expiresAt?: Date) => Promise<{ token: string; url: string } | null>;
  revokeShare: (shareId: string) => Promise<void>;
  copyLink: (token: string) => Promise<void>;
  isCreating: boolean;
}

export const ShareManagerContext = createContext<ShareManagerContextValue | null>(null);

export function useShareManager(): ShareManagerContextValue {
  const ctx = useContext(ShareManagerContext);
  if (!ctx) {
    throw new Error("useShareManager must be used within a <ShareManager>");
  }
  return ctx;
}
