import { useState } from "react";
import { useTeamsContext } from "./hooks/useTeamsContext";
import { useBackendAuth } from "./hooks/useBackendAuth";
import HomePage from "./pages/HomePage";
import BoardPage from "./pages/BoardPage";

import "./App.css";

export default function App() {
  const { context, isInTeams, isLoading } = useTeamsContext();
  const auth = useBackendAuth(context, isInTeams, isLoading);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (isLoading || auth.isLoading) {
    return (
      <div className="App">
        <p>Loading Retro Bot...</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="App">
        <div className="auth-error-card">
          <h2>Authentication failed</h2>
          <p>{auth.error}</p>
          <p>
            Check that the backend is running and Azure AD values are configured
            for Teams SSO.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!isInTeams && (
        <div className="dev-banner">
          Local dev mode — Teams SDK not available
        </div>
      )}
      <div className="context-info">
        <p>Signed in as {auth.userName || "Anonymous"}</p>
      </div>

      {activeSessionId ? (
        <BoardPage
          sessionId={activeSessionId}
          onBack={() => setActiveSessionId(null)}
        />
      ) : (
        <HomePage onSessionOpen={setActiveSessionId} />
      )}
    </div>
  );
}
