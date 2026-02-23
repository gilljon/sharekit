import type { ShareableAuthProvider, ShareableUser } from "@sharekit/core";
import { checkOwnerIdHeader } from "@sharekit/core";

// ---------------------------------------------------------------------------
// NextAuth v5 (Auth.js) types
// ---------------------------------------------------------------------------

type AuthJsInstance = () => Promise<AuthJsSession | null>;

interface AuthJsSession {
  user?: { id?: string; name?: string; email?: string };
}

// ---------------------------------------------------------------------------
// NextAuth v4 types
// ---------------------------------------------------------------------------

interface NextAuthV4Options {
  providers: unknown[];
  [key: string]: unknown;
}

type GetServerSessionFn = (
  options: NextAuthV4Options,
) => Promise<{ user?: { id?: string; name?: string; email?: string } } | null>;

// ---------------------------------------------------------------------------
// Provider overloads
// ---------------------------------------------------------------------------

interface NextAuthProviderOptions {
  /**
   * For NextAuth v5 (Auth.js): pass the `auth` function exported from your auth config.
   * For NextAuth v4: pass `{ getServerSession, authOptions }`.
   */
  auth?: AuthJsInstance;
  getServerSession?: GetServerSessionFn;
  authOptions?: NextAuthV4Options;
  /** Field to use as the user ID. Defaults to "id", falls back to "email". */
  idField?: "id" | "email";
}

/**
 * Creates a ShareableAuthProvider backed by NextAuth.js (v4 or v5).
 *
 * NextAuth v5 (Auth.js):
 * ```ts
 * import { nextAuthProvider } from '@sharekit/next-auth'
 * import { auth } from './auth'
 * const authAdapter = nextAuthProvider({ auth })
 * ```
 *
 * NextAuth v4:
 * ```ts
 * import { nextAuthProvider } from '@sharekit/next-auth'
 * import { getServerSession } from 'next-auth'
 * import { authOptions } from './auth'
 * const authAdapter = nextAuthProvider({ getServerSession, authOptions })
 * ```
 */
export function nextAuthProvider(options: NextAuthProviderOptions): ShareableAuthProvider {
  const idField = options.idField ?? "id";

  return {
    async getUser(request: Request): Promise<ShareableUser | null> {
      const headerUser = checkOwnerIdHeader(request);
      if (headerUser) return headerUser;

      try {
        let session: { user?: { id?: string; name?: string; email?: string } } | null = null;

        if (options.auth) {
          session = await options.auth();
        } else if (options.getServerSession && options.authOptions) {
          session = await options.getServerSession(options.authOptions);
        } else {
          return null;
        }

        if (!session?.user) return null;

        const userId =
          idField === "email" ? session.user.email : (session.user.id ?? session.user.email);

        if (!userId) return null;

        return {
          id: userId,
          name: session.user.name,
        };
      } catch {
        return null;
      }
    },
  };
}
