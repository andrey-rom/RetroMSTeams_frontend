import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BoardCollect, { type BoardCollectDesktopProps } from "../BoardCollect.tsx";

vi.mock("../../hooks/useLiveTimerDisplay.ts", () => ({
  useLiveTimerDisplay: () => "02:00",
}));

function createProps(overrides: Partial<BoardCollectDesktopProps> = {}): BoardCollectDesktopProps {
  return {
    cards: [],
    collectTimerConfigured: true,
    collectTimerNotStarted: true,
    columns: [{ color: "#5ec75a", id: "col-1", label: "Start", sortOrder: 1, value: "start" }],
    graceActive: false,
    graceBanner: false,
    graceUsedColumns: new Set<string>(),
    isModerator: true,
    myOwnerHash: "owner-1",
    onAdvanceToVote: vi.fn(),
    onBack: vi.fn(),
    onCreateCard: vi.fn(async () => {}),
    onDeleteCard: vi.fn(async () => {}),
    onGraceCardAdded: vi.fn(),
    onStartCollect: vi.fn(),
    onUpdateCard: vi.fn(async () => {}),
    sessionTitle: "Sprint Retro",
    templateCode: "SSC",
    timerExpiresAt: null,
    waitingForModerator: false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("BoardCollectView", () => {
  it("shows start button for moderator before collect timer starts", () => {
    const onStartCollect = vi.fn();

    render(<BoardCollect {...createProps({ onStartCollect })} />);

    fireEvent.click(screen.getByRole("button", { name: /start retrospective/i }));
    expect(onStartCollect).toHaveBeenCalledTimes(1);
  });

  it("shows next voting action when collect timer already started", () => {
    const onAdvanceToVote = vi.fn();

    render(<BoardCollect {...createProps({ collectTimerNotStarted: false, onAdvanceToVote })} />);

    fireEvent.click(screen.getByRole("button", { name: /next: voting/i }));
    expect(onAdvanceToVote).toHaveBeenCalledTimes(1);
  });

  it("creates a card in available column", async () => {
    const onCreateCard = vi.fn(async () => {});

    render(<BoardCollect {...createProps({ collectTimerConfigured: false, onCreateCard })} />);

    fireEvent.change(screen.getAllByPlaceholderText("Add a card...")[0], { target: { value: "Need better CI docs" } });
    fireEvent.click(screen.getByRole("button", { name: /add card/i }));

    await waitFor(() => expect(onCreateCard).toHaveBeenCalledWith("start", "Need better CI docs"));
  });

  it("shows waiting banner for non-moderator", () => {
    render(<BoardCollect {...createProps({ isModerator: false, waitingForModerator: true })} />);

    expect(screen.getByText(/waiting for moderator to start the retrospective/i)).toBeTruthy();
  });

  it("blocks adding card in grace when column already used", () => {
    render(
      <BoardCollect
        {...createProps({
          collectTimerConfigured: false,
          graceActive: true,
          graceUsedColumns: new Set<string>(["start"]),
        })}
      />,
    );

    expect(screen.queryAllByPlaceholderText("Add a card...")).toHaveLength(0);
    expect(screen.getByText("Last card added")).toBeTruthy();
  });
});
