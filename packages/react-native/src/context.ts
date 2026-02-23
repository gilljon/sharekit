import type { FieldSchema, Share, VisibleFields } from "@sharekit/core";
import { createContext, useContext } from "react";
import type { ShareClient } from "./client.js";

export interface ShareableContextValue {
  isShared: boolean;
  visibleFields: VisibleFields;
  type: string;
  schema: FieldSchema;
  ownerName: string | null;
  viewCount: number | null;
  shareToken: string | null;
  data: unknown;
  params: Record<string, unknown>;
  client: ShareClient | null;
  /** Base URL for constructing share links, e.g. "https://myapp.com" */
  baseUrl: string;
}

export const ShareableContext = createContext<ShareableContextValue | null>(null);

export function useShareableContext(): ShareableContextValue {
  const ctx = useContext(ShareableContext);
  if (!ctx) {
    throw new Error("useShareableContext must be used within a <ShareableProvider>");
  }
  return ctx;
}

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
  shareNative: (token: string) => Promise<void>;
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
