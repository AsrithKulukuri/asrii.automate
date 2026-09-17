"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JsonViewer } from "@/components/ui/JsonViewer";
import { Modal } from "@/components/ui/Modal";
import {
  Play,
  Clock,
  Terminal,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface WorkflowOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface StepLog {
  step: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "WARNING" | "INFO";
  durationMs: number;
  description: string;
  details?: Record<string, unknown>;
}

interface TestResult {
  executionId: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "UNSUPPORTED";
  mode: "MOCK" | "LIVE";
  workflowName: string;
  durationMs: number;
  timeline: StepLog[];
  generatedMessage?: string;
  responsePayload: Record<string, unknown>;
  errorMessage?: string;
}

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const initialWorkflowId = searchParams.get("workflowId");

  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(initialWorkflowId || "");
  const [mode, setMode] = useState<"MOCK" | "LIVE">("MOCK");
  const [isConfirmLiveModalOpen, setIsConfirmLiveModalOpen] = useState(false);

  // Form State
  const [postId, setPostId] = useState("post_demo_001");
  const [commentId, setCommentId] = useState("comment_demo_1001");
  const [username, setUsername] = useState("test_customer");
  const [commentText, setCommentText] = useState("Can you send me the price?");

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function loadWorkflows() {
      try {
        const res = await fetch("/api/workflows");
        const data = await res.json();
        if (data.workflows && data.workflows.length > 0) {
          setWorkflows(data.workflows);
          if (!selectedWorkflowId) {
            setSelectedWorkflowId(data.workflows[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadWorkflows();
  }, [selectedWorkflowId]);

  const loadExample = (type: "PRICE" | "VIP" | "UNMATCHED" | "SPAM") => {
    setPostId("post_demo_001");
    setCommentId(`comment_demo_${Date.now().toString().slice(-4)}`);

    switch (type) {
      case "PRICE":
        setUsername("alex_tech");
        setCommentText("What is the price of this SaaS?");
        break;
      case "VIP":
        setUsername("elena_growth");
        setCommentText("Can you share the VIP early access invite?");
        break;
      case "UNMATCHED":
        setUsername("john_traveler");
        setCommentText("Awesome background and visuals! Keep it up.");
        break;
      case "SPAM":
        setUsername("bot_promo_99");
        setCommentText("Check your price, this is a spam promo.");
        break;
    }
  };

  const handleModeChange = (newMode: "MOCK" | "LIVE") => {
    if (newMode === "LIVE") {
      setIsConfirmLiveModalOpen(true);
    } else {
      setMode("MOCK");
    }
  };

  const executeTest = async (confirmedLive = false) => {
    if (!selectedWorkflowId) {
      alert("Please select a workflow to test");
      return;
    }
    if (!commentText.trim()) {
      alert("Please enter comment text");
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const res = await fetch("/api/workflows/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: selectedWorkflowId,
          mode,
          postId,
          commentId,
          username,
          text: commentText,
          confirmedLive: mode === "LIVE" ? confirmedLive : false,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleStepExpand = (index: number) => {
    setExpandedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
            Testing Playground
          </h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Simulate Instagram comment events and inspect step-by-step execution rules in a safe sandbox.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#141414] border border-[#262626] self-start">
          <button
            type="button"
            onClick={() => handleModeChange("MOCK")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === "MOCK"
                ? "bg-[#252525] text-[#F5F5F5] shadow-xs"
                : "text-[#737373] hover:text-[#A3A3A3]"
            }`}
          >
            MOCK MODE
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("LIVE")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === "LIVE"
                ? "bg-[#065F46] text-[#6EE7B7] shadow-xs"
                : "text-[#737373] hover:text-[#A3A3A3]"
            }`}
          >
            LIVE MODE
          </button>
        </div>
      </div>

      {/* Two-Column Testing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Event Generator */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#A3A3A3]" />
                <span className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                  Simulate an Instagram Event
                </span>
              </div>
              <Badge variant={mode === "LIVE" ? "live" : "mock"}>
                {mode === "LIVE" ? "CALLS META API" : "SAFE SANDBOX"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Examples */}
              <div>
                <label className="block text-[11px] font-mono text-[#737373] uppercase tracking-wider mb-1.5">
                  Load Example Payload
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => loadExample("PRICE")}
                    className="px-2 py-1 rounded bg-[#1A1A1A] border border-[#2B2B2B] hover:text-[#F5F5F5] text-xs font-mono transition-colors"
                  >
                    Price Inquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => loadExample("VIP")}
                    className="px-2 py-1 rounded bg-[#1A1A1A] border border-[#2B2B2B] hover:text-[#F5F5F5] text-xs font-mono transition-colors"
                  >
                    VIP Access
                  </button>
                  <button
                    type="button"
                    onClick={() => loadExample("UNMATCHED")}
                    className="px-2 py-1 rounded bg-[#1A1A1A] border border-[#2B2B2B] hover:text-[#F5F5F5] text-xs font-mono transition-colors"
                  >
                    Unmatched
                  </button>
                  <button
                    type="button"
                    onClick={() => loadExample("SPAM")}
                    className="px-2 py-1 rounded bg-[#1A1A1A] border border-[#2B2B2B] hover:text-[#F5F5F5] text-xs font-mono transition-colors"
                  >
                    Excluded Spam
                  </button>
                </div>
              </div>

              {/* Workflow Selector */}
              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
                  Target Workflow
                </label>
                <select
                  value={selectedWorkflowId}
                  onChange={(e) => setSelectedWorkflowId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                >
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name} {!wf.isActive ? "(Paused)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comment Text */}
              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
                  Comment Text
                </label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="e.g. Can you send me the price?"
                  className="w-full p-3 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>

              {/* Simulated Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1">
                    Post ID
                  </label>
                  <input
                    type="text"
                    value={postId}
                    onChange={(e) => setPostId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1">
                  Comment ID
                </label>
                <input
                  type="text"
                  value={commentId}
                  onChange={(e) => setCommentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant={mode === "LIVE" ? "danger" : "primary"}
                  className="w-full"
                  isLoading={isRunning}
                  onClick={() => executeTest(false)}
                  leftIcon={<Play className="w-4 h-4 fill-current" />}
                >
                  {mode === "LIVE" ? "Dispatch Live Test via Meta" : "Run Mock Test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution Timeline & Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A3A3A3]" />
                <span className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                  Execution Inspector
                </span>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      result.status === "SUCCESS"
                        ? "success"
                        : result.status === "SKIPPED"
                        ? "neutral"
                        : "danger"
                    }
                  >
                    {result.status}
                  </Badge>
                  <span className="text-xs text-[#737373] font-mono">
                    {result.durationMs}ms
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="p-12 text-center">
                  <Play className="w-8 h-8 text-[#404040] mx-auto mb-2" />
                  <div className="text-xs text-[#A3A3A3]">Playground Ready</div>
                  <p className="text-[11px] text-[#737373] mt-1 max-w-sm mx-auto">
                    Click &quot;Run Mock Test&quot; to simulate webhook ingestion, condition matching, and private reply generation.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step-by-Step Timeline */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider font-mono mb-3">
                      Execution Timeline
                    </h3>
                    <div className="space-y-2 border-l border-[#222222] pl-4 ml-2">
                      {result.timeline.map((step, idx) => {
                        const isExpanded = Boolean(expandedSteps[idx]);
                        return (
                          <div key={idx} className="relative group">
                            {/* Bullet icon */}
                            <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-[#111111] border border-[#333333] flex items-center justify-center">
                              {step.status === "SUCCESS" ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                              ) : step.status === "SKIPPED" ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#A3A3A3]" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                              )}
                            </div>

                            <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#2A2A2A] transition-colors">
                              <div
                                className="flex items-center justify-between cursor-pointer select-none"
                                onClick={() => toggleStepExpand(idx)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-medium text-[#F5F5F5]">
                                    {step.step}
                                  </span>
                                  <span className="text-xs text-[#A3A3A3]">
                                    — {step.description}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#737373] font-mono">
                                    {step.durationMs}ms
                                  </span>
                                  {step.details && (
                                    isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#737373]" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />
                                    )
                                  )}
                                </div>
                              </div>

                              {isExpanded && step.details && (
                                <div className="mt-2.5 pt-2.5 border-t border-[#1F1F1F]">
                                  <JsonViewer data={step.details} maxHeight="160px" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Generated Message Preview */}
                  {result.generatedMessage && (
                    <div className="p-4 rounded-lg bg-[#141414] border border-[#222222] space-y-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-[#34D399] font-mono block">
                        Prepared Official Private Reply
                      </span>
                      <p className="text-xs text-[#F5F5F5] italic leading-relaxed">
                        &quot;{result.generatedMessage}&quot;
                      </p>
                    </div>
                  )}

                  {/* Structured Response Payload (Sanitized) */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider font-mono mb-2">
                      Sanitized Output Payload
                    </h3>
                    <JsonViewer
                      data={result.responsePayload}
                      title="API Response Payload (Zero Tokens Leaked)"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Mode Explicit Confirmation Modal */}
      <Modal
        isOpen={isConfirmLiveModalOpen}
        onClose={() => setIsConfirmLiveModalOpen(false)}
        title="Enable Live Mode Dispatch"
        description="Warning: Live mode calls the real Meta Graph API and sends actual private replies to live Instagram users."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-[#2D1414] border border-[#4B1E1E] text-xs text-[#F87171] space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Real Messages Will Be Sent</span>
            </div>
            <p>
              When Live Mode is enabled, the backend will decrypt your stored token and call Meta&apos;s <code>/{`{ig-user-id}`}/messages</code> endpoint.
            </p>
            <p>
              Remember: Meta strictly enforces 1 private reply per comment within a 7-day window.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfirmLiveModalOpen(false)}
            >
              Cancel (Stay in Mock Mode)
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setMode("LIVE");
                setIsConfirmLiveModalOpen(false);
              }}
            >
              I Understand, Enable Live Mode
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#737373]">Loading playground...</div>}>
      <PlaygroundContent />
    </Suspense>
  );
}
