import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCardTimeAgo, getColumnAccentColor, getColumnEmoji, sortColumns } from "../helpers.ts";
import { useLiveTimerDisplay } from "../hooks/useLiveTimerDisplay.ts";
import styles from "./BoardCollect.module.css";
import type { Card, TemplateValue } from "../../../shared/lib/api-client.ts";

export interface BoardCollectDesktopProps {
  cards: Card[];
  collectTimerConfigured: boolean;
  collectTimerNotStarted: boolean;
  collectTimerSeconds: null | number;
  columns: TemplateValue[];
  graceActive: boolean;
  graceBanner: boolean;
  graceUsedColumns: Set<string>;
  isModerator: boolean;
  myOwnerHash: null | string;
  onAdvanceToVote: () => void;
  onBack: () => void;
  onCreateCard: (columnKey: string, content: string) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onDismissGraceBanner: () => void;
  onGraceCardAdded: (columnKey: string) => void;
  onStartCollect: () => void;
  onToggleTimerPause: () => void;
  onUpdateCard: (cardId: string, content: string) => Promise<void>;
  pausedRemainingSeconds: null | number;
  sessionTitle: string;
  templateCode: string;
  timerExpired: boolean;
  timerExpiresAt: null | string;
  timerPaused: boolean;
  waitingForModerator: boolean;
}

interface CollectCardProps {
  card: Card;
  isEditing: boolean;
  isOwn: boolean;
  onDelete: () => Promise<void>;
  onEditCancel: () => void;
  onEditSave: (content: string) => Promise<void>;
  onEditStart: () => void;
}

interface ColumnProps {
  cards: Card[];
  collectTimerBlocksAdd: boolean;
  column: TemplateValue;
  columnIndex: number;
  editingCardId: null | string;
  graceActive: boolean;
  graceUsed: boolean;
  myOwnerHash: null | string;
  onCreateCard: (columnKey: string, content: string) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onEditChange: (id: null | string) => void;
  onGraceCardAdded: (columnKey: string) => void;
  onUpdateCard: (cardId: string, content: string) => Promise<void>;
  templateCode: string;
}

export default function BoardCollect({
  cards,
  collectTimerConfigured,
  collectTimerNotStarted,
  collectTimerSeconds,
  columns: columnsRaw,
  graceActive,
  graceBanner,
  graceUsedColumns,
  isModerator,
  myOwnerHash,
  onAdvanceToVote,
  onBack,
  onCreateCard,
  onDeleteCard,
  onDismissGraceBanner,
  onGraceCardAdded,
  onStartCollect,
  onToggleTimerPause,
  onUpdateCard,
  pausedRemainingSeconds,
  sessionTitle,
  templateCode,
  timerExpired,
  timerExpiresAt,
  timerPaused,
  waitingForModerator,
}: BoardCollectDesktopProps) {
  const columns = useMemo(() => sortColumns(columnsRaw), [columnsRaw]);
  const liveTimerText = useLiveTimerDisplay(timerExpiresAt);
  const pausedTimerText = formatSecondsAsTimer(pausedRemainingSeconds);
  let timerText = liveTimerText;

  if (collectTimerNotStarted && collectTimerSeconds !== null) {
    timerText = formatSecondsAsTimer(collectTimerSeconds);
  }

  if (timerPaused) {
    timerText = pausedTimerText;
  }
  if (timerExpired) {
    timerText = "00:00";
  }

  const contributorCount = useMemo(() => new Set(cards.map((c) => c.ownerHash)).size, [cards]);
  const onlineLabel = Math.max(contributorCount, 1);

  const [editingCardId, setEditingCardId] = useState<null | string>(null);

  const handleDelete = useCallback(
    async (cardId: string) => {
      if (!window.confirm("Delete this card?")) {
        return;
      }
      await onDeleteCard(cardId);
      setEditingCardId((id) => (id === cardId ? null : id));
    },
    [onDeleteCard],
  );

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
            <div className={`${styles.phaseStep} ${styles.phaseStepActive}`}>
              <i aria-hidden className={`fas fa-pen-to-square ${styles.phaseStepIcon}`} />
              Collect
            </div>
            <div className={styles.phaseConnector} />
            <div className={`${styles.phaseStep} ${styles.phaseStepUpcoming}`}>
              <i aria-hidden className={`fas fa-thumbs-up ${styles.phaseStepIcon}`} />
              Vote
            </div>
            <div className={styles.phaseConnector} />
            <div className={`${styles.phaseStep} ${styles.phaseStepUpcoming}`}>
              <i aria-hidden className={`fas fa-chart-simple ${styles.phaseStepIcon}`} />
              Summary
            </div>
          </div>

          <div className={`${styles.timerDisplay} ${timerExpired ? styles.timerDisplayExpired : ""}`}>
            <i
              aria-hidden
              className={`fas fa-clock ${styles.timerIcon} ${timerExpired ? styles.timerIconExpired : ""}`}
            />
            <span className={`${styles.timerValue} ${timerExpired ? styles.timerValueExpired : ""}`}>{timerText}</span>
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
            <span>Moderator view — You control the session flow</span>
          </div>
          <div className={styles.moderatorBarRight}>
            {collectTimerNotStarted ? (
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.modBtnTight}`}
                type="button"
                onClick={onStartCollect}
              >
                <i aria-hidden className="fas fa-play" /> Start Retrospective
              </button>
            ) : (
              <>
                <button
                  className={`${styles.btn} ${styles.btnSubtle} ${styles.modBtnTight}`}
                  type="button"
                  onClick={onToggleTimerPause}
                >
                  <i aria-hidden className={`fas ${timerPaused ? "fa-play" : "fa-pause"}`} />{" "}
                  {timerPaused ? "Resume Timer" : "Pause Timer"}
                </button>
                <button
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.modBtnTight}`}
                  type="button"
                  onClick={onAdvanceToVote}
                >
                  Next: Voting <i aria-hidden className="fas fa-arrow-right" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {waitingForModerator && (
        <div className={styles.waitingBanner}>Waiting for moderator to start the retrospective...</div>
      )}

      {graceBanner && (
        <div className={styles.graceBanner}>
          <span>Time is up! You may add one last card per column.</span>
          <button
            aria-label="Dismiss timer warning"
            className={styles.graceDismissBtn}
            type="button"
            onClick={onDismissGraceBanner}
          >
            <i aria-hidden className="fas fa-xmark" />
          </button>
        </div>
      )}

      <div className={styles.boardContainer}>
        {columns.map((col, index) => (
          <BoardCollectColumn
            key={col.value}
            cards={cards.filter((c) => c.columnKey === col.value)}
            collectTimerBlocksAdd={collectTimerConfigured && collectTimerNotStarted}
            column={col}
            columnIndex={index}
            editingCardId={editingCardId}
            graceActive={graceActive}
            graceUsed={graceUsedColumns.has(col.value)}
            myOwnerHash={myOwnerHash}
            templateCode={templateCode}
            onCreateCard={onCreateCard}
            onDeleteCard={handleDelete}
            onEditChange={setEditingCardId}
            onGraceCardAdded={onGraceCardAdded}
            onUpdateCard={onUpdateCard}
          />
        ))}
      </div>
    </div>
  );
}

function BoardCollectCard({
  card,
  isEditing,
  isOwn,
  onDelete,
  onEditCancel,
  onEditSave,
  onEditStart,
}: CollectCardProps) {
  const [draft, setDraft] = useState(card.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setDraft(card.content);
    }
  }, [isEditing, card.content]);

  const handleSave = async () => {
    const t = draft.trim();

    if (!t || t === card.content) {
      onEditCancel();

      return;
    }
    setSaving(true);
    try {
      await onEditSave(t);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${styles.card} ${isOwn ? styles.cardOwn : ""}`}>
      {isEditing ? (
        <>
          <textarea
            className={styles.cardEditInput}
            maxLength={500}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className={styles.cardFooter}>
            <span className={styles.cardMeta} />
            <div className={styles.cardActions} style={{ opacity: 1 }}>
              <button
                className={styles.cardActionBtn}
                disabled={saving}
                title="Cancel"
                type="button"
                onClick={onEditCancel}
              >
                <i className="fas fa-xmark" />
              </button>
              <button
                className={styles.cardActionBtn}
                disabled={saving}
                title="Save"
                type="button"
                onClick={() => void handleSave()}
              >
                <i className="fas fa-check" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.cardContent}>{card.content}</div>
          <div className={styles.cardFooter}>
            <div className={styles.cardMeta}>
              <span>{formatCardTimeAgo(card.createdAt)}</span>
            </div>
            {isOwn && (
              <div className={styles.cardActions}>
                <button className={styles.cardActionBtn} title="Edit" type="button" onClick={onEditStart}>
                  <i className="fas fa-pen" />
                </button>
                <button
                  className={`${styles.cardActionBtn} ${styles.cardActionBtnDelete}`}
                  title="Delete"
                  type="button"
                  onClick={() => void onDelete()}
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BoardCollectColumn({
  cards,
  collectTimerBlocksAdd,
  column,
  columnIndex,
  editingCardId,
  graceActive,
  graceUsed,
  myOwnerHash,
  onCreateCard,
  onDeleteCard,
  onEditChange,
  onGraceCardAdded,
  onUpdateCard,
  templateCode,
}: ColumnProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const accent = getColumnAccentColor(column, templateCode, columnIndex);
  const emoji = getColumnEmoji(templateCode, columnIndex);

  const canAddCard = !collectTimerBlocksAdd && (!graceActive || !graceUsed);
  const charLen = text.length;
  const counterClass = charLen > 450 ? styles.charCounterWarn : "";

  const resizeTextarea = useCallback(() => {
    const el = inputRef.current;

    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [text, resizeTextarea]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting || !canAddCard) {
      return;
    }
    setSubmitting(true);
    try {
      await onCreateCard(column.value, text.trim());
      setText("");
      if (graceActive) {
        onGraceCardAdded(column.value);
      }
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

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
          <BoardCollectCard
            key={card.id}
            card={card}
            isEditing={editingCardId === card.id}
            isOwn={myOwnerHash !== null && card.ownerHash === myOwnerHash}
            onDelete={() => onDeleteCard(card.id)}
            onEditCancel={() => onEditChange(null)}
            onEditSave={async (content) => {
              await onUpdateCard(card.id, content);
              onEditChange(null);
            }}
            onEditStart={() => onEditChange(card.id)}
          />
        ))}
      </div>

      {canAddCard && (
        <div className={styles.addCardArea}>
          <div className={styles.addCardInputWrapper}>
            <textarea
              ref={inputRef}
              className={styles.addCardInput}
              maxLength={500}
              placeholder="Add a card..."
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onInput={resizeTextarea}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
            <button
              aria-label="Add card"
              className={styles.addCardSubmit}
              disabled={!text.trim() || submitting}
              type="button"
              onClick={() => void handleSubmit()}
            >
              <i className="fas fa-plus" />
            </button>
          </div>
          <div className={`${styles.charCounter} ${counterClass}`}>{charLen} / 500</div>
        </div>
      )}

      {graceActive && graceUsed && <p className={styles.graceDoneLabel}>Last card added</p>}
    </div>
  );
}

function formatSecondsAsTimer(seconds: null | number): string {
  if (seconds === null) {
    return "--:--";
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
