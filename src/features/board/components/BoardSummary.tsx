import { useMemo } from "react";

import {
  formatSummaryDuration,
  getColumnAccentColor,
  getColumnEmoji,
  getSummaryTagKind,
  sortColumns,
} from "../helpers.ts";
import { useSessionSummaryQuery } from "../hooks/useSessionSummary.ts";

import styles from "./BoardSummary.module.css";
import type { Session } from "../../../shared/lib/api-client.ts";

export interface BoardSummaryDesktopProps {
  isModerator: boolean;
  onBack: () => void;
  onExitToHistory: () => void;
  onPublish: () => void;
  session: Session;
  sessionId: string;
}

type RankedCard = {
  columnIndex: number;
  columnKey: string;
  columnLabel: string;
  content: string;
  id: string;
  votesCount: number;
};

export default function BoardSummary({
  isModerator,
  onBack,
  onExitToHistory,
  onPublish,
  session,
  sessionId,
}: BoardSummaryDesktopProps) {
  const { data: summary, error, isError, isPending } = useSessionSummaryQuery(sessionId);

  const templateCode = session.templateType?.code ?? "SSC";
  const sortedTemplateValues = useMemo(
    () => sortColumns(session.templateType?.values ?? []),
    [session.templateType?.values],
  );

  const topRanked = useMemo(() => {
    if (!summary?.columns?.length) {
      return [];
    }

    return buildTopRanked(summary.columns);
  }, [summary]);

  const durationLabel = useMemo(
    () => formatSummaryDuration(session.createdAt, session.updatedAt ?? null),
    [session.createdAt, session.updatedAt],
  );

  if (isPending) {
    return (
      <div className={styles.boardShell}>
        <div className={styles.loading}>Loading summary…</div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className={styles.boardShell}>
        <div className={styles.error}>{error instanceof Error ? error.message : "Failed to load summary"}</div>
      </div>
    );
  }

  const totals = summary.totals;

  return (
    <div className={styles.boardShell}>
      <header className={styles.boardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>
            <div aria-hidden className={styles.headerLogoIcon}>
              <i className="fas fa-rotate" />
            </div>
            <span className={styles.headerTitle}>Retro-Bot</span>
          </div>
          <div className={styles.headerSeparator} />
          <span className={styles.sessionName}>{session.title}</span>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.phaseStepper}>
            <div className={`${styles.phaseStep} ${styles.phaseStepCompleted}`}>
              <i aria-hidden className={`fas fa-check ${styles.phaseStepIcon}`} />
              Collect
            </div>
            <div className={styles.phaseConnector} />
            <div className={`${styles.phaseStep} ${styles.phaseStepCompleted}`}>
              <i aria-hidden className={`fas fa-check ${styles.phaseStepIcon}`} />
              Vote
            </div>
            <div className={styles.phaseConnector} />
            <div className={`${styles.phaseStep} ${styles.phaseStepActive}`}>
              <i aria-hidden className={`fas fa-chart-simple ${styles.phaseStepIcon}`} />
              Summary
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            aria-label="Back to session history"
            className={`${styles.btn} ${styles.btnSubtle} ${styles.headerHistoryBtn}`}
            type="button"
            onClick={onExitToHistory}
          >
            <i aria-hidden className="fas fa-clock-rotate-left" /> History
          </button>
          <span className={styles.sessionComplete}>
            <i aria-hidden className="fas fa-check-circle" /> Session Complete
          </span>
        </div>
      </header>

      <div className={styles.summaryContent}>
        <div className={styles.summaryContainer}>
          <div className={styles.statsBar}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{totals.cards}</div>
              <div className={styles.statLabel}>Total Cards</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.statGreen}`}>{totals.participants}</div>
              <div className={styles.statLabel}>Participants</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.statYellow}`}>{totals.votes}</div>
              <div className={styles.statLabel}>Total Votes</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.statBlue}`}>{durationLabel}</div>
              <div className={styles.statLabel}>Duration</div>
            </div>
          </div>

          <div className={styles.topCards}>
            <h2 className={styles.sectionTitle}>
              <i aria-hidden className={`fas fa-trophy ${styles.sectionIconTrophy}`} /> Top Voted Items
            </h2>

            {topRanked.map((card, index) => {
              const rankClass = index === 0 ? styles.rank1 : index === 1 ? styles.rank2 : styles.rank3;
              const tagKind = getSummaryTagKind(templateCode, card.columnIndex);
              const tagClass =
                tagKind === "start"
                  ? styles.tagStart
                  : tagKind === "stop"
                    ? styles.tagStop
                    : tagKind === "continue"
                      ? styles.tagContinue
                      : styles.tagOther;
              const tagLabel = `${getColumnEmoji(templateCode, card.columnIndex)} ${card.columnLabel}`;

              return (
                <div key={card.id} className={styles.rankedCard}>
                  <div className={`${styles.rankBadge} ${rankClass}`}>{index + 1}</div>
                  <div className={styles.rankedCardContent}>
                    <div className={styles.rankedCardText}>{card.content}</div>
                    <div className={styles.rankedCardMeta}>
                      <span className={`${styles.columnTag} ${tagClass}`}>{tagLabel}</span>
                      <span className={styles.voteBadge}>
                        <i aria-hidden className="fas fa-star" /> {card.votesCount} votes
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className={styles.sectionTitle}>
            <i aria-hidden className={`fas fa-columns ${styles.sectionIconColumns}`} /> All Cards by Column
          </h2>

          <div className={styles.columnSummaries}>
            {summary.columns.map((col, columnIndex) => {
              const sortedCards = [...col.cards].sort((a, b) => b.votesCount - a.votesCount);
              const templateCol = sortedTemplateValues[columnIndex];
              const accent =
                col.color || (templateCol ? getColumnAccentColor(templateCol, templateCode, columnIndex) : "#6264a7");
              const columnTitle = `${getColumnEmoji(templateCode, columnIndex)} ${col.label} (${col.totalCards})`;

              return (
                <div key={col.key} className={styles.columnSummary} style={{ ["--column-accent" as string]: accent }}>
                  <div className={styles.columnSummaryHeader}>{columnTitle}</div>
                  <ul className={styles.columnSummaryList}>
                    {sortedCards.map((c) => (
                      <li key={c.id} className={styles.columnSummaryItem}>
                        <span>{c.content}</span>
                        <span className={styles.itemVotes}>
                          <i aria-hidden className="fas fa-star" /> {c.votesCount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {isModerator && (
            <div className={styles.publishSection}>
              <div className={styles.publishTitle}>Ready to Publish?</div>
              <div className={styles.publishDesc}>
                This summary will be posted as an Adaptive Card to your Teams channel
              </div>
              <div className={styles.publishActions}>
                <button className={`${styles.btn} ${styles.btnSubtle}`} type="button" onClick={onBack}>
                  <i aria-hidden className="fas fa-arrow-left" /> Back to Board
                </button>
                <button className={`${styles.btn} ${styles.btnSuccess}`} type="button" onClick={onPublish}>
                  <i aria-hidden className="fab fa-microsoft" /> Publish to Channel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildTopRanked(
  columns: Array<{ cards: Array<{ content: string; id: string; votesCount: number }>; key: string; label: string }>,
): RankedCard[] {
  const flat: RankedCard[] = [];

  columns.forEach((col, columnIndex) => {
    col.cards.forEach((card) => {
      flat.push({
        columnIndex,
        columnKey: col.key,
        columnLabel: col.label,
        content: card.content,
        id: card.id,
        votesCount: card.votesCount,
      });
    });
  });

  flat.sort((a, b) => b.votesCount - a.votesCount);

  return flat.slice(0, 3);
}
