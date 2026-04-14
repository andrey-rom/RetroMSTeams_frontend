import { useQuery } from "@tanstack/react-query";
import { api } from "../../../shared/lib/api-client.ts";

export function useSessionsQuery(channelId?: string) {
  return useQuery({
    queryFn: () => api.getSessions(channelId),
    queryKey: ["sessions", "list", channelId ?? ""],
  });
}
