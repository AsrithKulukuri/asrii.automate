"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  Terminal,
  GitBranch,
  Lock,
  Code2,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";

export default function LandingPage() {
  // Live Simulator state on landing page
  const [commentInput, setCommentInput] = useState("Can you send me the price?");
  const [simulatedStatus, setSimulatedStatus] = useState<"IDLE" | "SUCCESS" | "SKIPPED">("SUCCESS");
  const [simulatedReply, setSimulatedReply] = useState(
    "Hey @alex_traveler! Thanks for your interest. Pricing starts at $49/mo. Check your inbox for the breakdown!"
  );

  const runSimulation = () => {
    const text = commentInput.toLowerCase();
    if (text.includes("price") || text.includes("cost") || text.includes("pricing") || text.includes("rate")) {
      setSimulatedStatus("SUCCESS");
      setSimulatedReply(
        "Hey @alex_traveler! Thanks for your interest. Pricing starts at $49/mo. Check your inbox for the breakdown!"
      );
    } else {
      setSimulatedStatus("SKIPPED");
      setSimulatedReply("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] selection:bg-[#F5F5F5] selection:text-[#0A0A0A]">
      {/* Top Navigation */}
      <header className="h-16 border-b border-[#1F1F1F] px-6 lg:px-12 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] text-[#0A0A0A] font-bold text-base flex items-center justify-center shadow-xs">
            A
          </div>
          <span className="font-semibold text-base tracking-tight text-[#F5F5F5]">
            Asrii Automate
          </span>
          <Badge variant="mock" size="sm" className="hidden sm:inline-flex ml-1">
            Meta Graph API v21.0
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/playground"
            className="text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors hidden sm:inline"
          >
            Testing Playground
          </Link>
          <Link href="/auth">
            <Button size="sm" variant="secondary">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#262626] text-xs font-mono text-[#A3A3A3] mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
          <span>Official Meta API • No Scraping • Enterprise AES-256-GCM</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F5F5F5] max-w-4xl mx-auto leading-tight sm:leading-none">
          Automate Instagram conversations. Your way.
        </h1>

        <p className="text-base sm:text-lg text-[#A3A3A3] max-w-2xl mx-auto mt-6 leading-relaxed">
          Build reliable comment-to-DM workflows, test every execution, and manage your Instagram automation through one powerful developer workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
          <Link href="/auth" className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started Free
            </Button>
          </Link>
          <Link href="/dashboard/playground" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" leftIcon={<Zap className="w-4 h-4" />}>
              Open Playground
            </Button>
          </Link>
        </div>

        {/* Live Interactive Demo Simulator */}
        <div className="mt-16 text-left max-w-3xl mx-auto rounded-2xl bg-[#111111] border border-[#262626] shadow-2xl overflow-hidden">
          <div className="px-5 py-3.5 bg-[#141414] border-b border-[#222222] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#A3A3A3]" />
              <span className="text-xs font-mono font-medium text-[#F5F5F5]">
                Live Workflow Simulator (Client-Safe Sandbox)
              </span>
            </div>
            <Badge variant="mock">Mock Execution</Badge>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase text-[#737373] tracking-wider mb-2">
                Simulated Instagram Comment on Reel
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Type a comment, e.g. Can you send me the price?"
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
                <Button size="sm" variant="secondary" onClick={runSimulation} leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}>
                  Simulate
                </Button>
              </div>
            </div>

            {/* Workflow Match Info */}
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
                <span className="text-[#737373]">Workflow Selected:</span>
                <span className="text-[#F5F5F5] font-semibold">Price Inquiry Auto-Reply</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
                <span className="text-[#737373]">Condition Evaluated:</span>
                <span className="text-[#A3A3A3]">CONTAINS_ANY [price, cost, rate]</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737373]">Execution Status:</span>
                {simulatedStatus === "SUCCESS" ? (
                  <Badge variant="success">Mock Execution Successful</Badge>
                ) : (
                  <Badge variant="neutral">Condition Skipped (No Match)</Badge>
                )}
              </div>
            </div>

            {simulatedStatus === "SUCCESS" && (
              <div className="p-4 rounded-xl bg-[#141414] border border-[#2E2E2E] space-y-1.5">
                <span className="text-[11px] font-mono text-[#34D399] uppercase tracking-wider block">
                  Permitted Private Reply Prepared
                </span>
                <p className="text-xs text-[#F5F5F5] italic leading-relaxed">
                  &quot;{simulatedReply}&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-16 px-6 lg:px-12 border-t border-[#1F1F1F] bg-[#0D0D0D]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
              Built on Official Meta Architecture
            </h2>
            <p className="text-sm text-[#A3A3A3] mt-2">
              End-to-end webhook validation, HMAC-SHA256 signature verification, and permitted private replies.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222] font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2E2E2E] flex-1">
                <InstagramIcon className="w-5 h-5 mx-auto text-[#F5F5F5] mb-2" />
                <div className="text-xs font-semibold text-[#F5F5F5]">Instagram</div>
                <div className="text-[10px] text-[#737373] mt-0.5">Comment Event</div>
              </div>

              <div className="text-[#737373] font-bold">→</div>

              <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2E2E2E] flex-1">
                <ShieldCheck className="w-5 h-5 mx-auto text-[#34D399] mb-2" />
                <div className="text-xs font-semibold text-[#F5F5F5]">Meta API</div>
                <div className="text-[10px] text-[#737373] mt-0.5">Webhook Dispatch</div>
              </div>

              <div className="text-[#737373] font-bold">→</div>

              <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2E2E2E] flex-1">
                <Lock className="w-5 h-5 mx-auto text-[#A5B4FC] mb-2" />
                <div className="text-xs font-semibold text-[#F5F5F5]">Asrii Webhook</div>
                <div className="text-[10px] text-[#737373] mt-0.5">HMAC Verification</div>
              </div>

              <div className="text-[#737373] font-bold">→</div>

              <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2E2E2E] flex-1">
                <GitBranch className="w-5 h-5 mx-auto text-[#F5F5F5] mb-2" />
                <div className="text-xs font-semibold text-[#F5F5F5]">Workflow Engine</div>
                <div className="text-[10px] text-[#737373] mt-0.5">Rules & Policies</div>
              </div>

              <div className="text-[#737373] font-bold">→</div>

              <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2E2E2E] flex-1">
                <CheckCircle2 className="w-5 h-5 mx-auto text-[#34D399] mb-2" />
                <div className="text-xs font-semibold text-[#F5F5F5]">Private Reply</div>
                <div className="text-[10px] text-[#737373] mt-0.5">7-Day Window</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[#F5F5F5]">
            Engineered for High-Reliability Automation
          </h2>
          <p className="text-sm text-[#A3A3A3] mt-2">
            No brittle browser scrapers. No account lockouts. Official API compliance only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Comment Automation",
              desc: "Instantly reply to customer inquiries, lead requests, and keyword triggers on posts and reels.",
              icon: InstagramIcon,
            },
            {
              title: "Visual Workflow Builder",
              desc: "Configure conditions, case-sensitivity, regex matching, and template variables with zero code.",
              icon: GitBranch,
            },
            {
              title: "Mock & Live Sandbox",
              desc: "Simulate and inspect full execution timelines with guaranteed zero network calls in Mock Mode.",
              icon: Zap,
            },
            {
              title: "Webhook Deduplication",
              desc: "Automatic idempotency tracking ensures duplicate events from Meta are never processed twice.",
              icon: ShieldCheck,
            },
            {
              title: "AES-256-GCM Vault",
              desc: "Tokens are encrypted at rest with 256-bit keys and authentication tags. Zero client-side leakage.",
              icon: Lock,
            },
            {
              title: "Execution Timelines",
              desc: "Step-by-step developer logs with millisecond timings and sanitized payloads for auditability.",
              icon: Code2,
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#2E2E2E] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center text-[#F5F5F5] mb-4">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#F5F5F5]">{f.title}</h3>
                <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-[#1F1F1F] text-xs text-[#737373] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#F5F5F5]">Asrii Automate</span>
          <span>• Production Instagram SaaS for Developers</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/data-deletion">Data Deletion</Link>
          <Link href="/dashboard" className="hover:text-[#F5F5F5] transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard/playground" className="hover:text-[#F5F5F5] transition-colors">
            Playground
          </Link>
          <Link href="/dashboard/connect" className="hover:text-[#F5F5F5] transition-colors">
            Connect Meta
          </Link>
        </div>
      </footer>
    </div>
  );
}
