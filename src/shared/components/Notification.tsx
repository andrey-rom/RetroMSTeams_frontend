import { useEffect, useState } from "react";

import styles from "./Notification.module.css";

const EXIT_DURATION_MS = 220;

export interface NotificationProps {
  message: string;
  onClose: () => void;
  type: "error" | "success";
  durationMs?: number;
}

export default function Notification({ durationMs = 3000, message, onClose, type }: NotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, durationMs);

    const closeTimer = window.setTimeout(() => {
      onClose();
    }, durationMs + EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(closeTimer);
    };
  }, [durationMs, onClose]);

  const iconClass = type === "success" ? styles.successIcon : styles.errorIcon;
  const barClass = type === "success" ? styles.successBar : styles.errorBar;
  const messageClass = type === "success" ? styles.successMessage : styles.errorMessage;

  return (
    <div
      aria-live="polite"
      className={`${styles.notification} ${isExiting ? styles.exit : styles.enter}`}
      role="status"
    >
      <div className={styles.content}>
        <div aria-hidden className={`${styles.iconWrap} ${iconClass}`}>
          <i className={type === "success" ? "fas fa-check" : "fas fa-xmark"} />
        </div>
        <div className={`${styles.message} ${messageClass}`}>{message}</div>
      </div>
      <div className={styles.progressTrack}>
        <div className={`${styles.progressBar} ${barClass}`} style={{ animationDuration: `${durationMs}ms` }} />
      </div>
    </div>
  );
}
