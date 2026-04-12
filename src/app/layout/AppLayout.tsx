import type { PropsWithChildren } from "react";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>
            <div className={styles.headerLogoIcon}>
              <i className="fas fa-rotate" />
            </div>
            <span className={styles.headerTitle}>Retro-Bot</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.btnText}>
            <i className="fas fa-clock-rotate-left" /> History
          </button>
        </div>
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
