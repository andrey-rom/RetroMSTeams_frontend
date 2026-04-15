import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BoardVote, { type BoardVoteDesktopProps } from "../BoardVote.tsx";

const castVoteMock = vi.fn();
const removeVoteMock = vi.fn();

vi.mock("../../hooks/useLiveTimerDisplay.ts", () => ({
  useLiveTimerDisplay: () => "01:30",
}));

vi.mock("../../../../shared/lib/api-client.ts", () => ({
  api: {
    castVote: (...args: unknown[]) => castVoteMock(...args),
    removeVote: (...args: unknown[]) => removeVoteMock(...args),
  },
}));

function createProps(overrides: Partial<BoardVoteDesktopProps> = {}): BoardVoteDesktopProps {
  return {
    cards: [
      {
        columnKey: "start",
        content: "Document release process",
        createdAt: "2026-04-14T10:00:00.000Z",
        id: "card-1",
        ownerHash: "owner-1",
        sessionId: "session-1",
        votesCount: 2,
      },
    ],
    columns: [{ color: "#55AA55", id: "col-1", label: "Start", sortOrder: 1, value: "start" }],
    isModerator: true,
    maxVotesPerUser: 2,
    onAdvanceToSummary: vi.fn(),
    onBack: vi.fn(),
    onDismissTimerExpired: vi.fn(),
    onVoteToggle: vi.fn(),
    sessionTitle: "Sprint Retro",
    templateCode: "SSC",
    timerExpired: false,
    timerExpiresAt: null,
    votedCardIds: new Set<string>(),
    ...overrides,
  };
}

beforeEach(() => {
  castVoteMock.mockReset();
  removeVoteMock.mockReset();
  vi.stubGlobal("alert", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BoardVoteView", () => {
  it("allows moderator to finish voting phase", () => {
    const onAdvanceToSummary = vi.fn();

    render(<BoardVote {...createProps({ onAdvanceToSummary })} />);
    fireEvent.click(screen.getByRole("button", { name: /finish: summary/i }));

    expect(onAdvanceToSummary).toHaveBeenCalledTimes(1);
  });

  it("shows timer expired banner and handles dismiss", () => {
    const onDismissTimerExpired = vi.fn();

    render(<BoardVote {...createProps({ onDismissTimerExpired, timerExpired: true })} />);
    expect(screen.getByText(/vote timer is up!/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismissTimerExpired).toHaveBeenCalledTimes(1);
  });

  it("casts vote for non-voted card", async () => {
    castVoteMock.mockResolvedValue({ cardId: "card-1", votesCount: 3 });
    const onVoteToggle = vi.fn();

    render(<BoardVote {...createProps({ onVoteToggle })} />);
    fireEvent.click(screen.getByRole("button", { name: /^vote$/i }));

    await waitFor(() => expect(castVoteMock).toHaveBeenCalledWith("card-1"));
    expect(onVoteToggle).toHaveBeenCalledWith("card-1", true);
  });

  it("removes vote for already voted card", async () => {
    removeVoteMock.mockResolvedValue({ cardId: "card-1", votesCount: 1 });
    const onVoteToggle = vi.fn();

    render(<BoardVote {...createProps({ onVoteToggle, votedCardIds: new Set<string>(["card-1"]) })} />);
    fireEvent.click(screen.getByRole("button", { name: /voted/i }));

    await waitFor(() => expect(removeVoteMock).toHaveBeenCalledWith("card-1"));
    expect(onVoteToggle).toHaveBeenCalledWith("card-1", false);
  });

  it("disables voting when vote limit reached", () => {
    render(<BoardVote {...createProps({ maxVotesPerUser: 1, votedCardIds: new Set<string>(["card-2"]) })} />);

    const button = screen.getByRole("button", { name: /^vote$/i }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  it("shows alert when vote request fails", async () => {
    castVoteMock.mockRejectedValue(new Error("Vote failed hard"));

    render(<BoardVote {...createProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /^vote$/i }));

    await waitFor(() => expect(globalThis.alert).toHaveBeenCalledWith("Vote failed hard"));
  });
});
