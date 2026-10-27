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
    const { 
      restaurantId, 
      tableId, 
      tableNumber, 
      items, 
      subtotal, 
      tax, 
      discount, 
      couponCode, 
      total, 
      customerName, 
      customerPhone, 
      paymentMethod 
    } = body;

    if (!restaurantId || !tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid order data: items, restaurantId and tableId are required" }, { status: 400 });
    }

    // Defensive item sanitization
    const sanitizedItems = items.map((it: any) => {
      const price = Number(it.price ?? it.unitPrice ?? 0);
      const quantity = Math.max(1, Number(it.quantity) || 1);
      return {
        menuItemId: it.menuItemId || it.id || "item-custom",
        name: it.name || "Dish Item",
        price,
        quantity,
        isVeg: it.isVeg !== undefined ? Boolean(it.isVeg) : true,
        notes: it.notes || undefined,
      };
    });

    const calculatedSubtotal = Number(subtotal) >= 0 
      ? Number(subtotal) 
      : sanitizedItems.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);

    const calculatedDiscount = Math.max(0, Number(discount) || 0);
    const taxable = Math.max(0, calculatedSubtotal - calculatedDiscount);
    const calculatedTax = Number(tax) >= 0 ? Number(tax) : Number(((taxable * 5) / 100).toFixed(2));
    const calculatedTotal = Number(total) >= 0 ? Number(total) : Number((taxable + calculatedTax).toFixed(2));

    const order = await createOrder({
      restaurantId,
      tableId,
      tableNumber: tableNumber || "Table",
      customerName: customerName || "Guest",
      customerPhone: customerPhone || undefined,
      items: sanitizedItems,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      discount: calculatedDiscount,
      couponCode: couponCode || undefined,
      total: calculatedTotal,
      status: "pending",
      paymentMethod: paymentMethod || "counter_cash",
      paymentStatus: "unpaid",
    });

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("Order POST error:", err);
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
