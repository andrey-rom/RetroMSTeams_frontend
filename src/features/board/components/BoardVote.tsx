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
  onVoteToggle: (cardId: string, voted: boolean) => void;
  sessionTitle: string;
  templateCode: string;
  timerExpired: boolean;
  timerExpiresAt: null | string;
  votedCardIds: Set<string>;
}

interface VoteColumnProps {
  cards: Card[];
  column: TemplateValue;
  columnIndex: number;
  onVoteToggle: (cardId: string, voted: boolean) => void;
  templateCode: string;
  votedCardIds: Set<string>;
  votesRemaining: number;
}

interface VotePhaseCardProps {
  card: Card;
  hasVoted: boolean;
  onVoteToggle: (cardId: string, voted: boolean) => void;
  votesRemaining: number;
}

export default function BoardVote({
  cards,
  columns: columnsRaw,
  isModerator,
  maxVotesPerUser,
  onAdvanceToSummary,
  onBack,
  onDismissTimerExpired,
  onVoteToggle,
  sessionTitle,
  templateCode,
  timerExpired,
  timerExpiresAt,
  votedCardIds,
}: BoardVoteDesktopProps) {
  const columns = useMemo(() => sortColumns(columnsRaw), [columnsRaw]);
  const timerText = useLiveTimerDisplay(timerExpiresAt);

  const votesUsed = votedCardIds.size;
  const votesRemaining = Math.max(0, maxVotesPerUser - votesUsed);

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

          <div className={styles.timerDisplay}>
            <i aria-hidden className={`fas fa-clock ${styles.timerIcon}`} />
            <span className={styles.timerValue}>{timerText}</span>
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
              disabled
              className={`${styles.btn} ${styles.btnSubtle} ${styles.modBtnTight}`}
              title="Pause is not available yet"
              type="button"
            >
              <i aria-hidden className="fas fa-pause" /> Pause
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
            Dismiss
          </button>
        </div>
      )}

      <div className={styles.votesBanner}>
        <div className={styles.votesRemaining}>
          <i aria-hidden className={`fas fa-star ${styles.votesRemainingIcon}`} />
          <span>
            Votes remaining: {votesRemaining} / {maxVotesPerUser}
          </span>
        </div>
        <div aria-hidden className={styles.voteDots}>
          {Array.from({ length: maxVotesPerUser }, (_, i) => (
            <div
              key={i}
              className={`${styles.voteDot} ${i < votesUsed ? styles.voteDotUsed : styles.voteDotAvailable}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.boardContainer}>
        {columns.map((col, index) => (
          <VoteColumn
            key={col.value}
            cards={cards.filter((c) => c.columnKey === col.value)}
            column={col}
            columnIndex={index}
            templateCode={templateCode}
            votedCardIds={votedCardIds}
            votesRemaining={votesRemaining}
            onVoteToggle={onVoteToggle}
          />
        ))}
      </div>
    </div>
  );
}

function VoteColumn({
  cards,
  column,
  columnIndex,
  onVoteToggle,
  templateCode,
  votedCardIds,
  votesRemaining,
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
            card={card}
            hasVoted={votedCardIds.has(card.id)}
            votesRemaining={votesRemaining}
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

function VotePhaseCard({ card, hasVoted, onVoteToggle, votesRemaining }: VotePhaseCardProps) {
  const [busy, setBusy] = useState(false);

  const canAddVote = !hasVoted && votesRemaining > 0;
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
