import { NextRequest, NextResponse } from "next/server";
import { getOrdersForRestaurant, getTableOrders, createOrder, updateOrderStatus } from "@/lib/store";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isSuperAdminRequest } from "@/lib/auth";

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
      customerName, 
      customerPhone, 
      couponCode,
      paymentMethod 
    } = body;

    if (!restaurantId || !tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid order data: items, restaurantId and tableId are required" }, { status: 400 });
    }

    // Verify restaurant is active & get configured tax rate
    const rest = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { isActive: true, name: true, taxRatePercent: true },
    });
    if (!rest || !rest.isActive) {
      return NextResponse.json(
        { error: "This restaurant is currently suspended or inactive. Orders cannot be accepted." },
        { status: 403 }
      );
    }

    // Fetch official menu items for this restaurant to prevent client-side price tampering and verify stock
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      select: { id: true, name: true, price: true, isVeg: true, isAvailable: true, stockCount: true },
    });
    const itemMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    // Validate live stock and availability
    for (const it of items) {
      const dbItem = itemMap.get(it.menuItemId || it.id);
      if (dbItem) {
        if (!dbItem.isAvailable || (dbItem.stockCount !== null && dbItem.stockCount !== undefined && dbItem.stockCount === 0)) {
          return NextResponse.json(
            { error: `"${dbItem.name}" is currently Sold Out. Please remove it from your order.` },
            { status: 400 }
          );
        }
        if (dbItem.stockCount !== null && dbItem.stockCount !== undefined && dbItem.stockCount > 0 && Number(it.quantity) > dbItem.stockCount) {
          return NextResponse.json(
            { error: `Only ${dbItem.stockCount} portion(s) of "${dbItem.name}" left in kitchen. Please adjust quantity.` },
            { status: 400 }
          );
        }
      }
    }

    // Sanitize items with true database prices
    const sanitizedItems = items.map((it: any) => {
      const dbItem = itemMap.get(it.menuItemId || it.id);
      const price = dbItem ? dbItem.price : Number(it.price ?? 0);
      const name = dbItem ? dbItem.name : (it.name || "Dish Item");
      const isVeg = dbItem ? dbItem.isVeg : (it.isVeg !== undefined ? Boolean(it.isVeg) : true);
      const quantity = Math.max(1, Math.min(50, Number(it.quantity) || 1));

      return {
        menuItemId: it.menuItemId || it.id || "item-custom",
        name,
        price,
        quantity,
        isVeg,
        notes: it.notes || undefined,
      };
    });

    const calculatedSubtotal = Number(
      sanitizedItems.reduce((sum, it) => sum + it.price * it.quantity, 0).toFixed(2)
    );

    // Validate coupon code against system rules
    let verifiedDiscount = 0;
    const cleanCoupon = couponCode ? String(couponCode).trim().toUpperCase() : null;
    if (cleanCoupon === "WELCOME10") {
      verifiedDiscount = Math.round((calculatedSubtotal * 10) / 100);
    } else if (cleanCoupon === "FLAT50") {
      verifiedDiscount = Math.min(calculatedSubtotal, 50);
    } else if (cleanCoupon === "TASTE20") {
      verifiedDiscount = Math.round((calculatedSubtotal * 20) / 100);
    }

    const taxable = Math.max(0, calculatedSubtotal - verifiedDiscount);
    const taxRate = rest.taxRatePercent !== undefined ? rest.taxRatePercent : 5;
    const calculatedTax = Number(((taxable * taxRate) / 100).toFixed(2));
    const calculatedTotal = Number((taxable + calculatedTax).toFixed(2));

    const order = await createOrder({
      restaurantId,
      tableId,
      tableNumber: tableNumber || "Table",
      customerName: customerName || "Guest",
      customerPhone: customerPhone || undefined,
      items: sanitizedItems,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      discount: verifiedDiscount,
      couponCode: verifiedDiscount > 0 ? cleanCoupon : undefined,
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
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    // Only staff, owner, or superadmin can update orders
    if (!session && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Staff or Owner login required to manage orders." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, status, paymentStatus } = body;

    if (!orderId || (!status && !paymentStatus)) {
      return NextResponse.json({ error: "Missing orderId or status/paymentStatus" }, { status: 400 });
    }

    // Role & restaurant boundary check
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: { select: { id: true, slug: true } } },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      !isSuperAdmin &&
      session?.id !== existingOrder.restaurant.id &&
      session?.slug !== existingOrder.restaurant.slug &&
      session?.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify orders for another restaurant." },
        { status: 403 }
      );
    }

    // Granular staff permission check
    if (session?.role === "staff") {
      if (status && !session.permissions?.canManageOrders) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to advance or cancel kitchen orders." },
          { status: 403 }
        );
      }
      if (paymentStatus && !session.permissions?.canManageBilling) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to manage billing or payment status." },
          { status: 403 }
        );
      }
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
