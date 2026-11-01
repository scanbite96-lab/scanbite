import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_RESTAURANT, demoOrdersStore } from "@/lib/demoData";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    // Try finding order in Prisma DB
    let order: any = null;
    let restaurant: any = null;

    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              address: true,
              city: true,
              taxRatePercent: true,
              currencySymbol: true,
              upiId: true,
              logoUrl: true,
            },
          },
        },
      });

      if (order?.restaurant) {
        restaurant = order.restaurant;
      }
    } catch {
      // ignore db errors and fallback
    }

    // Fallback to demo orders store
    if (!order) {
      const demoOrder = demoOrdersStore.find((o) => o.id === orderId);
      if (demoOrder) {
        order = demoOrder;
        restaurant = {
          id: DEMO_RESTAURANT.id,
          name: DEMO_RESTAURANT.name,
          slug: DEMO_RESTAURANT.slug,
          phone: DEMO_RESTAURANT.phone,
          address: DEMO_RESTAURANT.address,
          city: DEMO_RESTAURANT.city,
          taxRatePercent: DEMO_RESTAURANT.taxRatePercent,
          currencySymbol: DEMO_RESTAURANT.currencySymbol,
          upiId: DEMO_RESTAURANT.upiId,
          logoUrl: DEMO_RESTAURANT.logoUrl,
        };
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        restaurantId: order.restaurantId,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        subtotal: order.subtotal,
        tax: order.tax,
        discount: order.discount || 0,
        couponCode: order.couponCode,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: typeof order.createdAt === "string" ? order.createdAt : order.createdAt.toISOString(),
        updatedAt: typeof order.updatedAt === "string" ? order.updatedAt : order.updatedAt.toISOString(),
        items: order.items.map((it: any) => ({
          id: it.id,
          menuItemId: it.menuItemId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          isVeg: it.isVeg,
          variantName: it.variantName,
          selectedAddons: it.selectedAddons,
          orderedByName: it.orderedByName,
          notes: it.notes,
        })),
      },
      restaurant: restaurant || {
        name: "ScanBite Restaurant",
        city: "Delhi NCR",
        currencySymbol: "₹",
        taxRatePercent: 5.0,
      },
    });
  } catch (err) {
    console.error("GET /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { customerPhone, paymentStatus, customerName } = body;

    const updateData: Record<string, any> = {};
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (customerName !== undefined) updateData.customerName = customerName;

    // Try DB update
    try {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true },
      });
      return NextResponse.json(updated);
    } catch {
      // demo store fallback
      const demoOrder = demoOrdersStore.find((o) => o.id === orderId);
      if (demoOrder) {
        if (customerPhone !== undefined) demoOrder.customerPhone = customerPhone;
        if (paymentStatus !== undefined) demoOrder.paymentStatus = paymentStatus;
        if (customerName !== undefined) demoOrder.customerName = customerName;
        return NextResponse.json(demoOrder);
      }
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (err) {
    console.error("PATCH /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
