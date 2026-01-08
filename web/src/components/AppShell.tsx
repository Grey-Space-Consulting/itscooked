import { Outlet } from "react-router";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";
import { useAppState } from "../lib/state/AppState";
import { NavBar } from "./NavBar";

export function AppShell() {
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
          <div className="status-pill" aria-live="polite">
            <span
              className={isOnline ? "status-dot" : "status-dot is-offline"}
            />
            {isOnline ? "Online" : "Offline"}
            <span>
              {lastSyncAt ? `Last sync ${lastSyncAt}` : "Not synced"}
            </span>
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <NavBar />
    </div>
  );
}
