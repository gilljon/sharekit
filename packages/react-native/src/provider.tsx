import type { FieldSchema, VisibleFields } from "@sharekit/core";
import type { ReactNode } from "react";
import type { ShareClient } from "./client.js";
import { ShareableContext, type ShareableContextValue } from "./context.js";

export interface ShareableProviderProps {
  type: string;
  schema: FieldSchema;
  data: unknown;
  params?: Record<string, unknown>;
  /** API client for share operations */
  client?: ShareClient;
  /** Base URL for constructing share links, e.g. "https://myapp.com" */
  baseUrl?: string;
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
  client,
  baseUrl = "",
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
    client: client ?? null,
    baseUrl,
  };

  return <ShareableContext value={value}>{children}</ShareableContext>;
}
