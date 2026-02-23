import { describe, expect, it, vi } from "vitest";
import { clerkProvider } from "./index.js";

describe("clerkProvider", () => {
  it("returns user with firstName", async () => {
    const auth = vi.fn().mockResolvedValue({ userId: "user-123" });
    const currentUser = vi.fn().mockResolvedValue({
      id: "user-123",
      firstName: "Jane",
      lastName: "Doe",
    });

    const provider = clerkProvider({ auth, currentUser });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "user-123", name: "Jane" });
    expect(auth).toHaveBeenCalled();
    expect(currentUser).toHaveBeenCalled();
  });

  it("returns user from x-shareable-owner-id header", async () => {
    const auth = vi.fn();
    const currentUser = vi.fn();

    const provider = clerkProvider({ auth, currentUser });
    const request = new Request("https://example.com", {
      headers: new Headers({ "x-shareable-owner-id": "owner-456" }),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "owner-456" });
    expect(auth).not.toHaveBeenCalled();
    expect(currentUser).not.toHaveBeenCalled();
  });

  it("returns null when no auth", async () => {
    const auth = vi.fn().mockResolvedValue({ userId: null });
    const currentUser = vi.fn();

    const provider = clerkProvider({ auth, currentUser });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
    expect(currentUser).not.toHaveBeenCalled();
  });

  it("returns user with undefined name when currentUser returns null", async () => {
    const auth = vi.fn().mockResolvedValue({ userId: "user-123" });
    const currentUser = vi.fn().mockResolvedValue(null);

    const provider = clerkProvider({ auth, currentUser });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "user-123", name: undefined });
  });

  it("returns null when auth throws", async () => {
    const auth = vi.fn().mockRejectedValue(new Error("Auth error"));
    const currentUser = vi.fn();

    const provider = clerkProvider({ auth, currentUser });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
  });
});
