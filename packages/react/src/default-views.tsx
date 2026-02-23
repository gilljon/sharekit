import type { SharedViewData } from "@sharekit/core";

export function DefaultSharedView({ data }: { data: SharedViewData }) {
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

export function DefaultNotFound() {
  return (
    <div data-shareable-not-found="">
      <h1>Share not found</h1>
      <p>This share link may have been revoked or does not exist.</p>
    </div>
  );
}

export function DefaultExpired() {
  return (
    <div data-shareable-expired="">
      <h1>Share expired</h1>
      <p>This share link has expired.</p>
    </div>
  );
}

export function DefaultError() {
  return (
    <div data-shareable-error="">
      <h1>Something went wrong</h1>
      <p>Unable to load this shared content.</p>
    </div>
  );
}
