import { describe, it, expect } from "vitest";
import { evaluateCommentCondition, renderMessageTemplate } from "../lib/engine/matcher";

describe("Workflow Condition Matcher", () => {
  it("should match ANY_COMMENT condition", () => {
    const res = evaluateCommentCondition("Random comment here!", "post_1", {
      matchType: "ANY_COMMENT",
    });
    expect(res.matched).toBe(true);
  });

  it("should match CONTAINS_ANY with case insensitivity by default", () => {
    const res = evaluateCommentCondition("Can you share the PRICE please?", "post_1", {
      matchType: "CONTAINS_ANY",
      keywords: ["price", "cost", "how much"],
      caseSensitive: false,
    });
    expect(res.matched).toBe(true);
    expect(res.matchedKeyword).toBe("price");
  });

  it("should respect case sensitivity when enabled", () => {
    const res = evaluateCommentCondition("Can you share the price please?", "post_1", {
      matchType: "CONTAINS_ANY",
      keywords: ["PRICE"],
      caseSensitive: true,
    });
    expect(res.matched).toBe(false);
  });

  it("should match EXACT_MATCH", () => {
    const res = evaluateCommentCondition("PRICE", "post_1", {
      matchType: "EXACT_MATCH",
      keywords: ["PRICE", "BUY"],
      caseSensitive: false,
    });
    expect(res.matched).toBe(true);

    const res2 = evaluateCommentCondition("What is the price?", "post_1", {
      matchType: "EXACT_MATCH",
      keywords: ["price"],
      caseSensitive: false,
    });
    expect(res2.matched).toBe(false);
  });

  it("should match STARTS_WITH", () => {
    const res = evaluateCommentCondition("info regarding your course", "post_1", {
      matchType: "STARTS_WITH",
      keywords: ["info"],
      caseSensitive: false,
    });
    expect(res.matched).toBe(true);
  });

  it("should reject comments containing excluded keywords (spam protection)", () => {
    const res = evaluateCommentCondition("Send price, but this is a scam bot", "post_1", {
      matchType: "CONTAINS_ANY",
      keywords: ["price"],
      excludedKeywords: ["scam", "bot"],
      caseSensitive: false,
    });
    expect(res.matched).toBe(false);
    expect(res.reason).toContain("excluded keyword");
  });

  it("should evaluate REGEX patterns", () => {
    const res = evaluateCommentCondition("I have $50 to spend", "post_1", {
      matchType: "REGEX",
      keywords: ["\\$\\d+"],
    });
    expect(res.matched).toBe(true);
  });

  it("should enforce specific post ID filtering when configured", () => {
    const res = evaluateCommentCondition("Tell me the price", "post_reel_999", {
      matchType: "CONTAINS_ANY",
      keywords: ["price"],
      postId: "post_reel_111", // Mismatched post ID
    });
    expect(res.matched).toBe(false);
    expect(res.reason).toContain("does not match target post ID");
  });

  it("should render message template with variables", () => {
    const template = "Hey {{username}}! Thanks for your comment: \"{{comment}}\".";
    const rendered = renderMessageTemplate(template, {
      username: "sarah_traveler",
      comment: "How much is the itinerary?",
    });

    expect(rendered).toBe('Hey sarah_traveler! Thanks for your comment: "How much is the itinerary?".');
  });
});
