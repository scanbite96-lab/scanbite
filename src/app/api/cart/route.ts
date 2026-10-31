import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let lastDinerCleanupTime = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const tableId = searchParams.get("tableId");
    const tableNumber = searchParams.get("tableNumber") || "Table";

    if (!tableId) {
      return NextResponse.json({ error: "tableId is required" }, { status: 400 });
    }

    // Auto-clean stale diners (throttled to once per 15 minutes to prevent write-lock storm)
    const now = Date.now();
    if (now - lastDinerCleanupTime > 15 * 60 * 1000) {
      lastDinerCleanupTime = now;
      try {
        const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
        await prisma.tableDiner.deleteMany({
          where: { joinedAt: { lt: twoHoursAgo } },
        });
      } catch {
        // ignore
      }
    }

    let cart = await prisma.tableCart.findUnique({
      where: { tableId },
      include: {
        diners: { orderBy: { joinedAt: "asc" } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!cart && restaurantId) {
      cart = await prisma.tableCart.create({
        data: {
          restaurantId,
          tableId,
          tableNumber,
        },
        include: {
          diners: true,
          items: true,
        },
      });
    }

    return NextResponse.json({ cart: cart || null });
  } catch (err) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json({ error: "Failed to fetch table cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, restaurantId, tableId, tableNumber, dinerId, dinerName } = body;

    if (!tableId) {
      return NextResponse.json({ error: "tableId is required" }, { status: 400 });
    }

    // Ensure TableCart exists
    let cart = await prisma.tableCart.findUnique({
      where: { tableId },
      include: { diners: true, items: true },
    });

    if (!cart) {
      cart = await prisma.tableCart.create({
        data: {
          restaurantId: restaurantId || "rest-001",
          tableId,
          tableNumber: tableNumber || "Table",
        },
        include: { diners: true, items: true },
      });
    }

    if (action === "join") {
      if (!dinerId || !dinerName) {
        return NextResponse.json({ error: "dinerId and dinerName are required to join" }, { status: 400 });
      }

      await prisma.tableDiner.upsert({
        where: {
          cartId_dinerId: {
            cartId: cart.id,
            dinerId,
          },
        },
        create: {
          cartId: cart.id,
          dinerId,
          name: dinerName.trim() || "Guest",
        },
        update: {
          name: dinerName.trim() || "Guest",
        },
      });
    } else if (action === "add_item") {
      const { item, quantity = 1, notes, variantName, selectedAddons } = body;
      if (!item || !item.id) {
        return NextResponse.json({ error: "Item is required" }, { status: 400 });
      }

      const existingCandidates = await prisma.tableCartItem.findMany({
        where: {
          cartId: cart.id,
          menuItemId: item.id,
          dinerId: dinerId || "guest",
          variantName: variantName || null,
          notes: notes || null,
        },
      });

      const addonStr = JSON.stringify(selectedAddons || []);
      const existing = existingCandidates.find(
        (c) => JSON.stringify(c.selectedAddons || []) === addonStr
      );

      if (existing) {
        await prisma.tableCartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + (Number(quantity) || 1),
          },
        });
      } else {
        await prisma.tableCartItem.create({
          data: {
            cartId: cart.id,
            menuItemId: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(quantity) || 1,
            isVeg: Boolean(item.isVeg),
            notes: notes || null,
            variantName: variantName || null,
            selectedAddons: selectedAddons || undefined,
            dinerId: dinerId || "guest",
            dinerName: dinerName || "Guest",
          },
        });
      }
    } else if (action === "update_item") {
      const { itemId, quantity, notes } = body;
      if (!itemId) {
        return NextResponse.json({ error: "itemId is required" }, { status: 400 });
      }

      if (quantity !== undefined && Number(quantity) <= 0) {
        await prisma.tableCartItem.delete({
          where: { id: itemId },
        });
      } else {
        const updateData: any = {};
        if (quantity !== undefined) updateData.quantity = Number(quantity);
        if (notes !== undefined) updateData.notes = notes;

        await prisma.tableCartItem.update({
          where: { id: itemId },
          data: updateData,
        });
      }
    } else if (action === "remove_item") {
      const { itemId } = body;
      if (!itemId) {
        return NextResponse.json({ error: "itemId is required" }, { status: 400 });
      }
      await prisma.tableCartItem.delete({
        where: { id: itemId },
      });
    } else if (action === "clear_cart") {
      await prisma.tableCartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    // Return updated cart
    const updatedCart = await prisma.tableCart.findUnique({
      where: { id: cart.id },
      include: {
        diners: { orderBy: { joinedAt: "asc" } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (err) {
    console.error("POST /api/cart error:", err);
    return NextResponse.json({ error: "Failed to process cart action" }, { status: 500 });
  }
}
