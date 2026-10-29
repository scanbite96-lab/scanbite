import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { AuthUser } from "@/types";

const AUTH_COOKIE_NAME = "scanbite_auth_token";
const SECRET_KEY = process.env.AUTH_SECRET || "scanbite-super-secret-salt-2026";

function signToken(payload: AuthUser): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifyToken(token: string): AuthUser | null {
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

// GET /api/auth -> Get current logged-in user profile
export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!cookie) {
      return NextResponse.json({ authenticated: false });
    }

    const session = verifyToken(cookie);
    if (!session || !session.slug) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify restaurant still exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: session.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerEmail: true,
        ownerName: true,
        staffPin: true,
      },
    });

    if (!restaurant) {
      const res = NextResponse.json({ authenticated: false });
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        ownerEmail: restaurant.ownerEmail,
        ownerName: restaurant.ownerName,
        role: session.role || "owner",
        staffPin: restaurant.staffPin || "1234",
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

// POST /api/auth -> Login, Staff PIN login, Logout, or Update Credentials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. OWNER PASSWORD LOGIN
    if (action === "login") {
      const { identifier, password } = body;
      if (!identifier || !password) {
        return NextResponse.json(
          { error: "Please enter your email or restaurant slug, and password." },
          { status: 400 }
        );
      }

      const cleanId = String(identifier).trim().toLowerCase();
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          OR: [
            { ownerEmail: cleanId },
            { slug: cleanId },
          ],
        },
      });

      if (!restaurant) {
        return NextResponse.json(
          { error: "No restaurant found matching this email or slug." },
          { status: 404 }
        );
      }

      const validPassword = restaurant.password || "admin123";
      if (password !== validPassword) {
        return NextResponse.json(
          { error: "Incorrect password. Please try again or use default: admin123" },
          { status: 401 }
        );
      }

      const user: AuthUser = {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        ownerEmail: restaurant.ownerEmail,
        ownerName: restaurant.ownerName,
        role: "owner",
      };

      const token = signToken(user);
      const response = NextResponse.json({
        success: true,
        message: `Welcome back, ${restaurant.ownerName || restaurant.name}!`,
        user,
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: "lax",
      });

      return response;
    }

    // 2. STAFF QUICK PIN LOGIN
    if (action === "pin_login") {
      const { slug, pin } = body;
      if (!slug || !pin) {
        return NextResponse.json(
          { error: "Restaurant slug and 4-digit PIN are required." },
          { status: 400 }
        );
      }

      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: String(slug).trim().toLowerCase() },
      });

      if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
      }

      const expectedPin = restaurant.staffPin || "1234";
      if (String(pin).trim() !== expectedPin) {
        return NextResponse.json(
          { error: "Incorrect 4-digit PIN. Default is 1234." },
          { status: 401 }
        );
      }

      const user: AuthUser = {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        ownerEmail: restaurant.ownerEmail,
        ownerName: "Staff Member",
        role: "staff",
      };

      const token = signToken(user);
      const response = NextResponse.json({
        success: true,
        message: "Staff PIN verified successfully.",
        user,
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: "/",
        maxAge: 24 * 60 * 60, // 24 hours
        sameSite: "lax",
      });

      return response;
    }

    // 3. LOGOUT
    if (action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out successfully." });
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    // 4. UPDATE CREDENTIALS (PASSWORD / PIN)
    if (action === "update_credentials") {
      const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (!cookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const session = verifyToken(cookie);
      if (!session || session.role !== "owner") {
        return NextResponse.json({ error: "Only owners can change credentials" }, { status: 403 });
      }

      const { newPassword, newStaffPin, ownerEmail, ownerName } = body;
      const updateData: Record<string, string> = {};

      if (newPassword && newPassword.trim().length >= 4) {
        updateData.password = newPassword.trim();
      }
      if (newStaffPin && newStaffPin.trim().length >= 4) {
        updateData.staffPin = newStaffPin.trim();
      }
      if (ownerEmail && ownerEmail.includes("@")) {
        updateData.ownerEmail = ownerEmail.trim().toLowerCase();
      }
      if (ownerName && ownerName.trim()) {
        updateData.ownerName = ownerName.trim();
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "No fields to update." }, { status: 400 });
      }

      const updated = await prisma.restaurant.update({
        where: { slug: session.slug },
        data: updateData,
      });

      // Update session cookie if email/name changed
      const updatedUser: AuthUser = {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        ownerEmail: updated.ownerEmail,
        ownerName: updated.ownerName,
        role: "owner",
      };
      const token = signToken(updatedUser);

      const response = NextResponse.json({
        success: true,
        message: "Security credentials updated successfully!",
        user: updatedUser,
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
      });

      return response;
    }

    // 5. SUPER ADMIN 1-CLICK IMPERSONATE LOGIN
    if (action === "impersonate") {
      const { slug } = body;
      if (!slug) {
        return NextResponse.json({ error: "Restaurant slug required for impersonation." }, { status: 400 });
      }

      const cleanSlug = String(slug).trim().toLowerCase();
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: cleanSlug },
      });

      if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
      }

      const user: AuthUser = {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        ownerEmail: restaurant.ownerEmail,
        ownerName: restaurant.ownerName || "Owner",
        role: "owner",
      };

      const token = signToken(user);
      const response = NextResponse.json({
        success: true,
        message: `Super Admin root access granted for ${restaurant.name}`,
        user,
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: "Authentication server error" }, { status: 500 });
  }
}
