import { NextRequest, NextResponse } from "next/server";
import { 
  getSuperAdminOverview, 
  updateSuperAdminRestaurant, 
  deleteRestaurant, 
  updatePlatformSetting 
} from "@/lib/store";
import { prisma } from "@/lib/prisma";
import { AuthUser } from "@/types";
import { signToken, AUTH_COOKIE_NAME, isSuperAdminRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    if (!isSuperAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const data = await getSuperAdminOverview();
    if (!data) {
      return NextResponse.json({ error: "Failed to load admin metrics" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Super Admin GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSuperAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const body = await request.json();
    const { action, slug } = body;

    if (action === "impersonate" && slug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: String(slug).trim().toLowerCase() },
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
        message: `Impersonation login granted for ${restaurant.name}`,
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
  } catch (err) {
    console.error("Super Admin POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isSuperAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const body = await request.json();
    const { action, restaurantId, id, ...payload } = body;
    const targetId = restaurantId || id;

    if (action === "update-broadcast") {
      const setting = await updatePlatformSetting(
        payload.broadcastMessage,
        payload.isMaintenance,
        payload.supportPhone
      );
      return NextResponse.json({ success: true, setting });
    }

    if (action === "update-restaurant" && targetId) {
      const updated = await updateSuperAdminRestaurant(targetId, payload);
      if (!updated) {
        return NextResponse.json({ error: "Restaurant not found or update failed" }, { status: 404 });
      }
      return NextResponse.json({ success: true, restaurant: updated });
    }

    return NextResponse.json({ error: "Invalid action or missing restaurantId" }, { status: 400 });
  } catch (err) {
    console.error("Super Admin PATCH error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isSuperAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId") || searchParams.get("id");

    if (!restaurantId) {
      return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
    }

    const success = await deleteRestaurant(restaurantId);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete restaurant" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Super Admin DELETE error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
