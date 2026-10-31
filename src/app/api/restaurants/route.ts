import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRestaurantBySlug } from "@/lib/store";
import { getSessionUser, isSuperAdminRequest, hashPassword, checkRateLimit, getClientIp } from "@/lib/auth";
import { DEMO_RESTAURANT } from "@/lib/demoData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const restaurant = await getRestaurantBySlug(slug);
      if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }

      let platformSetting = null;
      try {
        platformSetting = await prisma.platformSetting.findUnique({
          where: { id: "global" },
        });
      } catch {
        // ignore
      }

      return NextResponse.json({
        ...restaurant,
        platformSetting: platformSetting || {
          id: "global",
          broadcastMessage: null,
          isMaintenance: false,
          supportPhone: "+91 98765 43210",
        },
      });
    }

    let restaurants: any[] = [];
    try {
      restaurants = await prisma.restaurant.findMany({
        include: {
          categories: true,
          tables: true,
        },
      });
    } catch (err) {
      console.warn("prisma.restaurant.findMany error, using fallback demo restaurant:", err);
    }

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json([DEMO_RESTAURANT]);
    }

    // Strip sensitive passwords & staff pins from public restaurant list
    const safeRestaurants = restaurants.map((r) => {
      const { password, staffPin, ...safe } = r as Record<string, unknown>;
      return safe;
    });

    return NextResponse.json(safeRestaurants);
  } catch (err) {
    console.error("GET /api/restaurants error:", err);
    return NextResponse.json([DEMO_RESTAURANT]);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const querySlug = searchParams.get("slug");
    const body = await request.json();
    const slug = querySlug || body.slug;

    if (!slug) {
      return NextResponse.json({ error: "Missing restaurant slug" }, { status: 400 });
    }

    // Authentication & Role Check
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Owner login required." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot modify restaurant settings." }, { status: 403 });
    }
    if (!isSuperAdmin && session?.slug !== slug && session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: You cannot modify another restaurant." }, { status: 403 });
    }

    const { name, tagline, phone, address, currencySymbol, taxRatePercent, upiId } = body;

    const updated = await prisma.restaurant.update({
      where: { slug },
      data: {
        ...(name && { name }),
        ...(tagline !== undefined && { tagline }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(currencySymbol && { currencySymbol }),
        ...(taxRatePercent !== undefined && { taxRatePercent: Number(taxRatePercent) }),
        ...(upiId !== undefined && { upiId }),
      },
    });

    const { password, staffPin, ...safeUpdated } = updated as Record<string, unknown>;
    return NextResponse.json(safeUpdated);
  } catch (err) {
    console.error("Failed to update restaurant settings:", err);
    return NextResponse.json({ error: "Failed to update restaurant settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    // Anti-spam rate limiting: Max 5 new restaurant registrations per 15 minutes per IP
    const rateLimit = checkRateLimit(`register:${clientIp}`, 5, 900);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { 
      name, 
      slug, 
      tagline, 
      phone, 
      address, 
      city,
      plan,
      upiId, 
      tablesCount, 
      initialTables,
      ownerName, 
      ownerEmail, 
      password, 
      staffPin,
      planExpiresAt
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });
    }

    const cleanSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

    // Check if slug exists
    const existing = await prisma.restaurant.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return NextResponse.json({ error: `URL slug "${cleanSlug}" is already registered. Please choose a different slug.` }, { status: 409 });
    }

    const count = Number(tablesCount || initialTables) || 6;
    const tableData = Array.from({ length: count }, (_, i) => ({
      tableNumber: `Table ${i + 1}`,
      seats: i === 0 ? 2 : i < 5 ? 4 : 6,
    }));

    // Default starter categories
    const categoriesData = [
      { name: "Starters & Snacks", icon: "🍢", sortOrder: 1 },
      { name: "Main Course", icon: "🍛", sortOrder: 2 },
      { name: "Breads & Rice", icon: "🫓", sortOrder: 3 },
      { name: "Beverages", icon: "🍹", sortOrder: 4 },
      { name: "Desserts", icon: "🍨", sortOrder: 5 },
    ];

    const expiryDate = planExpiresAt 
      ? new Date(planExpiresAt) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days initial validity

    const restaurant = await prisma.restaurant.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        city: city || "Delhi NCR",
        plan: plan || "starter",
        planExpiresAt: expiryDate,
        isActive: true,
        ownerName: ownerName || "Owner",
        ownerEmail: ownerEmail ? String(ownerEmail).trim().toLowerCase() : null,
        password: hashPassword(password || "admin123"),
        staffPin: staffPin || "1234",
        tagline: tagline || "Authentic Taste, Fast Service",
        phone: phone || "+91 99999 00000",
        address: address || `${city || "Delhi NCR"}, India`,
        currency: "INR",
        currencySymbol: "₹",
        taxRatePercent: 5,
        upiId: upiId || `${cleanSlug}@upi`,
        logoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80",
        categories: {
          create: categoriesData,
        },
        tables: {
          create: tableData,
        },
      },
      include: {
        categories: true,
        tables: true,
      },
    });

    // Populate a few initial starter dishes
    const firstCat = restaurant.categories[0];
    if (firstCat) {
      await prisma.menuItem.createMany({
        data: [
          {
            restaurantId: restaurant.id,
            categoryId: firstCat.id,
            name: "Crispy Paneer Platter",
            description: "Fresh cottage cheese tossed with capsicum and mild spices.",
            price: 240,
            isVeg: true,
            isAvailable: true,
            imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80",
          },
          {
            restaurantId: restaurant.id,
            categoryId: firstCat.id,
            name: "Masala Lemon Cooler",
            description: "Chilled refreshing mint soda with lemon.",
            price: 90,
            isVeg: true,
            isAvailable: true,
            imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80",
          },
        ],
      });
    }

    const { password: _p, staffPin: _sp, ...safeRestaurant } = restaurant as Record<string, unknown>;
    return NextResponse.json(safeRestaurant, { status: 201 });
  } catch (err) {
    console.error("Register restaurant error:", err);
    return NextResponse.json({ error: "Failed to register restaurant" }, { status: 500 });
  }
}
