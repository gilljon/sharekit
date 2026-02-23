import {
  ShareableError,
  type ShareableInstance,
  type SharedViewData,
  handleAction,
} from "@sharekit/core";
import {
  DefaultError,
  DefaultExpired,
  DefaultNotFound,
  DefaultSharedView,
  ShareableProvider,
} from "@sharekit/react";
import type { ReactNode } from "react";

export interface SharedViewProps {
  /** The shareable instance (from createShareable) */
  config: ShareableInstance;
  /** The shareable type (e.g. "progress") */
  type: string;
  /** The share token from the URL */
  token: string;
  /** Custom render function for the shared content */
  children?: (data: SharedViewData) => ReactNode;
  /** Fallback to show while loading or on error */
  fallback?: ReactNode;
  /** Custom not-found component */
  notFound?: ReactNode;
}

/**
 * Server component that fetches shared data and renders it within a
 * ShareableProvider in "shared" mode.
 *
 * Usage in Next.js App Router:
 * ```tsx
 * // app/shared/[type]/[token]/page.tsx
 * export default async function SharedPage({ params }) {
 *   return <SharedView config={shareable} type={params.type} token={params.token} />
 * }
 * ```
 */
export async function SharedView({
  config,
  type,
  token,
  children,
  fallback,
  notFound,
}: SharedViewProps) {
  let viewData: SharedViewData;

  try {
    const result = await handleAction(config, { kind: "view", token });
    viewData = result as SharedViewData;
  } catch (err) {
    if (err instanceof ShareableError && err.status === 404) {
      return <>{notFound ?? <DefaultNotFound />}</>;
    }
    if (err instanceof ShareableError && err.status === 410) {
      return <>{notFound ?? <DefaultExpired />}</>;
    }
    return <>{fallback ?? <DefaultError />}</>;
  }

  return (
    <ShareableProvider
      type={type}
      schema={config.getDefinition(type)?.fields ?? {}}
      data={viewData.data}
      isShared
      visibleFields={viewData.visibleFields}
      ownerName={viewData.ownerName}
      viewCount={viewData.viewCount}
      shareToken={token}
    >
      {children ? children(viewData) : <DefaultSharedView data={viewData} />}
    </ShareableProvider>
  );
}
