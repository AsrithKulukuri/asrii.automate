export type MatchType =
  | "ANY_COMMENT"
  | "CONTAINS_ANY"
  | "CONTAINS_ALL"
  | "EXACT_MATCH"
  | "STARTS_WITH"
  | "REGEX";

export interface ConditionConfig {
  matchType: MatchType;
  keywords?: string[];
  excludedKeywords?: string[];
  caseSensitive?: boolean;
  postId?: string | null; // Specific post filter
}

export interface MatchResult {
  matched: boolean;
  reason: string;
  matchedKeyword?: string;
  matchedTrigger?: boolean;
}

/**
 * Evaluates whether a comment matches the workflow's configured conditions.
 */
export function evaluateCommentCondition(
  commentText: string,
  incomingPostId: string,
  condition: ConditionConfig,
  triggerPostId?: string | null
): MatchResult {
  // 1. Post ID check if workflow is scoped to a specific post/reel
  const targetPostId = condition.postId || triggerPostId;
  if (targetPostId && targetPostId.trim() !== "") {
    if (incomingPostId !== targetPostId.trim()) {
      return {
        matched: false,
        reason: `Comment post ID (${incomingPostId}) does not match target post ID (${targetPostId})`,
      };
    }
  }

  const rawComment = commentText || "";
  const comment = condition.caseSensitive ? rawComment : rawComment.toLowerCase();

  // 2. Check excluded keywords first (Spam protection)
  const excluded = condition.excludedKeywords || [];
  for (const exc of excluded) {
    const term = condition.caseSensitive ? exc.trim() : exc.trim().toLowerCase();
    if (term && comment.includes(term)) {
      return {
        matched: false,
        reason: `Comment contains excluded keyword: "${exc}"`,
      };
    }
  }

  // 3. Match types
  switch (condition.matchType) {
    case "ANY_COMMENT":
      return {
        matched: true,
        reason: "Matched ANY_COMMENT condition rule",
      };

    case "EXACT_MATCH": {
      const keywords = condition.keywords || [];
      for (const kw of keywords) {
        const term = condition.caseSensitive ? kw.trim() : kw.trim().toLowerCase();
        if (comment.trim() === term) {
          return {
            matched: true,
            reason: `Exact match with keyword: "${kw}"`,
            matchedKeyword: kw,
          };
        }
      }
      return {
        matched: false,
        reason: `Comment text "${rawComment}" did not exactly match any configured keywords`,
      };
    }

    case "STARTS_WITH": {
      const keywords = condition.keywords || [];
      for (const kw of keywords) {
        const term = condition.caseSensitive ? kw.trim() : kw.trim().toLowerCase();
        if (comment.trim().startsWith(term)) {
          return {
            matched: true,
            reason: `Comment starts with keyword: "${kw}"`,
            matchedKeyword: kw,
          };
        }
      }
      return {
        matched: false,
        reason: `Comment does not start with any configured keywords`,
      };
    }

    case "CONTAINS_ALL": {
      const keywords = (condition.keywords || []).map((k) => k.trim()).filter(Boolean);
      if (keywords.length === 0) {
        return { matched: true, reason: "No keywords required" };
      }
      for (const kw of keywords) {
        const term = condition.caseSensitive ? kw : kw.toLowerCase();
        if (!comment.includes(term)) {
          return {
            matched: false,
            reason: `Missing required keyword: "${kw}"`,
          };
        }
      }
      return {
        matched: true,
        reason: `Contains all required keywords (${keywords.join(", ")})`,
      };
    }

    case "REGEX": {
      const patterns = condition.keywords || [];
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern, condition.caseSensitive ? "" : "i");
          if (regex.test(rawComment)) {
            return {
              matched: true,
              reason: `Matched regular expression: /${pattern}/`,
              matchedKeyword: pattern,
            };
          }
        } catch (e) {
          return {
            matched: false,
            reason: `Invalid regular expression pattern: ${pattern} (${(e as Error).message})`,
          };
        }
      }
      return {
        matched: false,
        reason: "Comment did not match regex pattern",
      };
    }

    case "CONTAINS_ANY":
    default: {
      const keywords = (condition.keywords || []).map((k) => k.trim()).filter(Boolean);
      if (keywords.length === 0) {
        return { matched: true, reason: "No keywords specified, accepted by default" };
      }
      for (const kw of keywords) {
        const term = condition.caseSensitive ? kw : kw.toLowerCase();
        if (comment.includes(term)) {
          return {
            matched: true,
            reason: `Contains keyword: "${kw}"`,
            matchedKeyword: kw,
          };
        }
      }
      return {
        matched: false,
        reason: `Comment does not contain any of the configured keywords: [${keywords.join(", ")}]`,
      };
    }
  }
}

/**
 * Replaces message template variables with runtime values.
 * Supports: {{username}}, {{comment}}
 */
export function renderMessageTemplate(
  template: string,
  variables: { username?: string; comment?: string }
): string {
  let result = template;
  if (variables.username !== undefined) {
    const userVal = variables.username;
    result = result.replace(/{{\s*username\s*}}/gi, () => userVal);
  }
  if (variables.comment !== undefined) {
    const commentVal = variables.comment;
    result = result.replace(/{{\s*comment\s*}}/gi, () => commentVal);
  }
  return result;
}
