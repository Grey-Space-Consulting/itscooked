import Link from "next/link";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>IC</span>
          <span>ItsCooked</span>
        </div>
        <nav className={styles.nav}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className={styles.ghostButton}>Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>Social Recipe Saver</span>
            <h1>
              Capture recipes from Instagram and TikTok, then cook without the
              chaos.
            </h1>
            <p>
              Paste a link, pull the ingredients, and generate a grocery list you
              can share.
            </p>
            <div className={styles.actions}>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className={styles.primaryButton}>Get started</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <button className={styles.primaryButton} disabled>
                  New import (coming soon)
                </button>
              </SignedIn>
              <Link href="#recipes" className={styles.secondaryButton}>
                Preview saved list
              </Link>
            </div>
          </div>

          <div className={styles.heroPanel}>
            <div className={styles.panelHeader}>
              <span>Latest import</span>
              <span className={styles.badge}>OCR ready</span>
            </div>
            <div className={styles.recipeCard}>
              <div className={styles.recipeTitle}>Spicy Tomato Rigatoni</div>
              <div className={styles.recipeMeta}>
                <span className={styles.metaPill}>Instagram</span>
                <span className={styles.metaPill}>7 ingredients</span>
                <span className={styles.metaPill}>20 min</span>
              </div>
              <div className={styles.recipeList}>
                <span>- Rigatoni, tomato paste, garlic</span>
                <span>- Chili flakes, basil, olive oil</span>
                <span>- Finish with parmesan + lemon zest</span>
              </div>
            </div>
            <div className={styles.recipeCard}>
              <div className={styles.recipeTitle}>Grocery snapshot</div>
              <div className={styles.recipeList}>
                <span>- Pantry staples grouped automatically</span>
                <span>- Tap-to-check for store runs</span>
              </div>
            </div>
          </div>
        </section>

        <section id="recipes" className={styles.listPanel}>
          <div className={styles.listHeader}>
            <div>
              <h2>Your recipes</h2>
              <p>Private to your account, ready for cleanup.</p>
            </div>
            <SignedIn>
              <button className={styles.secondaryButton} disabled>
                New recipe
              </button>
            </SignedIn>
          </div>

          <SignedIn>
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>No recipes yet.</div>
              <p>Drop in an Instagram or TikTok link to build your first list.</p>
              <div className={styles.emptyActions}>
                <button className={styles.primaryButton} disabled>
                  Import a recipe
                </button>
                <button className={styles.ghostButton} disabled>
                  Paste from clipboard
                </button>
              </div>
            </div>
          </SignedIn>

          <SignedOut>
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>
                Sign in to start saving recipes.
              </div>
              <p>
                We'll keep your extracts private and tie every recipe to your
                account.
              </p>
              <div className={styles.emptyActions}>
                <SignInButton mode="modal">
                  <button className={styles.primaryButton}>
                    Sign in to continue
                  </button>
                </SignInButton>
                <Link href="/sign-up" className={styles.secondaryButton}>
                  Create an account
                </Link>
              </div>
            </div>
          </SignedOut>
        </section>
      </main>
    </div>
  );
}
