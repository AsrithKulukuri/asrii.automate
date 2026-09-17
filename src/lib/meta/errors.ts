// Unified Meta API Error Classification System

export type MetaErrorCategory =
  | "INVALID_TOKEN"
  | "EXPIRED_TOKEN"
  | "MISSING_PERMISSIONS"
  | "ALREADY_REPLIED"
  | "EXPIRED_MESSAGING_WINDOW"
  | "RATE_LIMIT"
  | "NETWORK_FAILURE"
  | "UNSUPPORTED_OPERATION"
  | "UNKNOWN_ERROR";

export interface ClassifiedMetaError {
  category: MetaErrorCategory;
  title: string;
  description: string;
  troubleshooting: string;
  rawCode?: number;
  rawSubcode?: number;
  isRetryable: boolean;
}

export function classifyMetaError(error: unknown): ClassifiedMetaError {
  if (typeof error === "object" && error !== null && "error" in error) {
    const metaErr = (error as { error: { message?: string; code?: number; error_subcode?: number } }).error;
    const code = metaErr.code;
    const subcode = metaErr.error_subcode;
    const msg = metaErr.message?.toLowerCase() || "";

    // Code 190: Invalid or expired OAuth access token
    if (code === 190) {
      if (subcode === 463 || subcode === 467 || msg.includes("expired")) {
        return {
          category: "EXPIRED_TOKEN",
          title: "Meta Access Token Expired",
          description: "The access token for this Instagram account has expired.",
          troubleshooting: "Reconnect your Instagram account or generate a refreshed developer token.",
          rawCode: code,
          rawSubcode: subcode,
          isRetryable: false,
        };
      }
      return {
        category: "INVALID_TOKEN",
        title: "Invalid Meta Token",
        description: "The provided token was revoked, malformed, or invalid for this application.",
        troubleshooting: "Verify your Meta App ID, Secret, and reconnect the account.",
        rawCode: code,
        rawSubcode: subcode,
        isRetryable: false,
      };
    }

    // Code 10 / 2534022: Outside allowed messaging window (7-day private reply rule or 24-hr DM window)
    if (code === 10 || subcode === 2534022 || msg.includes("outside") || msg.includes("window")) {
      return {
        category: "EXPIRED_MESSAGING_WINDOW",
        title: "Messaging Window Expired",
        description: "Meta allows private replies only within 7 days of comment creation, and standard DMs within 24 hours of customer interaction.",
        troubleshooting: "Ensure you are replying to comments created within the past 7 days.",
        rawCode: code,
        rawSubcode: subcode,
        isRetryable: false,
      };
    }

    // Code 10900: Cannot send private reply to this comment as it has already received one
    if (code === 10900 || subcode === 10900 || msg.includes("already received") || msg.includes("already replied")) {
      return {
        category: "ALREADY_REPLIED",
        title: "Comment Already Received a Private Reply",
        description: "Meta strictly enforces a limit of one private reply per comment.",
        troubleshooting: "This comment was already replied to. Wait for the user to reply in DM to continue conversation.",
        rawCode: code,
        rawSubcode: subcode,
        isRetryable: false,
      };
    }

    // Missing permissions or app review approval (Code 3, 200, or permission messages)
    if (code === 3 || code === 200 || msg.includes("permission") || msg.includes("capability")) {
      return {
        category: "MISSING_PERMISSIONS",
        title: "Missing Meta API Permissions",
        description: "Your Meta App lacks required permissions (`instagram_manage_messages`, `instagram_manage_comments`).",
        troubleshooting: "Request permissions in Meta Developer App Review or add your test Instagram account as a Tester in the Meta App Dashboard.",
        rawCode: code,
        rawSubcode: subcode,
        isRetryable: false,
      };
    }

    // Rate limits (Code 4, 17, 32, 613)
    if (code === 4 || code === 17 || code === 32 || code === 613 || msg.includes("rate limit")) {
      return {
        category: "RATE_LIMIT",
        title: "Meta API Rate Limit Reached",
        description: "Instagram messaging calls have exceeded the platform rate limit for this time window.",
        troubleshooting: "The request has been backed off. Meta will reset your rate limit window shortly.",
        rawCode: code,
        rawSubcode: subcode,
        isRetryable: true,
      };
    }

    return {
      category: "UNKNOWN_ERROR",
      title: "Meta Graph API Error",
      description: metaErr.message || "An unexpected error was returned by Meta.",
      troubleshooting: "Check Meta Developer status and your app configuration.",
      rawCode: code,
      rawSubcode: subcode,
      isRetryable: false,
    };
  }

  if (error instanceof Error) {
    if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("ENOTFOUND")) {
      return {
        category: "NETWORK_FAILURE",
        title: "Network Connection Failure",
        description: "Unable to reach Meta Graph API servers.",
        troubleshooting: "Check internet connectivity and outbound HTTPS traffic to graph.facebook.com.",
        isRetryable: true,
      };
    }

    return {
      category: "UNKNOWN_ERROR",
      title: "System Error",
      description: error.message,
      troubleshooting: "Check application logs for details.",
      isRetryable: false,
    };
  }

  return {
    category: "UNKNOWN_ERROR",
    title: "Unexpected Error",
    description: "An unknown error occurred during execution.",
    troubleshooting: "Retry the request or inspect system audit logs.",
    isRetryable: false,
  };
}
