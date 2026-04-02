import { useState } from "react";
import { useTeamsContext } from "./hooks/useTeamsContext";
import HomePage from "./pages/HomePage";
import BoardPage from "./pages/BoardPage";

import "./App.css";

export default function App() {
  const { isInTeams, isLoading } = useTeamsContext();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="App">
        <p>Loading...</p>
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
