import { apiRequest } from "./client";
import type { Template } from "../features/session/types/session.types";

export function getTemplates() {
  return apiRequest<Template[]>("/templates");
}
