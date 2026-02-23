import { TanStackSharedView, createShareServerFns, getShareMeta } from "@sharekit/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { shareable } from "../lib/shareable.js";

const fetchSharedView = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const fns = createShareServerFns(shareable);
    try {
      return await fns.view(data.token);
    } catch {
      return null;
    }
  });

export const Route = createFileRoute("/shared/$type/$token")({
  component: SharedPage,
  loader: async ({ params }) => {
    const shared = await fetchSharedView({ data: { token: params.token } });
    const meta = shared ? await getShareMeta(shareable, params.type, params.token) : null;
    return { shared, type: params.type, token: params.token, meta };
  },
  head: ({ loaderData }) => {
    const meta = loaderData?.meta as Awaited<ReturnType<typeof getShareMeta>> | null;
    if (!meta) return { meta: [{ title: "Shared Content" }] };
    return {
      meta: [
        { title: meta.title },
        ...(meta.description ? [{ name: "description" as const, content: meta.description }] : []),
        ...(meta.ogImageUrl ? [{ property: "og:image" as const, content: meta.ogImageUrl }] : []),
      ],
    };
  },
});

function SharedPage() {
  const { shared, type, token } = Route.useLoaderData();

  if (!shared) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h1>Share not found</h1>
      </div>
    );
  }

  if (type === "profile") {
    return (
      <TanStackSharedView config={shareable} data={shared} token={token}>
        {(data) => (
          <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
            <header>
              <p>Shared by {data.ownerName}</p>
              <p>
                {data.viewCount} view{data.viewCount !== 1 ? "s" : ""}
              </p>
            </header>
            <pre>{JSON.stringify(data.data, null, 2)}</pre>
          </div>
        )}
      </TanStackSharedView>
    );
  }

  return <TanStackSharedView config={shareable} data={shared} token={token} />;
}
