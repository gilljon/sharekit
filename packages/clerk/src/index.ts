import type { ShareableAuthProvider, ShareableUser } from "@sharekit/core";

interface ClerkAuthFn {
  (): Promise<{ userId: string | null }>;
}

interface ClerkUserFn {
  (): Promise<{ id: string; firstName: string | null; lastName: string | null } | null>;
}

interface ClerkProviderOptions {
  /**
   * The `auth()` function from `@clerk/nextjs/server`.
   * Returns `{ userId }` for the current request.
   */
  auth: ClerkAuthFn;
  /**
   * The `currentUser()` function from `@clerk/nextjs/server`.
   * Resolves the full user object (for name display).
   */
  currentUser: ClerkUserFn;
}

/**
 * Creates a ShareableAuthProvider backed by Clerk.
 *
 * ```ts
 * import { clerkProvider } from '@sharekit/clerk'
 * import { auth, currentUser } from '@clerk/nextjs/server'
 *
 * const authAdapter = clerkProvider({ auth, currentUser })
 * ```
 */
export function clerkProvider(options: ClerkProviderOptions): ShareableAuthProvider {
  return {
    async getUser(request: Request): Promise<ShareableUser | null> {
      const ownerIdHeader = request.headers.get("x-shareable-owner-id");
      if (ownerIdHeader) {
        return { id: ownerIdHeader };
      }

      try {
        const { userId } = await options.auth();
        if (!userId) return null;

        const user = await options.currentUser();
        return {
          id: userId,
          name: user?.firstName ?? undefined,
        };
      } catch {
        return null;
      }
    },
  };
}
