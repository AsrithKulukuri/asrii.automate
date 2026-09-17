"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  FlaskConical,
  Activity,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InstagramIcon } from "@/components/icons/InstagramIcon";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    workspaceName: string;
    isDemo: boolean;
  };
  connectedAccount?: {
    igUsername: string;
    healthStatus: string;
    isDeveloperToken: boolean;
  } | null;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/dashboard/workflows", icon: GitBranch },
  { label: "Playground", href: "/dashboard/playground", icon: FlaskConical },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Connect Meta", href: "/dashboard/connect", icon: InstagramIcon },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardShell({ children, user, connectedAccount }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-[#F5F5F5]">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F0F0F] border-r border-[#1F1F1F] flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-[#1F1F1F]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#0A0A0A] font-bold text-sm shadow-xs">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-[#F5F5F5]">
                Asrii Automate
              </span>
              <span className="text-[10px] text-[#737373] tracking-widest uppercase font-mono">
                Official Meta API
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-[#A3A3A3] hover:text-[#F5F5F5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="px-3 py-3 border-b border-[#1A1A1A]">
          <div className="px-3 py-2 rounded-lg bg-[#141414] border border-[#222222] flex items-center justify-between">
            <div className="truncate">
              <div className="text-[11px] uppercase tracking-wider text-[#737373] font-mono">
                Workspace
              </div>
              <div className="text-xs font-medium text-[#F5F5F5] truncate">
                {user.workspaceName}
              </div>
            </div>
            {user.isDemo && (
              <Badge variant="mock" size="sm">
                DEV
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#1E1E1E] text-[#F5F5F5] border border-[#2E2E2E]"
                    : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#141414]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-current" />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F5F5F5]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Connected Account Mini-Card */}
        <div className="p-3 border-t border-[#1A1A1A]">
          {connectedAccount ? (
            <div className="p-2.5 rounded-lg bg-[#141414] border border-[#222222]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <InstagramIcon className="w-3.5 h-3.5 text-[#F5F5F5]" />
                  <span className="text-xs font-medium text-[#F5F5F5]">
                    @{connectedAccount.igUsername}
                  </span>
                </div>
                <Badge
                  variant={
                    connectedAccount.healthStatus === "HEALTHY"
                      ? "success"
                      : "warning"
                  }
                  size="sm"
                >
                  {connectedAccount.healthStatus === "HEALTHY" ? "Active" : "Check"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#737373]">
                <span>Official v21.0</span>
                <Link
                  href="/dashboard/connect"
                  className="text-[#A3A3A3] hover:text-[#F5F5F5] flex items-center gap-0.5"
                >
                  Manage <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href="/dashboard/connect"
              className="block p-2.5 rounded-lg bg-[#171410] border border-[#3A2B15] text-[#F59E0B] hover:bg-[#201A12] transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-medium mb-1">
                <InstagramIcon className="w-3.5 h-3.5" />
                <span>Connect Instagram</span>
              </div>
              <p className="text-[11px] text-[#D97706] leading-tight">
                Connect official Professional account to activate workflows.
              </p>
            </Link>
          )}
        </div>

        {/* User Session Footer */}
        <div className="h-14 px-4 border-t border-[#1F1F1F] flex items-center justify-between bg-[#0C0C0C]">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center text-xs font-medium text-[#F5F5F5] uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-[#F5F5F5] truncate leading-tight">
                {user.name}
              </div>
              <div className="text-[10px] text-[#737373] truncate leading-tight">
                {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Sign out"
            className="p-1.5 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 px-6 border-b border-[#1F1F1F] bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 text-[#A3A3A3] hover:text-[#F5F5F5] rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-[#737373]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="hidden sm:inline">Meta Graph API v21.0</span>
              <span className="text-[#333333]">|</span>
              <span className="text-[#A3A3A3]">AES-256-GCM Secure</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/playground">
              <Button size="sm" variant="secondary" leftIcon={<Zap className="w-3.5 h-3.5" />}>
                Test Playground
              </Button>
            </Link>
            <a
              href="https://developers.facebook.com/docs/instagram-platform"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1 text-xs text-[#737373] hover:text-[#A3A3A3] transition-colors font-mono"
            >
              Meta Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
