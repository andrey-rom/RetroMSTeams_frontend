import { useState, useEffect, useCallback } from "react";
import { api, getUserId, type Session, type Card } from "../shared/lib/api-client";
import { useSocket } from "../shared/hooks/useSocket";
import BoardSessionView from "../features/board/components/BoardSessionView";
import { useMyOwnerHash } from "../features/board/hooks/useMyOwnerHash";

interface BoardPageProps {
  onBack: () => void;
  sessionId: string;
}

export default function BoardPage({ onBack, sessionId }: BoardPageProps) {
  const [session, setSession] = useState<null | Session>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [votedCardIds, setVotedCardIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [timerExpired, setTimerExpired] = useState(false);
  const [graceActive, setGraceActive] = useState(false);
  const [graceUsedColumns, setGraceUsedColumns] = useState<Set<string>>(new Set());

  const myOwnerHash = useMyOwnerHash(sessionId);

  const { off, on } = useSocket(sessionId);

  const handleVoteToggle = useCallback((cardId: string, voted: boolean) => {
    setVotedCardIds((prev) => {
      const next = new Set(prev);

      if (voted) {
        next.add(cardId);
      } else {
        next.delete(cardId);
      }

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
  }, [loadData]);

  useEffect(() => {
    const handleCardCreated = (raw: unknown) => {
      const card = raw as Card;

      setCards((prev) => {
        if (prev.some((c) => c.id === card.id)) {
          return prev;
        }

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
      const { phase } = raw as { phase: string };

      setSession((prev) => (prev ? { ...prev, currentPhase: phase, timerExpiresAt: null } : prev));
      setTimerExpired(false);
      setGraceActive(false);
      setGraceUsedColumns(new Set());
    };

    const handleVoteUpdated = (raw: unknown) => {
      const { cardId, votesCount } = raw as {
        cardId: string;
        votesCount: number;
      };

      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, votesCount } : c)));
    };

    const handleTimerStarted = (raw: unknown) => {
      const { timerExpiresAt } = raw as { timerExpiresAt: string };

      setSession((prev) => (prev ? { ...prev, timerExpiresAt } : prev));
      setTimerExpired(false);
    };

    const handleTimerExpired = () => {
      setSession((prev) => (prev ? { ...prev, timerExpiresAt: null } : prev));
      setTimerExpired(true);
    };

    const handleCollectGrace = (raw: unknown) => {
      const { collectGraceAt } = raw as { collectGraceAt: string };

      setSession((prev) => (prev ? { ...prev, collectGraceAt, timerExpiresAt: null } : prev));
      setGraceActive(true);
      setGraceUsedColumns(new Set());
    };

    on("card:created", handleCardCreated);
    on("card:updated", handleCardUpdated);
    on("card:deleted", handleCardDeleted);
    on("phase:changed", handlePhaseChanged);
    on("vote:updated", handleVoteUpdated);
    on("timer:started", handleTimerStarted);
    on("timer:expired", handleTimerExpired);
    on("collect:grace", handleCollectGrace);

    return () => {
      off("card:created");
      off("card:updated");
      off("card:deleted");
      off("phase:changed");
      off("vote:updated");
      off("timer:started");
      off("timer:expired");
      off("collect:grace");
    };
  }, [on, off]);

  const handleStartCollect = async () => {
    try {
      await api.startCollect(sessionId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start");
    }
  };

  const handleAdvancePhase = async (next: "summary" | "vote") => {
    try {
      const updated = await api.advancePhase(sessionId, next);

      setSession(updated);
      setTimerExpired(false);
      setGraceActive(false);
      setGraceUsedColumns(new Set());
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

  const handleDismissTimerExpired = () => setTimerExpired(false);

  const onGraceCardAdded = (columnKey: string) => {
    setGraceUsedColumns((prev) => new Set(prev).add(columnKey));
  };

  const handleCreateCard = async (columnKey: string, content: string) => {
    await api.createCard(sessionId, columnKey, content);
  };

  const handleUpdateCard = async (cardId: string, content: string) => {
    const updated = await api.updateCard(cardId, content);

    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
  };

  const handleDeleteCard = async (cardId: string) => {
    await api.deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  if (error) {
    return (
      <div className="board-error">
        <p>Error: {error}</p>
        <button type="button" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  if (!session) {
    return <p>Loading board...</p>;
  }

  const isModerator = session.creatorId === getUserId();

  return (
    <BoardSessionView
      cards={cards}
      graceActive={graceActive}
      graceUsedColumns={graceUsedColumns}
      isModerator={isModerator}
      myOwnerHash={myOwnerHash}
      session={session}
      sessionId={sessionId}
      timerExpired={timerExpired}
      votedCardIds={votedCardIds}
      onAdvanceToSummary={() => void handleAdvancePhase("summary")}
      onAdvanceToVote={() => void handleAdvancePhase("vote")}
      onBack={onBack}
      onCreateCard={handleCreateCard}
      onDeleteCard={handleDeleteCard}
      onDismissTimerExpired={handleDismissTimerExpired}
      onGraceCardAdded={onGraceCardAdded}
      onPublish={handlePublish}
      onStartCollect={handleStartCollect}
      onUpdateCard={handleUpdateCard}
      onVoteToggle={handleVoteToggle}
    />
  );
}
