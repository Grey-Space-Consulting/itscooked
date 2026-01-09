import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import AppNav from "./app-nav";
import { ToastProvider } from "./toast";
import styles from "./app-shell.module.css";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <ToastProvider>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <Link href="/app/recipes" className={styles.brand}>
            <span className={styles.brandMark}>IC</span>
            <span>ItsCooked</span>
          </Link>
          <div className={styles.topActions}>
            <Link href="/app/recipes/new" className={styles.primaryButton}>
              New import
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <div className={styles.body}>
          <aside className={styles.sidebar}>
            <AppNav />
          </aside>
          <main className={styles.main}>{children}</main>
        </div>

        <nav className={styles.bottomNav}>
          <AppNav variant="bottom" />
        </nav>
      </div>
    </ToastProvider>
  );
}
