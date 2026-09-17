import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  GitBranch,
  Activity,
  MessageSquare,
  ArrowUpRight,
  Plus,
  Zap,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getCurrentUser()) || (await getOrCreateDemoSession());

  // Aggregate database queries
  const [
    account,
    totalWorkflows,
    activeWorkflows,
    totalExecutions,
    recentExecutions,
    sentReplies,
  ] = await Promise.all([
    prisma.connectedAccount.findFirst({
      where: { workspaceId: user.workspaceId, isActive: true },
    }),
    prisma.workflow.count({ where: { workspaceId: user.workspaceId } }),
    prisma.workflow.count({ where: { workspaceId: user.workspaceId, isActive: true } }),
    prisma.workflowExecution.count({
      where: { workflow: { workspaceId: user.workspaceId } },
    }),
    prisma.workflowExecution.findMany({
      where: { workflow: { workspaceId: user.workspaceId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { workflow: true },
    }),
    prisma.messageLog.count({
      where: { workspaceId: user.workspaceId, status: "SENT" },
    }),
  ]);

  const metrics = [
    {
      title: "Active Workflows",
      value: `${activeWorkflows} / ${totalWorkflows}`,
      icon: GitBranch,
      desc: "Live automation rules",
    },
    {
      title: "Total Executions",
      value: totalExecutions.toLocaleString(),
      icon: Activity,
      desc: "Simulated & live runs",
    },
    {
      title: "Private Replies Sent",
      value: sentReplies.toLocaleString(),
      icon: MessageSquare,
      desc: "Within 7-day Meta window",
    },
    {
      title: "Webhook Status",
      value: "Active",
      icon: Zap,
      desc: "Graph API v21.0 listener",
    },
    {
      title: "Token Encryption",
      value: "AES-256-GCM",
      icon: ShieldCheck,
      desc: "Authenticated vault",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
            Dashboard Overview
          </h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Monitor official Meta Instagram automations, execution metrics, and webhook activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/workflows/new">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Workflow
            </Button>
          </Link>
          <Link href="/dashboard/playground">
            <Button size="sm" variant="secondary" leftIcon={<Zap className="w-3.5 h-3.5" />}>
              Open Playground
            </Button>
          </Link>
        </div>
      </div>

      {/* Account Connection Status Card */}
      <Card elevated className="border-[#262626]">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center text-[#F5F5F5]">
              <InstagramIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-[#F5F5F5]">
                  {account ? `@${account.igUsername}` : "No Instagram Account Connected"}
                </h2>
                {account ? (
                  <Badge variant="success">
                    <ShieldCheck className="w-3 h-3 mr-0.5" /> Active & Verified
                  </Badge>
                ) : (
                  <Badge variant="warning">Connection Required</Badge>
                )}
                {account?.isDeveloperToken && (
                  <Badge variant="mock">DEV TOKEN</Badge>
                )}
              </div>
              <p className="text-xs text-[#A3A3A3] mt-1">
                {account
                  ? `Connected ID: ${account.igUserId} • Graph API v21.0 • AES-256 Encrypted Token`
                  : "Connect an Instagram Professional account to receive comment webhooks and send permitted private replies."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/connect">
              <Button size="sm" variant={account ? "outline" : "primary"}>
                {account ? "Manage Connection" : "Connect Account"}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="p-4">
              <div className="flex items-center justify-between text-[#737373] mb-3">
                <span className="text-xs font-medium text-[#A3A3A3]">{metric.title}</span>
                <Icon className="w-4 h-4 text-[#737373]" />
              </div>
              <div className="text-2xl font-bold text-[#F5F5F5] tracking-tight font-mono">
                {metric.value}
              </div>
              <div className="text-[11px] text-[#737373] mt-1">{metric.desc}</div>
            </Card>
          );
        })}
      </div>

      {/* Recent Executions Stream */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Recent Execution Activity</h2>
            <p className="text-xs text-[#737373] mt-0.5">
              Latest trigger evaluations, keyword matching, and private replies.
            </p>
          </div>
          <Link
            href="/dashboard/activity"
            className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] flex items-center gap-1"
          >
            View All Logs <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <div className="divide-y divide-[#1F1F1F]">
          {recentExecutions.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-8 h-8 text-[#404040] mx-auto mb-2" />
              <div className="text-xs text-[#A3A3A3]">No executions recorded yet.</div>
              <p className="text-[11px] text-[#737373] mt-1 max-w-sm mx-auto">
                Trigger a simulated comment event in the Testing Playground to see execution steps here.
              </p>
              <div className="mt-4">
                <Link href="/dashboard/playground">
                  <Button size="sm" variant="secondary">
                    Launch Playground
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            recentExecutions.map((exec) => {
              let payload: { username?: string; text?: string } = {};
              try {
                payload = JSON.parse(exec.inputPayload);
              } catch {
                // fallback
              }

              return (
                <div
                  key={exec.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#141414] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <Badge
                      variant={
                        exec.status === "SUCCESS"
                          ? "success"
                          : exec.status === "SKIPPED"
                          ? "neutral"
                          : "danger"
                      }
                    >
                      {exec.status}
                    </Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#F5F5F5]">
                          {exec.workflow?.name}
                        </span>
                        <span className="text-[#404040]">•</span>
                        <span className="text-xs text-[#A3A3A3] font-mono">
                          @{payload.username || "commenter"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 truncate max-w-md">
                        &quot;{payload.text || "Comment text"}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#737373] font-mono">
                    <Badge variant={exec.mode === "LIVE" ? "live" : "mock"}>
                      {exec.mode}
                    </Badge>
                    <span>{exec.durationMs}ms</span>
                    <span>{new Date(exec.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
