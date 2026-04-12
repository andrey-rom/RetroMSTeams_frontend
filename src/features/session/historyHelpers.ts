import type { Session } from "../../shared/lib/api-client.ts";

export type HistoryUiStatus = "active" | "completed" | "draft";

/**
 * Secondary line under title (status badge + template are separate in UI).
 * Matches TMP/05-history-sessions.html copy patterns.
 */
export function formatSessionHistoryMeta(session: Session, status: HistoryUiStatus): string {
  if (status === "draft") {
    return `Created ${formatMediumDate(session.createdAt)}`;
  }

  if (status === "active") {
    return formatStartedAgo(session.createdAt);
  }

  return formatMediumDate(session.updatedAt ?? session.createdAt);
}

export function getHistoryUiStatus(session: Session): HistoryUiStatus {
  const s = session.currentStatus.toLowerCase();

  if (s === "draft") {
    return "draft";
  }

  if (s === "completed" || s === "archived") {
    return "completed";
  }

  return "active";
}

function formatMediumDate(iso: string): string {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/** Relative “Started 5 min ago” for active sessions. */
function formatStartedAgo(iso: string): string {
  const t = new Date(iso).getTime();

  if (Number.isNaN(t)) {
    return "";
  }
  const sec = Math.floor((Date.now() - t) / 1000);

  if (sec < 45) {
    return "Started just now";
  }
  const min = Math.floor(sec / 60);

  if (min < 60) {
    return `Started ${min} min ago`;
  }
  const h = Math.floor(min / 60);

  if (h < 24) {
    return `Started ${h} hr ago`;
  }
  const d = Math.floor(h / 24);

  return `Started ${d} day${d === 1 ? "" : "s"} ago`;
}

export const TEMPLATE_FILTER_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "", label: "All Templates" },
  { code: "SSC", label: "Start / Stop / Continue" },
  { code: "MSG", label: "Mad / Sad / Glad" },
  { code: "4L", label: "4L" },
];

export const STATUS_FILTER_OPTIONS: Array<{ label: string; value: "" | HistoryUiStatus }> = [
  { label: "All Statuses", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
];
