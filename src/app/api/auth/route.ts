import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthUser } from "@/types";
import { 
  signToken, 
  verifyToken, 
  AUTH_COOKIE_NAME, 
  isSuperAdminRequest,
  hashPassword,
  verifyPassword,
  isHashed,
  checkRateLimit,
  checkRateLimitDistributed,
  getClientIp,
  revokeAllSessions,
  isSessionRevoked,
  generate2FaOtp,
  verify2FaOtp,
  isTwoFactorEnabled,
  setTwoFactorEnabled
} from "@/lib/auth";
import { DEMO_STAFF } from "@/lib/demoData";

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
    let restaurant = null;
    try {
      restaurant = await prisma.restaurant.findUnique({
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
    } catch {
      // ignore
    }

    if (!restaurant) {
      if (session.slug === "grand-spice") {
        let staffPermissions = {
          canManageOrders: true,
          canManageMenu: true,
          canManageBilling: true,
          canManageRequests: true,
        };
        let staffName = session.staffName || "Rajesh Sharma";
        let staffRole = session.staffRole;

        if (session.role === "staff" && session.staffId) {
          const demoStaff = DEMO_STAFF.find((s) => s.id === session.staffId);
          if (demoStaff) {
            if (!demoStaff.isActive) {
              const res = NextResponse.json({ 
                authenticated: false, 
                error: `Account for ${demoStaff.name} has been deactivated by the restaurant owner.` 
              });
              res.cookies.delete(AUTH_COOKIE_NAME);
              return res;
            }
            staffName = demoStaff.name;
            staffRole = demoStaff.role;
            staffPermissions = {
              canManageOrders: demoStaff.canManageOrders,
              canManageMenu: demoStaff.canManageMenu,
              canManageBilling: demoStaff.canManageBilling,
              canManageRequests: demoStaff.canManageRequests,
            };
          }
        }

        return NextResponse.json({
          authenticated: true,
          user: {
            id: "rest-001",
            name: "The Grand Spice Kitchen",
            slug: "grand-spice",
            ownerEmail: "owner@grandspice.com",
            ownerName: session.role === "staff" ? staffName : "Rajesh Sharma",
            role: session.role || "owner",
            staffPin: session.role === "owner" ? "1234" : undefined,
            staffId: session.staffId,
            staffName: session.role === "staff" ? staffName : undefined,
            staffRole: session.role === "staff" ? staffRole : undefined,
            permissions: session.role === "staff" ? staffPermissions : {
              canManageOrders: true,
              canManageMenu: true,
              canManageBilling: true,
              canManageRequests: true,
            },
            twoFactorEnabled: isTwoFactorEnabled(session.slug),
          },
        });
      }
      const res = NextResponse.json({ authenticated: false });
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    let staffPermissions = session.permissions;
    let staffName = session.staffName || restaurant.ownerName;
    let staffRole = session.staffRole;

    // If session is staff and tied to a specific staffId, verify active status in DB or DEMO_STAFF
    if (session.role === "staff" && session.staffId) {
      let dbStaff: any = null;
      try {
        dbStaff = await prisma.staff.findUnique({
          where: { id: session.staffId },
        });
      } catch (err) {
        console.warn("Prisma staff lookup error in GET /api/auth:", err);
      }

      // Check DEMO_STAFF fallback if not found in DB
      if (!dbStaff && (session.slug === "grand-spice" || session.staffId.startsWith("st-") || restaurant.slug === "grand-spice" || restaurant.id === "rest-001")) {
        const demoStaff = DEMO_STAFF.find((s) => s.id === session.staffId);
        if (demoStaff) {
          dbStaff = demoStaff;
        }
      }

      if (!dbStaff || !dbStaff.isActive) {
        const res = NextResponse.json({ 
          authenticated: false, 
          error: dbStaff ? `Account for ${dbStaff.name} has been deactivated by the restaurant owner.` : "Your staff account has been deactivated by the restaurant owner." 
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
        ownerName: session.role === "staff" ? (staffName || restaurant.ownerName) : restaurant.ownerName,
        role: session.role || "owner",
        staffPin: session.role === "owner" ? (restaurant.staffPin || "1234") : undefined,
        staffId: session.staffId,
        staffName: session.role === "staff" ? staffName : undefined,
        staffRole: session.role === "staff" ? staffRole : undefined,
        permissions: staffPermissions,
        twoFactorEnabled: isTwoFactorEnabled(restaurant.slug),
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

    // 0. INSTANT DEMO LOGIN
    if (action === "demo_login") {
      const demoUser: AuthUser = {
        id: "rest-001",
        name: "The Grand Spice Kitchen",
        slug: "grand-spice",
        ownerEmail: "owner@grandspice.com",
        ownerName: "Rajesh Sharma",
        role: "owner",
        staffPin: "1234",
        permissions: {
          canManageOrders: true,
          canManageMenu: true,
          canManageBilling: true,
          canManageRequests: true,
        },
      };

      const token = signToken(demoUser);
      const response = NextResponse.json({
        success: true,
        message: "Welcome to ScanBite Interactive Demo!",
        user: demoUser,
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

    // 1. OWNER PASSWORD LOGIN
    if (action === "login") {
      const { identifier, password } = body;
      if (!identifier || !password) {
        return NextResponse.json(
          { error: "Please enter your email or restaurant slug, and password." },
          { status: 400 }
        );
      }

      const clientIp = getClientIp(request);
      const cleanId = String(identifier).trim().toLowerCase();

      // Distributed Rate limit: Max 5 login attempts per 60s per IP + identifier
      const rateLimitKey = `auth:login:${clientIp}:${cleanId}`;
      const rateLimit = await checkRateLimitDistributed(rateLimitKey, 5, 60);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.` },
          { 
            status: 429,
            headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }
          }
        );
      }

      let restaurant = null;
      try {
        restaurant = await prisma.restaurant.findFirst({
          where: {
            OR: [
              { ownerEmail: cleanId },
              { slug: cleanId },
            ],
          },
        });
      } catch {
        // ignore
      }

      if (!restaurant) {
        if (cleanId === "grand-spice" || cleanId === "owner@grandspice.com" || cleanId === "demo@scanbite.com") {
          restaurant = {
            id: "rest-001",
            name: "The Grand Spice Kitchen",
            slug: "grand-spice",
            ownerEmail: "owner@grandspice.com",
            ownerName: "Rajesh Sharma",
            password: "admin123",
            staffPin: "1234",
          } as any;
        } else {
          return NextResponse.json(
            { error: "No restaurant found matching this email or slug." },
            { status: 404 }
          );
        }
      }

      const storedPassword = restaurant.password || "admin123";
      const isValid = verifyPassword(password, storedPassword);

      if (!isValid) {
        return NextResponse.json(
          { error: "Incorrect password. Please try again." },
          { status: 401 }
        );
      }

      // Auto-migrate legacy plaintext password to secure scrypt hash in database
      if (!isHashed(restaurant.password) && restaurant.id !== "rest-001") {
        try {
          await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: { password: hashPassword(password) },
          });
        } catch (upgradeErr) {
          console.warn("Failed to auto-upgrade restaurant password hash:", upgradeErr);
        }
      }

      // Check if 2FA is enabled or requested
      if (isTwoFactorEnabled(restaurant.slug) || body.request2Fa) {
        const phone = restaurant.phone || "919876543210";
        const otpInfo = generate2FaOtp(restaurant.slug, phone);
        const waMessage = encodeURIComponent(
          `🔐 *ScanBite 2FA Security Code*\n\nYour one-time login verification code is: *${otpInfo.otp}*\n\nValid for 5 minutes. Do not share this code with anyone.`
        );
        const waPhoneClean = phone.replace(/\D/g, "");
        const waUrl = `https://wa.me/${waPhoneClean}?text=${waMessage}`;

        return NextResponse.json({
          require2FA: true,
          identifier: restaurant.slug,
          phoneMasked: otpInfo.phoneMasked,
          waUrl,
          demoOtp: (process.env.NODE_ENV !== "production" || restaurant.slug === "grand-spice" ? otpInfo.otp : undefined),
          message: `2FA security code dispatched to WhatsApp (${otpInfo.phoneMasked}).`,
        });
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


    // 1.1 VERIFY 2FA OTP
    if (action === "verify_2fa") {
      const { identifier, otp } = body;
      if (!identifier || !otp) {
        return NextResponse.json({ error: "Identifier and 6-digit OTP code are required." }, { status: 400 });
      }

      const clientIp = getClientIp(request);
      const cleanId = String(identifier).trim().toLowerCase();

      // Rate limit OTP verification: Max 5 attempts per 60s
      const rateLimitKey = `auth:2fa:${clientIp}:${cleanId}`;
      const rateLimit = await checkRateLimitDistributed(rateLimitKey, 5, 60);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: `Too many verification attempts. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
          { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
        );
      }

      const result = verify2FaOtp(cleanId, otp);
      if (!result.valid) {
        return NextResponse.json({ error: result.error || "Invalid or expired OTP code." }, { status: 401 });
      }

      let restaurant = null;
      try {
        restaurant = await prisma.restaurant.findFirst({
          where: {
            OR: [
              { ownerEmail: cleanId },
              { slug: cleanId },
            ],
          },
        });
      } catch {
        // ignore
      }

      if (!restaurant) {
        if (cleanId === "grand-spice" || cleanId === "owner@grandspice.com" || cleanId === "demo@scanbite.com") {
          restaurant = {
            id: "rest-001",
            name: "The Grand Spice Kitchen",
            slug: "grand-spice",
            ownerEmail: "owner@grandspice.com",
            ownerName: "Rajesh Sharma",
            staffPin: "1234",
          } as any;
        } else {
          return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
        }
      }

      const user: AuthUser = {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        ownerEmail: restaurant.ownerEmail,
        ownerName: restaurant.ownerName,
        role: "owner",
        twoFactorEnabled: isTwoFactorEnabled(restaurant.slug),
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
        message: `2FA Verified! Welcome back, ${restaurant.ownerName || restaurant.name}!`,
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

    // 1.2 RESEND 2FA OTP
    if (action === "resend_2fa_otp") {
      const { identifier } = body;
      if (!identifier) {
        return NextResponse.json({ error: "Identifier is required." }, { status: 400 });
      }
      const cleanId = String(identifier).trim().toLowerCase();
      let restaurant = null;
      try {
        restaurant = await prisma.restaurant.findFirst({
          where: {
            OR: [{ ownerEmail: cleanId }, { slug: cleanId }],
          },
        });
      } catch {}
      const phone = restaurant?.phone || "919876543210";
      const otpInfo = generate2FaOtp(cleanId, phone);
      const waMessage = encodeURIComponent(
        `🔐 *ScanBite 2FA Security Code*\n\nYour one-time login verification code is: *${otpInfo.otp}*\n\nValid for 5 minutes.`
      );
      const waPhoneClean = phone.replace(/\D/g, "");
      const waUrl = `https://wa.me/${waPhoneClean}?text=${waMessage}`;

      return NextResponse.json({
        success: true,
        identifier: cleanId,
        phoneMasked: otpInfo.phoneMasked,
        waUrl,
        demoOtp: (process.env.NODE_ENV !== "production" || cleanId === "grand-spice" ? otpInfo.otp : undefined),
        expiresInSeconds: otpInfo.expiresInSeconds,
        message: "New 2FA code generated successfully.",
      });
    }

    // 1.3 TOGGLE 2FA SETTINGS
    if (action === "toggle_2fa") {
      const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (!cookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const session = verifyToken(cookie);
      if (!session || session.role !== "owner" || !session.slug) {
        return NextResponse.json({ error: "Only restaurant owners can configure 2FA." }, { status: 403 });
      }

      const { enabled } = body;
      setTwoFactorEnabled(session.slug, !!enabled);

      return NextResponse.json({
        success: true,
        twoFactorEnabled: !!enabled,
        message: enabled
          ? "WhatsApp 2-Factor Authentication (2FA) is now enabled for your account!"
          : "WhatsApp 2-Factor Authentication (2FA) has been disabled.",
      });
    }

    // 1.4 INSTANT MULTI-DEVICE SESSION INVALIDATION (LOGOUT ALL DEVICES)
    if (action === "revoke_all_sessions") {
      const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (!cookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const session = verifyToken(cookie);
      if (!session || session.role !== "owner" || !session.slug) {
        return NextResponse.json({ error: "Only restaurant owners can revoke all sessions." }, { status: 403 });
      }

      revokeAllSessions(session.slug);

      const response = NextResponse.json({
        success: true,
        message: "All active sessions across all phones and devices have been revoked immediately.",
      });
      response.cookies.delete(AUTH_COOKIE_NAME);
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

      const clientIp = getClientIp(request);
      const cleanSlug = String(slug).trim().toLowerCase();
      const cleanPin = String(pin).trim();

      // Distributed Rate limit: Max 5 PIN attempts per 60s per IP + slug to block brute force
      const rateLimitKey = `auth:pin:${clientIp}:${cleanSlug}`;
      const rateLimit = await checkRateLimitDistributed(rateLimitKey, 5, 60);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: `Too many PIN attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.` },
          { 
            status: 429,
            headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }
          }
        );
      }

      let restaurant: any = null;
      try {
        restaurant = await prisma.restaurant.findUnique({
          where: { slug: cleanSlug },
        });
      } catch (err) {
        console.warn("Prisma restaurant lookup error in pin_login:", err);
      }

      const isDemoRestaurant = cleanSlug === "grand-spice" || restaurant?.slug === "grand-spice" || restaurant?.id === "rest-001";

      if (!restaurant) {
        if (isDemoRestaurant) {
          restaurant = {
            id: "rest-001",
            name: "The Grand Spice Kitchen",
            slug: "grand-spice",
            ownerEmail: "owner@grandspice.com",
            ownerName: "Rajesh Sharma",
            staffPin: "1234",
          };
        } else {
          return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
        }
      }

      // Check if there is an individual staff member registered with this PIN in DB (resilient try/catch)
      let specificStaff: any = null;
      try {
        const staffList = await prisma.staff.findMany({
          where: {
            restaurantId: restaurant.id,
          },
        });
        specificStaff = staffList.find((s) => verifyPassword(cleanPin, s.pin));
      } catch (err) {
        console.warn("Prisma staff lookup error in pin_login:", err);
      }

      // If DB returned no match (or DB failed) and this is the demo restaurant, check DEMO_STAFF
      if (!specificStaff && isDemoRestaurant) {
        const demoStaffMatch = DEMO_STAFF.find((s) => verifyPassword(cleanPin, s.pin));
        if (demoStaffMatch) {
          specificStaff = {
            id: demoStaffMatch.id,
            restaurantId: restaurant.id,
            name: demoStaffMatch.name,
            role: demoStaffMatch.role,
            pin: demoStaffMatch.pin,
            phone: demoStaffMatch.phone,
            isActive: demoStaffMatch.isActive,
            canManageOrders: demoStaffMatch.canManageOrders,
            canManageMenu: demoStaffMatch.canManageMenu,
            canManageBilling: demoStaffMatch.canManageBilling,
            canManageRequests: demoStaffMatch.canManageRequests,
          };
        }
      }

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
        if (!verifyPassword(cleanPin, expectedPin)) {
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
      const displayName = user.staffName || specificStaff?.name || "Staff Member";
      const displayRole = user.staffRole || specificStaff?.role;
      const response = NextResponse.json({
        success: true,
        message: displayRole
          ? `Welcome, ${displayName} (${String(displayRole).toUpperCase()})!`
          : "Staff PIN verified successfully.",
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
        updateData.password = hashPassword(newPassword.trim());
        // Automatically invalidate all other existing sessions across devices
        revokeAllSessions(session.slug);
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

      let updated: any = null;
      try {
        updated = await prisma.restaurant.update({
          where: { slug: session.slug },
          data: updateData,
        });
      } catch (err) {
        console.warn("Prisma update credentials fallback for demo:", err);
      }

      if (!updated && session.slug === "grand-spice") {
        updated = {
          id: "rest-001",
          name: "The Grand Spice Kitchen",
          slug: "grand-spice",
          ownerEmail: updateData.ownerEmail || session.ownerEmail || "owner@grandspice.com",
          ownerName: updateData.ownerName || session.ownerName || "Rajesh Sharma",
        };
      }

      if (!updated) {
        return NextResponse.json({ error: "Failed to update restaurant credentials in database." }, { status: 500 });
      }

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
