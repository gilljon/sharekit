import type { ShareableInstance, SharedViewData } from "@sharekit/core";
import { DefaultSharedView, ShareableProvider } from "@sharekit/react";
import type { ReactNode } from "react";

export interface TanStackSharedViewProps {
  /** Pre-fetched shared view data (from a loader or createServerFn) */
  data: SharedViewData;
  /** The shareable instance (for field schema lookup) */
  config: ShareableInstance;
  /** Share token (for context) */
  token: string;
  /** Custom render function */
  children?: (data: SharedViewData) => ReactNode;
}

/**
 * Renders shared content in a ShareableProvider with isShared=true.
 *
 * Unlike the Next.js SharedView (which is an async server component),
 * this expects pre-fetched data from a TanStack Start loader:
 *
 * ```tsx
 * // routes/shared.$type.$token.tsx
 * export const Route = createFileRoute('/shared/$type/$token')({
 *   loader: async ({ params }) => {
 *     const fns = createShareServerFns(shareable)
 *     return fns.view(params.token)
 *   },
 *   component: SharedPage,
 * })
 *
 * function SharedPage() {
 *   const data = Route.useLoaderData()
 *   return <TanStackSharedView config={shareable} data={data} token={params.token} />
 * }
 * ```
 */
export function TanStackSharedView({ data, config, token, children }: TanStackSharedViewProps) {
  const definition = config.getDefinition(data.type);

  return (
    <ShareableProvider
      type={data.type}
      schema={definition?.fields ?? {}}
      data={data.data}
      isShared
      visibleFields={data.visibleFields}
      ownerName={data.ownerName}
      viewCount={data.viewCount}
      shareToken={token}
    >
      {children ? children(data) : <DefaultSharedView data={data} />}
    </ShareableProvider>
  );
}
