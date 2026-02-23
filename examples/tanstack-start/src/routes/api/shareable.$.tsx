import { createTanStackHandler } from "@sharekit/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { shareable } from "../../lib/shareable.js";

export const Route = createFileRoute("/api/shareable/$")({
  server: {
    handlers: createTanStackHandler(shareable),
  },
});
