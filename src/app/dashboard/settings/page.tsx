"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Webhook,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Users,
} from "lucide-react";

export default function SettingsPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    status: string;
    verifiedAt: string;
  } | null>(null);

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/instagram`
      : "http://localhost:3000/api/webhooks/instagram";

  const verifyToken = "asrii_automate_verify_token_dev";

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const testWebhookHandshake = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch("/api/settings/test-webhook", { method: "POST" });
      const data = await res.json();
      setWebhookTestResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
          Workspace & Webhook Settings
        </h1>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Configure official Meta webhook endpoints, encryption keys, and developer preferences.
        </p>
      </div>

      {/* Webhook Configuration */}
      <Card elevated className="border-[#262626]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-[#A3A3A3]" />
            <span className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
              Meta Webhook Verification Configuration
            </span>
          </div>
          <Badge variant="live">Official Meta Subscription</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-xs text-[#A3A3A3] leading-relaxed">
            Configure these values in the Meta Developer Portal under{" "}
            <strong>Instagram &gt; Webhooks</strong> to receive real-time comment and messaging events.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#D4D4D4] mb-1">
                Callback URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={callbackUrl}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F5]"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(callbackUrl, "url")}
                  leftIcon={
                    copiedField === "url" ? (
                      <Check className="w-3.5 h-3.5 text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedField === "url" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D4D4D4] mb-1">
                Verify Token (hub.verify_token)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={verifyToken}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F5]"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(verifyToken, "token")}
                  leftIcon={
                    copiedField === "token" ? (
                      <Check className="w-3.5 h-3.5 text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedField === "token" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#1F1F1F]">
            <Button
              size="sm"
              variant="outline"
              isLoading={isTestingWebhook}
              onClick={testWebhookHandshake}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              Test Webhook Handshake (Ping)
            </Button>

            {webhookTestResult && (
              <span className="text-xs font-mono text-[#34D399] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Handshake Verified: {webhookTestResult.status} ({new Date(webhookTestResult.verifiedAt).toLocaleTimeString()})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security & Cryptography Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#34D399]" />
            <span className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
              Cryptographic Security & Token Vault
            </span>
          </div>
          <Badge variant="success">Active Protection</Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-[#141414] border border-[#222222]">
              <span className="text-[#737373] block mb-1 font-mono uppercase text-[10px]">
                Encryption Algorithm
              </span>
              <span className="font-semibold text-[#F5F5F5] font-mono">
                AES-256-GCM (Authenticated)
              </span>
              <p className="text-[#737373] mt-1 text-[11px]">
                Tokens are encrypted with a 256-bit key and verified with a 16-byte authentication tag to detect any tampering.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#141414] border border-[#222222]">
              <span className="text-[#737373] block mb-1 font-mono uppercase text-[10px]">
                Zero-Leak Guarantee
              </span>
              <span className="font-semibold text-[#F5F5F5] font-mono">
                Server-Only Decryption
              </span>
              <p className="text-[#737373] mt-1 text-[11px]">
                Plaintext access tokens never leave the server. API responses and logs only display masked representations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#A3A3A3]" />
            <span className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
              Workspace Profile
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#737373] mb-1 font-mono text-[11px]">
                Workspace Name
              </label>
              <div className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#222222] text-[#F5F5F5]">
                Asrii Automation Studio
              </div>
            </div>
            <div>
              <label className="block text-[#737373] mb-1 font-mono text-[11px]">
                Workspace Slug
              </label>
              <div className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#222222] font-mono text-[#A3A3A3]">
                asrii-studio
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
