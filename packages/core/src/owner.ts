import type { OwnerDisplay } from "./types.js";

export function formatOwnerName(name: string | undefined, display: OwnerDisplay): string {
  if (!name || display === "anonymous") return "Someone";
  if (display === "first-name") return name.split(" ")[0] ?? "Someone";
  return name;
}
