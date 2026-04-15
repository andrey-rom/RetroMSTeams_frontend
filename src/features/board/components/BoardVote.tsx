import { useMemo, useState } from "react";
import { api } from "../../../shared/lib/api-client.ts";
import { getColumnAccentColor, getColumnEmoji, sortColumns } from "../helpers.ts";
import { useLiveTimerDisplay } from "../hooks/useLiveTimerDisplay.ts";
import styles from "./BoardVote.module.css";
import type { Card, TemplateValue } from "../../../shared/lib/api-client.ts";

export interface BoardVoteDesktopProps {
  cards: Card[];
  columns: TemplateValue[];
  isModerator: boolean;
  maxVotesPerUser: number;
  onAdvanceToSummary: () => void;
  onBack: () => void;
  onDismissTimerExpired: () => void;
  onToggleTimerPause: () => void;
  onVoteToggle: (cardId: string, voted: boolean) => void;
  pausedRemainingSeconds: null | number;
  sessionTitle: string;
  templateCode: string;
  timerExpired: boolean;
  timerExpiresAt: null | string;
  timerPaused: boolean;
  votedCardIds: Set<string>;
  voteTimerElapsed: boolean;
}

interface VoteColumnProps {
  allowNewVote: boolean;
  cards: Card[];
  column: TemplateValue;
  columnIndex: number;
  onVoteToggle: (cardId: string, voted: boolean) => void;
  templateCode: string;
  votedCardIds: Set<string>;
}

interface VotePhaseCardProps {
  allowNewVote: boolean;
  card: Card;
  hasVoted: boolean;
  onVoteToggle: (cardId: string, voted: boolean) => void;
}

export default function BoardVote({
  cards,
  columns: columnsRaw,
  isModerator,
  maxVotesPerUser,
  onAdvanceToSummary,
  onBack,
  onDismissTimerExpired,
  onToggleTimerPause,
  onVoteToggle,
  pausedRemainingSeconds,
  sessionTitle,
  templateCode,
  timerExpired,
  timerExpiresAt,
  timerPaused,
  votedCardIds,
  voteTimerElapsed,
}: BoardVoteDesktopProps) {
  const columns = useMemo(() => sortColumns(columnsRaw), [columnsRaw]);
  const liveTimerText = useLiveTimerDisplay(timerExpiresAt);
  const pausedTimerText =
    pausedRemainingSeconds === null
      ? "--:--"
      : `${String(Math.floor(pausedRemainingSeconds / 60)).padStart(2, "0")}:${String(pausedRemainingSeconds % 60).padStart(2, "0")}`;
  const timerText = voteTimerElapsed ? "00:00" : timerPaused ? pausedTimerText : liveTimerText;

  const allowNewVote = votedCardIds.size < maxVotesPerUser;

  const contributorCount = useMemo(() => new Set(cards.map((c) => c.ownerHash)).size, [cards]);
  const onlineLabel = Math.max(contributorCount, 1);

  return (
    <div className={styles.boardShell}>
      <header className={styles.boardHeader}>
        <div className={styles.headerLeft}>
          <button aria-label="Back" className={styles.headerBack} type="button" onClick={onBack}>
            <i className="fas fa-arrow-left" />
          </button>
          <div className={styles.headerLogo}>
            <div aria-hidden className={styles.headerLogoIcon}>
              <i className="fas fa-rotate" />
            </div>
            <span className={styles.headerTitle}>Retro-Bot</span>
          </div>
          <div className={styles.headerSeparator} />
          <span className={styles.sessionName}>{sessionTitle}</span>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.phaseStepper}>
            <div className={`${styles.phaseStep} ${styles.phaseStepCompleted}`}>
              <i aria-hidden className={`fas fa-check ${styles.phaseStepIcon}`} />
              Collect
            </div>
            <div className={styles.phaseConnector} />
            <div className={`${styles.phaseStep} ${styles.phaseStepActive}`}>
              <i aria-hidden className={`fas fa-thumbs-up ${styles.phaseStepIcon}`} />
              Vote
            </div>
            <div className={styles.phaseConnector} />
            <div className={`${styles.phaseStep} ${styles.phaseStepUpcoming}`}>
              <i aria-hidden className={`fas fa-chart-simple ${styles.phaseStepIcon}`} />
              Summary
            </div>
          </div>

          <div className={`${styles.timerDisplay} ${voteTimerElapsed ? styles.timerDisplayExpired : ""}`}>
            <i
              aria-hidden
              className={`fas fa-clock ${styles.timerIcon} ${voteTimerElapsed ? styles.timerIconExpired : ""}`}
            />
            <span className={`${styles.timerValue} ${voteTimerElapsed ? styles.timerValueExpired : ""}`}>
              {timerText}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.anonymousBadge}>
            <i aria-hidden className={`fas fa-user-secret ${styles.anonymousIcon}`} />
            Anonymous
          </div>
          <div className={styles.participants}>
            <i aria-hidden className={`fas fa-circle ${styles.participantsDot}`} />
            <span>{onlineLabel} online</span>
          </div>
        </div>
      </header>

      {isModerator && (
        <div className={styles.moderatorBar}>
          <div className={styles.moderatorBarLeft}>
            <i aria-hidden className="fas fa-shield-halved" />
            <span>Moderator view — Voting phase active</span>
          </div>
          <div className={styles.moderatorBarRight}>
            <button
              className={`${styles.btn} ${styles.btnSubtle} ${styles.modBtnTight}`}
              type="button"
              onClick={onToggleTimerPause}
            >
              <i aria-hidden className={`fas ${timerPaused ? "fa-play" : "fa-pause"}`} />{" "}
              {timerPaused ? "Resume" : "Pause"}
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.modBtnTight}`}
              type="button"
              onClick={onAdvanceToSummary}
            >
              Finish: Summary <i aria-hidden className="fas fa-arrow-right" />
            </button>
          </div>
        </div>
      )}

      {timerExpired && (
        <div className={styles.timerExpiredBanner}>
          <span>
            {isModerator ? "Vote timer is up! End voting when ready." : "Vote timer is up! Waiting for moderator."}
          </span>
          <button className={styles.timerDismissBtn} type="button" onClick={onDismissTimerExpired}>
            <i aria-hidden className="fas fa-xmark" />
          </button>
        </div>
      )}

      <div className={styles.boardContainer}>
        {columns.map((col, index) => (
          <VoteColumn
            key={col.value}
            allowNewVote={allowNewVote}
            cards={cards.filter((c) => c.columnKey === col.value)}
            column={col}
            columnIndex={index}
            templateCode={templateCode}
            votedCardIds={votedCardIds}
            onVoteToggle={onVoteToggle}
          />
        ))}
      </div>
    </div>
  );
}

function VoteColumn({
  allowNewVote,
  cards,
  column,
  columnIndex,
  onVoteToggle,
  templateCode,
  votedCardIds,
}: VoteColumnProps) {
  const accent = getColumnAccentColor(column, templateCode, columnIndex);
  const emoji = getColumnEmoji(templateCode, columnIndex);

  return (
    <div className={styles.column} style={{ ["--column-accent" as string]: accent }}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitle}>
          <span className={styles.columnEmoji}>{emoji}</span>
          <span className={styles.columnName}>{column.label}</span>
        </div>
        <span className={styles.columnCount}>{cards.length}</span>
      </div>

      <div className={styles.columnCards}>
        {cards.map((card) => (
          <VotePhaseCard
            key={card.id}
            allowNewVote={allowNewVote}
            card={card}
            hasVoted={votedCardIds.has(card.id)}
            onVoteToggle={onVoteToggle}
          />
        ))}
      </div>

      <div className={styles.lockedMessage}>
        <i aria-hidden className="fas fa-lock" />
        Card creation locked during voting
      </div>
    </div>
  );
}

function VotePhaseCard({ allowNewVote, card, hasVoted, onVoteToggle }: VotePhaseCardProps) {
  const [busy, setBusy] = useState(false);

  const canAddVote = !hasVoted && allowNewVote;
  const disabled = !hasVoted && !canAddVote;

  const handleClick = async () => {
    if (busy || disabled) {
      return;
    }
    setBusy(true);
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
      setBusy(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>{card.content}</div>
      <div className={styles.cardVoteArea}>
        <div className={styles.voteCount}>
          <span className={styles.voteCountNumber}>{card.votesCount}</span>
          <span>votes</span>
        </div>
        <button
          className={`${styles.voteBtn} ${hasVoted ? styles.voteBtnVoted : ""} ${disabled ? styles.voteBtnDisabled : ""}`}
          disabled={disabled || busy}
          type="button"
          onClick={() => void handleClick()}
        >
          {hasVoted ? (
            <>
              <i aria-hidden className="fas fa-thumbs-up" /> Voted
            </>
          ) : (
            <>
              <i aria-hidden className="far fa-thumbs-up" /> {busy ? "…" : "Vote"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
