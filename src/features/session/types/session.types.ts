export interface Session {
  collectGraceAt: null | string;
  collectTimerSeconds: null | number;
  createdAt: string;
  creatorId: string;
  currentPhase: "collect" | "summary" | "vote";
  currentStatus: "active" | "archived" | "completed";
  id: string;
  maxVotesPerUser: number;
  reportMessageId: null | string;
  templateType: Template;
  timerExpiresAt: null | string;
  title: string;
  updatedAt: string;
  voteTimerSeconds: null | number;
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
