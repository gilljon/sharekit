import type { ShareableAuthProvider, ShareableUser } from "@sharekit/core";
import { checkOwnerIdHeader } from "@sharekit/core";

interface BetterAuthInstance {
  api: {
    getSession: (opts: {
      headers: Headers;
    }) => Promise<{ user?: { id: string; name?: string } } | null>;
  };
}

/**
 * Creates a ShareableAuthProvider backed by Better Auth.
 *
 * ```ts
 * import { betterAuthProvider } from '@sharekit/better-auth'
 * import { auth } from './auth'
 *
 * const authAdapter = betterAuthProvider(auth)
 * ```
 */
export function betterAuthProvider(auth: BetterAuthInstance): ShareableAuthProvider {
  return {
    async getUser(request: Request): Promise<ShareableUser | null> {
      const headerUser = checkOwnerIdHeader(request);
      if (headerUser) return headerUser;

      try {
        const session = await auth.api.getSession({
          headers: request.headers instanceof Headers ? request.headers : new Headers(),
        });

        if (!session?.user) return null;

        return {
          id: session.user.id,
          name: session.user.name,
        };
      } catch {
        return null;
      }
    },
  };
}
