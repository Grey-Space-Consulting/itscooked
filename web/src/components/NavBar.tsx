import { NavLink } from "react-router";
import { cx } from "../lib/utils";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/recipes", label: "Recipes" },
  { to: "/grocery", label: "Grocery" },
  { to: "/settings", label: "Settings" }
];

export function NavBar() {
  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cx("nav-link", isActive && "active")
            }
          >
            <span className="nav-icon" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
