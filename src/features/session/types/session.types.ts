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
  currentPhase: "collect" | "vote" | "summary";
  currentStatus: "active" | "completed" | "archived";
  maxVotesPerUser: number;
  collectTimerSeconds: number | null;
  voteTimerSeconds: number | null;
  timerExpiresAt: string | null;
  collectGraceAt: string | null;
  createdAt: string;
  updatedAt: string;
  reportMessageId: string | null;
  templateType: Template;
}
