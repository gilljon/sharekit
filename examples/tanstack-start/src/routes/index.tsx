import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div style={{ padding: 48, maxWidth: 640, margin: "0 auto" }}>
      <h1>ShareKit TanStack Start Example</h1>
      <p>
        <Link to="/profile">View profile</Link> to see the share integration.
      </p>
    </div>
  );
}
