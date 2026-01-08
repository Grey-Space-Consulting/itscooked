import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { AuthProvider } from "./lib/auth";
import { registerServiceWorker } from "./lib/pwa";
import { AppStateProvider } from "./lib/state/AppState";
import "./styles/global.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <AuthProvider>
      <AppStateProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppStateProvider>
    </AuthProvider>
  </StrictMode>
);

registerServiceWorker();
