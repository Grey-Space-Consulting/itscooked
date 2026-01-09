import styles from "./loading.module.css";

export default function RecipesLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.skeletonCard}>
        <div className={`${styles.skeletonLine} ${styles.medium}`} />
        <div className={`${styles.skeletonLine} ${styles.short}`} />
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className={styles.skeletonCard}>
          <div className={`${styles.skeletonLine} ${styles.long}`} />
          <div className={`${styles.skeletonLine} ${styles.medium}`} />
          <div className={`${styles.skeletonLine} ${styles.short}`} />
        </div>
      ))}
    </div>
  );
}
