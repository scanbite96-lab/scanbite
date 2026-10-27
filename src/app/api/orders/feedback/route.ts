import { NextRequest, NextResponse } from "next/server";
import { updateOrderRating } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, rating, reviewFeedback } = body;

    if (!orderId || !rating) {
      return NextResponse.json({ error: "Missing orderId or rating" }, { status: 400 });
    }

    const ok = await updateOrderRating(orderId, Number(rating), reviewFeedback);
    if (!ok) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
