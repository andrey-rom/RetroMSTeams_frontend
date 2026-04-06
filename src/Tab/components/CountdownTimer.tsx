import { useState, useEffect } from "react";

interface CountdownTimerProps {
  expiresAt: string | null;
}

export default function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }

    const target = new Date(expiresAt).getTime();

    function tick() {
      const diff = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemaining(diff);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining === null) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const urgent = remaining <= 10;

  return (
    <span className={`countdown-timer${urgent ? " countdown-urgent" : ""}`}>
      {remaining === 0 ? "Time's up!" : `⏱ ${display}`}
    </span>
  );
}
