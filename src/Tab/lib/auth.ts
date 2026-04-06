import * as microsoftTeams from "@microsoft/teams-js";
import type { app } from "@microsoft/teams-js";

const DEFAULT_BACKEND_ORIGIN = "http://localhost:3000";
const BACKEND_ORIGIN =
  (import.meta.env.VITE_BACKEND_ORIGIN as string | undefined) ||
  DEFAULT_BACKEND_ORIGIN;
const API_BASE = `${BACKEND_ORIGIN}/api`;

const LOCAL_USER_ID_KEY = "retrobot-user-id";
const LOCAL_USER_NAME_KEY = "retrobot-user-name";

type TeamsContext = app.Context | null;

interface BackendExchangeResponse {
  token: string;
  user: {
    id: string;
    tenantId?: string;
    name?: string;
    username?: string;
  };
  expiresIn: string;
}

interface AuthState {
  mode: "teams" | "local";
  token: string | null;
  userId: string;
  userName: string;
}

let configuredContext: TeamsContext = null;
let configuredIsInTeams = false;
let authState: AuthState | null = null;
let initPromise: Promise<AuthState> | null = null;

function getOrCreateLocalUserId(): string {
  let id = localStorage.getItem(LOCAL_USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LOCAL_USER_ID_KEY, id);
  }

  return id;
}

function getLocalUserName(): string {
  return localStorage.getItem(LOCAL_USER_NAME_KEY) || "Anonymous";
}

function setLocalUserName(name: string): void {
  localStorage.setItem(LOCAL_USER_NAME_KEY, name);
}

async function exchangeTeamsTokenForBackendJwt(
  ssoToken: string,
): Promise<BackendExchangeResponse> {
  const response = await fetch(`${API_BASE}/auth/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ssoToken }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to authenticate with backend");
  }

  return response.json();
}

async function createTeamsAuthState(): Promise<AuthState> {
  const ssoToken = await microsoftTeams.authentication.getAuthToken();
  const exchange = await exchangeTeamsTokenForBackendJwt(ssoToken);
  const userName =
    exchange.user.name ||
    exchange.user.username ||
    configuredContext?.user?.displayName ||
    "Anonymous";

  return {
    mode: "teams",
    token: exchange.token,
    userId: exchange.user.id,
    userName,
  };
}

function createLocalAuthState(): AuthState {
  const displayName = configuredContext?.user?.displayName || getLocalUserName();
  setLocalUserName(displayName);

  return {
    mode: "local",
    token: null,
    userId: getOrCreateLocalUserId(),
    userName: displayName,
  };
}

export function configureAuth(options: {
  context: TeamsContext;
  isInTeams: boolean;
}): void {
  configuredContext = options.context;
  configuredIsInTeams = options.isInTeams;
}

export async function initializeAuth(): Promise<AuthState> {
  if (authState) return authState;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const nextState = configuredIsInTeams
      ? await createTeamsAuthState()
      : createLocalAuthState();
    authState = nextState;
    return nextState;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

export function getBackendOrigin(): string {
  return BACKEND_ORIGIN;
}

export function getApiBase(): string {
  return API_BASE;
}

export function getUserId(): string {
  return authState?.userId || getOrCreateLocalUserId();
}

export function getUserDisplayName(): string {
  return authState?.userName || getLocalUserName();
}

export function setUserDisplayName(name: string): void {
  setLocalUserName(name);
  if (authState?.mode === "local") {
    authState = { ...authState, userName: name };
  }
}

export async function getRequestHeaders(
  extraHeaders: HeadersInit = {},
): Promise<HeadersInit> {
  const state = await initializeAuth();

  if (state.mode === "teams" && state.token) {
    return {
      Authorization: `Bearer ${state.token}`,
      ...extraHeaders,
    };
  }

  return {
    "x-user-id": state.userId,
    ...extraHeaders,
  };
}

export async function getSocketAuth(): Promise<{ token: string }> {
  const state = await initializeAuth();
  return {
    token: state.token || state.userId,
  };
}
