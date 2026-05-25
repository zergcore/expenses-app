import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectSuspiciousActivity } from "../suspicious-activity";
import { generateSecureToken, verifySecureToken } from "../secure-token";

// Mock the Supabase server client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

const mockSupabaseAdmin = {
  from: mockFrom,
};

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => Promise.resolve(mockSupabaseAdmin)),
}));

describe("detectSuspiciousActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      eq: mockEq, // Support nested eq calls if any
      gte: mockGte,
    });
    mockGte.mockReturnValue({
      order: mockOrder,
    });
  });

  it("should detect suspicious activity when login is from a new country", async () => {
    // Mock past successful sign-ins from "US"
    mockOrder.mockResolvedValue({
      data: [
        {
          event_type: "sign_in",
          is_suspicious: false,
          country_code: "US",
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const result = await detectSuspiciousActivity("user-123", "1.1.1.1", "VE", "UserAgent");
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toBe("new_country");
  });

  it("should NOT detect suspicious activity when login is from a known country", async () => {
    // Mock past successful sign-ins from "VE"
    mockOrder.mockResolvedValue({
      data: [
        {
          event_type: "sign_in",
          is_suspicious: false,
          country_code: "VE",
          ip_address: "1.1.1.1",
          user_agent: "UserAgent",
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const result = await detectSuspiciousActivity("user-123", "1.1.1.1", "VE", "UserAgent");
    expect(result.isSuspicious).toBe(false);
    expect(result.reason).toBeNull();
  });

  it("should detect suspicious activity when login is from a new IP address", async () => {
    // Mock past successful sign-ins from "1.1.1.1"
    mockOrder.mockResolvedValue({
      data: [
        {
          event_type: "sign_in",
          is_suspicious: false,
          ip_address: "1.1.1.1",
          country_code: "US",
          user_agent: "UserAgent",
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const result = await detectSuspiciousActivity("user-123", "2.2.2.2", "US", "UserAgent");
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toBe("new_ip");
  });

  it("should NOT detect suspicious activity when login is from a known IP address", async () => {
    // Mock past successful sign-ins from "2.2.2.2"
    mockOrder.mockResolvedValue({
      data: [
        {
          event_type: "sign_in",
          is_suspicious: false,
          ip_address: "2.2.2.2",
          country_code: "US",
          user_agent: "UserAgent",
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const result = await detectSuspiciousActivity("user-123", "2.2.2.2", "US", "UserAgent");
    expect(result.isSuspicious).toBe(false);
    expect(result.reason).toBeNull();
  });

  it("should detect suspicious activity when login is from a new user agent", async () => {
    // Mock past successful sign-ins from "Chrome/100"
    mockOrder.mockResolvedValue({
      data: [
        {
          event_type: "sign_in",
          is_suspicious: false,
          user_agent: "Chrome/100",
          ip_address: "1.1.1.1",
          country_code: "US",
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const result = await detectSuspiciousActivity("user-123", "1.1.1.1", "US", "Firefox/100");
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toBe("new_user_agent");
  });

  it("should NOT detect suspicious activity when login is from a known user agent", async () => {
    // Mock past successful sign-ins from "Firefox/100"
    mockOrder.mockResolvedValue({
      data: [
        {
          event_type: "sign_in",
          is_suspicious: false,
          user_agent: "Firefox/100",
          ip_address: "1.1.1.1",
          country_code: "US",
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const result = await detectSuspiciousActivity("user-123", "1.1.1.1", "US", "Firefox/100");
    expect(result.isSuspicious).toBe(false);
    expect(result.reason).toBeNull();
  });

  it("should detect suspicious activity when failed attempt threshold is exceeded", async () => {
    // Mock 3 failed attempts in the last 15 minutes
    const now = new Date();
    mockOrder.mockResolvedValue({
      data: [
        {
          event_type: "failed_attempt",
          created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 mins ago
        },
        {
          event_type: "failed_attempt",
          created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 mins ago
        },
        {
          event_type: "failed_attempt",
          created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 mins ago
        },
      ],
      error: null,
    });

    const result = await detectSuspiciousActivity("user-123", "1.1.1.1", "US", "UserAgent");
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toBe("failed_attempt_threshold");
  });

  it("should detect suspicious activity when password change spam limit is exceeded", async () => {
    // Mock 2 password changes in the last 24 hours
    const now = new Date();
    mockOrder.mockResolvedValue({
      data: [
        {
          event_type: "password_change",
          created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
        },
        {
          event_type: "password_change",
          created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5h ago
        },
      ],
      error: null,
    });

    const result = await detectSuspiciousActivity("user-123", "1.1.1.1", null, "UserAgent");
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toBe("password_change_spam");
  });
});

describe("secure-token", () => {
  it("should generate a valid token and verify it correctly", () => {
    const userId = "user-abc-123";
    const token = generateSecureToken(userId);
    expect(token).toBeDefined();

    const verifiedUserId = verifySecureToken(token);
    expect(verifiedUserId).toBe(userId);
  });

  it("should reject tampered tokens", () => {
    const userId = "user-abc-123";
    const token = generateSecureToken(userId);
    const tamperedToken = token.slice(0, -5) + "abcde";
    
    const verifiedUserId = verifySecureToken(tamperedToken);
    expect(verifiedUserId).toBeNull();
  });
});
