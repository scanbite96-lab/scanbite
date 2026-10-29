import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isSuperAdminRequest } from "@/lib/auth";
import { DEMO_STAFF } from "@/lib/demoData";

// GET /api/staff?restaurantId=...
export async function GET(request: NextRequest) {
  let restaurantId: string | null = null;
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
    }

    // Security check: only own restaurant or superadmin
    if (!isSuperAdmin && session?.id !== restaurantId && session?.role !== "admin") {
      let rest = null;
      try {
        rest = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { slug: true } });
      } catch {
        // ignore
      }
      if (rest && rest.slug !== session?.slug) {
        return NextResponse.json({ error: "Forbidden: Cannot access another restaurant's staff." }, { status: 403 });
      }
    }

    let staffList: any[] = [];
    try {
      staffList = await prisma.staff.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // ignore
    }

    if (staffList.length === 0 && (restaurantId === "rest-001" || restaurantId === "grand-spice")) {
      staffList = DEMO_STAFF;
    }

    let restaurant = null;
    try {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { staffPin: true },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      staff: staffList,
      defaultStaffPin: restaurant?.staffPin || "1234",
    });
  } catch (err) {
    console.error("GET /api/staff error:", err);
    if (restaurantId === "rest-001" || restaurantId === "grand-spice") {
      return NextResponse.json({
        staff: DEMO_STAFF,
        defaultStaffPin: "1234",
      });
    }
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }
}

// POST /api/staff -> Add a new staff member with roles and permissions
export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    // Only owner or admin can add staff
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Forbidden: Only owners can manage staff members." }, { status: 403 });
    }

    const body = await request.json();
    const {
      restaurantId,
      name,
      role = "waiter",
      pin,
      phone,
      isActive = true,
      canManageOrders,
      canManageMenu,
      canManageBilling,
      canManageRequests,
    } = body;

    if (!restaurantId || !name || !pin) {
      return NextResponse.json({ error: "Restaurant ID, Staff Name, and 4-digit PIN are required." }, { status: 400 });
    }

    const cleanPin = String(pin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits (e.g. 1234)." }, { status: 400 });
    }

    // Security check
    if (!isSuperAdmin && session?.id !== restaurantId && session?.role !== "admin") {
      const rest = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { slug: true } });
      if (!rest || rest.slug !== session?.slug) {
        return NextResponse.json({ error: "Forbidden: Cannot add staff to another restaurant." }, { status: 403 });
      }
    }

    // Check duplicate PIN for this restaurant
    const existingStaffWithPin = await prisma.staff.findFirst({
      where: { restaurantId, pin: cleanPin },
    });
    if (existingStaffWithPin) {
      return NextResponse.json(
        { error: `PIN ${cleanPin} is already assigned to "${existingStaffWithPin.name}". Please pick a different 4-digit PIN.` },
        { status: 400 }
      );
    }

    // Smart default permissions based on role if not explicitly provided
    let ordersPerm = canManageOrders !== undefined ? Boolean(canManageOrders) : true;
    let menuPerm = canManageMenu !== undefined ? Boolean(canManageMenu) : false;
    let billingPerm = canManageBilling !== undefined ? Boolean(canManageBilling) : false;
    let requestsPerm = canManageRequests !== undefined ? Boolean(canManageRequests) : true;

    if (role === "chef") {
      if (canManageMenu === undefined) menuPerm = true;
      if (canManageBilling === undefined) billingPerm = false;
      if (canManageRequests === undefined) requestsPerm = false;
    } else if (role === "cashier") {
      if (canManageBilling === undefined) billingPerm = true;
      if (canManageMenu === undefined) menuPerm = false;
    } else if (role === "manager") {
      ordersPerm = true;
      menuPerm = true;
      billingPerm = true;
      requestsPerm = true;
    }

    const newStaff = await prisma.staff.create({
      data: {
        restaurantId,
        name: String(name).trim(),
        role: String(role).toLowerCase(),
        pin: cleanPin,
        phone: phone ? String(phone).trim() : null,
        isActive: Boolean(isActive),
        canManageOrders: ordersPerm,
        canManageMenu: menuPerm,
        canManageBilling: billingPerm,
        canManageRequests: requestsPerm,
      },
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (err) {
    console.error("POST /api/staff error:", err);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

// PATCH /api/staff -> Update staff status, PIN, role, or permissions
export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    if (session?.role === "staff") {
      return NextResponse.json({ error: "Forbidden: Only owners can update staff." }, { status: 403 });
    }

    const body = await request.json();
    const {
      staffId,
      name,
      role,
      pin,
      phone,
      isActive,
      canManageOrders,
      canManageMenu,
      canManageBilling,
      canManageRequests,
    } = body;

    if (!staffId) {
      return NextResponse.json({ error: "Missing staffId" }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { restaurant: { select: { id: true, slug: true } } },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (
      !isSuperAdmin &&
      session?.id !== staff.restaurant.id &&
      session?.slug !== staff.restaurant.slug &&
      session?.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden: Cannot edit staff of another restaurant." }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (role !== undefined) updateData.role = String(role).toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (canManageOrders !== undefined) updateData.canManageOrders = Boolean(canManageOrders);
    if (canManageMenu !== undefined) updateData.canManageMenu = Boolean(canManageMenu);
    if (canManageBilling !== undefined) updateData.canManageBilling = Boolean(canManageBilling);
    if (canManageRequests !== undefined) updateData.canManageRequests = Boolean(canManageRequests);

    if (pin !== undefined) {
      const cleanPin = String(pin).trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        return NextResponse.json({ error: "PIN must be exactly 4 digits (e.g. 1234)." }, { status: 400 });
      }
      // Check duplicate PIN
      const existing = await prisma.staff.findFirst({
        where: {
          restaurantId: staff.restaurantId,
          pin: cleanPin,
          id: { not: staffId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `PIN ${cleanPin} is already used by "${existing.name}". Please pick another.` },
          { status: 400 }
        );
      }
      updateData.pin = cleanPin;
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/staff error:", err);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

// DELETE /api/staff?staffId=...
export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    if (session?.role === "staff") {
      return NextResponse.json({ error: "Forbidden: Only owners can delete staff." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json({ error: "Missing staffId" }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { restaurant: { select: { id: true, slug: true } } },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (
      !isSuperAdmin &&
      session?.id !== staff.restaurant.id &&
      session?.slug !== staff.restaurant.slug &&
      session?.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden: Cannot delete staff of another restaurant." }, { status: 403 });
    }

    await prisma.staff.delete({
      where: { id: staffId },
    });

    return NextResponse.json({ success: true, message: "Staff member removed successfully." });
  } catch (err) {
    console.error("DELETE /api/staff error:", err);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
