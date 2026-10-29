import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/store";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isSuperAdminRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const restaurant = await getRestaurantBySlug(params.slug);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    let platformSetting = null;
    try {
      platformSetting = await prisma.platformSetting.findUnique({
        where: { id: "global" },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      ...restaurant,
      platformSetting: platformSetting || {
        id: "global",
        broadcastMessage: null,
        isMaintenance: false,
        supportPhone: "+91 98765 43210",
      },
    });
  } catch (err) {
    console.error("GET /api/restaurants/[slug] error:", err);
    return NextResponse.json({ error: "Failed to fetch restaurant" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Owner login required." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot modify restaurant settings." }, { status: 403 });
    }
    if (!isSuperAdmin && session?.slug !== params.slug && session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: You cannot modify another restaurant." }, { status: 403 });
    }

    const body = await request.json();
    const { name, tagline, phone, address, currencySymbol, taxRatePercent, upiId } = body;

    const updated = await prisma.restaurant.update({
      where: { slug: params.slug },
      data: {
        ...(name && { name }),
        ...(tagline !== undefined && { tagline }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(currencySymbol && { currencySymbol }),
        ...(taxRatePercent !== undefined && { taxRatePercent: Number(taxRatePercent) }),
        ...(upiId !== undefined && { upiId }),
      },
    });

    const { password, staffPin, ...safeUpdated } = updated as Record<string, unknown>;
    return NextResponse.json(safeUpdated);
  } catch (err) {
    console.error("Failed to update restaurant settings:", err);
    return NextResponse.json({ error: "Failed to update restaurant settings" }, { status: 500 });
  }
}
