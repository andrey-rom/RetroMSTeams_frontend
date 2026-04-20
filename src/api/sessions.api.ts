import { apiRequest } from "./client";
import type { Session } from "../features/session/types/session.types";

export interface CreateSessionPayload {
  templateTypeId: string;
  title: string;
  collectTimerSeconds?: number;
  maxVotesPerUser?: number;
  msChannelId?: string;
  msTeamsId?: string;
  voteTimerSeconds?: number;
}

export function createSession(payload: CreateSessionPayload) {
  return apiRequest<Session>("/sessions", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
