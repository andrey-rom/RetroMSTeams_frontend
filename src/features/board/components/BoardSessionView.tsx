import BoardCollect from "./BoardCollect.tsx";
import BoardVote from "./BoardVote.tsx";
import BoardSummary from "./BoardSummary.tsx";
import styles from "./BoardSessionView.module.css";
import type { Session, Card, TemplateValue } from "../../../shared/lib/api-client.ts";

export interface BoardSessionViewProps {
  advancingToSummary: boolean;
  advancingToVote: boolean;
  cards: Card[];
  graceActive: boolean;
  graceBannerVisible: boolean;
  graceUsedColumns: Set<string>;
  isModerator: boolean;
  myOwnerHash: null | string;
  onAdvanceToSummary: () => void;
  onAdvanceToVote: () => void;
  onBack: () => void;
  onCreateCard: (columnKey: string, content: string) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onDismissGraceBanner: () => void;
  onDismissTimerExpired: () => void;
  onExitToHistory: () => void;
  onGraceCardAdded: (columnKey: string) => void;
  onPublish: () => Promise<void> | void;
  onPublishNotificationClose: () => void;
  onStartCollect: () => void;
  onToggleTimerPause: () => void;
  onUpdateCard: (cardId: string, content: string) => Promise<void>;
  onVoteToggle: (cardId: string, voted: boolean) => void;
  publishingSummary: boolean;
  publishNotification: null | { id: number; message: string; type: "error" | "success" };
  pausedRemainingSeconds: null | number;
  session: Session;
  sessionId: string;
  startingCollect: boolean;
  timerExpired: boolean;
  timerPaused: boolean;
  votedCardIds: Set<string>;
  voteTimerElapsed: boolean;
}

export default function BoardSessionView({
  advancingToSummary,
  advancingToVote,
  cards,
  graceActive,
  graceBannerVisible,
  graceUsedColumns,
  isModerator,
  myOwnerHash,
  onAdvanceToSummary,
  onAdvanceToVote,
  onBack,
  onCreateCard,
  onDeleteCard,
  onDismissGraceBanner,
  onDismissTimerExpired,
  onExitToHistory,
  onGraceCardAdded,
  onPublish,
  onPublishNotificationClose,
  onStartCollect,
  onToggleTimerPause,
  onUpdateCard,
  onVoteToggle,
  publishingSummary,
  publishNotification,
  pausedRemainingSeconds,
  session,
  sessionId,
  startingCollect,
  timerExpired,
  timerPaused,
  votedCardIds,
  voteTimerElapsed,
}: BoardSessionViewProps) {
  const columns: TemplateValue[] = session.templateType?.values ?? [];
  const templateCode = session.templateType?.code ?? "";

  const collectTimerConfigured = !!session.collectTimerSeconds;
  const collectTimerNotStarted = collectTimerConfigured && !session.timerExpiresAt && !session.collectGraceAt;

  switch (session.currentPhase) {
    case "collect":
      return (
        <div className={styles.root}>
          <BoardCollect
            advanceToVotePending={advancingToVote}
            cards={cards}
            collectTimerConfigured={collectTimerConfigured}
            collectTimerNotStarted={collectTimerNotStarted}
            collectTimerSeconds={session.collectTimerSeconds}
            columns={columns}
            graceActive={graceActive}
            graceBanner={graceBannerVisible}
            graceUsedColumns={graceUsedColumns}
            isModerator={isModerator}
            myOwnerHash={myOwnerHash}
            pausedRemainingSeconds={pausedRemainingSeconds}
            sessionTitle={session.title}
            startCollectPending={startingCollect}
            templateCode={templateCode}
            timerExpired={graceActive}
            timerExpiresAt={session.timerExpiresAt}
            timerPaused={timerPaused}
            waitingForModerator={!isModerator && collectTimerNotStarted}
            onAdvanceToVote={onAdvanceToVote}
            onBack={onBack}
            onCreateCard={onCreateCard}
            onDeleteCard={onDeleteCard}
            onDismissGraceBanner={onDismissGraceBanner}
            onGraceCardAdded={onGraceCardAdded}
            onStartCollect={onStartCollect}
            onToggleTimerPause={onToggleTimerPause}
            onUpdateCard={onUpdateCard}
          />
        </div>
      );
    case "summary":
      return (
        <div className={styles.root}>
          <BoardSummary
            isModerator={isModerator}
            publishNotification={publishNotification}
            publishPending={publishingSummary}
            session={session}
            sessionId={sessionId}
            onBack={onBack}
            onExitToHistory={onExitToHistory}
            onPublish={onPublish}
            onPublishNotificationClose={onPublishNotificationClose}
          />
        </div>
      );
    case "vote":
      return (
        <div className={styles.root}>
          <BoardVote
            advanceToSummaryPending={advancingToSummary}
            cards={cards}
            columns={columns}
            isModerator={isModerator}
            maxVotesPerUser={session.maxVotesPerUser}
            pausedRemainingSeconds={pausedRemainingSeconds}
            sessionTitle={session.title}
            templateCode={templateCode}
            timerExpired={timerExpired}
            timerExpiresAt={session.timerExpiresAt}
            timerPaused={timerPaused}
            votedCardIds={votedCardIds}
            voteTimerElapsed={voteTimerElapsed}
            onAdvanceToSummary={onAdvanceToSummary}
            onBack={onBack}
            onDismissTimerExpired={onDismissTimerExpired}
            onToggleTimerPause={onToggleTimerPause}
            onVoteToggle={onVoteToggle}
          />
        </div>
      );
    default:
      return (
        <div className={styles.root}>
          <p>Unknown session phase</p>
        </div>
      );
  }
}
