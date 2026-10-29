import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthUser } from "@/types";
import { signToken, verifyToken, AUTH_COOKIE_NAME, isSuperAdminRequest } from "@/lib/auth";

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

    let staffPermissions = session.permissions;
    let staffName = session.staffName || restaurant.ownerName;
    let staffRole = session.staffRole;

    // If session is staff and tied to a specific staffId, verify active status in DB
    if (session.role === "staff" && session.staffId) {
      const dbStaff = await prisma.staff.findUnique({
        where: { id: session.staffId },
      });
      if (!dbStaff || !dbStaff.isActive) {
        const res = NextResponse.json({ 
          authenticated: false, 
          error: "Your staff account has been deactivated by the restaurant owner." 
        });
        res.cookies.delete(AUTH_COOKIE_NAME);
        return res;
      }
      staffName = dbStaff.name;
      staffRole = dbStaff.role;
      staffPermissions = {
        canManageOrders: dbStaff.canManageOrders,
        canManageMenu: dbStaff.canManageMenu,
        canManageBilling: dbStaff.canManageBilling,
        canManageRequests: dbStaff.canManageRequests,
      };
    } else if (session.role === "owner" || session.role === "admin") {
      // Owner has full permissions by default
      staffPermissions = {
        canManageOrders: true,
        canManageMenu: true,
        canManageBilling: true,
        canManageRequests: true,
      };
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
        staffId: session.staffId,
        staffName,
        staffRole,
        permissions: staffPermissions,
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
        permissions: {
          canManageOrders: true,
          canManageMenu: true,
          canManageBilling: true,
          canManageRequests: true,
        },
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

      const cleanSlug = String(slug).trim().toLowerCase();
      const cleanPin = String(pin).trim();

      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: cleanSlug },
      });

      if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
      }

      // Check if there is an individual staff member registered with this PIN
      const specificStaff = await prisma.staff.findFirst({
        where: {
          restaurantId: restaurant.id,
          pin: cleanPin,
        },
      });

      let user: AuthUser;

      if (specificStaff) {
        if (!specificStaff.isActive) {
          return NextResponse.json(
            { error: `Account for ${specificStaff.name} is currently deactivated by the restaurant owner.` },
            { status: 403 }
          );
        }

        user = {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          ownerEmail: restaurant.ownerEmail,
          ownerName: specificStaff.name,
          role: "staff",
          staffId: specificStaff.id,
          staffName: specificStaff.name,
          staffRole: specificStaff.role,
          permissions: {
            canManageOrders: specificStaff.canManageOrders,
            canManageMenu: specificStaff.canManageMenu,
            canManageBilling: specificStaff.canManageBilling,
            canManageRequests: specificStaff.canManageRequests,
          },
        };
      } else {
        // Fallback to default restaurant-wide staffPin
        const expectedPin = restaurant.staffPin || "1234";
        if (cleanPin !== expectedPin) {
          return NextResponse.json(
            { error: "Incorrect 4-digit PIN. Please verify with the restaurant owner." },
            { status: 401 }
          );
        }

        user = {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          ownerEmail: restaurant.ownerEmail,
          ownerName: "Staff Member",
          role: "staff",
          staffName: "Staff Member",
          staffRole: "staff",
          permissions: {
            canManageOrders: true,
            canManageMenu: true,
            canManageBilling: true,
            canManageRequests: true,
          },
        };
      }

      const token = signToken(user);
      const response = NextResponse.json({
        success: true,
        message: specificStaff ? `Welcome, ${specificStaff.name} (${specificStaff.role.toUpperCase()})!` : "Staff PIN verified successfully.",
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
      if (!isSuperAdminRequest(request)) {
        return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 403 });
      }

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
