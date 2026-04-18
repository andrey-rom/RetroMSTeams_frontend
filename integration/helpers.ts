/** API base including `/api` suffix, or empty string if not configured. */
export function apiBaseUrl(): string {
  const fromIntegration = process.env.INTEGRATION_API_URL?.trim();
  const fromVite = process.env.VITE_API_URL?.trim();
  const raw = fromIntegration || fromVite || "";

  return raw.replace(/\/$/, "");
}

export async function apiFetch(path: string, init: RequestInit & { userId?: string } = {}): Promise<Response> {
  const base = apiBaseUrl();

  if (!base) {
    throw new Error("INTEGRATION_API_URL or VITE_API_URL must be set for API integration tests");
  }

  const { headers: initHeaders, userId, ...rest } = init;
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId ?? integrationUserId(),
      ...initHeaders,
    },
  });
}

export function integrationUserId(): string {
  return process.env.INTEGRATION_USER_ID?.trim() || `integration-${crypto.randomUUID()}`;
}

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.integration.local" });
loadEnv({ path: ".env.production" });

export function tabBaseUrl(): string {
  const raw = process.env.INTEGRATION_TAB_URL ?? "https://tabc2ac8b.azurewebsites.net";

  return raw.replace(/\/$/, "");
}
