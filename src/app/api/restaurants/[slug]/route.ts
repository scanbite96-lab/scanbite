import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurant = await getRestaurantBySlug(params.slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }
  return NextResponse.json(restaurant);
}
