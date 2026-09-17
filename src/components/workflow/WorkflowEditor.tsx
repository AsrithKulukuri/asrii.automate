"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ShieldAlert,
  Plus,
  X,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { MatchType } from "@/lib/engine/matcher";

export interface WorkflowEditorProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    isActive: boolean;
    triggerConfig: {
      type: string;
      postId?: string | null;
    };
    conditionConfig: {
      matchType: MatchType;
      keywords: string[];
      excludedKeywords: string[];
      caseSensitive: boolean;
      postId?: string | null;
    };
    actionConfig: {
      type: string;
      template: string;
    };
  };
}

export function WorkflowEditor({ initialData }: WorkflowEditorProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "New Comment Automation");
  const [description, setDescription] = useState(
    initialData?.description || "Sends private reply when specific keyword is mentioned"
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Trigger
  const [triggerScope, setTriggerScope] = useState<"ALL" | "SPECIFIC">(
    initialData?.triggerConfig?.postId ? "SPECIFIC" : "ALL"
  );
  const [triggerPostId, setTriggerPostId] = useState(
    initialData?.triggerConfig?.postId || ""
  );

  // Condition
  const [matchType, setMatchType] = useState<MatchType>(
    initialData?.conditionConfig?.matchType || "CONTAINS_ANY"
  );
  const [keywords, setKeywords] = useState<string[]>(
    initialData?.conditionConfig?.keywords || ["price", "cost", "info"]
  );
  const [currentKeywordInput, setCurrentKeywordInput] = useState("");
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>(
    initialData?.conditionConfig?.excludedKeywords || ["spam", "fake"]
  );
  const [currentExcludedInput, setCurrentExcludedInput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(
    initialData?.conditionConfig?.caseSensitive || false
  );

  // Action
  const [actionTemplate, setActionTemplate] = useState(
    initialData?.actionConfig?.template ||
      "Hey {{username}}! Thanks for your interest. Pricing starts at $49/mo with full access. Let us know if you have any questions!"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddKeyword = () => {
    if (currentKeywordInput.trim() && !keywords.includes(currentKeywordInput.trim())) {
      setKeywords([...keywords, currentKeywordInput.trim()]);
      setCurrentKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleAddExcluded = () => {
    if (currentExcludedInput.trim() && !excludedKeywords.includes(currentExcludedInput.trim())) {
      setExcludedKeywords([...excludedKeywords, currentExcludedInput.trim()]);
      setCurrentExcludedInput("");
    }
  };

  const handleRemoveExcluded = (kw: string) => {
    setExcludedKeywords(excludedKeywords.filter((k) => k !== kw));
  };

  const insertVariable = (variable: string) => {
    setActionTemplate((prev) => prev + " " + variable);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage("Workflow name cannot be empty");
      return;
    }
    if (!actionTemplate.trim()) {
      setErrorMessage("Private reply message cannot be empty");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      isActive,
      triggerConfig: {
        type: "COMMENT_RECEIVED",
        postId: triggerScope === "SPECIFIC" ? triggerPostId.trim() : null,
      },
      conditionConfig: {
        matchType,
        keywords,
        excludedKeywords,
        caseSensitive,
        postId: triggerScope === "SPECIFIC" ? triggerPostId.trim() : null,
      },
      actionConfig: {
        type: "PRIVATE_REPLY",
        template: actionTemplate.trim(),
      },
    };

    try {
      const isEdit = Boolean(initialData?.id);
      const url = isEdit ? `/api/workflows/${initialData?.id}` : "/api/workflows";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save workflow");
      }

      setSuccessMessage("Workflow saved successfully!");
      if (!isEdit && data.workflow?.id) {
        router.push(`/dashboard/workflows/${data.workflow.id}`);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/workflows"
              className="text-xs text-[#737373] hover:text-[#F5F5F5] transition-colors font-mono"
            >
              Workflows
            </Link>
            <span className="text-[#404040]">/</span>
            <span className="text-xs text-[#A3A3A3] font-mono">
              {initialData?.id ? "Edit Workflow" : "New Automation"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5] mt-1">
            {initialData?.id ? name : "Workflow Builder"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {initialData?.id && (
            <Link href={`/dashboard/playground?workflowId=${initialData.id}`}>
              <Button size="sm" variant="outline" leftIcon={<Zap className="w-3.5 h-3.5" />}>
                Test in Playground
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="primary"
            isLoading={isSaving}
            onClick={handleSave}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Workflow
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#064E3B]/30 border border-[#065F46] text-[#34D399] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#7F1D1D]/30 border border-[#991B1B] text-[#F87171] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* General Information Card */}
      <Card>
        <CardHeader>
          <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider font-mono">
            Workflow Details
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737373]">Status:</span>
            <button
              onClick={() => setIsActive(!isActive)}
              type="button"
              className="cursor-pointer"
            >
              <Badge variant={isActive ? "success" : "neutral"}>
                {isActive ? "Active" : "Paused"}
              </Badge>
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Price Inquiry Auto-Reply"
              className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this workflow accomplishes"
              className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Structured Visual Flow: TRIGGER -> CONDITION -> ACTION */}
      <div className="relative space-y-6">
        {/* Node 1: TRIGGER */}
        <Card className="border-l-4 border-l-[#F5F5F5]">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#222222] flex items-center justify-center text-xs font-bold text-[#F5F5F5]">
                1
              </div>
              <span className="text-sm font-semibold text-[#F5F5F5]">
                Trigger: Instagram Comment Received
              </span>
            </div>
            <Badge variant="mock">Official Meta Webhook</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-[#A3A3A3]">
              Fires when a user comments on an Instagram post or reel connected to your Professional account.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#D4D4D4]">
                Target Posts
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-[#F5F5F5] cursor-pointer">
                  <input
                    type="radio"
                    name="triggerScope"
                    checked={triggerScope === "ALL"}
                    onChange={() => setTriggerScope("ALL")}
                    className="accent-white"
                  />
                  <span>All current & future posts / reels</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#F5F5F5] cursor-pointer">
                  <input
                    type="radio"
                    name="triggerScope"
                    checked={triggerScope === "SPECIFIC"}
                    onChange={() => setTriggerScope("SPECIFIC")}
                    className="accent-white"
                  />
                  <span>Specific Post or Reel ID only</span>
                </label>
              </div>
            </div>

            {triggerScope === "SPECIFIC" && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1">
                  Meta Instagram Post ID
                </label>
                <input
                  type="text"
                  value={triggerPostId}
                  onChange={(e) => setTriggerPostId(e.target.value)}
                  placeholder="e.g. 17923485729183492"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Node 2: CONDITIONS */}
        <Card className="border-l-4 border-l-[#A3A3A3]">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#222222] flex items-center justify-center text-xs font-bold text-[#F5F5F5]">
                2
              </div>
              <span className="text-sm font-semibold text-[#F5F5F5]">
                Condition: Comment Matching Rules
              </span>
            </div>
            <span className="text-xs text-[#737373] font-mono">
              Type: {matchType}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
                Match Rule
              </label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as MatchType)}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
              >
                <option value="CONTAINS_ANY">CONTAINS_ANY — Matches if comment contains any keyword</option>
                <option value="CONTAINS_ALL">CONTAINS_ALL — Matches only if comment has all keywords</option>
                <option value="EXACT_MATCH">EXACT_MATCH — Matches if comment is identical to keyword</option>
                <option value="STARTS_WITH">STARTS_WITH — Matches if comment begins with keyword</option>
                <option value="REGEX">REGEX — Regular expression pattern matching</option>
                <option value="ANY_COMMENT">ANY_COMMENT — Trigger on every comment without filtering</option>
              </select>
            </div>

            {matchType !== "ANY_COMMENT" && (
              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
                  Target Keywords / Phrases
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentKeywordInput}
                    onChange={(e) => setCurrentKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="Type keyword and press Enter or click Add"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleAddKeyword}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1C1C1C] border border-[#2E2E2E] text-xs font-mono text-[#F5F5F5]"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="hover:text-[#EF4444] transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {keywords.length === 0 && (
                    <span className="text-xs text-[#737373] italic">
                      No keywords added yet.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Spam Filter: Excluded Keywords */}
            <div>
              <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
                Excluded Keywords (Spam & Bot Protection)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentExcludedInput}
                  onChange={(e) => setCurrentExcludedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExcluded();
                    }
                  }}
                  placeholder="e.g. spam, scam, fake, promo"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddExcluded}
                >
                  Add Excluded
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
                {excludedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#241414] border border-[#3E1D1D] text-xs font-mono text-[#F87171]"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExcluded(kw)}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs text-[#A3A3A3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="accent-white"
                />
                <span>Case-sensitive keyword matching</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Node 3: ACTION */}
        <Card className="border-l-4 border-l-[#34D399]">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#222222] flex items-center justify-center text-xs font-bold text-[#F5F5F5]">
                3
              </div>
              <span className="text-sm font-semibold text-[#F5F5F5]">
                Action: Send Permitted Private Reply
              </span>
            </div>
            <Badge variant="live">Official Meta Action</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[#D4D4D4]">
                Message Content
              </label>
              <div className="flex items-center gap-1 text-[11px] text-[#A3A3A3]">
                <span>Variables:</span>
                <button
                  type="button"
                  onClick={() => insertVariable("{{username}}")}
                  className="px-1.5 py-0.5 rounded bg-[#1C1C1C] border border-[#2E2E2E] hover:text-[#F5F5F5] font-mono text-[11px]"
                >
                  + &#123;&#123;username&#125;&#125;
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable("{{comment}}")}
                  className="px-1.5 py-0.5 rounded bg-[#1C1C1C] border border-[#2E2E2E] hover:text-[#F5F5F5] font-mono text-[11px]"
                >
                  + &#123;&#123;comment&#125;&#125;
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={actionTemplate}
              onChange={(e) => setActionTemplate(e.target.value)}
              placeholder="Write your private reply here..."
              className="w-full p-3 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] text-xs text-[#F5F5F5] leading-relaxed focus:outline-none focus:border-[#F5F5F5]"
            />

            {/* Live Message Preview */}
            <div className="p-3 rounded-lg bg-[#141414] border border-[#222222]">
              <span className="text-[11px] uppercase tracking-wider text-[#737373] font-mono block mb-1">
                Rendered Preview
              </span>
              <p className="text-xs text-[#E5E5E5] italic">
                &quot;{actionTemplate.replace(/{{\s*username\s*}}/gi, "alex_creator").replace(/{{\s*comment\s*}}/gi, "What is the price?")}&quot;
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta Compliance & Policy Card */}
      <Card elevated className="border-[#382810] bg-[#14110C]">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Official Meta Instagram Messaging Policies Enforced</span>
          </div>
          <ul className="text-xs text-[#D97706] space-y-1.5 list-disc list-inside">
            <li>
              <strong>One private reply limit:</strong> Meta strictly allows only 1 private reply per comment.
            </li>
            <li>
              <strong>7-day window:</strong> Private replies can only be sent within 7 days of comment creation.
            </li>
            <li>
              <strong>24-hour DM window:</strong> Follow-up DMs are allowed only after the customer replies to your message.
            </li>
            <li>
              <strong>Testing safety:</strong> Use the Playground in Mock Mode to safely verify matching before enabling Live Mode.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
