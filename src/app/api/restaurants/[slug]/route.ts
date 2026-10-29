import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/store";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurant = await getRestaurantBySlug(params.slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const platformSetting = await prisma.platformSetting.findUnique({
    where: { id: "global" },
  });

  return NextResponse.json({
    ...restaurant,
    platformSetting: platformSetting || {
      id: "global",
      broadcastMessage: null,
      isMaintenance: false,
      supportPhone: "+91 98765 43210",
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
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

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update restaurant settings:", err);
    return NextResponse.json({ error: "Failed to update restaurant settings" }, { status: 500 });
  }
}
