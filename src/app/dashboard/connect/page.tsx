"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ShieldCheck,
  Key,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";

interface AccountData {
  id: string;
  igUserId: string;
  igUsername: string;
  igName?: string;
  profilePictureUrl?: string;
  healthStatus: string;
  isDeveloperToken: boolean;
  scopes: string[];
  createdAt: string;
}

export default function ConnectPage() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [devToken, setDevToken] = useState("");
  const [devIgUsername, setDevIgUsername] = useState("asrii.official");
  const [devIgUserId, setDevIgUserId] = useState("17841400012345678");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reloadAccount = async () => {
    try {
      const res = await fetch("/api/meta/account");
      const data = await res.json();
      if (data.connected && data.account) {
        setAccount(data.account);
      } else {
        setAccount(null);
      }
    } catch {
      setAccount(null);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadAccount() {
      try {
        const res = await fetch("/api/meta/account");
        const data = await res.json();
        if (!ignore) {
          if (data.connected && data.account) {
            setAccount(data.account);
          } else {
            setAccount(null);
          }
        }
      } catch {
        if (!ignore) {
          setAccount(null);
        }
      }
    }
    loadAccount();
    return () => {
      ignore = true;
    };
  }, []);

  const handleConnectDeveloperToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devToken.trim()) return;

    setIsConnecting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: devToken.trim(),
          igUsername: devIgUsername.trim(),
          igUserId: devIgUserId.trim(),
          environment: "development",
          isDeveloperToken: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to connect token");
      }

      setSuccessMessage("Instagram account connected and token encrypted with AES-256-GCM!");
      setIsModalOpen(false);
      setDevToken("");
      reloadAccount();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this Instagram account? Active workflows will pause.")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await fetch("/api/meta/disconnect", { method: "POST" });
      setAccount(null);
      setSuccessMessage("Account disconnected successfully.");
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
          Meta Instagram Connection
        </h1>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Connect your Instagram Professional (Business or Creator) account via official Meta Graph API v21.0.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#064E3B]/30 border border-[#065F46] text-[#34D399] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#7F1D1D]/30 border border-[#991B1B] text-[#F87171] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Status Card */}
      {account ? (
        <Card elevated className="border-[#262626]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center text-[#F5F5F5]">
                <InstagramIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[#F5F5F5]">
                    @{account.igUsername}
                  </h2>
                  <Badge variant="success">Connected</Badge>
                  {account.isDeveloperToken && (
                    <Badge variant="mock">DEVELOPMENT TOKEN</Badge>
                  )}
                </div>
                <div className="text-xs text-[#737373] mt-0.5">
                  IG ID: <span className="font-mono text-[#A3A3A3]">{account.igUserId}</span> • Graph API v21.0
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={reloadAccount}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDisconnecting}
                onClick={handleDisconnect}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Disconnect
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider font-mono mb-3">
                Granted Meta Permissions (Scopes)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[
                  {
                    scope: "instagram_manage_comments",
                    desc: "Read comments and subscribe to comment webhook events",
                  },
                  {
                    scope: "instagram_manage_messages",
                    desc: "Send permitted private replies to comments within 7 days",
                  },
                  {
                    scope: "instagram_basic",
                    desc: "Read basic Instagram profile information and ID",
                  },
                  {
                    scope: "pages_show_list",
                    desc: "Show connected Facebook Pages linked to Instagram",
                  },
                ].map((s) => (
                  <div
                    key={s.scope}
                    className="p-3 rounded-lg bg-[#141414] border border-[#222222] flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-mono font-medium text-[#F5F5F5]">
                        {s.scope}
                      </div>
                      <div className="text-[11px] text-[#737373] mt-0.5">
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0E0E0E] border border-[#1F1F1F] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#A3A3A3]">
                <Lock className="w-4 h-4 text-[#34D399]" />
                <span>Encrypted at rest using AES-256-GCM. Tokens are never exposed to browser bundles.</span>
              </div>
              <span className="text-[11px] font-mono text-[#737373]">
                IV: 16 bytes • Tag: 16 bytes
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Unconnected State: Connection Options */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: Meta OAuth */}
          <Card className="flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center text-[#F5F5F5]">
                <InstagramIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#F5F5F5]">
                  Option A: Official Meta OAuth
                </h3>
                <p className="text-xs text-[#A3A3A3] mt-1.5 leading-relaxed">
                  Log in via Facebook Login for Business to authorize Instagram Professional account access.
                </p>
              </div>
              <ul className="text-xs text-[#737373] space-y-1.5 list-disc list-inside">
                <li>Requires Instagram Business or Creator account</li>
                <li>Requires linked Facebook Page</li>
                <li>App Review approval needed for production users</li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0">
              <a
                href="https://www.facebook.com/v21.0/dialog/oauth?client_id=YOUR_META_APP_ID&redirect_uri=http://localhost:3000/api/meta/connect&scope=instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_show_list"
                target="_blank"
                rel="noreferrer"
                className="w-full block"
              >
                <Button variant="secondary" className="w-full" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  Connect with Meta OAuth
                </Button>
              </a>
            </div>
          </Card>

          {/* Option B: Developer Token Connect */}
          <Card className="flex flex-col justify-between border-[#2B2B2B]">
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center text-[#F5F5F5]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#F5F5F5]">
                    Option B: Developer Token Connect
                  </h3>
                  <Badge variant="mock">RECOMMENDED FOR TESTING</Badge>
                </div>
                <p className="text-xs text-[#A3A3A3] mt-1.5 leading-relaxed">
                  Connect using a Meta Graph API Explorer Page/User token to test workflows instantly in a sandbox environment before full App Review.
                </p>
              </div>
              <ul className="text-xs text-[#737373] space-y-1.5 list-disc list-inside">
                <li>Instant connection with developer test tokens</li>
                <li>AES-256-GCM token encryption on submission</li>
                <li>Never stored in localStorage or exposed to client</li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Key className="w-4 h-4" />}
              >
                Connect Developer Token
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Developer Token Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect Developer Token"
        description="Submit your Meta Graph API Explorer token for authorized testing. It is encrypted immediately using AES-256-GCM."
      >
        <form onSubmit={handleConnectDeveloperToken} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
              Meta Graph API Access Token (User or Page Token)
            </label>
            <input
              type="password"
              value={devToken}
              onChange={(e) => setDevToken(e.target.value)}
              placeholder="EAABwzLixnjYBA..."
              required
              className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
            />
            <p className="text-[11px] text-[#737373] mt-1">
              Obtained from Meta Graph API Explorer with `instagram_manage_comments` and `instagram_manage_messages`.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
                Instagram Handle
              </label>
              <input
                type="text"
                value={devIgUsername}
                onChange={(e) => setDevIgUsername(e.target.value)}
                placeholder="your.instagram.handle"
                className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
                Instagram Account ID
              </label>
              <input
                type="text"
                value={devIgUserId}
                onChange={(e) => setDevIgUserId(e.target.value)}
                placeholder="178414000..."
                className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] text-[11px] text-[#A3A3A3] space-y-1">
            <div className="flex items-center gap-1.5 text-[#F5F5F5] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Security Guarantee</span>
            </div>
            <p>
              Your token will be encrypted server-side using AES-256-GCM. Raw tokens are never logged or returned in responses.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isConnecting}
            >
              Encrypt & Save Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
