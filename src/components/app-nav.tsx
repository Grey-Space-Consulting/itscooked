"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./app-shell.module.css";

type AppNavProps = {
  variant?: "sidebar" | "bottom";
};

const navItems = [
  { label: "Recipes", href: "/app/recipes" },
  { label: "New import", href: "/app/recipes/new" },
  { label: "Settings", href: "/app/settings" },
];

export default function AppNav({ variant = "sidebar" }: AppNavProps) {
  const pathname = usePathname();
  const path = pathname ?? "";

  const isRecipesActive =
    path === "/app/recipes" ||
    (path.startsWith("/app/recipes/") && !path.startsWith("/app/recipes/new"));
  const isNewActive = path.startsWith("/app/recipes/new");
  const isSettingsActive = path.startsWith("/app/settings");

  const activeMap = new Map([
    ["/app/recipes", isRecipesActive],
    ["/app/recipes/new", isNewActive],
    ["/app/settings", isSettingsActive],
  ]);

  return (
    <div className={variant === "bottom" ? styles.bottomNavInner : styles.nav}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={styles.navLink}
          data-active={activeMap.get(item.href) ? "true" : "false"}
        >
          <span className={styles.navLabel}>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
