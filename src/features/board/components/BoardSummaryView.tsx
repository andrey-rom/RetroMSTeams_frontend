import { useEffect, useState } from "react";
import { api, getUserId, type Session, type SessionSummary } from "../../../shared/lib/api-client.ts";

export interface BoardSummaryViewProps {
  onBack: () => void;
  onPublish: () => Promise<void> | void;
  session: Session;
  sessionId: string;
}

export default function BoardSummaryView({ onBack, onPublish, session, sessionId }: BoardSummaryViewProps) {
  const isModerator = session.creatorId === getUserId();
  const columns = session.templateType?.values ?? [];

  return (
    <div className="board-page">
      <div className="board-header">
        <button className="back-btn" type="button" onClick={onBack}>
          &larr; Back
        </button>
        <h2>{session.title}</h2>
        <span className="phase-badge">{session.currentPhase}</span>
        {isModerator && <span className="moderator-badge">Moderator</span>}
        {isModerator && !session.reportMessageId && (
          <button className="phase-advance-btn publish-btn" type="button" onClick={() => void onPublish()}>
            Publish to Teams
          </button>
        )}
        {session.reportMessageId && <span className="phase-done-label">Published</span>}
        {!isModerator && !session.reportMessageId && <span className="phase-done-label">Session complete</span>}
      </div>
      <SummaryColumns columnCount={columns.length} sessionId={sessionId} />
    </div>
  );
}

function SummaryColumns({ columnCount, sessionId }: { columnCount: number; sessionId: string }) {
  const [summary, setSummary] = useState<null | SessionSummary>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSummary(sessionId)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return <p style={{ opacity: 0.5 }}>Loading results...</p>;
  }
  if (!summary) {
    return <p>Failed to load summary</p>;
  }

  return (
    <div className="summary-view">
      <div className="summary-totals">
        <span>{summary.totals.cards} cards</span>
        <span className="summary-dot">&middot;</span>
        <span>{summary.totals.votes} votes</span>
        <span className="summary-dot">&middot;</span>
        <span>{summary.totals.participants} participants</span>
      </div>

      <div className="board-columns" style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
        {summary.columns.map((col) => (
          <div key={col.key} className="column">
            <div className="column-header" style={{ backgroundColor: col.color }}>
              <h3>{col.label}</h3>
              <span className="card-count">{col.totalVotes}</span>
            </div>
            <div className="column-cards">
              {col.cards.length === 0 && (
                <p style={{ fontSize: "0.85rem", fontStyle: "italic", opacity: 0.35 }}>No cards</p>
              )}
              {col.cards.map((card) => (
                <div key={card.id} className="card">
                  <p>{card.content}</p>
                  {card.votesCount > 0 && (
                    <div className="card-footer">
                      <span className="vote-count">+{card.votesCount}</span>
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
