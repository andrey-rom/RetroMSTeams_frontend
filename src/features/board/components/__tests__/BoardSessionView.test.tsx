import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BoardSessionView, { type BoardSessionViewProps } from "../BoardSessionView.tsx";
import type { Session } from "../../../../shared/lib/api-client.ts";

let collectCapturedProps: null | Record<string, unknown> = null;
let voteCapturedProps: null | Record<string, unknown> = null;
let summaryCapturedProps: null | Record<string, unknown> = null;

vi.mock("../BoardCollect.tsx", () => ({
  default: (props: Record<string, unknown>) => {
    collectCapturedProps = props;

    return <div data-testid="board-collect-mock">collect-view</div>;
  },
}));

vi.mock("../BoardVote.tsx", () => ({
  default: (props: Record<string, unknown>) => {
    voteCapturedProps = props;

    return <div data-testid="board-vote-mock">vote-view</div>;
  },
}));

vi.mock("../BoardSummary.tsx", () => ({
  default: (props: Record<string, unknown>) => {
    summaryCapturedProps = props;

    return <div data-testid="board-summary-mock">summary-view</div>;
  },
}));

function createProps(phase: string, overrides: Partial<BoardSessionViewProps> = {}): BoardSessionViewProps {
  return {
    cards: [],
    graceActive: false,
    graceUsedColumns: new Set<string>(),
    isModerator: false,
    myOwnerHash: "owner-hash",
    onAdvanceToSummary: vi.fn(),
    onAdvanceToVote: vi.fn(),
    onBack: vi.fn(),
    onCreateCard: vi.fn(async () => {}),
    onDeleteCard: vi.fn(async () => {}),
    onDismissTimerExpired: vi.fn(),
    onExitToHistory: vi.fn(),
    onGraceCardAdded: vi.fn(),
    onPublish: vi.fn(),
    onStartCollect: vi.fn(),
    onUpdateCard: vi.fn(async () => {}),
    onVoteToggle: vi.fn(),
    session: createSession(phase),
    sessionId: "session-1",
    timerExpired: false,
    votedCardIds: new Set<string>(),
    ...overrides,
  };
}

function createSession(phase: string): Session {
  return {
    collectGraceAt: null,
    collectTimerSeconds: 120,
    createdAt: "2026-04-14T10:00:00.000Z",
    creatorId: "creator-1",
    currentPhase: phase,
    currentStatus: "active",
    id: "session-1",
    maxVotesPerUser: 3,
    reportMessageId: null,
    templateType: {
      code: "SSC",
      description: null,
      id: "template-1",
      name: "Start Stop Continue",
      values: [
        { color: "#00AA00", id: "col-1", label: "Start", sortOrder: 1, value: "start" },
        { color: "#AA0000", id: "col-2", label: "Stop", sortOrder: 2, value: "stop" },
      ],
    },
    timerExpiresAt: null,
    title: "Sprint Retro",
    voteTimerSeconds: 180,
  };
}

describe("BoardSessionView", () => {
  it("renders collect phase and computes collect flags", () => {
    collectCapturedProps = null;

    render(<BoardSessionView {...createProps("collect")} />);

    expect(screen.getByTestId("board-collect-mock")).toBeTruthy();
    expect(collectCapturedProps).toMatchObject({
      collectTimerConfigured: true,
      collectTimerNotStarted: true,
      sessionTitle: "Sprint Retro",
      templateCode: "SSC",
      waitingForModerator: true,
    });
  });

  it("renders vote phase and forwards vote-related props", () => {
    voteCapturedProps = null;
    const votedCardIds = new Set<string>(["card-1", "card-2"]);

    render(<BoardSessionView {...createProps("vote", { timerExpired: true, votedCardIds })} />);

    expect(screen.getByTestId("board-vote-mock")).toBeTruthy();
    expect(voteCapturedProps).toMatchObject({
      isModerator: false,
      maxVotesPerUser: 3,
      sessionTitle: "Sprint Retro",
      templateCode: "SSC",
      timerExpired: true,
      votedCardIds,
    });
  });

  it("renders summary phase and forwards summary actions", () => {
    summaryCapturedProps = null;
    const onPublish = vi.fn();
    const onExitToHistory = vi.fn();

    render(<BoardSessionView {...createProps("summary", { onExitToHistory, onPublish })} />);

    expect(screen.getByTestId("board-summary-mock")).toBeTruthy();
    expect(summaryCapturedProps).toMatchObject({
      isModerator: false,
      onExitToHistory,
      onPublish,
      sessionId: "session-1",
    });
  });

  it("renders fallback for unsupported phase", () => {
    render(<BoardSessionView {...createProps("archived")} />);

    expect(screen.getByText("Unknown session phase")).toBeTruthy();
  });
});
