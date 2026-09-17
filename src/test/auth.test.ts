import { describe, it, expect } from "vitest";
import { getOrCreateDemoSession, DEFAULT_DEMO_SESSION, DEMO_USER_ID } from "../lib/auth";

describe("Developer Demo Session & Auth Fallback", () => {
  it("should return a valid developer demo session with all required attributes", async () => {
    const session = await getOrCreateDemoSession();
    expect(session).toBeDefined();
    expect(session.id).toBe(DEMO_USER_ID);
    expect(session.isDemo).toBe(true);
    expect(session.workspaceId).toBeDefined();
    expect(session.workspaceName).toBe("Asrii Automation Studio");
  });

  it("should have consistent DEFAULT_DEMO_SESSION parameters", () => {
    expect(DEFAULT_DEMO_SESSION.id).toBe(DEMO_USER_ID);
    expect(DEFAULT_DEMO_SESSION.email).toContain("@");
    expect(DEFAULT_DEMO_SESSION.isDemo).toBe(true);
    expect(DEFAULT_DEMO_SESSION.role).toBe("OWNER");
  });
});
