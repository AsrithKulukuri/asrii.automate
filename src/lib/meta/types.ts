// Official Meta Graph API v21.0 & Instagram Messaging Types

export interface MetaOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaDebugTokenData {
  app_id: string;
  type: string;
  application: string;
  data_access_expires_at: number;
  expires_at: number;
  is_valid: boolean;
  issued_at: number;
  scopes: string[];
  user_id: string;
}

export interface MetaDebugTokenResponse {
  data: MetaDebugTokenData;
}

export interface InstagramAccountInfo {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  account_type?: "BUSINESS" | "CREATOR" | "PERSONAL";
}

export interface FacebookPageAccount {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: InstagramAccountInfo;
}

export interface MetaAccountsResponse {
  data: FacebookPageAccount[];
}

export interface MetaPrivateReplyRequest {
  recipient: {
    comment_id: string;
  };
  message: {
    text: string;
  };
}

export interface MetaDirectMessageRequest {
  recipient: {
    id: string; // IGSID (Instagram Scoped ID)
  };
  message: {
    text: string;
  };
}

export interface MetaSendMessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface MetaApiErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

// Webhook Ingestion Types
export interface WebhookCommentChangeValue {
  id: string; // Comment ID
  text: string;
  created_time?: number;
  from: {
    id: string;
    username: string;
  };
  media: {
    id: string; // Post or reel ID
    media_product_type?: string;
  };
  parent_id?: string;
}

export interface WebhookChange {
  field: "comments" | "feed" | "messages";
  value: WebhookCommentChangeValue | Record<string, unknown>;
}

export interface WebhookEntry {
  id: string; // Page or IG Account ID
  time: number;
  changes?: WebhookChange[];
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: { mid: string; text: string };
    postback?: { mid: string; title: string; payload: string };
  }>;
}

export interface MetaWebhookPayload {
  object: "instagram" | "page";
  entry: WebhookEntry[];
}
