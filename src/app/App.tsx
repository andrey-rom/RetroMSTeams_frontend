import { useState } from "react";
import { useTeamsContext } from "../shared/hooks/useTeamsContext";
import ConfigPage from "../pages/ConfigPage";
import BoardPage from "../pages/BoardPage";

import "./App.css";
import AppLayout from "./layout/AppLayout.tsx";
import type { SessionConfigPanel } from "../features/session/SessionConfigShell.tsx";

export default function App() {
  const { context, isInTeams, isLoading } = useTeamsContext();
  const [activeSessionId, setActiveSessionId] = useState<null | string>(null);
  const [configPanel, setConfigPanel] = useState<SessionConfigPanel>("config");

  if (isLoading || !context) {
    return (
      <div className="App">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <AppLayout variant={activeSessionId ? "full" : "default"}>
        <div className={activeSessionId ? "app-main-stack" : "app-main-config"}>
          {!isInTeams && <div className="dev-banner">Local dev mode — Teams SDK not available</div>}

          {activeSessionId ? (
            <BoardPage
              sessionId={activeSessionId}
              onBack={() => setActiveSessionId(null)}
              onExitToHistory={() => {
                setActiveSessionId(null);
                setConfigPanel("history");
              }}
            />
          ) : (
            <ConfigPage
              panel={configPanel}
              teamsContext={context}
              onPanelChange={setConfigPanel}
              onSessionOpen={setActiveSessionId}
            />
          )}
        </div>
      </AppLayout>
    </div>
  );
}
