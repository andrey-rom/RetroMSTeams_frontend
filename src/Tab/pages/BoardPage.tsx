import { useState, useEffect, useCallback } from "react";
import {
  api,
  getUserId,
  generateOwnerHash,
  type Session,
  type SessionSummary,
  type Card,
  type TemplateValue,
} from "../lib/api-client";
import { useSocket } from "../hooks/useSocket";
import CountdownTimer from "../components/CountdownTimer";

interface BoardPageProps {
  sessionId: string;
  onBack: () => void;
}

export default function BoardPage({ sessionId, onBack }: BoardPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [votedCardIds, setVotedCardIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [timerExpired, setTimerExpired] = useState(false);
  const [graceActive, setGraceActive] = useState(false);
  const [graceUsedColumns, setGraceUsedColumns] = useState<Set<string>>(new Set());
  const [activeUsers, setActiveUsers] = useState(0);
  const [ownerHash, setOwnerHash] = useState<string | null>(null);

  const { on, off } = useSocket(sessionId);

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
      const [s, c, v, g] = await Promise.all([
        api.getSession(sessionId),
        api.getCards(sessionId),
        api.getMyVotes(sessionId),
        api.getGraceStatus(sessionId),
      ]);
      setSession(s);
      setCards(c);
      setVotedCardIds(new Set(v.cardIds));
      if (g.graceActive) {
        setGraceActive(true);
        setGraceUsedColumns(new Set(g.usedColumns));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
    generateOwnerHash(getUserId(), sessionId).then(setOwnerHash);
  }, [loadData, sessionId]);

  useEffect(() => {
    // Define handlers as separate named functions so we can properly clean them up
    const handleCardCreated = (raw: unknown) => {
      const card = raw as Card;
      setCards((prev) => {
        if (prev.some((c) => c.id === card.id)) return prev;
        return [...prev, card];
      });
    };

    const handleCardUpdated = (raw: unknown) => {
      const card = raw as Card;
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    };

    const handleCardDeleted = (raw: unknown) => {
      const { cardId } = raw as { cardId: string };
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    };

    const handlePhaseChanged = (raw: unknown) => {
      const { phase, timerExpiresAt } = raw as { phase: string; timerExpiresAt: string | null };
      setSession((prev) =>
        prev ? { ...prev, currentPhase: phase, timerExpiresAt: timerExpiresAt ?? null } : prev,
      );
      setTimerExpired(false);
      setGraceActive(false);
      setGraceUsedColumns(new Set());
    };

    const handleVoteUpdated = (raw: unknown) => {
      const { cardId, votesCount } = raw as {
        cardId: string;
        votesCount: number;
      };
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, votesCount } : c)),
      );
    };

    const handleTimerStarted = (raw: unknown) => {
      const { timerExpiresAt } = raw as { timerExpiresAt: string };
      setSession((prev) =>
        prev ? { ...prev, timerExpiresAt } : prev,
      );
      setTimerExpired(false);
    };

    const handleTimerExpired = () => {
      setSession((prev) =>
        prev ? { ...prev, timerExpiresAt: null } : prev,
      );
      setTimerExpired(true);
    };

    const handleCollectGrace = (raw: unknown) => {
      const { collectGraceAt } = raw as { collectGraceAt: string };
      setSession((prev) =>
        prev ? { ...prev, timerExpiresAt: null, collectGraceAt } : prev,
      );
      setGraceActive(true);
      setGraceUsedColumns(new Set());
    };

    const handleUsersCount = (raw: unknown) => {
      const { count } = raw as { count: number };
      setActiveUsers(count);
    };

    on("card:created", handleCardCreated);
    on("card:updated", handleCardUpdated);
    on("card:deleted", handleCardDeleted);
    on("phase:changed", handlePhaseChanged);
    on("vote:updated", handleVoteUpdated);
    on("timer:started", handleTimerStarted);
    on("timer:expired", handleTimerExpired);
    on("collect:grace", handleCollectGrace);
    on("users:count", handleUsersCount);

    return () => {
      off("card:created");
      off("card:updated");
      off("card:deleted");
      off("phase:changed");
      off("vote:updated");
      off("timer:started");
      off("timer:expired");
      off("collect:grace");
      off("users:count");
    };
  }, [on, off]);

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

  const collectTimerConfigured = !!session.collectTimerSeconds;
  const collectTimerNotStarted = collectTimerConfigured && !session.timerExpiresAt && !session.collectGraceAt;

  const handleStartCollect = async () => {
    try {
      await api.startCollect(sessionId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start");
    }
  };

  const handleAdvancePhase = async (next: "vote" | "summary") => {
    try {
      await api.advancePhase(sessionId, next);
      // State is updated via the phase:changed socket event (which includes
      // timerExpiresAt). Don't overwrite session here — the HTTP response
      // has timerExpiresAt: null since it's returned before the timer is set.
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Phase change failed");
    }
  };

  const handlePublish = async () => {
    try {
      await api.publishSummary(sessionId);
      const updated = await api.getSession(sessionId);
      setSession(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Publish failed");
    }
  };

  const handleDismissExpired = () => setTimerExpired(false);

  const onGraceCardAdded = (columnKey: string) => {
    setGraceUsedColumns((prev) => new Set(prev).add(columnKey));
  };

  return (
    <div className="board-page">
      <div className="board-header">
        <button className="back-btn" onClick={onBack}>
          &larr; Back
        </button>
        <h2>{session.title}</h2>
        <span className="phase-badge">{phase}</span>
        <CountdownTimer expiresAt={session.timerExpiresAt} />
        {phase !== "summary" && (
          <span className="active-users-badge">
            <span className="active-users-dot" />
            {activeUsers} {activeUsers === 1 ? "user" : "users"}
          </span>
        )}
        {isModerator && <span className="moderator-badge">Moderator</span>}

        {isModerator && phase === "collect" && collectTimerNotStarted && (
          <button
            className="phase-advance-btn start-retro-btn"
            onClick={handleStartCollect}
          >
            Start Retrospective
          </button>
        )}
        {isModerator && phase === "collect" && !collectTimerNotStarted && (
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
        {phase === "summary" && isModerator && !session.reportMessageId && (
          <button
            className="phase-advance-btn publish-btn"
            onClick={handlePublish}
          >
            Publish to Teams
          </button>
        )}
        {phase === "summary" && session.reportMessageId && (
          <span className="phase-done-label">Published</span>
        )}
        {phase === "summary" && !isModerator && !session.reportMessageId && (
          <span className="phase-done-label">Session complete</span>
        )}
      </div>

      {!isModerator && phase === "collect" && collectTimerNotStarted && (
        <div className="waiting-banner">
          Waiting for moderator to start the retrospective...
        </div>
      )}

      {graceActive && phase === "collect" && (
        <div className="timer-expired-banner">
          <span>Time is up! You may add one last card per column.</span>
        </div>
      )}

      {timerExpired && phase === "vote" && (
        <div className="timer-expired-banner">
          <span>{isModerator ? "Vote timer is up! End voting when ready." : "Vote timer is up! Waiting for moderator."}</span>
          <button className="timer-dismiss-btn" onClick={handleDismissExpired}>
            Dismiss
          </button>
        </div>
      )}

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
              collectPhase={phase === "collect"}
              votePhase={isVotePhase}
              votedCardIds={votedCardIds}
              onVoteToggle={handleVoteToggle}
              graceActive={graceActive}
              graceUsed={graceUsedColumns.has(col.value)}
              onGraceCardAdded={onGraceCardAdded}
              ownerHash={ownerHash}
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
  graceActive: boolean;
  graceUsed: boolean;
  onGraceCardAdded: (columnKey: string) => void;
  ownerHash: string | null;
}

function Column({
  column,
  cards,
  sessionId,
  collectPhase,
  votePhase,
  votedCardIds,
  onVoteToggle,
  graceActive,
  graceUsed,
  onGraceCardAdded,
  ownerHash,
}: ColumnProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canAddCard = collectPhase && (!graceActive || !graceUsed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting || !canAddCard) return;

    setSubmitting(true);
    try {
      await api.createCard(sessionId, column.value, text.trim());
      setText("");
      if (graceActive) {
        onGraceCardAdded(column.value);
      }
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
            collectPhase={collectPhase}
            votePhase={votePhase}
            isOwner={ownerHash !== null && card.ownerHash === ownerHash}
            hasVoted={votedCardIds.has(card.id)}
            onVoteToggle={onVoteToggle}
          />
        ))}
      </div>

      {canAddCard && (
        <form className="card-form" onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder={graceActive ? `Last card for "${column.label}"...` : `Add a "${column.label}" card...`}
            maxLength={500}
            rows={2}
          />
          <button type="submit" disabled={!text.trim() || submitting}>
            {submitting ? "..." : "Add"}
          </button>
        </form>
      )}

      {collectPhase && graceActive && graceUsed && (
        <p className="grace-done-label">Last card added</p>
      )}
    </div>
  );
}

interface CardItemProps {
  card: Card;
  collectPhase: boolean;
  votePhase: boolean;
  isOwner: boolean;
  hasVoted: boolean;
  onVoteToggle: (cardId: string, voted: boolean) => void;
}

function CardItem({ card, collectPhase, votePhase, isOwner, hasVoted, onVoteToggle }: CardItemProps) {
  const [voting, setVoting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(card.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canModify = collectPhase && isOwner;

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

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed || saving) return;
    if (trimmed === card.content) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await api.updateCard(card.id, trimmed);
      setEditing(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Edit failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await api.deleteCard(card.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditText(card.content);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="card card-editing">
        <textarea
          className="card-edit-textarea"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleEditKeyDown}
          maxLength={500}
          rows={3}
          autoFocus
        />
        <div className="card-edit-actions">
          <button
            className="card-edit-save"
            onClick={handleSaveEdit}
            disabled={!editText.trim() || saving}
          >
            {saving ? "..." : "Save"}
          </button>
          <button
            className="card-edit-cancel"
            onClick={() => { setEditText(card.content); setEditing(false); }}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card${canModify ? " card-owned" : ""}`}>
      <div className="card-body">
        <p>{card.content}</p>
        {canModify && (
          <div className="card-actions">
            <button
              className="card-action-btn"
              onClick={() => setEditing(true)}
              title="Edit card"
            >
              &#9998;
            </button>
            <button
              className="card-action-btn card-action-delete"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete card"
            >
              {deleting ? "..." : "\u00D7"}
            </button>
          </div>
        )}
      </div>
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
