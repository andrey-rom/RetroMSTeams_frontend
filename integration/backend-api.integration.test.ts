// @vitest-environment node
import { describe, expect, it } from "vitest";

import { apiBaseUrl, apiFetch } from "./helpers";

const runApi = Boolean(apiBaseUrl());

describe.skipIf(!runApi)("backend HTTP API (paired with deployed app)", () => {
  const userId = `integration-suite-${crypto.randomUUID()}`;

  it("returns templates", async () => {
    const res = await apiFetch("/templates", { userId });

    expect(res.ok).toBe(true);

    const data = (await res.json()) as { id: string; values: { value: string }[] }[];

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].values?.length).toBeGreaterThan(0);
  }, 30_000);

  it("creates session, starts collect, creates card, and gets cards", async () => {
    const tRes = await apiFetch("/templates", { userId });
    const templates = (await tRes.json()) as {
      id: string;
      values: { value: string }[];
    }[];
    const template = templates[0];
    const columnKey = template.values[0].value;

    const title = `integration-${Date.now()}`;
    const sRes = await apiFetch("/sessions", {
      body: JSON.stringify({
        collectTimerSeconds: 300,
        templateTypeId: template.id,
        title,
        voteTimerSeconds: 300,
      }),
      method: "POST",
      userId,
    });

    expect(sRes.ok).toBe(true);
    const session = (await sRes.json()) as { currentPhase: string; id: string };

    expect(session.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(session.currentPhase).toBe("collect");

    const startRes = await apiFetch(`/sessions/${session.id}/start`, {
      method: "POST",
      userId,
    });

    expect(startRes.ok).toBe(true);

    const cardRes = await apiFetch(`/sessions/${session.id}/cards`, {
      body: JSON.stringify({
        columnKey,
        content: "integration test card",
      }),
      method: "POST",
      userId,
    });

    expect(cardRes.ok).toBe(true);
    const card = (await cardRes.json()) as { columnKey: string; id: string; sessionId: string };

    expect(card.sessionId).toBe(session.id);
    expect(card.columnKey).toBe(columnKey);

    const cardsRes = await apiFetch(`/sessions/${session.id}/cards`, { userId });

    expect(cardsRes.ok).toBe(true);
    const cards = (await cardsRes.json()) as { id: string }[];

    expect(cards.some((c) => c.id === card.id)).toBe(true);
  }, 30_000);
});
