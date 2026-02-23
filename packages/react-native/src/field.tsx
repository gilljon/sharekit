import type { ReactNode } from "react";
import { useShareableContext } from "./context.js";

export interface FieldProps {
  name: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally renders children based on field visibility.
 *
 * - In authenticated view (isShared=false): always renders children
 * - In shared view (isShared=true): renders children only if the field is visible
 */
export function Field({ name, fallback = null, children }: FieldProps) {
  const ctx = useShareableContext();

  if (!ctx.isShared) {
    return <>{children}</>;
  }

  if (ctx.visibleFields[name]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
