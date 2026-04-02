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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getTemplates().then(setTemplates).catch(() => {
      setError("Cannot reach backend — is it running on localhost:3000?");
    });
    api.getSessions().then(setSessions).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !title.trim() || creating) return;

    setCreating(true);
    try {
      const session = await api.createSession(title.trim(), selected.id);
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
