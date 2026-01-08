import type { Metadata, Viewport } from "next";
import {
  ClerkProvider
} from "@clerk/nextjs";
import { AppShell } from "../components/AppShell";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ItsCooked",
  description: "ItsCooked PWA for recipes and cooking.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ItsCooked"
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16120F"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Providers>
            <AppShell>
              {children}
            </AppShell>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
