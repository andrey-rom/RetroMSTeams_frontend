import { useState, useEffect } from "react";
import { api, type Template, type Session } from "../lib/api-client";

interface HomePageProps {
  onSessionOpen: (sessionId: string) => void;
}

export default function HomePage({ onSessionOpen }: HomePageProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [title, setTitle] = useState("");
  const [collectTimer, setCollectTimer] = useState("");
  const [voteTimer, setVoteTimer] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getTemplates().then(setTemplates).catch(() => {
      setError(`Cannot reach backend at ${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}`);
    });
    api.getSessions().then(setSessions).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !title.trim() || creating) return;

    setCreating(true);
    try {
      const collectMin = collectTimer ? parseInt(collectTimer, 10) : undefined;
      const voteMin = voteTimer ? parseInt(voteTimer, 10) : undefined;
      const session = await api.createSession(title.trim(), selected.id, {
        collectTimerSeconds: collectMin && collectMin >= 1 ? collectMin * 60 : undefined,
        voteTimerSeconds: voteMin && voteMin >= 1 ? voteMin * 60 : undefined,
      });
      onSessionOpen(session.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="home-page">
      <h1>Retro Bot</h1>
      <p>Start a new retrospective or join an existing one.</p>

      {error && <p style={{ color: "#E74856" }}>{error}</p>}

      <h3 style={{ marginBottom: "0.5rem" }}>Choose a template</h3>
      <div className="template-grid">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            className={`template-card${selected?.id === tpl.id ? " selected" : ""}`}
            onClick={() => setSelected(tpl)}
          >
            <h3>{tpl.name}</h3>
            <p>{tpl.description}</p>
            <div className="template-columns">
              {tpl.values.map((v) => (
                <span
                  key={v.value}
                  className="template-col-chip"
                  style={{ backgroundColor: v.color }}
                >
                  {v.label}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <form className="create-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Session title, e.g. Sprint 12 Retro"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            autoFocus
          />
          <div className="timer-config-row">
            <div className="timer-config-field">
              <label>Collect timer (min)</label>
              <input
                type="number"
                placeholder="off"
                min={1}
                max={60}
                value={collectTimer}
                onChange={(e) => setCollectTimer(e.target.value)}
              />
            </div>
            <div className="timer-config-field">
              <label>Vote timer (min)</label>
              <input
                type="number"
                placeholder="off"
                min={1}
                max={60}
                value={voteTimer}
                onChange={(e) => setVoteTimer(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" disabled={!title.trim() || creating}>
            {creating ? "Creating..." : "Start Retrospective"}
          </button>
        </form>
      )}

      {sessions.length > 0 && (
        <div className="sessions-list">
          <h3>Recent sessions</h3>
          {sessions.map((s) => (
            <div
              key={s.id}
              className="session-item"
              onClick={() => onSessionOpen(s.id)}
            >
              <span className="title">{s.title}</span>
              <span className="meta">
                {s.templateType.code} &middot; {s.currentPhase}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
