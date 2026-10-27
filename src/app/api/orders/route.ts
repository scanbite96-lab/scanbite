import { NextRequest, NextResponse } from "next/server";
import { getOrdersForRestaurant, getTableOrders, createOrder, updateOrderStatus } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const tableId = searchParams.get("tableId");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  if (tableId) {
    const orders = await getTableOrders(restaurantId, tableId);
    return NextResponse.json(orders);
  }

  const orders = await getOrdersForRestaurant(restaurantId);
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, tableId, tableNumber, items, subtotal, tax, discount, couponCode, total, customerName, customerPhone, paymentMethod } = body;

    if (!restaurantId || !tableId || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const order = await createOrder({
      restaurantId,
      tableId,
      tableNumber: tableNumber || "Table",
      customerName: customerName || "Guest",
      customerPhone,
      items,
      subtotal,
      tax,
      discount: Number(discount) || 0,
      couponCode: couponCode || undefined,
      total,
      status: "pending",
      paymentMethod: paymentMethod || "counter_cash",
      paymentStatus: "unpaid",
    });

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, paymentStatus } = body;

    if (!orderId || (!status && !paymentStatus)) {
      return NextResponse.json({ error: "Missing orderId or status/paymentStatus" }, { status: 400 });
    }

    const updated = await updateOrderStatus(orderId, status, paymentStatus);
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
