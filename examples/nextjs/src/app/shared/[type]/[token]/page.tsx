import { SharedView, getSharedMetadata } from "@sharekit/next";
import { shareable } from "../../../lib/shareable.js";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; token: string }>;
}) {
  const { type, token } = await params;
  return getSharedMetadata(shareable, type, token);
}

export default async function SharedPage({
  params,
}: {
  params: Promise<{ type: string; token: string }>;
}) {
  const { type, token } = await params;
  return (
    <SharedView config={shareable} type={type} token={token}>
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
    </SharedView>
  );
}
