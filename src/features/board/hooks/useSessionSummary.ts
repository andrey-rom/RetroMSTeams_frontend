import { useQuery } from "@tanstack/react-query";
import { api } from "../../../shared/lib/api-client.ts";

export function useSessionSummaryQuery(sessionId: null | string) {
  return useQuery({
    enabled: Boolean(sessionId),
    queryFn: () => api.getSummary(sessionId!),
    queryKey: ["session", "summary", sessionId],
  });
}
