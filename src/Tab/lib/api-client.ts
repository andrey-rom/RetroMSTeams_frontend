/**
 * API base URL from environment variables (VITE_API_URL)
 * Falls back to localhost for local development if not specified
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export function getUserId(): string {
  let id = localStorage.getItem("retrobot-user-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("retrobot-user-id", id);
  }
  return id;
}

export function getUserDisplayName(): string {
  return localStorage.getItem("retrobot-user-name") || "Anonymous";
}

export function setUserDisplayName(name: string): void {
  localStorage.setItem("retrobot-user-name", name);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": getUserId(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface TemplateValue {
  id: string;
  value: string;
  label: string;
  color: string;
  sortOrder: number;
}

export interface Template {
  id: string;
  code: string;
  name: string;
  description: string | null;
  values: TemplateValue[];
}

export interface Session {
  id: string;
  title: string;
  creatorId: string;
  currentStatus: string;
  currentPhase: string;
  maxVotesPerUser: number;
  collectTimerSeconds: number | null;
  voteTimerSeconds: number | null;
  timerExpiresAt: string | null;
  collectGraceAt: string | null;
  createdAt: string;
  reportMessageId: string | null;
  templateType: Template;
}

export interface Card {
  id: string;
  sessionId: string;
  columnKey: string;
  content: string;
  ownerHash: string;
  votesCount: number;
  createdAt: string;
}

export const api = {
  getTemplates: () => request<Template[]>("/templates"),

  createSession: (
    title: string,
    templateTypeId: string,
    opts?: { collectTimerSeconds?: number; voteTimerSeconds?: number },
  ) =>
    request<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify({ title, templateTypeId, ...opts }),
    }),

  getSession: (id: string) => request<Session>(`/sessions/${id}`),

  getSessions: () => request<Session[]>("/sessions"),

  getCards: (sessionId: string) =>
    request<Card[]>(`/sessions/${sessionId}/cards`),

  createCard: (sessionId: string, columnKey: string, content: string) =>
    request<Card>(`/sessions/${sessionId}/cards`, {
      method: "POST",
      body: JSON.stringify({ columnKey, content }),
    }),

  getMyVotes: (sessionId: string) =>
    request<{ cardIds: string[] }>(`/sessions/${sessionId}/my-votes`),

  castVote: (cardId: string) =>
    request<{ cardId: string; votesCount: number }>(`/cards/${cardId}/vote`, {
      method: "POST",
    }),

  removeVote: (cardId: string) =>
    request<{ cardId: string; votesCount: number }>(`/cards/${cardId}/vote`, {
      method: "DELETE",
    }),

  getGraceStatus: (sessionId: string) =>
    request<{ graceActive: boolean; usedColumns: string[] }>(`/sessions/${sessionId}/grace-status`),

  startCollect: (sessionId: string) =>
    request<{ started: boolean }>(`/sessions/${sessionId}/start`, {
      method: "POST",
    }),

  advancePhase: (sessionId: string, phase: "collect" | "vote" | "summary") =>
    request<Session>(`/sessions/${sessionId}/phase`, {
      method: "PUT",
      body: JSON.stringify({ phase }),
    }),

  getSummary: (sessionId: string) =>
    request<SessionSummary>(`/sessions/${sessionId}/summary`),

  publishSummary: (sessionId: string) =>
    request<{ sessionId: string; messageId: string; published: boolean }>(
      `/sessions/${sessionId}/publish`,
      { method: "POST" },
    ),
};

export interface SummaryCard {
  id: string;
  content: string;
  votesCount: number;
}

export interface SummaryColumn {
  key: string;
  label: string;
  color: string;
  cards: SummaryCard[];
  totalCards: number;
  totalVotes: number;
}

export interface SessionSummary {
  sessionId: string;
  title: string;
  templateName: string;
  currentPhase: string;
  currentStatus: string;
  createdAt: string;
  columns: SummaryColumn[];
  totals: {
    cards: number;
    votes: number;
    participants: number;
  };
}
