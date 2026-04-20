import type { PropsWithChildren } from "react";

import styles from "./SessionConfigShell.module.css";

/** `config` = TMP/03 session setup; `history` = session list */
export type SessionConfigPanel = "config" | "history";

interface SessionConfigShellProps extends PropsWithChildren {
  onBackToConfig: () => void;
  onOpenHistory: () => void;
  panel: SessionConfigPanel;
}

export default function SessionConfigShell({
  children,
  onBackToConfig,
  onOpenHistory,
  panel,
}: SessionConfigShellProps) {
  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>
            <div aria-hidden className={styles.headerLogoIcon}>
              <i className="fas fa-rotate" />
            </div>
            <span className={styles.headerTitle}>Retro-Bot</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          {panel === "config" ? (
            <button className={styles.btnText} type="button" onClick={onOpenHistory}>
              <i className="fas fa-clock-rotate-left" /> History
            </button>
          ) : (
            <button className={styles.btnText} type="button" onClick={onBackToConfig}>
              <i className="fas fa-arrow-left" /> Setup
            </button>
          )}
        </div>
      </header>

      <div className={styles.mainArea}>{children}</div>
    </div>
  );
}
