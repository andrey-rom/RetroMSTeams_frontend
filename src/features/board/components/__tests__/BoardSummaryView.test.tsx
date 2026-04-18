import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BoardSummary, { type BoardSummaryDesktopProps } from "../BoardSummary.tsx";
import type { Session, SessionSummary } from "../../../../shared/lib/api-client.ts";

const useSessionSummaryQueryMock = vi.fn();

vi.mock("../../hooks/useSessionSummary.ts", () => ({
  useSessionSummaryQuery: (sessionId: string) => useSessionSummaryQueryMock(sessionId),
}));

function createProps(overrides: Partial<BoardSummaryDesktopProps> = {}): BoardSummaryDesktopProps {
  return {
    isModerator: true,
    onBack: vi.fn(),
    onExitToHistory: vi.fn(),
    onPublish: vi.fn(),
    session: createSession(),
    sessionId: "session-1",
    ...overrides,
  };
}

function createSession(): Session {
  return {
    collectGraceAt: null,
    collectTimerSeconds: 120,
    createdAt: "2026-04-14T10:00:00.000Z",
    creatorId: "creator-1",
    currentPhase: "summary",
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
        { color: "#55AA55", id: "c1", label: "Start", sortOrder: 1, value: "start" },
        { color: "#AA5555", id: "c2", label: "Stop", sortOrder: 2, value: "stop" },
        { color: "#5599DD", id: "c3", label: "Continue", sortOrder: 3, value: "continue" },
      ],
    },
    timerExpiresAt: null,
    title: "Sprint Retro",
    updatedAt: "2026-04-14T10:40:00.000Z",
    voteTimerSeconds: 180,
  };
}

function createSummary(): SessionSummary {
  return {
    columns: [
      {
        cards: [
          { content: "Document release checklist", id: "card-1", votesCount: 7 },
          { content: "Create onboarding guide", id: "card-2", votesCount: 4 },
        ],
        color: "#55AA55",
        key: "start",
        label: "Start",
        totalCards: 2,
        totalVotes: 11,
      },
      {
        cards: [{ content: "Last-minute deployment changes", id: "card-3", votesCount: 5 }],
        color: "#AA5555",
        key: "stop",
        label: "Stop",
        totalCards: 1,
        totalVotes: 5,
      },
      {
        cards: [{ content: "Daily standup updates", id: "card-4", votesCount: 3 }],
        color: "#5599DD",
        key: "continue",
        label: "Continue",
        totalCards: 1,
        totalVotes: 3,
      },
    ],
    createdAt: "2026-04-14T10:00:00.000Z",
    currentPhase: "summary",
    currentStatus: "active",
    sessionId: "session-1",
    templateName: "Start Stop Continue",
    title: "Sprint Retro",
    totals: {
      cards: 4,
      participants: 3,
      votes: 14,
    },
  };
}

afterEach(() => {
  cleanup();
  useSessionSummaryQueryMock.mockReset();
});

describe("BoardSummaryView", () => {
  it("renders loading state while summary is pending", () => {
    useSessionSummaryQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: true,
    });

    render(<BoardSummary {...createProps()} />);

    expect(screen.getByText("Loading summary…")).toBeTruthy();
  });

  it("renders error state when summary query fails", () => {
    useSessionSummaryQueryMock.mockReturnValue({
      data: undefined,
      error: new Error("summary failed"),
      isError: true,
      isPending: false,
    });

    render(<BoardSummary {...createProps()} />);

    expect(screen.getByText("summary failed")).toBeTruthy();
  });

  it("renders summary content and supports moderator actions", () => {
    const onPublish = vi.fn();
    const onBack = vi.fn();
    const onExitToHistory = vi.fn();

    useSessionSummaryQueryMock.mockReturnValue({
      data: createSummary(),
      error: null,
      isError: false,
      isPending: false,
    });

    render(<BoardSummary {...createProps({ onBack, onExitToHistory, onPublish })} />);

    expect(screen.getByText("Top Voted Items")).toBeTruthy();
    expect(screen.getByText("Total Cards")).toBeTruthy();
    expect(screen.getByText("Participants")).toBeTruthy();
    expect(screen.getByText("Total Votes")).toBeTruthy();
    expect(screen.getAllByText("Document release checklist").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /back to session history/i }));
    fireEvent.click(screen.getByRole("button", { name: /back to board/i }));
    fireEvent.click(screen.getByRole("button", { name: /publish to channel/i }));

    expect(onExitToHistory).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it("hides publish section for non-moderator", () => {
    useSessionSummaryQueryMock.mockReturnValue({
      data: createSummary(),
      error: null,
      isError: false,
      isPending: false,
    });

    render(<BoardSummary {...createProps({ isModerator: false })} />);

    expect(screen.queryByText("Ready to Publish?")).toBeNull();
    expect(screen.queryByRole("button", { name: /publish to channel/i })).toBeNull();
  });
});
