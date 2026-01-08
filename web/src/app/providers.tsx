"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { registerServiceWorker } from "../lib/pwa";
import { AppStateProvider } from "../lib/state/AppState";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <AppStateProvider>{children}</AppStateProvider>;
}
