import { useState, useEffect, useCallback } from "react";
import { api, getUserId, type Session, type Card } from "../shared/lib/api-client";
import { useSocket } from "../shared/hooks/useSocket";
import BoardSessionView from "../features/board/components/BoardSessionView";
import { useMyOwnerHash } from "../features/board/hooks/useMyOwnerHash";
import Loader from "../shared/components/Loader";

interface BoardPageProps {
  onBack: () => void;
  onExitToHistory: () => void;
  sessionId: string;
}

type PublishNotification = {
  id: number;
  message: string;
  type: "error" | "success";
};

export default function BoardPage({ onBack, onExitToHistory, sessionId }: BoardPageProps) {
  const [session, setSession] = useState<null | Session>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [votedCardIds, setVotedCardIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [timerExpired, setTimerExpired] = useState(false);
  const [voteTimerElapsed, setVoteTimerElapsed] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [pausedRemainingSeconds, setPausedRemainingSeconds] = useState<null | number>(null);
  const [graceActive, setGraceActive] = useState(false);
  const [graceBannerVisible, setGraceBannerVisible] = useState(false);
  const [graceUsedColumns, setGraceUsedColumns] = useState<Set<string>>(new Set());
  const [startingCollect, setStartingCollect] = useState(false);
  const [advancingToVote, setAdvancingToVote] = useState(false);
  const [advancingToSummary, setAdvancingToSummary] = useState(false);
  const [publishingSummary, setPublishingSummary] = useState(false);
  const [publishNotification, setPublishNotification] = useState<null | PublishNotification>(null);

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

  const clearPausedTimerState = useCallback(() => {
    setTimerPaused(false);
    setPausedRemainingSeconds(null);
  }, []);

  const getRemainingSeconds = useCallback((expiresAt: null | string) => {
    if (!expiresAt) {
      return null;
    }

    const target = new Date(expiresAt).getTime();

    if (Number.isNaN(target)) {
      return null;
    }

    return Math.max(0, Math.round((target - Date.now()) / 1000));
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
        setGraceBannerVisible(true);
        setGraceUsedColumns(new Set(g.usedColumns));
      }
      clearPausedTimerState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [clearPausedTimerState, sessionId]);

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
      const { phase, timerExpiresAt } = raw as { phase: string; timerExpiresAt?: null | string };

      setSession((prev) =>
        prev
          ? {
              ...prev,
              collectGraceAt: phase === "collect" ? prev.collectGraceAt : null,
              currentPhase: phase,
              timerExpiresAt: timerExpiresAt ?? prev.timerExpiresAt,
            }
          : prev,
      );
      setTimerExpired(false);
      setVoteTimerElapsed(false);
      setGraceActive(false);
      setGraceBannerVisible(false);
      setGraceUsedColumns(new Set());
      clearPausedTimerState();

      // Some phase-change events do not include timer data.
      // Sync from backend so Vote timer is always correct for all clients.
      void api
        .getSession(sessionId)
        .then((latest) => {
          setSession(latest);
        })
        .catch(() => {});
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
      setVoteTimerElapsed(false);
      clearPausedTimerState();
    };

    const handleTimerExpired = () => {
      if (timerPaused) {
        return;
      }

      setSession((prev) => (prev ? { ...prev, timerExpiresAt: null } : prev));
      setTimerExpired(true);
      setVoteTimerElapsed(true);
      clearPausedTimerState();
    };

    const handleCollectGrace = (raw: unknown) => {
      const { collectGraceAt } = raw as { collectGraceAt: string };

      setSession((prev) => (prev ? { ...prev, collectGraceAt, timerExpiresAt: null } : prev));
      setGraceActive(true);
      setGraceBannerVisible(true);
      setGraceUsedColumns(new Set());
      clearPausedTimerState();
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
  }, [clearPausedTimerState, on, off, sessionId, timerPaused]);

  const handleStartCollect = async () => {
    if (startingCollect) {
      return;
    }

    setStartingCollect(true);
    try {
      await api.startCollect(sessionId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setStartingCollect(false);
    }
  };

  const handleAdvancePhase = async (next: "summary" | "vote") => {
    if (next === "vote" && advancingToVote) {
      return;
    }

    if (next === "summary" && advancingToSummary) {
      return;
    }

    if (next === "vote") {
      setAdvancingToVote(true);
    } else {
      setAdvancingToSummary(true);
    }

    try {
      const updated = await api.advancePhase(sessionId, next);

      setSession(updated);
      setTimerExpired(false);
      setVoteTimerElapsed(false);
      setGraceActive(false);
      setGraceUsedColumns(new Set());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Phase change failed");
    } finally {
      if (next === "vote") {
        setAdvancingToVote(false);
      } else {
        setAdvancingToSummary(false);
      }
    }
  };

  const handlePublish = async () => {
    if (publishingSummary) {
      return;
    }

    setPublishingSummary(true);
    try {
      await api.publishSummary(sessionId);
      const updated = await api.getSession(sessionId);

      setSession(updated);
      setPublishNotification({
        id: Date.now(),
        message: "Summary published to channel successfully.",
        type: "success",
      });
    } catch (err: unknown) {
      setPublishNotification({
        id: Date.now(),
        message: err instanceof Error ? err.message : "Failed to publish summary.",
        type: "error",
      });
    } finally {
      setPublishingSummary(false);
    }
  };

  const handleDismissTimerExpired = () => setTimerExpired(false);
  const handleDismissGraceBanner = () => setGraceBannerVisible(false);

  const handleToggleTimerPause = () => {
    if (!session) {
      return;
    }

    if (timerPaused) {
      if (pausedRemainingSeconds === null) {
        return;
      }

      const resumedExpiresAt = new Date(Date.now() + pausedRemainingSeconds * 1000).toISOString();

      setSession((prev) => (prev ? { ...prev, timerExpiresAt: resumedExpiresAt } : prev));
      setTimerPaused(false);
      setPausedRemainingSeconds(null);

      return;
    }

    const remaining = getRemainingSeconds(session.timerExpiresAt);

    if (remaining === null) {
      return;
    }

    setTimerPaused(true);
    setPausedRemainingSeconds(remaining);
  };

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
    return <Loader />;
  }

  const isModerator = session.creatorId === getUserId();

  return (
    <BoardSessionView
      advancingToSummary={advancingToSummary}
      advancingToVote={advancingToVote}
      cards={cards}
      graceActive={graceActive}
      graceBannerVisible={graceBannerVisible}
      graceUsedColumns={graceUsedColumns}
      isModerator={isModerator}
      myOwnerHash={myOwnerHash}
      publishingSummary={publishingSummary}
      publishNotification={publishNotification}
      pausedRemainingSeconds={pausedRemainingSeconds}
      session={session}
      sessionId={sessionId}
      startingCollect={startingCollect}
      timerExpired={timerExpired}
      timerPaused={timerPaused}
      votedCardIds={votedCardIds}
      voteTimerElapsed={voteTimerElapsed}
      onAdvanceToSummary={() => void handleAdvancePhase("summary")}
      onAdvanceToVote={() => void handleAdvancePhase("vote")}
      onBack={onBack}
      onCreateCard={handleCreateCard}
      onDeleteCard={handleDeleteCard}
      onDismissGraceBanner={handleDismissGraceBanner}
      onDismissTimerExpired={handleDismissTimerExpired}
      onExitToHistory={onExitToHistory}
      onGraceCardAdded={onGraceCardAdded}
      onPublish={handlePublish}
      onPublishNotificationClose={() => setPublishNotification(null)}
      onStartCollect={handleStartCollect}
      onToggleTimerPause={handleToggleTimerPause}
      onUpdateCard={handleUpdateCard}
      onVoteToggle={handleVoteToggle}
    />
  );
}
