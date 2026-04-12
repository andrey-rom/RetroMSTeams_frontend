const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": getOrCreateDevUserId(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}) as { error?: string });

    throw new Error(payload.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function getOrCreateDevUserId(): string {
  const storageKey = "retrobot-user-id";
  const existing = localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();

  localStorage.setItem(storageKey, created);

  return created;
}

export { getOrCreateDevUserId };
