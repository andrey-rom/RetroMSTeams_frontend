import type { Template } from "./types/session.types.ts";

export function getPreviewByTemplate(
  template: Template | undefined,
): Array<{ text: string; tone: "blue" | "green" | "red" | "yellow" }> {
  if (!template) {
    return [];
  }

  if (template.name.includes("Start")) {
    return [
      { text: "🚀 Start", tone: "green" },
      { text: "🛑 Stop", tone: "red" },
      { text: "🔄 Continue", tone: "blue" },
    ];
  }

  if (template.name.includes("Mad")) {
    return [
      { text: "😡 Mad", tone: "red" },
      { text: "😢 Sad", tone: "blue" },
      { text: "😊 Glad", tone: "green" },
    ];
  }

  return [
    { text: "👍 Liked", tone: "green" },
    { text: "💡 Learned", tone: "blue" },
    { text: "❌ Lacked", tone: "red" },
    { text: "💭 Longed For", tone: "yellow" },
  ];
}

export function getTemplateIcon(template: Template): string {
  const code = template.code.toUpperCase();

  if (code.includes("SSC") || template.name.includes("Start")) {
    return "🚀";
  }
  if (code.includes("MSG") || template.name.includes("Mad")) {
    return "😡";
  }
  if (template.name.includes("4L")) {
    return "📚";
  }

  return "📝";
}

export function mapMinutesToSeconds(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return undefined;
  }

  return Math.round(minutes * 60);
}
