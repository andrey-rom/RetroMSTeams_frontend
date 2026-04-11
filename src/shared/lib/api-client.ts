/**
 * API base URL from environment variables (VITE_API_URL)
 * Falls back to localhost for local development if not specified
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface Card {
  columnKey: string;
  content: string;
  createdAt: string;
  id: string;
  ownerHash: string;
  sessionId: string;
  votesCount: number;
}

export interface Session {
  collectGraceAt: null | string;
  collectTimerSeconds: null | number;
  createdAt: string;
  creatorId: string;
  currentPhase: string;
  currentStatus: string;
  id: string;
  maxVotesPerUser: number;
  reportMessageId: null | string;
  templateType: Template;
  timerExpiresAt: null | string;
  title: string;
  voteTimerSeconds: null | number;
  cardsCount?: number;
  participantsCount?: number;
  updatedAt?: string;
  votesCount?: number;
}

export interface Template {
  code: string;
  description: null | string;
  id: string;
  name: string;
  values: TemplateValue[];
}

export interface TemplateValue {
  color: string;
  id: string;
  label: string;
  sortOrder: number;
  value: string;
}

export function getUserDisplayName(): string {
  return localStorage.getItem("retrobot-user-name") || "Anonymous";
}

export function getUserId(): string {
  let id = localStorage.getItem("retrobot-user-id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("retrobot-user-id", id);
  }

  return id;
}

export function setUserDisplayName(name: string): void {
  localStorage.setItem("retrobot-user-name", name);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export const api = {
  advancePhase: (sessionId: string, phase: "collect" | "summary" | "vote") =>
    request<Session>(`/sessions/${sessionId}/phase`, {
      body: JSON.stringify({ phase }),
      method: "PUT",
    }),

  castVote: (cardId: string) =>
    request<{ cardId: string; votesCount: number }>(`/cards/${cardId}/vote`, {
      method: "POST",
    }),

  createCard: (sessionId: string, columnKey: string, content: string) =>
    request<Card>(`/sessions/${sessionId}/cards`, {
      body: JSON.stringify({ columnKey, content }),
      method: "POST",
    }),

  createSession: (
    title: string,
    templateTypeId: string,
    opts?: { collectTimerSeconds?: number; voteTimerSeconds?: number },
  ) =>
    request<Session>("/sessions", {
      body: JSON.stringify({ templateTypeId, title, ...opts }),
      method: "POST",
    }),

  deleteCard: (cardId: string) =>
    request<{ success: boolean }>(`/sessions/cards/${cardId}`, {
      method: "DELETE",
    }),

  getCards: (sessionId: string) => request<Card[]>(`/sessions/${sessionId}/cards`),

  getGraceStatus: (sessionId: string) =>
    request<{ graceActive: boolean; usedColumns: string[] }>(`/sessions/${sessionId}/grace-status`),

  getMyVotes: (sessionId: string) => request<{ cardIds: string[] }>(`/sessions/${sessionId}/my-votes`),

  getSession: (id: string) => request<Session>(`/sessions/${id}`),

  getSessions: () => request<Session[]>("/sessions"),

  getSummary: (sessionId: string) => request<SessionSummary>(`/sessions/${sessionId}/summary`),

  getTemplates: () => request<Template[]>("/templates"),

  publishSummary: (sessionId: string) =>
    request<{ messageId: string; published: boolean; sessionId: string }>(`/sessions/${sessionId}/publish`, {
      method: "POST",
    }),

  removeVote: (cardId: string) =>
    request<{ cardId: string; votesCount: number }>(`/cards/${cardId}/vote`, {
      method: "DELETE",
    }),

  startCollect: (sessionId: string) =>
    request<{ started: boolean }>(`/sessions/${sessionId}/start`, {
      method: "POST",
    }),

  updateCard: (cardId: string, content: string) =>
    request<Card>(`/sessions/cards/${cardId}`, {
      body: JSON.stringify({ content }),
      method: "PUT",
    }),
};

export interface SessionSummary {
  columns: SummaryColumn[];
  createdAt: string;
  currentPhase: string;
  currentStatus: string;
  sessionId: string;
  templateName: string;
  title: string;
  totals: {
    cards: number;
    participants: number;
    votes: number;
  };
}

export interface SummaryCard {
  content: string;
  id: string;
  votesCount: number;
}

export interface SummaryColumn {
  cards: SummaryCard[];
  color: string;
  key: string;
  label: string;
  totalCards: number;
  totalVotes: number;
}
