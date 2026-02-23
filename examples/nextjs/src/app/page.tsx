import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ padding: 48, maxWidth: 640, margin: "0 auto" }}>
      <h1>ShareKit Next.js Example</h1>
      <p>
        <Link href="/blog/1">View blog post</Link> to see the share integration.
      </p>
    </div>
  );
}
