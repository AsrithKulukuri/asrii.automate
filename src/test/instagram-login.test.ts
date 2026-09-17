import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchInstagramAccounts } from "../lib/meta/api";

afterEach(() => vi.unstubAllGlobals());
describe("Instagram Login token verification", () => {
  it("uses Instagram Graph and the professional user ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({id: "scoped", user_id: "professional", username: "tester"}), {status: 200}));
    vi.stubGlobal("fetch", fetchMock);
    const accounts = await fetchInstagramAccounts("test-token");
    expect(accounts[0].id).toBe("professional");
    expect(fetchMock.mock.calls[0][0]).toContain("https://graph.instagram.com/");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token");
  });
  it("rejects invalid tokens instead of returning a fabricated account", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({error: {code: 190, message: "Invalid token"}}), {status: 400})));
    await expect(fetchInstagramAccounts("invalid")).rejects.toThrow();
  });
});
