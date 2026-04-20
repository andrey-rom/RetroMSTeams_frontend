import { useState, useEffect } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import { getMockContext } from "../lib/teams-context";

interface TeamsContextState {
  context: microsoftTeams.app.Context | null;
  error: null | string;
  isInTeams: boolean;
  isLoading: boolean;
}

/**
 * Initialises the Teams JS SDK and retrieves the app context.
 *
 * When running outside Teams (local dev), the SDK initialisation
 * will fail and the hook falls back to getMockContext() so the
 * entire UI remains functional without a Teams client.
 */
export function useTeamsContext(): TeamsContextState {
  const [state, setState] = useState<TeamsContextState>({
    context: null,
    error: null,
    isInTeams: false,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    microsoftTeams.app
      .initialize()
      .then(() => {
        if (cancelled) {
          return;
        }

        return microsoftTeams.app.getContext();
      })
      .then((ctx) => {
        if (cancelled || !ctx) {
          return;
        }
        setState({
          context: ctx,
          error: null,
          isInTeams: true,
          isLoading: false,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        console.info("[useTeamsContext] Teams SDK unavailable — using mock context for local dev");
        setState({
          context: getMockContext(),
          error: null,
          isInTeams: false,
          isLoading: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
