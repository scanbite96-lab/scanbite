const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const initialRestaurant = {
  id: "rest-001",
  name: "The Grand Spice Kitchen",
  slug: "grand-spice",
  tagline: "Authentic Flavors, Modern Dining",
  phone: "+91 98765 43210",
  address: "Plot 42, Cyber Hub, MG Road, Gurugram",
  currency: "INR",
  currencySymbol: "₹",
  taxRatePercent: 5,
  upiId: "grandspice@icici",
  logoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80",
};

const categories = [
  { id: "cat-1", name: "Starters & Tandoor", icon: "🍢", sortOrder: 1 },
  { id: "cat-2", name: "Main Course Curries", icon: "🍛", sortOrder: 2 },
  { id: "cat-3", name: "Breads & Biryani", icon: "🫓", sortOrder: 3 },
  { id: "cat-4", name: "Mocktails & Shakes", icon: "🍹", sortOrder: 4 },
  { id: "cat-5", name: "Desserts & Sweets", icon: "🍨", sortOrder: 5 },
];

const tables = [
  { id: "tbl-1", tableNumber: "Table 1", seats: 2 },
  { id: "tbl-2", tableNumber: "Table 2", seats: 4 },
  { id: "tbl-3", tableNumber: "Table 3", seats: 4 },
  { id: "tbl-4", tableNumber: "Table 4", seats: 6 },
  { id: "tbl-5", tableNumber: "Table 5", seats: 4 },
  { id: "tbl-6", tableNumber: "Patio 1", seats: 4 },
  { id: "tbl-7", tableNumber: "Patio 2", seats: 8 },
  { id: "tbl-8", tableNumber: "Rooftop VIP", seats: 10 },
];

const menuItems = [
  {
    id: "item-1",
    categoryId: "cat-1",
    name: "Paneer Tikka Angara",
    description: "Charcoal grilled cottage cheese cubes marinated in Kashmiri chili and aromatic spices.",
    price: 280,
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    spiceLevel: 2,
    prepTimeMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-2",
    categoryId: "cat-1",
    name: "Crispy Corn & Waterchestnut",
    description: "Golden fried sweet corn tossed with spring onion, pepper, and schezwan chili sauce.",
    price: 240,
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    spiceLevel: 1,
    prepTimeMinutes: 12,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-3",
    categoryId: "cat-1",
    name: "Murgh Malai Tikka",
    description: "Boneless chicken thigh chunks steeped in rich cream, cashew paste, and green cardamom.",
    price: 360,
    isVeg: false,
    isAvailable: true,
    isBestseller: true,
    spiceLevel: 1,
    prepTimeMinutes: 18,
    imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-4",
    categoryId: "cat-1",
    name: "Amritsari Fish Fry",
    description: "Crispy carom-seed flavored batter fried river sole fish fillets served with mint chutney.",
    price: 420,
    isVeg: false,
    isAvailable: true,
    isBestseller: false,
    spiceLevel: 2,
    prepTimeMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1535400255456-984241443b29?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-5",
    categoryId: "cat-2",
    name: "Dal Makhani Grand Special",
    description: "Slow-cooked black lentils simmered overnight with tomatoes, pure butter, and fresh cream.",
    price: 290,
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    spiceLevel: 1,
    prepTimeMinutes: 10,
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-6",
    categoryId: "cat-2",
    name: "Paneer Butter Masala",
    description: "Silky tomato gravy enriched with butter, honey, kasuri methi, and soft malai paneer.",
    price: 320,
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    spiceLevel: 1,
    prepTimeMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-7",
    categoryId: "cat-2",
    name: "Old Delhi Butter Chicken",
    description: "Tandoori chicken pulled and simmered in a velvety buttery tomato gravy with fenugreek.",
    price: 410,
    isVeg: false,
    isAvailable: true,
    isBestseller: true,
    spiceLevel: 1,
    prepTimeMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-8",
    categoryId: "cat-2",
    name: "Rara Gosht Punjabi",
    description: "Tender mutton pieces cooked in rich, slow-braised minced lamb gravy with whole spices.",
    price: 490,
    isVeg: false,
    isAvailable: false,
    isBestseller: false,
    spiceLevel: 3,
    prepTimeMinutes: 20,
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-9",
    categoryId: "cat-3",
    name: "Butter Garlic Naan",
    description: "Refined flour bread cooked in tandoor, brushed with rich garlic butter and fresh coriander.",
    price: 75,
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    spiceLevel: 0,
    prepTimeMinutes: 5,
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-10",
    categoryId: "cat-3",
    name: "Dum Hyderabadi Veg Biryani",
    description: "Fragrant aged basmati rice cooked with seasonal vegetables, saffron, and aromatic spices.",
    price: 290,
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    spiceLevel: 2,
    prepTimeMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-11",
    categoryId: "cat-3",
    name: "Kolkata Mutton Dum Biryani",
    description: "Aromatic dum biryani with melt-in-mouth mutton, golden fried potato, and boiled egg.",
    price: 460,
    isVeg: false,
    isAvailable: true,
    isBestseller: true,
    spiceLevel: 2,
    prepTimeMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-12",
    categoryId: "cat-4",
    name: "Virgin Mint Mojito",
    description: "Crisp soda cooler muddled with fresh mint leaves, zesty lemon wedges, and brown sugar.",
    price: 150,
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    spiceLevel: 0,
    prepTimeMinutes: 5,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-13",
    categoryId: "cat-4",
    name: "Masala Chaas (Spiced Buttermilk)",
    description: "Chilled churned yogurt drink tempered with roasted cumin, rock salt, ginger, and mint.",
    price: 90,
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    spiceLevel: 1,
    prepTimeMinutes: 5,
    imageUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-14",
    categoryId: "cat-5",
    name: "Sizzling Brownie with Ice Cream",
    description: "Warm walnut fudge brownie served on a hot sizzler plate with vanilla bean ice cream and hot chocolate fudge.",
    price: 210,
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    spiceLevel: 0,
    prepTimeMinutes: 8,
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "item-15",
    categoryId: "cat-5",
    name: "Kesari Rasmalai (2 Pcs)",
    description: "Spongy cottage cheese patties soaked in thickened saffron-cardamom milk, garnished with pistachios.",
    price: 160,
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    spiceLevel: 0,
    prepTimeMinutes: 5,
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
  },
];

async function main() {
  console.log("Seeding SQLite database...");

  // Delete old if exists
  const existing = await prisma.restaurant.findUnique({
    where: { slug: initialRestaurant.slug },
  });

  if (existing) {
    console.log("Found existing restaurant, deleting for fresh seed...");
    await prisma.restaurant.delete({ where: { slug: initialRestaurant.slug } });
  }

  // Create restaurant
  const rest = await prisma.restaurant.create({
    data: {
      ...initialRestaurant,
      categories: {
        create: categories,
      },
      tables: {
        create: tables,
      },
    },
  });

  // Create menu items
  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        restaurantId: rest.id,
      },
    });
  }

  // Create demo order
  await prisma.order.create({
    data: {
      id: "ord-101",
      restaurantId: rest.id,
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

  // Create demo service request
  await prisma.serviceRequest.create({
    data: {
      id: "req-1",
      restaurantId: rest.id,
      tableId: "tbl-3",
      tableNumber: "Table 3",
      type: "water",
      status: "pending",
    },
  });

  console.log("Database seeded successfully with all tables, dishes and categories!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
