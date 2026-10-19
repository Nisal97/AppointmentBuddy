import type { ReactNode } from "react";
import { AppHeader } from "../app-header";

/**
 * Layout for signed-in pages (/home, /profile, /shop — URLs unchanged).
 * Provides the shared app header with nav, theme toggle, and logout.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <AppHeader />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
