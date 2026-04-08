import { useMutation, useQuery } from "@tanstack/react-query";
import { createSession, type CreateSessionPayload } from "../../../api/sessions.api";
import { getTemplates } from "../../../api/templates.api";

export function useCreateSessionMutation() {
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => createSession(payload),
  });
}

export function useTemplatesQuery() {
  return useQuery({
    queryFn: getTemplates,
    queryKey: ["templates"],
  });
}
