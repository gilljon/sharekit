import type { ShareableInstance, SharedViewData } from "@sharekit/core";
import { ShareableProvider } from "@sharekit/react";
import type { ReactNode } from "react";

export interface RemixSharedViewProps {
  /** Pre-fetched shared view data (from useLoaderData) */
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
 * Uses pre-fetched data from Remix's useLoaderData():
 *
 * ```tsx
 * // app/routes/shared.$type.$token.tsx
 * export async function loader({ params }) {
 *   const result = await handleAction(shareable, { kind: "view", token: params.token })
 *   return json(result)
 * }
 *
 * export default function SharedPage() {
 *   const data = useLoaderData<typeof loader>()
 *   return <RemixSharedView config={shareable} data={data} token={params.token} />
 * }
 * ```
 */
export function RemixSharedView({ data, config, token, children }: RemixSharedViewProps) {
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
      {children ? (
        children(data)
      ) : (
        <DefaultSharedView data={data} />
      )}
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
