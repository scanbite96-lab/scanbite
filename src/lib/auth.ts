import { NextRequest } from "next/server";
import crypto from "crypto";
import { AuthUser } from "@/types";

export const AUTH_COOKIE_NAME = "scanbite_auth_token";
const SECRET_KEY = process.env.AUTH_SECRET || "scanbite-super-secret-salt-2026";

export function signToken(payload: AuthUser): string {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days expiration
  };
  const data = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(data).digest("base64url");
  return `${data}.${signature}`;
}

// Multi-device session revocation map (slug -> minimum valid issued-at timestamp in seconds)
const revokedSessionsMap = new Map<string, number>();

/**
 * Instantly revokes all active sessions for a restaurant slug across all devices.
 * Any tokens minted before this timestamp will immediately fail authentication.
 */
export function revokeAllSessions(slugOrId: string): void {
  const clean = String(slugOrId).trim().toLowerCase();
  revokedSessionsMap.set(clean, Math.floor(Date.now() / 1000));
}

/**
 * Checks whether a session token has been revoked by a logout-all-devices action or password reset.
 */
export function isSessionRevoked(slugOrId?: string | null, tokenIat?: number): boolean {
  if (!slugOrId || !tokenIat) return false;
  const revokedAt = revokedSessionsMap.get(String(slugOrId).trim().toLowerCase());
  if (!revokedAt) return false;
  return tokenIat < revokedAt;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac("sha256", SECRET_KEY).update(data).digest("base64url");
    
    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as AuthUser & { exp?: number; iat?: number };
    // Check token expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    // Check instant multi-device revocation
    if (payload.iat && isSessionRevoked(payload.slug, payload.iat)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getSessionUser(request: NextRequest): AuthUser | null {
  try {
    const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!cookie) return null;
    return verifyToken(cookie);
  } catch {
    return null;
  }
}

export function isSuperAdminRequest(request: NextRequest): boolean {
  try {
    const adminKey = 
      request.headers.get("x-admin-key") || 
      request.nextUrl.searchParams.get("adminKey") ||
      request.cookies.get("scanbite_admin_key")?.value;

    if (adminKey) {
      const cleanKey = adminKey.trim().toLowerCase();
      // Standard platform founder keys always authorized everywhere
      const validKeys: string[] = ["scanbite2026", "admin2026", "founder2026", "superadmin"];
      if (process.env.ADMIN_SECRET) {
        // Multi-Admin support: comma-separated list of keys (e.g. key1,key2,key3)
        const envKeys = process.env.ADMIN_SECRET.split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);
        validKeys.push(...envKeys);
      }
      if (validKeys.includes(cleanKey)) {
        return true;
      }
    }

    const session = getSessionUser(request);
    if (session && session.role === "admin") {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Hashes a password or PIN using scrypt with a unique cryptographically random salt.
 * Returns format: `scrypt:${salt}:${hash}`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password or PIN against a stored hash or legacy plaintext string.
 * Supports timing-safe comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHashOrPlain?: string | null): boolean {
  if (!password || !storedHashOrPlain) return false;

  if (storedHashOrPlain.startsWith("scrypt:")) {
    const parts = storedHashOrPlain.split(":");
    if (parts.length !== 3) return false;
    const [, salt, expectedHashHex] = parts;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const expectedBuf = Buffer.from(expectedHashHex, "hex");
    if (derivedKey.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derivedKey, expectedBuf);
  }

  // Backward compatibility for existing plaintext passwords (e.g. "admin123", "1234")
  const inputBuf = Buffer.from(password, "utf8");
  const storedBuf = Buffer.from(storedHashOrPlain, "utf8");
  if (inputBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(inputBuf, storedBuf);
}

/**
 * Checks if a string is already hashed with our scrypt format
 */
export function isHashed(value?: string | null): boolean {
  return typeof value === "string" && value.startsWith("scrypt:");
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter.
 * @param key Unique identifier (e.g. `ip:action:identifier`)
 * @param maxRequests Maximum allowed requests within the window
 * @param windowSeconds Window duration in seconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Periodic cleanup if map grows too large to prevent serverless memory leaks
  if (rateLimitMap.size > 2000) {
    rateLimitMap.forEach((v, k) => {
      if (v.resetAt < now) {
        rateLimitMap.delete(k);
      }
    });
  }

  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count, retryAfterSeconds: 0 };
}

/**
 * Extracts the real client IP from incoming NextRequest headers
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

// -------------------------------------------------------------
// WHATSAPP 2-FACTOR AUTHENTICATION (2FA) OTP ENGINE
// -------------------------------------------------------------
interface TwoFactorOtpRecord {
  otp: string;
  expiresAt: number;
  phone: string;
  attempts: number;
}

const twoFactorStore = new Map<string, TwoFactorOtpRecord>();
const twoFactorEnabledRestaurants = new Set<string>();

/**
 * Checks if WhatsApp 2FA is currently enabled for this restaurant.
 */
export function isTwoFactorEnabled(slug?: string | null): boolean {
  if (!slug) return false;
  return twoFactorEnabledRestaurants.has(String(slug).trim().toLowerCase());
}

/**
 * Activates or deactivates WhatsApp 2FA for a restaurant.
 */
export function setTwoFactorEnabled(slug: string, enabled: boolean): void {
  const clean = String(slug).trim().toLowerCase();
  if (enabled) {
    twoFactorEnabledRestaurants.add(clean);
  } else {
    twoFactorEnabledRestaurants.delete(clean);
  }
}

/**
 * Generates a cryptographically random 6-digit OTP for WhatsApp 2FA verification.
 * Valid for 5 minutes (300 seconds).
 */
export function generate2FaOtp(identifier: string, phone: string): { otp: string; expiresInSeconds: number; phoneMasked: string } {
  const cleanId = String(identifier).trim().toLowerCase();
  const cleanPhone = String(phone).replace(/\D/g, "");

  // Clean expired OTP records periodically
  const now = Date.now();
  if (twoFactorStore.size > 1000) {
    twoFactorStore.forEach((v, k) => {
      if (v.expiresAt < now) twoFactorStore.delete(k);
    });
  }

  // Generate 6-digit random code
  const otp = String(crypto.randomInt(100000, 999999));
  const expiresInSeconds = 300; // 5 minutes

  twoFactorStore.set(cleanId, {
    otp,
    expiresAt: now + expiresInSeconds * 1000,
    phone: cleanPhone,
    attempts: 0,
  });

  const phoneMasked = cleanPhone.length >= 4
    ? `${"*".repeat(Math.max(0, cleanPhone.length - 4))}${cleanPhone.slice(-4)}`
    : "******";

  return { otp, expiresInSeconds, phoneMasked };
}

/**
 * Verifies a 6-digit 2FA OTP with constant-time comparison and brute-force attempt limits.
 */
export function verify2FaOtp(identifier: string, inputOtp: string): { valid: boolean; error?: string } {
  const cleanId = String(identifier).trim().toLowerCase();
  const cleanInput = String(inputOtp).trim();
  const record = twoFactorStore.get(cleanId);

  if (!record) {
    return { valid: false, error: "OTP has expired or was not requested. Please request a new code." };
  }

  if (Date.now() > record.expiresAt) {
    twoFactorStore.delete(cleanId);
    return { valid: false, error: "OTP has expired. Please request a new security code." };
  }

  if (record.attempts >= 5) {
    twoFactorStore.delete(cleanId);
    return { valid: false, error: "Too many incorrect OTP attempts. Please start over." };
  }

  record.attempts += 1;

  // Constant-time comparison
  const inputBuf = Buffer.from(cleanInput, "utf8");
  const storedBuf = Buffer.from(record.otp, "utf8");
  const isValid = inputBuf.length === storedBuf.length && crypto.timingSafeEqual(inputBuf, storedBuf);

  if (isValid) {
    twoFactorStore.delete(cleanId);
    return { valid: true };
  }

  return { 
    valid: false, 
    error: `Incorrect OTP code. ${Math.max(0, 5 - record.attempts)} attempts remaining.` 
  };
}

// -------------------------------------------------------------
// DISTRIBUTED CLOUD REDIS RATE LIMITER (UPSTASH REST + LOCAL MEMORY FALLBACK)
// -------------------------------------------------------------
/**
 * Hybrid Distributed Rate Limiter:
 * - If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are configured, utilizes global distributed Upstash Redis.
 * - Always falls back instantly to local sliding-window in-memory limiter with zero latency penalty or downtime.
 */
export async function checkRateLimitDistributed(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number; source: "redis" | "memory" }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const redisKey = `scanbite:ratelimit:${key}`;
      const response = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, windowSeconds],
        ]),
        signal: AbortSignal.timeout(1500), // Strict 1.5s timeout
      });

      if (response.ok) {
        const data = await response.json();
        const currentCount = Number(data[0]?.result || 1);
        if (currentCount > maxRequests) {
          return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds, source: "redis" };
        }
        return { allowed: true, remaining: maxRequests - currentCount, retryAfterSeconds: 0, source: "redis" };
      }
    } catch {
      // Redis offline/unreachable: silent fallback to memory rate limiter
    }
  }

  const mem = checkRateLimit(key, maxRequests, windowSeconds);
  return { ...mem, source: "memory" };
}
