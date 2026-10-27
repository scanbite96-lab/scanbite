import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        categories: true,
        tables: true,
      },
    });
    return NextResponse.json(restaurants);
  } catch {
    return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, tagline, phone, address, upiId, tablesCount } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });
    }

    const count = Number(tablesCount) || 6;
    const tableData = Array.from({ length: count }, (_, i) => ({
      tableNumber: `Table ${i + 1}`,
      seats: i === 0 ? 2 : i < 5 ? 4 : 6,
    }));

    // Check if slug exists
    const existing = await prisma.restaurant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(existing);
    }

    // Default starter categories
    const categoriesData = [
      { name: "Starters & Snacks", icon: "🍢", sortOrder: 1 },
      { name: "Main Course", icon: "🍛", sortOrder: 2 },
      { name: "Breads & Rice", icon: "🫓", sortOrder: 3 },
      { name: "Beverages", icon: "🍹", sortOrder: 4 },
      { name: "Desserts", icon: "🍨", sortOrder: 5 },
    ];

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        tagline: tagline || "Authentic Taste, Fast Service",
        phone: phone || "+91 99999 00000",
        address: address || "City Center",
        currency: "INR",
        currencySymbol: "₹",
        taxRatePercent: 5,
        upiId: upiId || "restaurant@upi",
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

    return NextResponse.json(restaurant, { status: 201 });
  } catch (err) {
    console.error("Register restaurant error:", err);
    return NextResponse.json({ error: "Failed to register restaurant" }, { status: 500 });
  }
}
