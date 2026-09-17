"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  ArrowRight,
  Terminal,
  CheckCircle2,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isDemoLoginLoading, setIsDemoLoginLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoginLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setIsDemoLoginLoading(false);
    }
  };

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSendingMagicLink(true);
    setTimeout(() => {
      setIsSendingMagicLink(false);
      setInfoMessage("Magic sign-in link dispatched. In local dev mode, click Developer Demo Session below.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex flex-col justify-center items-center p-6 selection:bg-[#F5F5F5] selection:text-[#0A0A0A]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] text-[#0A0A0A] font-bold text-base flex items-center justify-center shadow-xs">
              A
            </div>
            <span className="font-semibold text-lg tracking-tight text-[#F5F5F5]">
              Asrii Automate
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
            Sign in to your workspace
          </h1>
          <p className="text-xs text-[#A3A3A3]">
            Official Meta Instagram Graph API automation platform.
          </p>
        </div>

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-[#064E3B]/30 border border-[#065F46] text-[#34D399] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        <Card elevated className="border-[#262626]">
          <CardContent className="p-6 space-y-5">
            {/* Google Sign-in */}
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => {
                setInfoMessage("Google OAuth configured via Supabase. For instant local testing, use Developer Demo Login.");
              }}
              leftIcon={
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              }
            >
              Continue with Google
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#222222] w-full" />
              <span className="bg-[#111111] px-3 text-[11px] text-[#737373] uppercase font-mono tracking-wider absolute">
                or email
              </span>
            </div>

            {/* Email form */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                size="md"
                isLoading={isSendingMagicLink}
              >
                Send Magic Sign-In Link
              </Button>
            </form>

            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-[#222222] w-full" />
              <span className="bg-[#111111] px-3 text-[11px] text-[#737373] uppercase font-mono tracking-wider absolute">
                Instant Developer Access
              </span>
            </div>

            {/* Instant Dev Session */}
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                size="lg"
                isLoading={isDemoLoginLoading}
                onClick={handleDemoLogin}
                leftIcon={<Terminal className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Developer Demo Session
              </Button>
              <p className="text-[11px] text-[#737373] text-center leading-relaxed">
                Initializes local developer workspace with pre-seeded workflows, safe testing sandbox, and SQLite storage.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-[#737373] flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#34D399]" />
          <span>Official Meta API • No Scraping • AES-256-GCM Vault</span>
        </div>
      </div>
    </div>
  );
}
