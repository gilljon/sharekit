import { describe, expect, it } from "vitest";
import { generateToken, validateToken } from "./token.js";

describe("generateToken", () => {
  it("generates a token of the specified length", () => {
    const token = generateToken(16);
    expect(token).toHaveLength(16);
  });

  it("defaults to 12 characters", () => {
    const token = generateToken();
    expect(token).toHaveLength(12);
  });

  it("enforces minimum length of 8", () => {
    const token = generateToken(4);
    expect(token).toHaveLength(8);
  });

  it("generates hex characters only", () => {
    const token = generateToken(32);
    expect(token).toMatch(/^[a-f0-9]+$/i);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("validateToken", () => {
  it("accepts valid tokens", () => {
    expect(validateToken("a3f8b2c1d4e5")).toBe(true);
    expect(validateToken("abcdef123456")).toBe(true);
  });

  it("rejects short tokens", () => {
    expect(validateToken("abc")).toBe(false);
    expect(validateToken("1234567")).toBe(false);
  });

  it("rejects empty and non-string values", () => {
    expect(validateToken("")).toBe(false);
    expect(validateToken(null as unknown as string)).toBe(false);
    expect(validateToken(undefined as unknown as string)).toBe(false);
  });

  it("rejects tokens with invalid characters", () => {
    expect(validateToken("abcdef12345!")).toBe(false);
    expect(validateToken("hello world!")).toBe(false);
  });
});
