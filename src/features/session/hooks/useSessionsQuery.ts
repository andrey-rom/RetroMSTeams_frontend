import { useQuery } from "@tanstack/react-query";
import { api } from "../../../shared/lib/api-client.ts";

export function useSessionsQuery() {
  return useQuery({
    queryFn: () => api.getSessions(),
    queryKey: ["sessions", "list"],
  });
}
