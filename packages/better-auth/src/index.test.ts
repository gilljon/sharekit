import { describe, expect, it, vi } from "vitest";
import { betterAuthProvider } from "./index.js";

describe("betterAuthProvider", () => {
  it("returns user from session", async () => {
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: "user-123", name: "Test User" },
        }),
      },
    };

    const provider = betterAuthProvider(auth as never);
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "user-123", name: "Test User" });
    expect(auth.api.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  it("returns user from x-shareable-owner-id header", async () => {
    const auth = {
      api: {
        getSession: vi.fn(),
      },
    };

    const provider = betterAuthProvider(auth as never);
    const request = new Request("https://example.com", {
      headers: new Headers({ "x-shareable-owner-id": "owner-456" }),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "owner-456" });
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it("returns null when no session", async () => {
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    };

    const provider = betterAuthProvider(auth as never);
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
  });

  it("returns null when session has no user", async () => {
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue({}),
      },
    };

    const provider = betterAuthProvider(auth as never);
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
  });

  it("returns null when getSession throws", async () => {
    const auth = {
      api: {
        getSession: vi.fn().mockRejectedValue(new Error("Auth error")),
      },
    };

    const provider = betterAuthProvider(auth as never);
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
  });
});
