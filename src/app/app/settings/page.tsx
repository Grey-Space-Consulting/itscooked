import styles from "./settings.module.css";

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <div>
          <h1>Settings</h1>
          <p>Manage your account and import preferences.</p>
        </div>
      </section>

      <section className={styles.card}>
        <h2>Import preferences</h2>
        <p>
          Control how we extract recipe text from Instagram and TikTok links. OCR
          settings arrive in the next phase.
        </p>
        <div className={styles.placeholder}>Extraction controls coming soon.</div>
      </section>

      <section className={styles.card}>
        <h2>Install the app</h2>
        <p>
          Add ItsCooked to your home screen for a faster cooking flow. Guidance
          will appear here during the PWA polish phase.
        </p>
        <div className={styles.placeholder}>PWA install tips coming soon.</div>
      </section>
    </div>
  );
}
