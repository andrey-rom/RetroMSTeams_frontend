import styles from "./Loader.module.css";

export default function Loader() {
  return (
    <div aria-live="polite" className={styles.loader} role="status">
      <span aria-hidden className={styles.circle} />
      <span>Loading...</span>
    </div>
  );
}
