"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  GitBranch,
  Plus,
  Search,
  Zap,
  Trash2,
  Edit,
  MessageSquare,
} from "lucide-react";

interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerConfig: string;
  conditionConfig: string;
  actionConfig: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    executions: number;
  };
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");

  useEffect(() => {
    let ignore = false;
    async function loadWorkflows() {
      try {
        const res = await fetch("/api/workflows");
        const data = await res.json();
        if (!ignore && data.workflows) {
          setWorkflows(data.workflows);
        }
      } catch {
        if (!ignore) setWorkflows([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadWorkflows();
    return () => {
      ignore = true;
    };
  }, []);

  const toggleActive = async (workflow: WorkflowItem) => {
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !workflow.isActive }),
      });
      if (res.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflow.id ? { ...w, isActive: !w.isActive } : w))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (filterStatus === "ACTIVE" && !w.isActive) return false;
    if (filterStatus === "PAUSED" && w.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        w.name.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
            Automation Workflows
          </h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Build and manage comment-triggered private reply workflows.
          </p>
        </div>
        <Link href="/dashboard/workflows/new">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Workflow
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows by name or keyword..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111111] border border-[#222222] text-xs text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#F5F5F5]"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#111111] border border-[#222222] rounded-lg text-xs">
          {(["ALL", "ACTIVE", "PAUSED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === status
                  ? "bg-[#222222] text-[#F5F5F5]"
                  : "text-[#737373] hover:text-[#A3A3A3]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#737373] animate-shimmer">
            Loading workflows...
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <Card className="p-12 text-center">
            <GitBranch className="w-10 h-10 text-[#404040] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#F5F5F5]">No workflows found</h3>
            <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">
              Create a workflow to automatically reply to comments asking about pricing, links, or info.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/workflows/new">
                <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Create First Workflow
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          filteredWorkflows.map((workflow) => {
            let conditionConfig: { matchType?: string; keywords?: string[] } = {};
            let actionConfig: { template?: string } = {};
            try {
              conditionConfig = JSON.parse(workflow.conditionConfig);
            } catch {
              // fallback
            }
            try {
              actionConfig = JSON.parse(workflow.actionConfig);
            } catch {
              // fallback
            }

            return (
              <Card
                key={workflow.id}
                className="p-5 hover:border-[#333333] transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-semibold text-[#F5F5F5]">
                        {workflow.name}
                      </h2>
                      <button
                        onClick={() => toggleActive(workflow)}
                        className="cursor-pointer"
                        title={workflow.isActive ? "Click to Pause" : "Click to Activate"}
                      >
                        <Badge variant={workflow.isActive ? "success" : "neutral"}>
                          {workflow.isActive ? "Active" : "Paused"}
                        </Badge>
                      </button>
                    </div>

                    {workflow.description && (
                      <p className="text-xs text-[#A3A3A3] line-clamp-1">
                        {workflow.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#737373]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#525252]" />
                        <span>Trigger: Instagram Comment</span>
                      </div>

                      <div className="flex items-center gap-1 text-[#A3A3A3] font-mono text-[11px]">
                        <span>Match:</span>
                        <span className="text-[#F5F5F5]">
                          {conditionConfig.matchType || "CONTAINS_ANY"}
                        </span>
                        {conditionConfig.keywords && conditionConfig.keywords.length > 0 && (
                          <span className="text-[#737373]">
                            [{conditionConfig.keywords.slice(0, 3).join(", ")}
                            {conditionConfig.keywords.length > 3 ? "..." : ""}]
                          </span>
                        )}
                      </div>
                    </div>

                    {actionConfig.template && (
                      <div className="text-[11px] text-[#737373] flex items-center gap-1.5 pt-1">
                        <MessageSquare className="w-3 h-3 text-[#525252]" />
                        <span className="truncate max-w-lg italic">
                          &quot;{actionConfig.template}&quot;
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1F1F1F]">
                    <Link href={`/dashboard/playground?workflowId=${workflow.id}`}>
                      <Button size="sm" variant="outline" leftIcon={<Zap className="w-3.5 h-3.5" />}>
                        Test
                      </Button>
                    </Link>
                    <Link href={`/dashboard/workflows/${workflow.id}`}>
                      <Button size="sm" variant="secondary" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(workflow.id)}
                      title="Delete workflow"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
