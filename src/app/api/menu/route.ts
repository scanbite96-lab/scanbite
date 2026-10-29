import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, categoryId, name, description, price, isVeg, imageUrl } = body;

    if (!restaurantId || !name || price === undefined) {
      return NextResponse.json({ error: "Missing required dish fields" }, { status: 400 });
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

    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: catId,
        name,
        description: description || "",
        price: Number(price),
        isVeg: Boolean(isVeg),
        isAvailable: true,
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
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
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
