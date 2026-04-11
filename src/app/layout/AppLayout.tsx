import type { PropsWithChildren } from "react";
import styles from "./AppLayout.module.css";

interface AppLayoutProps extends PropsWithChildren {
  variant?: AppLayoutVariant;
}

type AppLayoutVariant = "default" | "full";

export default function AppLayout({ children, variant = "default" }: AppLayoutProps) {
  const isFull = variant === "full";

  return (
    <div className={styles.appShell}>
      {!isFull && (
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
            <button className={styles.btnText} type="button">
              <i className="fas fa-clock-rotate-left" /> History
            </button>
          </div>
        </header>
      )}

      <main className={isFull ? styles.contentFull : styles.content}>{children}</main>
    </div>
  );
}
