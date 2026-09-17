"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JsonViewer } from "@/components/ui/JsonViewer";
import { Modal } from "@/components/ui/Modal";
import {
  Search,
  RefreshCw,
  Clock,
  ChevronRight,
} from "lucide-react";

interface ExecutionItem {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "UNSUPPORTED";
  mode: "MOCK" | "LIVE";
  inputPayload: {
    postId?: string;
    commentId?: string;
    username?: string;
    text?: string;
  };
  executionLogs: Array<{
    step: string;
    status: string;
    durationMs: number;
    description: string;
    details?: Record<string, unknown>;
  }>;
  durationMs: number;
  errorMessage?: string;
  createdAt: string;
}

export default function ActivityPage() {
  const [executions, setExecutions] = useState<ExecutionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionItem | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const refreshActivity = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/activity", window.location.origin);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (modeFilter !== "ALL") url.searchParams.set("mode", modeFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.executions) {
        setExecutions(data.executions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const url = new URL("/api/activity", window.location.origin);
        if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
        if (modeFilter !== "ALL") url.searchParams.set("mode", modeFilter);

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!ignore && data.executions) {
          setExecutions(data.executions);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [statusFilter, modeFilter]);

  const filtered = executions.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.workflowName.toLowerCase().includes(q) ||
      (e.inputPayload?.username && e.inputPayload.username.toLowerCase().includes(q)) ||
      (e.inputPayload?.text && e.inputPayload.text.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
            Activity & Execution Logs
          </h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Real-time webhook events, keyword evaluations, and Meta Graph API messaging records.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshActivity}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by workflow, username, or comment..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111111] border border-[#222222] text-xs text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#F5F5F5]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 bg-[#111111] border border-[#222222] rounded-lg text-xs">
            {["ALL", "SUCCESS", "SKIPPED", "FAILED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-[#222222] text-[#F5F5F5]"
                    : "text-[#737373] hover:text-[#A3A3A3]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Mode filter */}
          <div className="flex items-center gap-1 p-1 bg-[#111111] border border-[#222222] rounded-lg text-xs">
            {["ALL", "MOCK", "LIVE"].map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                  modeFilter === m
                    ? "bg-[#222222] text-[#F5F5F5]"
                    : "text-[#737373] hover:text-[#A3A3A3]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] border-b border-[#222222] text-[#737373] uppercase font-mono tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Commenter</th>
                <th className="px-4 py-3">Comment Preview</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#737373] animate-shimmer">
                    Loading activity stream...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#737373]">
                    <Clock className="w-8 h-8 text-[#404040] mx-auto mb-2" />
                    No matching activity events found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedExecution(item)}
                    className="hover:bg-[#141414] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge
                        variant={
                          item.status === "SUCCESS"
                            ? "success"
                            : item.status === "SKIPPED"
                            ? "neutral"
                            : "danger"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[#F5F5F5] whitespace-nowrap">
                      {item.workflowName}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#A3A3A3] whitespace-nowrap">
                      @{item.inputPayload?.username || "unknown"}
                    </td>
                    <td className="px-4 py-3.5 text-[#737373] max-w-xs truncate">
                      &quot;{item.inputPayload?.text || "..."}&quot;
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={item.mode === "LIVE" ? "live" : "mock"}>
                        {item.mode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#737373] whitespace-nowrap">
                      {item.durationMs}ms
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#737373] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <ChevronRight className="w-4 h-4 text-[#525252] inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <Modal
          isOpen={Boolean(selectedExecution)}
          onClose={() => setSelectedExecution(null)}
          title={`Execution Details: ${selectedExecution.id}`}
          description={`Workflow: ${selectedExecution.workflowName} • Mode: ${selectedExecution.mode}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Status overview */}
            <div className="p-4 rounded-lg bg-[#141414] border border-[#222222] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    selectedExecution.status === "SUCCESS"
                      ? "success"
                      : selectedExecution.status === "SKIPPED"
                      ? "neutral"
                      : "danger"
                  }
                >
                  {selectedExecution.status}
                </Badge>
                <span className="text-xs text-[#A3A3A3]">
                  Duration: <span className="font-mono text-[#F5F5F5]">{selectedExecution.durationMs}ms</span>
                </span>
              </div>
              <span className="text-xs font-mono text-[#737373]">
                {new Date(selectedExecution.createdAt).toLocaleString()}
              </span>
            </div>

            {selectedExecution.errorMessage && (
              <div className="p-3.5 rounded-lg bg-[#7F1D1D]/30 border border-[#991B1B] text-[#F87171] text-xs">
                <strong>Error:</strong> {selectedExecution.errorMessage}
              </div>
            )}

            {/* Input payload */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                Input Event Payload
              </h4>
              <JsonViewer data={selectedExecution.inputPayload} maxHeight="140px" />
            </div>

            {/* Execution step timeline */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] mb-2">
                Step-by-step Execution Log
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedExecution.executionLogs?.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-[#0A0A0A] border border-[#222222] text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-mono font-medium text-[#F5F5F5]">
                        {step.step}
                      </div>
                      <div className="text-[#A3A3A3] text-[11px] mt-0.5">
                        {step.description}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#737373] shrink-0">
                      +{step.durationMs}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
