import {
  ShareableError,
  type ShareableInstance,
  type SharedViewData,
  handleAction,
} from "@sharekit/core";
import { ShareableProvider } from "@sharekit/react";
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

  if (children) {
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
        {children(viewData)}
      </ShareableProvider>
    );
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
      <DefaultSharedView data={viewData} />
    </ShareableProvider>
  );
}

function DefaultSharedView({ data }: { data: SharedViewData }) {
  return (
    <div data-shareable-shared-view="">
      <header data-shareable-shared-header="">
        <p>Shared by {data.ownerName}</p>
        <p>
          {data.viewCount} view{data.viewCount !== 1 ? "s" : ""}
        </p>
      </header>
      <pre>{JSON.stringify(data.data, null, 2)}</pre>
    </div>
  );
}

function DefaultNotFound() {
  return (
    <div data-shareable-not-found="">
      <h1>Share not found</h1>
      <p>This share link may have been revoked or does not exist.</p>
    </div>
  );
}

function DefaultExpired() {
  return (
    <div data-shareable-expired="">
      <h1>Share expired</h1>
      <p>This share link has expired.</p>
    </div>
  );
}

function DefaultError() {
  return (
    <div data-shareable-error="">
      <h1>Something went wrong</h1>
      <p>Unable to load this shared content.</p>
    </div>
  );
}
