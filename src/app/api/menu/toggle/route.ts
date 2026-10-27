import { NextRequest, NextResponse } from "next/server";
import { toggleItemAvailability } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, itemId } = body;

    if (!slug || !itemId) {
      return NextResponse.json({ error: "Missing slug or itemId" }, { status: 400 });
    }

    const updated = await toggleItemAvailability(slug, itemId);
    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to toggle status" }, { status: 500 });
  }
}
