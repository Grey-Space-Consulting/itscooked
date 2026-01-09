import styles from "../loading.module.css";

export default function RecipeDetailLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.skeletonCard}>
        <div className={`${styles.skeletonLine} ${styles.long}`} />
        <div className={`${styles.skeletonLine} ${styles.short}`} />
      </div>
      <div className={styles.skeletonCard}>
        <div className={`${styles.skeletonLine} ${styles.medium}`} />
        <div className={`${styles.skeletonLine} ${styles.long}`} />
        <div className={`${styles.skeletonLine} ${styles.long}`} />
      </div>
    </div>
  );
}
