export type LoginEventType =
  | "sign_in"
  | "failed_attempt"
  | "password_change"
  | "security_action";

export interface LoginEvent {
  id: string;
  user_id: string;
  event_type: LoginEventType;
  ip_address: string | null;
  country_code: string | null;
  user_agent: string | null;
  is_suspicious: boolean;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SuspiciousActivityContext {
  userId: string;
  email: string;
  currentEvent: Pick<LoginEvent, "event_type" | "ip_address" | "country_code" | "user_agent">;
}

export interface SuspiciousActivityResult {
  isSuspicious: boolean;
  reason:
    | "new_country"
    | "new_ip"
    | "new_user_agent"
    | "failed_attempt_threshold"
    | "password_change_spam"
    | null;
}

