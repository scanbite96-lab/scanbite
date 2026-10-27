import { PrismaClient } from "@prisma/client";
import { initialRestaurant } from "../src/lib/data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Check if restaurant already exists
  const existing = await prisma.restaurant.findUnique({
    where: { slug: initialRestaurant.slug },
  });

  if (existing) {
    console.log("Restaurant already seeded. Cleaning up old demo data...");
    await prisma.restaurant.delete({ where: { slug: initialRestaurant.slug } });
  }

  // Create Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      id: initialRestaurant.id,
      name: initialRestaurant.name,
      slug: initialRestaurant.slug,
      tagline: initialRestaurant.tagline,
      phone: initialRestaurant.phone,
      address: initialRestaurant.address,
      currency: initialRestaurant.currency,
      currencySymbol: initialRestaurant.currencySymbol,
      taxRatePercent: initialRestaurant.taxRatePercent,
      upiId: initialRestaurant.upiId,
      logoUrl: initialRestaurant.logoUrl,
      // Create Categories
      categories: {
        create: initialRestaurant.categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          sortOrder: c.sortOrder,
        })),
      },
      // Create Tables
      tables: {
        create: initialRestaurant.tables.map((t) => ({
          id: t.id,
          tableNumber: t.tableNumber,
          seats: t.seats,
        })),
      },
    },
  });

  // Create Menu Items
  for (const item of initialRestaurant.menuItems) {
    await prisma.menuItem.create({
      data: {
        id: item.id,
        restaurantId: restaurant.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        isVeg: item.isVeg,
        isAvailable: item.isAvailable,
        isBestseller: item.isBestseller ?? false,
        spiceLevel: item.spiceLevel ?? 0,
        prepTimeMinutes: item.prepTimeMinutes ?? 10,
        imageUrl: item.imageUrl,
      },
    });
  }

  // Create Initial Demo Order for Table 2
  await prisma.order.create({
    data: {
      id: "ord-101",
      restaurantId: restaurant.id,
      tableId: "tbl-2",
      tableNumber: "Table 2",
      customerName: "Rahul Sharma",
      customerPhone: "9876543210",
      subtotal: 580,
      tax: 29,
      total: 609,
      status: "cooking",
      paymentMethod: "upi_online",
      paymentStatus: "unpaid",
      items: {
        create: [
          {
            menuItemId: "item-1",
            name: "Paneer Tikka Angara",
            price: 280,
            quantity: 1,
            isVeg: true,
            notes: "Extra mint chutney please",
          },
          {
            menuItemId: "item-12",
            name: "Virgin Mint Mojito",
            price: 150,
            quantity: 2,
            isVeg: true,
          },
        ],
      },
    },
  });

  // Create Demo Service Request
  await prisma.serviceRequest.create({
    data: {
      id: "req-1",
      restaurantId: restaurant.id,
      tableId: "tbl-3",
      tableNumber: "Table 3",
      type: "water",
      status: "pending",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
