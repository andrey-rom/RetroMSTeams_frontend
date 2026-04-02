import { useState, useEffect, useCallback } from "react";
import {
  api,
  getUserId,
  type Session,
  type SessionSummary,
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
  const [votedCardIds, setVotedCardIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const { on } = useSocket(sessionId);

  const handleVoteToggle = useCallback((cardId: string, voted: boolean) => {
    setVotedCardIds((prev) => {
      const next = new Set(prev);
      if (voted) next.add(cardId);
      else next.delete(cardId);
      return next;
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [s, c, v] = await Promise.all([
        api.getSession(sessionId),
        api.getCards(sessionId),
        api.getMyVotes(sessionId),
      ]);
      setSession(s);
      setCards(c);
      setVotedCardIds(new Set(v.cardIds));
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

    on("vote:updated", (raw: unknown) => {
      const { cardId, votesCount } = raw as {
        cardId: string;
        votesCount: number;
      };
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, votesCount } : c)),
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

  const columns = session.templateType?.values ?? [];
  const phase = session.currentPhase;
  const isVotePhase = phase === "vote";
  const isModerator = session.creatorId === getUserId();

  const handleAdvancePhase = async (next: "vote" | "summary") => {
    try {
      const updated = await api.advancePhase(sessionId, next);
      setSession(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Phase change failed");
    }
  };

  return (
    <div className="board-page">
      <div className="board-header">
        <button className="back-btn" onClick={onBack}>
          &larr; Back
        </button>
        <h2>{session.title}</h2>
        <span className="phase-badge">{phase}</span>
        {isModerator && <span className="moderator-badge">Moderator</span>}

        {isModerator && phase === "collect" && (
          <button
            className="phase-advance-btn"
            onClick={() => handleAdvancePhase("vote")}
          >
            Start Voting &rarr;
          </button>
        )}
        {isModerator && phase === "vote" && (
          <button
            className="phase-advance-btn"
            onClick={() => handleAdvancePhase("summary")}
          >
            End Voting &rarr;
          </button>
        )}
        {phase === "summary" && (
          <span className="phase-done-label">Session complete</span>
        )}
      </div>

      {phase === "summary" ? (
        <SummaryView sessionId={sessionId} columnCount={columns.length} />
      ) : (
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
              collectPhase={session.currentPhase === "collect"}
              votePhase={isVotePhase}
              votedCardIds={votedCardIds}
              onVoteToggle={handleVoteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ColumnProps {
  column: TemplateValue;
  cards: Card[];
  sessionId: string;
  collectPhase: boolean;
  votePhase: boolean;
  votedCardIds: Set<string>;
  onVoteToggle: (cardId: string, voted: boolean) => void;
}

function Column({
  column,
  cards,
  sessionId,
  collectPhase,
  votePhase,
  votedCardIds,
  onVoteToggle,
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
          <CardItem
            key={card.id}
            card={card}
            votePhase={votePhase}
            hasVoted={votedCardIds.has(card.id)}
            onVoteToggle={onVoteToggle}
          />
        ))}
      </div>

      {collectPhase && (
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

interface CardItemProps {
  card: Card;
  votePhase: boolean;
  hasVoted: boolean;
  onVoteToggle: (cardId: string, voted: boolean) => void;
}

function CardItem({ card, votePhase, hasVoted, onVoteToggle }: CardItemProps) {
  const [voting, setVoting] = useState(false);

  const handleToggleVote = async () => {
    if (voting) return;
    setVoting(true);
    try {
      if (hasVoted) {
        await api.removeVote(card.id);
        onVoteToggle(card.id, false);
      } else {
        await api.castVote(card.id);
        onVoteToggle(card.id, true);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="card">
      <p>{card.content}</p>
      <div className="card-footer">
        {card.votesCount > 0 && (
          <span className="vote-count">{card.votesCount} vote{card.votesCount !== 1 ? "s" : ""}</span>
        )}
        {votePhase && (
          <button
            className={`vote-btn${hasVoted ? " voted" : ""}`}
            onClick={handleToggleVote}
            disabled={voting}
            title={hasVoted ? "Remove vote" : "Vote"}
          >
            {voting ? "..." : hasVoted ? "👎" : "👍"}
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryView({
  sessionId,
  columnCount,
}: {
  sessionId: string;
  columnCount: number;
}) {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSummary(sessionId).then(setSummary).finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p style={{ opacity: 0.5 }}>Loading results...</p>;
  if (!summary) return <p>Failed to load summary</p>;

  return (
    <div className="summary-view">
      <div className="summary-totals">
        <span>{summary.totals.cards} cards</span>
        <span className="summary-dot">&middot;</span>
        <span>{summary.totals.votes} votes</span>
        <span className="summary-dot">&middot;</span>
        <span>{summary.totals.participants} participants</span>
      </div>

      <div
        className="board-columns"
        style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
      >
        {summary.columns.map((col) => (
          <div key={col.key} className="column">
            <div className="column-header" style={{ backgroundColor: col.color }}>
              <h3>{col.label}</h3>
              <span className="card-count">{col.totalVotes}</span>
            </div>
            <div className="column-cards">
              {col.cards.length === 0 && (
                <p style={{ opacity: 0.35, fontSize: "0.85rem", fontStyle: "italic" }}>
                  No cards
                </p>
              )}
              {col.cards.map((card) => (
                <div key={card.id} className="card">
                  <p>{card.content}</p>
                  {card.votesCount > 0 && (
                    <div className="card-footer">
                      <span className="vote-count">
                        +{card.votesCount}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
