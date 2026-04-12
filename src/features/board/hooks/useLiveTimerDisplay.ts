import { useEffect, useState } from "react";

/** MM:SS from `expiresAt`, or `--:--` when null / expired. */
export function useLiveTimerDisplay(expiresAt: null | string): string {
  const [display, setDisplay] = useState("--:--");

  useEffect(() => {
    if (!expiresAt) {
      setDisplay("--:--");

      return;
    }

    const target = new Date(expiresAt).getTime();

    if (Number.isNaN(target)) {
      setDisplay("--:--");

      return;
    }

    function tick() {
      const diff = Math.max(0, Math.round((target - Date.now()) / 1000));
      const m = Math.floor(diff / 60);
      const s = diff % 60;

      setDisplay(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }

    tick();
    const id = window.setInterval(tick, 1000);

    return () => window.clearInterval(id);
  }, [expiresAt]);

  return display;
}
