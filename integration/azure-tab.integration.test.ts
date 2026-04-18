// @vitest-environment node
import { describe, expect, it } from "vitest";
import { tabBaseUrl } from "./helpers";

describe("deployed Teams tab (Azure App Service)", () => {
  const base = tabBaseUrl();

  it("serves SPA shell at /tabs/home/", async () => {
    const res = await fetch(`${base}/tabs/home/`);

    expect(res.ok).toBe(true);
    expect(res.headers.get("content-type") ?? "").toMatch(/text\/html/i);

    const html = await res.text();

    expect(html).toMatch(/<div id="root">/);
    expect(html).toMatch(/\/tabs\/home\/assets\/[^"]+\.js/);
  }, 30_000);

  it("redirects /tabs/home to /tabs/home/", async () => {
    const res = await fetch(`${base}/tabs/home`, { redirect: "manual" });

    expect(res.status).toBe(301);
    const loc = res.headers.get("location") ?? "";

    expect(loc).toMatch(/\/tabs\/home\/?$/);
  }, 30_000);

  it("serves the Vite entry chunk referenced by index.html", async () => {
    const htmlRes = await fetch(`${base}/tabs/home/`);
    const html = await htmlRes.text();
    const m = html.match(/src="(\/tabs\/home\/assets\/[^"]+\.js)"/);

    expect(m).not.toBeNull();

    const jsUrl = new URL(m![1], base).href;
    const jsRes = await fetch(jsUrl);

    expect(jsRes.ok).toBe(true);
    expect(jsRes.headers.get("content-type") ?? "").toMatch(/javascript/);

    const js = await jsRes.text();

    expect(js.length).toBeGreaterThan(500);
  }, 30_000);
});
