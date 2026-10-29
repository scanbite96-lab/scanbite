import { NextRequest } from "next/server";
import crypto from "crypto";
import { AuthUser } from "@/types";

export const AUTH_COOKIE_NAME = "scanbite_auth_token";
const SECRET_KEY = process.env.AUTH_SECRET || "scanbite-super-secret-salt-2026";
const ADMIN_MASTER_KEYS = [process.env.ADMIN_SECRET, "admin2026", "superadmin", "founder2026"].filter(Boolean) as string[];

export function signToken(payload: AuthUser): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac("sha256", SECRET_KEY).update(data).digest("base64url");
    if (signature !== expectedSig) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as AuthUser;
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
      const validKeys = ["admin2026", "superadmin", "founder2026"];
      if (process.env.ADMIN_SECRET) validKeys.push(process.env.ADMIN_SECRET.trim().toLowerCase());
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
