import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
vi.mock("../lib/db", () => ({ prisma: { workflow: { findUnique: vi.fn() }, messageLog: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }, workflowExecution: { create: vi.fn() } } }));
vi.mock("../lib/crypto", () => ({ decryptToken: () => "test-token" }));
vi.mock("../lib/meta/api", () => ({ sendPrivateReply: vi.fn(), sendCommentReply: vi.fn() }));
import { prisma } from "../lib/db";
import { sendPrivateReply, sendCommentReply } from "../lib/meta/api";
import { executeWorkflow, type ExecuteWorkflowInput } from "../lib/engine/executor";
const input: ExecuteWorkflowInput = {workflowId: "wf", workspaceId: "ws", mode: "LIVE", event: {postId: "post", commentId: "comment", username: "customer", text: "link"}};
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("ENABLE_LIVE_META", "true");
  vi.mocked(prisma.workflow.findUnique).mockResolvedValue({id: "wf", workspaceId: "ws", name: "Link", isActive: true, triggerConfig: "{}", conditionConfig: JSON.stringify({matchType: "ANY_COMMENT"}), actionConfig: JSON.stringify({type: "PRIVATE_REPLY", template: "Here is your link"}), connectedAccount: {igUserId: "ig", igUsername: "owner", isActive: true, healthStatus: "HEALTHY"}} as never);
  vi.mocked(prisma.messageLog.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.messageLog.create).mockResolvedValue({id: "log"} as never);
  vi.mocked(prisma.messageLog.update).mockResolvedValue({id: "log"} as never);
  vi.mocked(prisma.workflowExecution.create).mockResolvedValue({id: "exec"} as never);
  vi.mocked(sendPrivateReply).mockResolvedValue({recipient_id: "customer", message_id: "dm"});
  vi.mocked(sendCommentReply).mockResolvedValue({id: "public"});
});
afterEach(() => vi.unstubAllEnvs());
describe("Public acknowledgement after DM", () => {
  it("posts only after the DM succeeds", async () => {
    const result = await executeWorkflow(input);
    expect(result.status).toBe("SUCCESS");
    expect(sendCommentReply).toHaveBeenCalledWith("comment", "Done! Sent you a DM 📩", "test-token");
    expect(vi.mocked(sendPrivateReply).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(sendCommentReply).mock.invocationCallOrder[0]);
  });
  it("does not post when the DM fails", async () => {
    vi.mocked(sendPrivateReply).mockRejectedValue(new Error("Denied"));
    expect((await executeWorkflow(input)).status).toBe("FAILED");
    expect(sendCommentReply).not.toHaveBeenCalled();
  });
  it("keeps DM success and records a warning if public reply fails", async () => {
    vi.mocked(sendCommentReply).mockRejectedValue(new Error("Denied"));
    const result = await executeWorkflow(input);
    expect(result.status).toBe("SUCCESS");
    expect(result.timeline.some(s => s.step === "PUBLIC_COMMENT_REPLY" && s.status === "WARNING")).toBe(true);
  });
  it("makes no Meta calls in mock mode", async () => {
    await executeWorkflow({...input, mode: "MOCK"});
    expect(sendPrivateReply).not.toHaveBeenCalled(); expect(sendCommentReply).not.toHaveBeenCalled();
  });
  it("does not acknowledge an already-replied comment again", async () => {
    vi.mocked(prisma.messageLog.findFirst).mockResolvedValue({id: "previous"} as never);
    expect((await executeWorkflow(input)).status).toBe("UNSUPPORTED");
    expect(sendCommentReply).not.toHaveBeenCalled();
  });
});
