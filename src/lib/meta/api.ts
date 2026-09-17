import {
  MetaDebugTokenResponse,
  InstagramAccountInfo,
  MetaSendMessageResponse,
  MetaApiErrorResponse,
  MetaPrivateReplyRequest,
  MetaDirectMessageRequest,
} from "./types";
import { classifyMetaError } from "./errors";

const GRAPH_BASE = "https://graph.facebook.com";
const DEFAULT_VERSION = process.env.META_API_VERSION || "v21.0";
const REQUEST_TIMEOUT_MS = 10000;

interface FetchOptions {
  timeoutMs?: number;
}

async function graphFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  customOptions: FetchOptions = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${GRAPH_BASE}/${DEFAULT_VERSION}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), customOptions.timeoutMs || REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok || (data && (data as MetaApiErrorResponse).error)) {
      throw data;
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === "AbortError") {
      throw new Error(`Meta Graph API call timed out after ${customOptions.timeoutMs || REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

/**
 * Validates and inspects an access token using Meta's debug_token endpoint.
 */
export async function debugToken(
  inputToken: string,
  appId?: string,
  appSecret?: string
): Promise<MetaDebugTokenResponse> {
  const currentAppId = appId || process.env.META_APP_ID;
  const currentAppSecret = appSecret || process.env.META_APP_SECRET;

  const appAccessToken = currentAppId && currentAppSecret
    ? `${currentAppId}|${currentAppSecret}`
    : inputToken;

  return graphFetch<MetaDebugTokenResponse>(
    `/debug_token?input_token=${encodeURIComponent(inputToken)}&access_token=${encodeURIComponent(appAccessToken)}`
  );
}

/**
 * Fetches connected Instagram Professional accounts associated with a User / Page access token.
 */
export async function fetchInstagramAccounts(accessToken: string): Promise<InstagramAccountInfo[]> {
  try {
    // 1. Check if token directly represents an Instagram Business Account
    try {
      const directMe = await graphFetch<InstagramAccountInfo>(
        `/me?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
      );
      if (directMe.username) {
        return [
          {
            id: directMe.id,
            username: directMe.username,
            name: directMe.name || directMe.username,
            profile_picture_url: directMe.profile_picture_url,
            account_type: "BUSINESS",
          },
        ];
      }
    } catch {
      // Continue to check connected Facebook Pages
    }

    // 2. Fetch Facebook Pages linked to Instagram accounts
    const pagesResponse = await graphFetch<{
      data: Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: {
          id: string;
          username: string;
          name?: string;
          profile_picture_url?: string;
        };
      }>;
    }>(
      `/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(accessToken)}`
    );

    const accounts: InstagramAccountInfo[] = [];

    for (const page of pagesResponse.data || []) {
      if (page.instagram_business_account) {
        accounts.push({
          id: page.instagram_business_account.id,
          username: page.instagram_business_account.username,
          name: page.instagram_business_account.name || page.name,
          profile_picture_url: page.instagram_business_account.profile_picture_url,
          account_type: "BUSINESS",
        });
      }
    }

    return accounts;
  } catch (error) {
    const classified = classifyMetaError(error);
    throw new Error(`${classified.title}: ${classified.description}`);
  }
}

/**
 * Sends an official Private Reply to an Instagram comment.
 * Meta Rule: Allowed strictly within 7 days of comment creation, exactly 1 reply per comment.
 */
export async function sendPrivateReply(
  igUserId: string,
  commentId: string,
  text: string,
  accessToken: string
): Promise<MetaSendMessageResponse> {
  if (!igUserId || !commentId || !text || !accessToken) {
    throw new Error("Missing required parameters for private reply");
  }

  const payload: MetaPrivateReplyRequest = {
    recipient: {
      comment_id: commentId,
    },
    message: {
      text,
    },
  };

  try {
    return await graphFetch<MetaSendMessageResponse>(
      `/${igUserId}/messages?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  } catch (error) {
    const classified = classifyMetaError(error);
    throw {
      ...classified,
      originalError: error,
    };
  }
}

/**
 * Sends a Direct Message to a customer's Instagram Scoped ID (IGSID).
 * Meta Rule: Allowed strictly within standard 24-hour interaction window.
 */
export async function sendDirectMessage(
  igUserId: string,
  recipientId: string,
  text: string,
  accessToken: string
): Promise<MetaSendMessageResponse> {
  if (!igUserId || !recipientId || !text || !accessToken) {
    throw new Error("Missing required parameters for direct message");
  }

  const payload: MetaDirectMessageRequest = {
    recipient: {
      id: recipientId,
    },
    message: {
      text,
    },
  };

  try {
    return await graphFetch<MetaSendMessageResponse>(
      `/${igUserId}/messages?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  } catch (error) {
    const classified = classifyMetaError(error);
    throw {
      ...classified,
      originalError: error,
    };
  }
}
