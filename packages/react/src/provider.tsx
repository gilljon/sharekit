import type { FieldSchema, VisibleFields } from "@sharekit/core";
import type { ReactNode } from "react";
import { ShareableContext, type ShareableContextValue } from "./context.js";

export interface ShareableProviderProps {
  type: string;
  schema: FieldSchema;
  data: unknown;
  params?: Record<string, unknown>;
  apiBasePath?: string;
  /** Override for shared view rendering */
  isShared?: boolean;
  visibleFields?: VisibleFields;
  ownerName?: string;
  viewCount?: number;
  shareToken?: string;
  children: ReactNode;
}

export function ShareableProvider({
  type,
  schema,
  data,
  params = {},
  apiBasePath = "/api/shareable",
  isShared = false,
  visibleFields = {},
  ownerName,
  viewCount,
  shareToken,
  children,
}: ShareableProviderProps) {
  const value: ShareableContextValue = {
    isShared,
    visibleFields,
    type,
    schema,
    ownerName: ownerName ?? null,
    viewCount: viewCount ?? null,
    shareToken: shareToken ?? null,
    data,
    params,
    apiBasePath,
  };

  return <ShareableContext value={value}>{children}</ShareableContext>;
}
