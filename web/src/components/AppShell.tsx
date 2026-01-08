"use client";

import type { ReactNode } from "react";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";
import { useAppState } from "../lib/state/AppState";
import { NavBar } from "./NavBar";

type AppShellProps = {
  children: ReactNode;
  authSlot?: ReactNode;
};

export function AppShell({ children, authSlot }: AppShellProps) {
  const isOnline = useOnlineStatus();
  const { activeKitchen, lastSyncAt } = useAppState();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <div className="brand">ItsCooked</div>
            <div className="brand-sub">Kitchen: {activeKitchen}</div>
          </div>
          <div className="app-header-meta">
            <div className="status-pill" aria-live="polite">
              <span
                className={isOnline ? "status-dot" : "status-dot is-offline"}
              />
              {isOnline ? "Online" : "Offline"}
              <span>
                {lastSyncAt ? `Last sync ${lastSyncAt}` : "Not synced"}
              </span>
            </div>
            {authSlot && <div className="auth-actions">{authSlot}</div>}
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="container">
          {children}
        </div>
      </main>
      <NavBar />
    </div>
  );
}
