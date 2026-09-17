import { describe, it, expect, beforeAll } from "vitest";
import { executeWorkflow } from "../lib/engine/executor";
import { seedDemoData } from "../lib/seed";
import { DEMO_WORKSPACE_ID } from "../lib/auth";

describe("Workflow Execution Engine (Mock & Policy Validation)", () => {
  let workflowId: string;

  beforeAll(async () => {
    const seed = await seedDemoData();
    workflowId = seed?.workflows[0]?.id || "wf_demo_price_inquiry";
  });

  it("should successfully execute in MOCK mode when comment matches keyword", async () => {
    const result = await executeWorkflow({
      workflowId,
      workspaceId: DEMO_WORKSPACE_ID,
      mode: "MOCK",
      event: {
        postId: "post_sample_123",
        commentId: "comment_test_" + Date.now(),
        username: "test_customer",
        text: "Can you send me the price?",
        createdTime: Date.now(),
      },
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.mode).toBe("MOCK");
    expect(result.generatedMessage).toContain("test_customer");
    expect(result.responsePayload.networkRequest).toBe(false);
    expect(result.timeline.length).toBeGreaterThan(4);
    expect(result.timeline.some((s) => s.step === "DISPATCH_MOCK")).toBe(true);
  });

  it("should mark status as SKIPPED when comment does not match keywords", async () => {
    const result = await executeWorkflow({
      workflowId,
      workspaceId: DEMO_WORKSPACE_ID,
      mode: "MOCK",
      event: {
        postId: "post_sample_123",
        commentId: "comment_test_nomatch_" + Date.now(),
        username: "unrelated_user",
        text: "Nice photo! Love the sunset.",
        createdTime: Date.now(),
      },
    });

    expect(result.status).toBe("SKIPPED");
    expect(result.responsePayload.matched).toBe(false);
  });

  it("should enforce Meta 7-day rule and mark as UNSUPPORTED if comment is older than 7 days", async () => {
    const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);

    const result = await executeWorkflow({
      workflowId,
      workspaceId: DEMO_WORKSPACE_ID,
      mode: "MOCK",
      event: {
        postId: "post_sample_123",
        commentId: "comment_old_" + Date.now(),
        username: "late_commenter",
        text: "What is the price?",
        createdTime: eightDaysAgo,
      },
    });

    expect(result.status).toBe("UNSUPPORTED");
    expect(result.errorMessage).toContain("7 days");
  });
});
