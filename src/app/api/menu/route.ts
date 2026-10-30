import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isSuperAdminRequest } from "@/lib/auth";
import { DEMO_RESTAURANT } from "@/lib/demoData";
import { MenuItem } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    const body = await request.json();

    if (body.action === "addCategory" || body.type === "category") {
      const { restaurantId, name, icon } = body;
      if (!restaurantId || !name?.trim()) {
        return NextResponse.json({ error: "Missing required category fields (restaurantId, name)" }, { status: 400 });
      }

      const isDemoRestaurant = restaurantId === "rest-001" || restaurantId === "grand-spice";

      if (!session && !isSuperAdmin && !isDemoRestaurant) {
        return NextResponse.json({ error: "Unauthorized: Please log in as owner." }, { status: 401 });
      }
      if (session?.role === "staff") {
        return NextResponse.json({ error: "Unauthorized: Staff cannot add categories. Owner access required." }, { status: 403 });
      }

      if (!isSuperAdmin && session?.id !== restaurantId && session?.role !== "admin" && !isDemoRestaurant) {
        const rest = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { slug: true } });
        if (!rest || rest.slug !== session?.slug) {
          return NextResponse.json({ error: "Forbidden: You cannot modify another restaurant's menu." }, { status: 403 });
        }
      }

      const catIcon = icon && String(icon).trim() ? String(icon).trim() : "🍽️";
      let category: any = null;

      try {
        const highestOrder = await prisma.category.findFirst({
          where: { restaurantId },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        const nextOrder = (highestOrder?.sortOrder ?? 0) + 1;

        category = await prisma.category.create({
          data: {
            restaurantId,
            name: String(name).trim(),
            icon: catIcon,
            sortOrder: nextOrder,
          },
        });
      } catch (dbErr) {
        console.warn("Prisma category creation failed, falling back to demo store:", dbErr);
      }

      if (isDemoRestaurant || !category) {
        const demoCategory = {
          id: category?.id || `cat-${Date.now()}`,
          name: String(name).trim(),
          icon: catIcon,
          sortOrder: (DEMO_RESTAURANT.categories?.length || 0) + 1,
        };
        if (!DEMO_RESTAURANT.categories) DEMO_RESTAURANT.categories = [];
        DEMO_RESTAURANT.categories.push(demoCategory);
        return NextResponse.json(category || demoCategory, { status: 201 });
      }

      return NextResponse.json(category, { status: 201 });
    }

    const { 
      restaurantId, 
      categoryId, 
      name, 
      description, 
      price, 
      isVeg, 
      imageUrl,
      stockCount = -1,
      lowStockThreshold = 5,
      variants,
      addons
    } = body;

    if (!restaurantId || !name || price === undefined) {
      return NextResponse.json({ error: "Missing required dish fields" }, { status: 400 });
    }

    const isDemoRestaurant = restaurantId === "rest-001" || restaurantId === "grand-spice";

    if (!session && !isSuperAdmin && !isDemoRestaurant) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to add dishes." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot add dishes. Owner access required." }, { status: 403 });
    }

    if (!isSuperAdmin && session?.id !== restaurantId && session?.role !== "admin" && !isDemoRestaurant) {
      // Also check slug
      const rest = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { slug: true } });
      if (!rest || rest.slug !== session?.slug) {
        return NextResponse.json({ error: "Forbidden: You cannot modify another restaurant's menu." }, { status: 403 });
      }
    }

    const initialStock = stockCount !== undefined ? Number(stockCount) : -1;

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

    // Persist to Neon DB
    let item: any = null;
    try {
      item = await prisma.menuItem.create({
        data: {
          restaurantId,
          categoryId: catId,
          name: String(name).trim(),
          description: description || "",
          price: Number(price),
          isVeg: Boolean(isVeg),
          isAvailable: initialStock === 0 ? false : true,
          stockCount: initialStock,
          lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
          variants: variants && Array.isArray(variants) && variants.length > 0 ? variants : undefined,
          addons: addons && Array.isArray(addons) && addons.length > 0 ? addons : undefined,
        },
      });
    } catch (dbErr) {
      console.warn("Prisma dish creation failed, creating in demo store:", dbErr);
    }

    if (isDemoRestaurant) {
      const demoItem: MenuItem = {
        id: item?.id || `item-${Date.now()}`,
        categoryId: catId,
        name: String(name).trim(),
        description: description || "",
        price: Number(price),
        isVeg: Boolean(isVeg),
        isAvailable: initialStock === 0 ? false : true,
        stockCount: initialStock,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
        variants: variants && Array.isArray(variants) ? variants : undefined,
        addons: addons && Array.isArray(addons) ? addons : undefined,
      };
      DEMO_RESTAURANT.menuItems.unshift(demoItem);
      return NextResponse.json(item || demoItem, { status: 201 });
    }

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

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (categoryId) {
      const hasDemoPrefix = String(categoryId).startsWith("cat-");
      const inDemoStore = Boolean(DEMO_RESTAURANT.categories?.some((c) => c.id === categoryId));

      let dbCategory: { id: string; restaurantId: string; restaurant?: { id: string; slug: string } } | null = null;
      try {
        dbCategory = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, restaurantId: true, restaurant: { select: { id: true, slug: true } } },
        });
      } catch (dbErr) {
        // Fallback gracefully if database is unreachable
      }

      const isDemoDbCategory = Boolean(
        dbCategory && (dbCategory.restaurantId === "rest-001" || dbCategory.restaurant?.slug === "grand-spice")
      );

      const isDemoCategory = hasDemoPrefix || inDemoStore || isDemoDbCategory;

      if (!session && !isSuperAdmin && !isDemoCategory) {
        return NextResponse.json({ error: "Unauthorized: Owner access required." }, { status: 401 });
      }
      if (session?.role === "staff") {
        return NextResponse.json({ error: "Unauthorized: Staff cannot delete categories." }, { status: 403 });
      }

      if (!isSuperAdmin && dbCategory && !isDemoCategory) {
        const ownsCategory = session?.id === dbCategory.restaurantId || session?.slug === dbCategory.restaurant?.slug || session?.role === "admin";
        if (!ownsCategory) {
          return NextResponse.json({ error: "Forbidden: You cannot delete another restaurant's category." }, { status: 403 });
        }
      }

      const idx = DEMO_RESTAURANT.categories.findIndex((c) => c.id === categoryId);
      if (idx !== -1) {
        DEMO_RESTAURANT.categories.splice(idx, 1);
      }
      DEMO_RESTAURANT.menuItems = DEMO_RESTAURANT.menuItems.filter((it) => it.categoryId !== categoryId);

      try {
        await prisma.menuItem.deleteMany({ where: { categoryId } });
        await prisma.category.delete({ where: { id: categoryId } });
      } catch (dbErr) {
        // Safe to ignore if record only existed in memory
      }

      return NextResponse.json({ success: true });
    }

    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId or categoryId" }, { status: 400 });
    }

    const hasDemoItemPrefix = String(itemId).startsWith("item-");
    const inDemoItemStore = Boolean(DEMO_RESTAURANT.menuItems?.some((it) => it.id === itemId));

    let dbItemToDelete: { id: string; restaurantId: string; restaurant?: { id: string; slug: string } } | null = null;
    try {
      dbItemToDelete = await prisma.menuItem.findUnique({
        where: { id: itemId },
        select: { id: true, restaurantId: true, restaurant: { select: { id: true, slug: true } } },
      });
    } catch (dbErr) {
      // Fallback gracefully if database is unreachable
    }

    const isDemoDbItemToDelete = Boolean(
      dbItemToDelete && (dbItemToDelete.restaurantId === "rest-001" || dbItemToDelete.restaurant?.slug === "grand-spice")
    );

    const isDemoItem = hasDemoItemPrefix || inDemoItemStore || isDemoDbItemToDelete;

    if (!session && !isSuperAdmin && !isDemoItem) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to delete dishes." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot delete dishes. Owner access required." }, { status: 403 });
    }

    if (isDemoItem) {
      const idx = DEMO_RESTAURANT.menuItems.findIndex((it) => it.id === itemId);
      if (idx !== -1) {
        DEMO_RESTAURANT.menuItems.splice(idx, 1);
      }
      try {
        await prisma.menuItem.delete({ where: { id: itemId } });
      } catch (e) {
        // Safe to ignore if record only existed in memory
      }
      return NextResponse.json({ success: true });
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
      categoryId,
      variants,
      addons
    } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const hasDemoPrefix = String(itemId).startsWith("item-");
    const inDemoStore = Boolean(DEMO_RESTAURANT.menuItems?.some((m) => m.id === itemId));

    let dbItem: { id: string; restaurantId: string; isAvailable?: boolean; restaurant?: { id: string; slug: string } } | null = null;
    try {
      dbItem = await prisma.menuItem.findUnique({
        where: { id: itemId },
        select: { id: true, restaurantId: true, isAvailable: true, restaurant: { select: { id: true, slug: true } } },
      });
    } catch (dbErr) {
      // Fallback gracefully if database is unreachable
    }

    const isDemoDbItem = Boolean(
      dbItem && (dbItem.restaurantId === "rest-001" || dbItem.restaurant?.slug === "grand-spice")
    );

    const isDemoItem = hasDemoPrefix || inDemoStore || isDemoDbItem;

    if (!session && !isSuperAdmin && !isDemoItem) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    // Check staff permissions
    if (session?.role === "staff" && !session.permissions?.canManageMenu) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to manage menu or stock." }, { status: 403 });
    }

    if (isDemoItem) {
      const demoItem = DEMO_RESTAURANT.menuItems.find((m) => m.id === itemId);
      if (demoItem) {
        if (name !== undefined) demoItem.name = String(name).trim();
        if (price !== undefined) demoItem.price = Number(price);
        if (isVeg !== undefined) demoItem.isVeg = Boolean(isVeg);
        if (description !== undefined) demoItem.description = String(description);
        if (imageUrl !== undefined) demoItem.imageUrl = String(imageUrl);
        if (categoryId !== undefined) demoItem.categoryId = String(categoryId);
        if (lowStockThreshold !== undefined) demoItem.lowStockThreshold = Number(lowStockThreshold);
        if (stockCount !== undefined) {
          demoItem.stockCount = Number(stockCount);
          if (demoItem.stockCount === 0) demoItem.isAvailable = false;
          else if (demoItem.stockCount > 0 && isAvailable === undefined) demoItem.isAvailable = true;
        }
        if (isAvailable !== undefined) demoItem.isAvailable = Boolean(isAvailable);
        if (variants !== undefined) demoItem.variants = variants;
        if (addons !== undefined) demoItem.addons = addons;

        // Also sync to live database if this demo item exists in PostgreSQL
        if (dbItem) {
          try {
            const syncData: Record<string, unknown> = {};
            if (name !== undefined) syncData.name = demoItem.name;
            if (price !== undefined) syncData.price = demoItem.price;
            if (isVeg !== undefined) syncData.isVeg = demoItem.isVeg;
            if (description !== undefined) syncData.description = demoItem.description;
            if (imageUrl !== undefined) syncData.imageUrl = demoItem.imageUrl;
            if (categoryId !== undefined) syncData.categoryId = demoItem.categoryId;
            if (lowStockThreshold !== undefined) syncData.lowStockThreshold = demoItem.lowStockThreshold;
            if (stockCount !== undefined) syncData.stockCount = demoItem.stockCount;
            if (isAvailable !== undefined || stockCount !== undefined) syncData.isAvailable = demoItem.isAvailable;
            if (variants !== undefined) syncData.variants = variants;
            if (addons !== undefined) syncData.addons = addons;

            await prisma.menuItem.update({
              where: { id: itemId },
              data: syncData,
            });
          } catch (syncErr) {
            // Safe to ignore DB sync error for demo store fallback
          }
        }

        return NextResponse.json(demoItem);
      }
    }

    const item = dbItem || await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { restaurant: { select: { id: true, slug: true } } },
    });

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    if (!isSuperAdmin && !isDemoItem && session?.id !== item.restaurant?.id && session?.slug !== item.restaurant?.slug && session?.role !== "admin") {
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
      if (parsedStock > 0 && isAvailable === undefined && !item.isAvailable) {
        updateData.isAvailable = true;
      } else if (parsedStock === 0) {
        updateData.isAvailable = false;
      }
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = Boolean(isAvailable);
    }
    if (variants !== undefined) updateData.variants = variants;
    if (addons !== undefined) updateData.addons = addons;

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
