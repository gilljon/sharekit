import { describe, expect, it, vi } from "vitest";
import { nextAuthProvider } from "./index.js";

describe("nextAuthProvider", () => {
  it("v5: uses auth() function", async () => {
    const auth = vi.fn().mockResolvedValue({
      user: { id: "user-123", name: "Test User", email: "test@example.com" },
    });

    const provider = nextAuthProvider({ auth });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "user-123", name: "Test User" });
    expect(auth).toHaveBeenCalled();
  });

  it("v4: uses getServerSession()", async () => {
    const getServerSession = vi.fn().mockResolvedValue({
      user: { id: "user-456", name: "V4 User", email: "v4@example.com" },
    });
    const authOptions = { providers: [] };

    const provider = nextAuthProvider({ getServerSession, authOptions });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "user-456", name: "V4 User" });
    expect(getServerSession).toHaveBeenCalledWith(authOptions);
  });

  it("returns user from x-shareable-owner-id header", async () => {
    const auth = vi.fn();

    const provider = nextAuthProvider({ auth });
    const request = new Request("https://example.com", {
      headers: new Headers({ "x-shareable-owner-id": "owner-789" }),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "owner-789" });
    expect(auth).not.toHaveBeenCalled();
  });

  it("returns null when no session", async () => {
    const auth = vi.fn().mockResolvedValue(null);

    const provider = nextAuthProvider({ auth });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
  });

  it("returns null when session has no user", async () => {
    const auth = vi.fn().mockResolvedValue({});

    const provider = nextAuthProvider({ auth });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
  });

  it("returns null when neither auth nor getServerSession provided", async () => {
    const provider = nextAuthProvider({});
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
  });

  it("uses email as id when idField is email", async () => {
    const auth = vi.fn().mockResolvedValue({
      user: { id: "user-123", name: "Test", email: "test@example.com" },
    });

    const provider = nextAuthProvider({ auth, idField: "email" });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toEqual({ id: "test@example.com", name: "Test" });
  });

  it("returns null when auth throws", async () => {
    const auth = vi.fn().mockRejectedValue(new Error("Auth error"));

    const provider = nextAuthProvider({ auth });
    const request = new Request("https://example.com", {
      headers: new Headers(),
    });

    const user = await provider.getUser(request);

    expect(user).toBeNull();
  });
});
