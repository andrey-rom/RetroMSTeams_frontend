import { useState } from "react";
import SessionConfig from "../features/session/SessionConfig";
import SessionConfigShell, { type SessionConfigPanel } from "../features/session/SessionConfigShell";
import SessionHistory from "../features/session/SessionHistory.tsx";
import type * as microsoftTeams from "@microsoft/teams-js";

interface ConfigPageProps {
  onSessionOpen: (sessionId: string) => void;
  teamsContext: microsoftTeams.app.Context;
}

export default function ConfigPage({ onSessionOpen, teamsContext }: ConfigPageProps) {
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
        <SessionConfig teamsContext={teamsContext} onSessionOpen={onSessionOpen} />
      ) : (
        <SessionHistory onSessionOpen={onSessionOpen} />
      )}
    </SessionConfigShell>
  );
}
