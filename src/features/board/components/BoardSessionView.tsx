import BoardCollect from "./BoardCollect.tsx";
import BoardVote from "./BoardVote.tsx";
import BoardSummary from "./BoardSummary.tsx";
import type { Session, Card, TemplateValue } from "../../../shared/lib/api-client.ts";

export interface BoardSessionViewProps {
  cards: Card[];
  graceActive: boolean;
  graceUsedColumns: Set<string>;
  isModerator: boolean;
  myOwnerHash: null | string;
  onAdvanceToSummary: () => void;
  onAdvanceToVote: () => void;
  onBack: () => void;
  onCreateCard: (columnKey: string, content: string) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onDismissTimerExpired: () => void;
  onGraceCardAdded: (columnKey: string) => void;
  onPublish: () => Promise<void> | void;
  onStartCollect: () => void;
  onUpdateCard: (cardId: string, content: string) => Promise<void>;
  onVoteToggle: (cardId: string, voted: boolean) => void;
  session: Session;
  sessionId: string;
  timerExpired: boolean;
  votedCardIds: Set<string>;
}

export default function BoardSessionView({
  cards,
  graceActive,
  graceUsedColumns,
  isModerator,
  myOwnerHash,
  onAdvanceToSummary,
  onAdvanceToVote,
  onBack,
  onCreateCard,
  onDeleteCard,
  onDismissTimerExpired,
  onGraceCardAdded,
  onPublish,
  onStartCollect,
  onUpdateCard,
  onVoteToggle,
  session,
  sessionId,
  timerExpired,
  votedCardIds,
}: BoardSessionViewProps) {
  const columns: TemplateValue[] = session.templateType?.values ?? [];
  const templateCode = session.templateType?.code ?? "";

  const collectTimerConfigured = !!session.collectTimerSeconds;
  const collectTimerNotStarted = collectTimerConfigured && !session.timerExpiresAt && !session.collectGraceAt;

  switch (session.currentPhase) {
    case "collect":
      return (
        <BoardCollect
          cards={cards}
          collectTimerConfigured={collectTimerConfigured}
          collectTimerNotStarted={collectTimerNotStarted}
          columns={columns}
          graceActive={graceActive}
          graceBanner={graceActive}
          graceUsedColumns={graceUsedColumns}
          isModerator={isModerator}
          myOwnerHash={myOwnerHash}
          sessionTitle={session.title}
          templateCode={templateCode}
          timerExpiresAt={session.timerExpiresAt}
          waitingForModerator={!isModerator && collectTimerNotStarted}
          onAdvanceToVote={onAdvanceToVote}
          onBack={onBack}
          onCreateCard={onCreateCard}
          onDeleteCard={onDeleteCard}
          onGraceCardAdded={onGraceCardAdded}
          onStartCollect={onStartCollect}
          onUpdateCard={onUpdateCard}
        />
      );
    case "summary":
      return (
        <BoardSummary
          isModerator={isModerator}
          session={session}
          sessionId={sessionId}
          onBack={onBack}
          onPublish={onPublish}
        />
      );
    case "vote":
      return (
        <BoardVote
          cards={cards}
          columns={columns}
          isModerator={isModerator}
          maxVotesPerUser={session.maxVotesPerUser}
          sessionTitle={session.title}
          templateCode={templateCode}
          timerExpired={timerExpired}
          timerExpiresAt={session.timerExpiresAt}
          votedCardIds={votedCardIds}
          onAdvanceToSummary={onAdvanceToSummary}
          onBack={onBack}
          onDismissTimerExpired={onDismissTimerExpired}
          onVoteToggle={onVoteToggle}
        />
      );
    default:
      return <p>Unknown session phase</p>;
  }
}
