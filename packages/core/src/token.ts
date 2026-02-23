import { randomUUID } from "node:crypto";

const MIN_TOKEN_LENGTH = 8;
const DEFAULT_TOKEN_LENGTH = 12;

export function generateToken(length: number = DEFAULT_TOKEN_LENGTH): string {
  const effectiveLength = Math.max(length, MIN_TOKEN_LENGTH);
  let token = "";
  while (token.length < effectiveLength) {
    token += randomUUID().replace(/-/g, "");
  }
  return token.slice(0, effectiveLength);
}

export function validateToken(token: string): boolean {
  return (
    typeof token === "string" && token.length >= MIN_TOKEN_LENGTH && /^[a-f0-9]+$/i.test(token)
  );
}
