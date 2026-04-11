import type { TemplateValue } from "../../shared/lib/api-client.ts";

/** Tag style for TMP/04-summary-results.html (SSC start/stop/continue). */
export type SummaryTagKind = "continue" | "other" | "start" | "stop";

/** Relative time like the HTML mock ("2 min ago"). */
export function formatCardTimeAgo(iso: string): string {
  const t = new Date(iso).getTime();

  if (Number.isNaN(t)) {
    return "";
  }
  const sec = Math.floor((Date.now() - t) / 1000);

  if (sec < 45) {
    return "just now";
  }
  const min = Math.floor(sec / 60);

  if (min < 60) {
    return `${min} min ago`;
  }
  const h = Math.floor(min / 60);

  if (h < 24) {
    return `${h} hr ago`;
  }
  const d = Math.floor(h / 24);

  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/** Session length for summary stats (e.g. "15m", "1h 5m"). */
export function formatSummaryDuration(createdAtIso: string, endAtIso?: null | string): string {
  const start = new Date(createdAtIso).getTime();
  const end = endAtIso ? new Date(endAtIso).getTime() : Date.now();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "—";
  }

  const totalMin = Math.max(0, Math.round((end - start) / 60_000));

  if (totalMin < 60) {
    return `${totalMin}m`;
  }

  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Top accent bar: prefer template color; fallback by column index for SSC-like layouts. */
export function getColumnAccentColor(column: TemplateValue, templateCode: string, columnIndex: number): string {
  if (column.color) {
    return column.color;
  }
  const code = templateCode.toUpperCase();

  if (code === "SSC") {
    return ["#5ec75a", "#e74c4c", "#479ef5"][columnIndex] ?? "#6264a7";
  }
  if (code === "MSG") {
    return ["#e74c4c", "#479ef5", "#5ec75a"][columnIndex] ?? "#6264a7";
  }

  return "#6264a7";
}

/** Emoji per column — aligned with TMP/01-board-collect-desktop.html (SSC). */
export function getColumnEmoji(templateCode: string, columnIndex: number): string {
  const code = templateCode.toUpperCase();

  if (code === "SSC") {
    return ["🚀", "🛑", "🔄"][columnIndex] ?? "📝";
  }
  if (code === "MSG") {
    return ["😡", "😢", "😊"][columnIndex] ?? "📝";
  }
  if (code === "4L") {
    return ["👍", "💡", "❌", "💭"][columnIndex] ?? "📝";
  }

  return "📝";
}

export function getSummaryTagKind(templateCode: string, columnIndex: number): SummaryTagKind {
  const code = templateCode.toUpperCase();

  if (code === "SSC") {
    return (["start", "stop", "continue"] as const)[columnIndex] ?? "other";
  }

  if (code === "MSG") {
    return (["stop", "continue", "start"] as const)[columnIndex] ?? "other";
  }

  return "other";
}

export function sortColumns(values: TemplateValue[]): TemplateValue[] {
  return [...values].sort((a, b) => a.sortOrder - b.sortOrder);
}
