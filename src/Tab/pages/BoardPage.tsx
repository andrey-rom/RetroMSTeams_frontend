import { useState, useEffect, useCallback } from "react";
import {
  api,
  type Session,
  type Card,
  type TemplateValue,
} from "../lib/api-client";
import { useSocket } from "../hooks/useSocket";

interface BoardPageProps {
  sessionId: string;
  onBack: () => void;
}

export default function BoardPage({ sessionId, onBack }: BoardPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState("");

  const { on } = useSocket(sessionId);

  const loadData = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        api.getSession(sessionId),
        api.getCards(sessionId),
      ]);
      setSession(s);
      setCards(c);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    on("card:created", (raw: unknown) => {
      const card = raw as Card;
      setCards((prev) => {
        if (prev.some((c) => c.id === card.id)) return prev;
        return [...prev, card];
      });
    });

    on("card:updated", (raw: unknown) => {
      const card = raw as Card;
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    });

    on("card:deleted", (raw: unknown) => {
      const { cardId } = raw as { cardId: string };
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    });

    on("phase:changed", (raw: unknown) => {
      const { phase } = raw as { phase: string };
      setSession((prev) =>
        prev ? { ...prev, currentPhase: phase } : prev,
      );
    });
  }, [on]);

  if (error) {
    return (
      <div className="board-error">
        <p>Error: {error}</p>
        <button onClick={onBack}>Back</button>
      </div>
    );
  }

  if (!session) {
    return <p>Loading board...</p>;
  }

  const columns = session.templateType.values;

  return (
    <div className="board-page">
      <div className="board-header">
        <button className="back-btn" onClick={onBack}>
          &larr; Back
        </button>
        <h2>{session.title}</h2>
        <span className="phase-badge">{session.currentPhase}</span>
      </div>

      <div
        className="board-columns"
        style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
      >
        {columns.map((col) => (
          <Column
            key={col.value}
            column={col}
            cards={cards.filter((c) => c.columnKey === col.value)}
            sessionId={sessionId}
            disabled={session.currentPhase !== "collect"}
          />
        ))}
      </div>
    </div>
  );
}

interface ColumnProps {
  column: TemplateValue;
  cards: Card[];
  sessionId: string;
  disabled: boolean;
}

function Column({
  column,
  cards,
  sessionId,
  disabled,
}: ColumnProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.createCard(sessionId, column.value, text.trim());
      setText("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="column">
      <div className="column-header" style={{ backgroundColor: column.color }}>
        <h3>{column.label}</h3>
        <span className="card-count">{cards.length}</span>
      </div>

      <div className="column-cards">
        {cards.map((card) => (
          <div key={card.id} className="card">
            <p>{card.content}</p>
          </div>
        ))}
      </div>

      {!disabled && (
        <form className="card-form" onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Add a "${column.label}" card...`}
            maxLength={500}
            rows={2}
          />
          <button type="submit" disabled={!text.trim() || submitting}>
            {submitting ? "..." : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}
