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

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as AuthUser & { exp?: number };
    // Check token expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
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
      const validKeys: string[] = [];
      if (process.env.ADMIN_SECRET) {
        validKeys.push(process.env.ADMIN_SECRET.trim().toLowerCase());
      }
      // Fallback dev keys only allowed outside production
      if (process.env.NODE_ENV !== "production") {
        validKeys.push("admin2026", "superadmin", "founder2026");
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
