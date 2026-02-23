import type { ShareableUser } from "./types.js";

/**
 * Checks for the internal `x-shareable-owner-id` header used by the core
 * handler to look up owner display names. All auth adapters should call
 * this first and return early if the header is present.
 */
export function checkOwnerIdHeader(request: Request): ShareableUser | null {
  const id = request.headers.get("x-shareable-owner-id");
  return id ? { id } : null;
}
