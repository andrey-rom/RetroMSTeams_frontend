import type { TemplateValue } from "../../shared/lib/api-client.ts";

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

export function sortColumns(values: TemplateValue[]): TemplateValue[] {
  return [...values].sort((a, b) => a.sortOrder - b.sortOrder);
}
