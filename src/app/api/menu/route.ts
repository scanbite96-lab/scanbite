import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isSuperAdminRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to add dishes." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot add dishes. Owner access required." }, { status: 403 });
    }

    const body = await request.json();
    const { 
      restaurantId, 
      categoryId, 
      name, 
      description, 
      price, 
      isVeg, 
      imageUrl,
      stockCount = -1,
      lowStockThreshold = 5
    } = body;

    if (!restaurantId || !name || price === undefined) {
      return NextResponse.json({ error: "Missing required dish fields" }, { status: 400 });
    }

    if (!isSuperAdmin && session?.id !== restaurantId && session?.role !== "admin") {
      // Also check slug
      const rest = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { slug: true } });
      if (!rest || rest.slug !== session?.slug) {
        return NextResponse.json({ error: "Forbidden: You cannot modify another restaurant's menu." }, { status: 403 });
      }
    }

    let catId = categoryId;
    if (!catId) {
      let cat = await prisma.category.findFirst({ where: { restaurantId } });
      if (!cat) {
        cat = await prisma.category.create({
          data: {
            restaurantId,
            name: "Main Course",
            icon: "🍛",
            sortOrder: 1,
          },
        });
      }
      catId = cat.id;
    }

    const initialStock = stockCount !== undefined ? Number(stockCount) : -1;
    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: catId,
        name,
        description: description || "",
        price: Number(price),
        isVeg: Boolean(isVeg),
        isAvailable: initialStock === 0 ? false : true,
        stockCount: initialStock,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("Failed to create menu item:", err);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to delete dishes." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot delete dishes. Owner access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { restaurant: { select: { id: true, slug: true } } },
    });

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    if (!isSuperAdmin && session?.id !== item.restaurant.id && session?.slug !== item.restaurant.slug && session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: You cannot delete another restaurant's dish." }, { status: 403 });
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete menu item:", err);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    // Check staff permissions
    if (session?.role === "staff" && !session.permissions?.canManageMenu) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to manage menu or stock." }, { status: 403 });
    }

    const body = await request.json();
    const { 
      itemId, 
      name, 
      price, 
      isVeg, 
      isAvailable, 
      stockCount, 
      lowStockThreshold, 
      description, 
      imageUrl, 
      categoryId 
    } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { restaurant: { select: { id: true, slug: true } } },
    });

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    if (!isSuperAdmin && session?.id !== item.restaurant.id && session?.slug !== item.restaurant.slug && session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Cannot edit another restaurant's dish." }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (price !== undefined) updateData.price = Number(price);
    if (isVeg !== undefined) updateData.isVeg = Boolean(isVeg);
    if (description !== undefined) updateData.description = String(description);
    if (imageUrl !== undefined) updateData.imageUrl = String(imageUrl);
    if (categoryId !== undefined) updateData.categoryId = String(categoryId);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(lowStockThreshold);

    if (stockCount !== undefined) {
      const parsedStock = Number(stockCount);
      updateData.stockCount = parsedStock;
      // If stock replenished > 0 and availability not explicitly set, auto-enable
      if (parsedStock > 0 && isAvailable === undefined && !item.isAvailable) {
        updateData.isAvailable = true;
      } else if (parsedStock === 0) {
        updateData.isAvailable = false;
      }
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = Boolean(isAvailable);
    }

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update menu item:", err);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}
