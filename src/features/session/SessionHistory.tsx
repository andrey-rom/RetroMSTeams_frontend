import { useMemo, useState } from "react";

import {
  type HistoryUiStatus,
  STATUS_FILTER_OPTIONS,
  TEMPLATE_FILTER_OPTIONS,
  formatSessionHistoryMeta,
  getHistoryUiStatus,
} from "./historyHelpers.ts";
import { useSessionsQuery } from "./hooks/useSessionsQuery.ts";

import styles from "./SessionHistory.module.css";
import type { Session } from "../../shared/lib/api-client.ts";

export interface SessionHistoryDesktopProps {
  channelId?: string;
  onSessionOpen: (sessionId: string) => void;
}

export default function SessionHistory({ channelId, onSessionOpen }: SessionHistoryDesktopProps) {
  const { data: sessions = [], error, isError, isPending } = useSessionsQuery(channelId);
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | HistoryUiStatus>("");

  const filtered = useMemo(
    () => filterSessions(sessions, search, templateFilter, statusFilter),
    [sessions, search, templateFilter, statusFilter],
  );

  if (isPending) {
    return (
      <div className={styles.historyRoot}>
        <div className={styles.loading}>Loading sessions…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.historyRoot}>
        <div className={styles.error}>{error instanceof Error ? error.message : "Failed to load sessions"}</div>
      </div>
    );
  }

  return (
    <div className={styles.historyRoot}>
      <div className={styles.historyContent}>
        <div className={styles.historyContainer}>
          <div className={styles.pageHeading}>
            <div>
              <h1 className={styles.pageTitle}>Session History</h1>
              <p className={styles.pageSubtitle}>Past retrospectives for this channel</p>
            </div>
          </div>

          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <i aria-hidden className={`fas fa-search ${styles.searchIcon}`} />
              <input
                aria-label="Search sessions"
                className={styles.searchInput}
                placeholder="Search sessions..."
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              aria-label="Filter by template"
              className={styles.filterSelect}
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
            >
              {TEMPLATE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | HistoryUiStatus)}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {sessions.length === 0 ? (
            <div className={styles.emptyState}>
              <div aria-hidden className={styles.emptyIcon}>
                <i className="fas fa-inbox" />
              </div>
              <div className={styles.emptyTitle}>No sessions yet</div>
              <div className={styles.emptyDesc}>Create a new retrospective to see it here.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div aria-hidden className={styles.emptyIcon}>
                <i className="fas fa-filter" />
              </div>
              <div className={styles.emptyTitle}>No matching sessions</div>
              <div className={styles.emptyDesc}>Try adjusting search or filters.</div>
            </div>
          ) : (
            <div className={styles.sessionList}>
              {filtered.map((session) => (
                <SessionHistoryCard key={session.id} session={session} onOpen={() => onSessionOpen(session.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function filterSessions(
  sessions: Session[],
  search: string,
  templateCode: string,
  status: "" | HistoryUiStatus,
): Session[] {
  const q = search.trim().toLowerCase();

  return sessions.filter((session) => {
    if (q && !session.title.toLowerCase().includes(q)) {
      return false;
    }

    if (templateCode && session.templateType.code.toUpperCase() !== templateCode.toUpperCase()) {
      return false;
    }

    if (status) {
      const ui = getHistoryUiStatus(session);

      if (ui !== status) {
        return false;
      }
    }

    return true;
  });
}

function SessionHistoryCard({ onOpen, session }: { onOpen: () => void; session: Session }) {
  const status = getHistoryUiStatus(session);
  const meta = formatSessionHistoryMeta(session, status);
  const code = session.templateType?.code ?? "—";

  const cards = session.cardsCount ?? 0;
  const participants = session.participantsCount ?? 0;
  const votes = session.votesCount ?? 0;

  const iconEmoji = status === "active" ? "\u{1F504}" : status === "completed" ? "\u2705" : "\u{1F4DD}";
  const iconClass =
    status === "active"
      ? styles.sessionIconActive
      : status === "completed"
        ? styles.sessionIconCompleted
        : styles.sessionIconDraft;

  const badgeClass =
    status === "active"
      ? styles.statusBadgeActive
      : status === "completed"
        ? styles.statusBadgeCompleted
        : styles.statusBadgeDraft;

  return (
    <div
      className={styles.sessionCard}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className={styles.sessionCardLeft}>
        <div aria-hidden className={`${styles.sessionIcon} ${iconClass}`}>
          {iconEmoji}
        </div>
        <div className={styles.sessionInfo}>
          <div className={styles.sessionCardTitle}>{session.title}</div>
          <div className={styles.sessionCardMeta}>
            {status === "active" && (
              <span className={`${styles.statusBadge} ${badgeClass}`}>
                <i aria-hidden className={`fas fa-circle ${styles.statusDot}`} /> Active
              </span>
            )}
            {status === "completed" && (
              <span className={`${styles.statusBadge} ${badgeClass}`}>
                <i aria-hidden className={`fas fa-check ${styles.statusCheck}`} /> Completed
              </span>
            )}
            {status === "draft" && (
              <span className={`${styles.statusBadge} ${badgeClass}`}>
                <i aria-hidden className={`fas fa-pen ${styles.statusPen}`} /> Draft
              </span>
            )}
            <span className={styles.templateTag}>{code}</span>
            <span>{meta}</span>
          </div>
        </div>
      </div>
      <div className={styles.sessionStats}>
        {status !== "draft" && (
          <>
            <div className={styles.sessionStat}>
              <div className={styles.sessionStatValue}>{cards}</div>
              <div className={styles.sessionStatLabel}>Cards</div>
            </div>
            <div className={styles.sessionStat}>
              <div className={styles.sessionStatValue}>{participants}</div>
              <div className={styles.sessionStatLabel}>Participants</div>
            </div>
            {status === "completed" && (
              <div className={styles.sessionStat}>
                <div className={styles.sessionStatValue}>{votes}</div>
                <div className={styles.sessionStatLabel}>Votes</div>
              </div>
            )}
          </>
        )}
      </div>
      <i aria-hidden className={`fas fa-chevron-right ${styles.sessionArrow}`} />
    </div>
  );
}
