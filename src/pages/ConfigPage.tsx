import SessionConfig from "../features/session/SessionConfig.tsx";

interface ConfigPageProps {
  onSessionOpen: (sessionId: string) => void;
}

export default function ConfigPage({ onSessionOpen }: ConfigPageProps) {
  return <SessionConfig onSessionOpen={onSessionOpen} />;
}
