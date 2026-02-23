import { createShareable } from "@sharekit/core";
import { nextAuthProvider } from "@sharekit/next-auth";
import { prismaStorage } from "@sharekit/prisma";

declare const prisma: {
  shareableShare: {
    create: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
};
declare const auth: () => Promise<{ user?: { id?: string; name?: string } } | null>;

export const shareable = createShareable({
  storage: prismaStorage(prisma as any),
  auth: nextAuthProvider({ auth }),
  baseUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  defaults: {
    tokenLength: 12,
    ownerDisplay: "first-name",
    trackViews: true,
  },
});
