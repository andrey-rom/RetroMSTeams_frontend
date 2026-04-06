import { useEffect, useState } from "react";
import type { app } from "@microsoft/teams-js";
import {
  configureAuth,
  getUserDisplayName,
  initializeAuth,
} from "../lib/auth";

interface BackendAuthState {
  isLoading: boolean;
  error: string | null;
  userName: string;
}

export function useBackendAuth(
  context: app.Context | null,
  isInTeams: boolean,
  teamsContextLoading: boolean,
): BackendAuthState {
  const [state, setState] = useState<BackendAuthState>({
    isLoading: true,
    error: null,
    userName: "",
  });

  useEffect(() => {
    if (teamsContextLoading) return;

    let cancelled = false;
    configureAuth({ context, isInTeams });

    initializeAuth()
      .then(() => {
        if (cancelled) return;
        setState({
          isLoading: false,
          error: null,
          userName: getUserDisplayName(),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to authenticate with backend",
          userName: "",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [context, isInTeams, teamsContextLoading]);

  return state;
}
