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
      <main className={isFull ? styles.contentFull : styles.contentConfig}>{children}</main>
    </div>
  );
}
