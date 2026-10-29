import { NextRequest, NextResponse } from "next/server";
import { 
  getSuperAdminOverview, 
  updateSuperAdminRestaurant, 
  deleteRestaurant, 
  updatePlatformSetting 
} from "@/lib/store";
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

export async function GET() {
  try {
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
    const body = await request.json();
    const { action, restaurantId, ...payload } = body;

    if (action === "update-broadcast") {
      const setting = await updatePlatformSetting(
        payload.broadcastMessage,
        payload.isMaintenance,
        payload.supportPhone
      );
      return NextResponse.json({ success: true, setting });
    }

    if (action === "update-restaurant" && restaurantId) {
      const updated = await updateSuperAdminRestaurant(restaurantId, payload);
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
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

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
