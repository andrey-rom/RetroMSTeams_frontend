import { useState } from "react";
import SessionConfig from "../features/session/SessionConfig";
import SessionConfigShell, { type SessionConfigPanel } from "../features/session/SessionConfigShell";
import SessionHistory from "../features/session/SessionHistory.tsx";

interface ConfigPageProps {
  onSessionOpen: (sessionId: string) => void;
}

export default function ConfigPage({ onSessionOpen }: ConfigPageProps) {
  const [panel, setPanel] = useState<SessionConfigPanel>("config");

  return (
    <SessionConfigShell
      panel={panel}
      onBackToConfig={() => {
        setPanel("config");
      }}
      onOpenHistory={() => {
        setPanel("history");
      }}
    >
      {panel === "config" ? (
        <SessionConfig onSessionOpen={onSessionOpen} />
      ) : (
        <SessionHistory onSessionOpen={onSessionOpen} />
      )}
    </SessionConfigShell>
  );
}
