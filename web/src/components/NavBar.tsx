"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "../lib/utils";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/recipes", label: "Recipes" },
  { to: "/grocery", label: "Grocery" },
  { to: "/settings", label: "Settings" }
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        {navItems.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className={cx(
              "nav-link",
              item.to === "/"
                ? pathname === "/" && "active"
                : pathname.startsWith(item.to) && "active"
            )}
          >
            <span className="nav-icon" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
