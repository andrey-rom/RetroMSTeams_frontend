import SessionConfig from "../features/session/SessionConfig";
import SessionConfigShell, { type SessionConfigPanel } from "../features/session/SessionConfigShell";
import SessionHistory from "../features/session/SessionHistory.tsx";
import type * as microsoftTeams from "@microsoft/teams-js";

interface ConfigPageProps {
  onPanelChange: (panel: SessionConfigPanel) => void;
  onSessionOpen: (sessionId: string) => void;
  panel: SessionConfigPanel;
  teamsContext: microsoftTeams.app.Context;
}

export default function ConfigPage({ onPanelChange, onSessionOpen, panel, teamsContext }: ConfigPageProps) {
  return (
    <SessionConfigShell
      panel={panel}
      onBackToConfig={() => {
        onPanelChange("config");
      }}
      onOpenHistory={() => {
        onPanelChange("history");
      }}
    >
      {panel === "config" ? (
        <SessionConfig teamsContext={teamsContext} onSessionOpen={onSessionOpen} />
      ) : (
        <SessionHistory onSessionOpen={onSessionOpen} channelId={teamsContext.channel?.id} />
      )}
    </SessionConfigShell>
  );
}
