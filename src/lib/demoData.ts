import { Restaurant, Order, ServiceRequest, Staff } from "@/types";

export const DEMO_RESTAURANT: Restaurant = {
  id: "rest-001",
  name: "The Grand Spice Kitchen",
  slug: "grand-spice",
  tagline: "Authentic Flavors, Modern Dining",
  phone: "+91 98765 43210",
  address: "Plot 42, Cyber Hub, MG Road, Gurugram",
  city: "Delhi NCR",
  ownerName: "Rajesh Sharma",
  ownerEmail: "owner@grandspice.com",
  plan: "pro",
  isActive: true,
  currency: "INR",
  currencySymbol: "₹",
  taxRatePercent: 5.0,
  upiId: "grandspice@icici",
  logoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80",
  categories: [
    { id: "cat-1", name: "Starters & Tandoor", icon: "🍢", sortOrder: 1 },
    { id: "cat-2", name: "Main Course Curries", icon: "🍛", sortOrder: 2 },
    { id: "cat-3", name: "Breads & Biryani", icon: "🫓", sortOrder: 3 },
    { id: "cat-4", name: "Mocktails & Shakes", icon: "🍹", sortOrder: 4 },
    { id: "cat-5", name: "Desserts & Sweets", icon: "🍨", sortOrder: 5 },
  ],
  tables: [
    { id: "tbl-1", tableNumber: "Table 1", seats: 2 },
    { id: "tbl-2", tableNumber: "Table 2", seats: 4 },
    { id: "tbl-3", tableNumber: "Table 3", seats: 4 },
    { id: "tbl-4", tableNumber: "Table 4", seats: 6 },
    { id: "tbl-5", tableNumber: "Table 5", seats: 4 },
    { id: "tbl-6", tableNumber: "Patio 1", seats: 4 },
    { id: "tbl-7", tableNumber: "Patio 2", seats: 8 },
    { id: "tbl-8", tableNumber: "Rooftop VIP", seats: 10 },
  ],
  menuItems: [
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
      stockCount: 18,
      lowStockThreshold: 5,
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
      stockCount: 25,
      lowStockThreshold: 5,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
      addons: [
        { id: "add-corn-1", name: "Cheesy Jalapeno Dip", price: 35 },
        { id: "add-corn-2", name: "Peri Peri Seasoning", price: 20 },
      ],
    },
    {
      id: "item-pizza-1",
      categoryId: "cat-1",
      name: "Farmhouse Cheese & Capsicum Pizza",
      description: "Fresh hand-stretched thin crust loaded with mozzarella, crunchy capsicum, sweet corn, and herbs.",
      price: 280,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: 1,
      prepTimeMinutes: 15,
      stockCount: 20,
      lowStockThreshold: 5,
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
      variants: [
        { id: "piz-v1", name: "Regular 7\"", price: 190 },
        { id: "piz-v2", name: "Medium 10\"", price: 320 },
        { id: "piz-v3", name: "Large 12\"", price: 480 },
      ],
      addons: [
        { id: "piz-a1", name: "Extra Cheese", price: 40 },
        { id: "piz-a2", name: "Extra Dip", price: 20 },
        { id: "piz-a3", name: "Cheese Burst Crust", price: 60 },
      ],
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
      stockCount: 14,
      lowStockThreshold: 5,
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
      stockCount: 8,
      lowStockThreshold: 5,
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
      stockCount: 30,
      lowStockThreshold: 5,
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
      stockCount: 22,
      lowStockThreshold: 5,
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
      variants: [
        { id: "var-pbm-half", name: "Half Portion", price: 190 },
        { id: "var-pbm-full", name: "Full Portion", price: 320 },
      ],
      addons: [
        { id: "add-pbm-butter", name: "Extra Amul Butter", price: 30 },
        { id: "add-pbm-paneer", name: "Extra Malai Paneer Cubes", price: 50 },
      ],
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
      stockCount: 16,
      lowStockThreshold: 5,
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=80",
      variants: [
        { id: "var-bc-half", name: "Half Portion", price: 260 },
        { id: "var-bc-full", name: "Full Portion", price: 410 },
      ],
      addons: [
        { id: "add-bc-butter", name: "Extra Amul Butter", price: 30 },
        { id: "add-bc-gravy", name: "Extra Makhani Gravy Cup", price: 50 },
      ],
    },
    {
      id: "item-8",
      categoryId: "cat-2",
      name: "Rara Gosht Punjabi",
      description: "Tender mutton pieces cooked in rich, slow-braised minced lamb gravy with whole spices.",
      price: 490,
      isVeg: false,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: 3,
      prepTimeMinutes: 20,
      stockCount: 10,
      lowStockThreshold: 5,
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
      stockCount: 60,
      lowStockThreshold: 10,
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
      stockCount: 20,
      lowStockThreshold: 5,
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
      variants: [
        { id: "var-vb-half", name: "Half Plate", price: 180 },
        { id: "var-vb-full", name: "Full Plate", price: 320 },
      ],
      addons: [
        { id: "add-vb-raita", name: "Extra Boondi Raita", price: 35 },
        { id: "add-vb-salan", name: "Mirchi Ka Salan", price: 40 },
        { id: "add-vb-papad", name: "Crispy Roasted Papad", price: 20 },
      ],
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
      stockCount: 15,
      lowStockThreshold: 5,
      imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80",
      variants: [
        { id: "var-mb-half", name: "Half Plate", price: 280 },
        { id: "var-mb-full", name: "Full Plate", price: 460 },
      ],
      addons: [
        { id: "add-mb-egg", name: "Extra Boiled Egg", price: 20 },
        { id: "add-mb-aloo", name: "Spiced Kolkata Aloo", price: 25 },
        { id: "add-mb-raita", name: "Mint Cucumber Raita", price: 30 },
      ],
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
      stockCount: 40,
      lowStockThreshold: 10,
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
      stockCount: 50,
      lowStockThreshold: 10,
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
      stockCount: 25,
      lowStockThreshold: 5,
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
      stockCount: 30,
      lowStockThreshold: 5,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
    },
  ],
};

const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();

export let demoOrdersStore: Order[] = [
  {
    id: "ord-101",
    restaurantId: "rest-001",
    tableId: "tbl-4",
    tableNumber: "Table 4",
    customerName: "Aakash Sharma",
    customerPhone: "9876543210",
    subtotal: 690,
    tax: 35,
    discount: 0,
    total: 725,
    status: "cooking",
    paymentMethod: "upi_online",
    paymentStatus: "paid",
    items: [
      { menuItemId: "item-1", name: "Paneer Tikka Angara", price: 280, quantity: 1, isVeg: true, notes: "Extra spicy please" },
      { menuItemId: "item-7", name: "Old Delhi Butter Chicken", price: 410, quantity: 1, isVeg: false },
    ],
    createdAt: minutesAgo(4),
    updatedAt: minutesAgo(4),
  },
  {
    id: "ord-102",
    restaurantId: "rest-001",
    tableId: "tbl-2",
    tableNumber: "Table 2",
    customerName: "Priya Patel",
    customerPhone: "9812345678",
    subtotal: 580,
    tax: 29,
    discount: 50,
    couponCode: "SAVE50",
    total: 559,
    status: "pending",
    paymentMethod: "counter_cash",
    paymentStatus: "unpaid",
    items: [
      { menuItemId: "item-5", name: "Dal Makhani Grand Special", price: 290, quantity: 1, isVeg: true },
      { menuItemId: "item-9", name: "Butter Garlic Naan", price: 75, quantity: 2, isVeg: true },
      { menuItemId: "item-14", name: "Sizzling Brownie with Ice Cream", price: 210, quantity: 1, isVeg: true },
    ],
    createdAt: minutesAgo(18),
    updatedAt: minutesAgo(18),
  },
  {
    id: "ord-103",
    restaurantId: "rest-001",
    tableId: "tbl-1",
    tableNumber: "Table 1",
    customerName: "Rohan Verma",
    customerPhone: "9823456789",
    subtotal: 300,
    tax: 15,
    discount: 0,
    total: 315,
    status: "ready",
    paymentMethod: "upi_online",
    paymentStatus: "paid",
    items: [
      { menuItemId: "item-12", name: "Virgin Mint Mojito", price: 150, quantity: 2, isVeg: true },
    ],
    createdAt: minutesAgo(14),
    updatedAt: minutesAgo(2),
  },
  {
    id: "ord-104",
    restaurantId: "rest-001",
    tableId: "tbl-6",
    tableNumber: "Patio 1",
    customerName: "Sameer Khan",
    customerPhone: "9899887766",
    subtotal: 550,
    tax: 28,
    discount: 0,
    total: 578,
    status: "served",
    paymentMethod: "counter_cash",
    paymentStatus: "paid",
    rating: 5,
    reviewFeedback: "The Kolkata Mutton Dum Biryani was phenomenal! Super aromatic and succulent meat.",
    items: [
      { menuItemId: "item-11", name: "Kolkata Mutton Dum Biryani", price: 460, quantity: 1, isVeg: false },
      { menuItemId: "item-13", name: "Masala Chaas (Spiced Buttermilk)", price: 90, quantity: 1, isVeg: true },
    ],
    createdAt: minutesAgo(25),
    updatedAt: minutesAgo(10),
  },
  {
    id: "ord-105",
    restaurantId: "rest-001",
    tableId: "tbl-3",
    tableNumber: "Table 3",
    customerName: "Ananya Deshmukh",
    customerPhone: "9833445566",
    subtotal: 650,
    tax: 32,
    discount: 0,
    total: 682,
    status: "completed",
    paymentMethod: "upi_online",
    paymentStatus: "paid",
    rating: 5,
    reviewFeedback: "Amazing hospitality and the Dal Makhani Grand Special was rich and creamy. Fast QR ordering!",
    items: [
      { menuItemId: "item-5", name: "Dal Makhani Grand Special", price: 290, quantity: 1, isVeg: true },
      { menuItemId: "item-9", name: "Butter Garlic Naan", price: 75, quantity: 2, isVeg: true },
      { menuItemId: "item-14", name: "Sizzling Brownie with Ice Cream", price: 210, quantity: 1, isVeg: true },
    ],
    createdAt: minutesAgo(45),
    updatedAt: minutesAgo(20),
  },
  {
    id: "ord-106",
    restaurantId: "rest-001",
    tableId: "tbl-5",
    tableNumber: "Table 5",
    customerName: "Vikram Malhotra",
    customerPhone: "9877001122",
    subtotal: 420,
    tax: 21,
    discount: 0,
    total: 441,
    status: "completed",
    paymentMethod: "counter_cash",
    paymentStatus: "paid",
    rating: 4,
    reviewFeedback: "Crispy paneer tikka and chilled virgin mojito. Loved the vibe!",
    items: [
      { menuItemId: "item-1", name: "Paneer Tikka Angara", price: 280, quantity: 1, isVeg: true },
      { menuItemId: "item-12", name: "Virgin Mint Mojito", price: 150, quantity: 1, isVeg: true },
    ],
    createdAt: minutesAgo(75),
    updatedAt: minutesAgo(40),
  },
];

export let demoServiceRequestsStore: ServiceRequest[] = [
  {
    id: "req-1",
    restaurantId: "rest-001",
    tableId: "tbl-4",
    tableNumber: "Table 4",
    type: "water",
    status: "pending",
    createdAt: minutesAgo(3),
  },
  {
    id: "req-2",
    restaurantId: "rest-001",
    tableId: "tbl-3",
    tableNumber: "Table 3",
    type: "waiter",
    status: "pending",
    createdAt: minutesAgo(1),
  },
  {
    id: "req-3",
    restaurantId: "rest-001",
    tableId: "tbl-2",
    tableNumber: "Table 2",
    type: "bill",
    status: "attended",
    createdAt: minutesAgo(10),
  },
];

export const DEMO_STAFF: Staff[] = [
  {
    id: "st-1",
    restaurantId: "rest-001",
    name: "Vikram Chef",
    role: "chef",
    pin: "1234",
    phone: "9876543201",
    isActive: true,
    canManageOrders: true,
    canManageMenu: true,
    canManageBilling: false,
    canManageRequests: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "st-2",
    restaurantId: "rest-001",
    name: "Amit Waiter",
    role: "waiter",
    pin: "2345",
    phone: "9876543202",
    isActive: true,
    canManageOrders: true,
    canManageMenu: false,
    canManageBilling: false,
    canManageRequests: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "st-3",
    restaurantId: "rest-001",
    name: "Pooja Cashier",
    role: "cashier",
    pin: "3456",
    phone: "9876543203",
    isActive: true,
    canManageOrders: true,
    canManageMenu: false,
    canManageBilling: true,
    canManageRequests: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getDemoOrders(): Order[] {
  return [...demoOrdersStore];
}

export function resetDemoOrders(): Order[] {
  const currentNow = new Date();
  const getMinutesAgo = (mins: number) => new Date(currentNow.getTime() - mins * 60 * 1000).toISOString();
  demoOrdersStore = [
    {
      id: "ord-101",
      restaurantId: "rest-001",
      tableId: "tbl-4",
      tableNumber: "Table 4",
      customerName: "Aakash Sharma",
      customerPhone: "9876543210",
      subtotal: 690,
      tax: 35,
      discount: 0,
      total: 725,
      status: "cooking",
      paymentMethod: "upi_online",
      paymentStatus: "paid",
      items: [
        { menuItemId: "item-1", name: "Paneer Tikka Angara", price: 280, quantity: 1, isVeg: true, notes: "Extra spicy please" },
        { menuItemId: "item-7", name: "Old Delhi Butter Chicken", price: 410, quantity: 1, isVeg: false },
      ],
      createdAt: getMinutesAgo(4),
      updatedAt: getMinutesAgo(4),
    },
    {
      id: "ord-102",
      restaurantId: "rest-001",
      tableId: "tbl-2",
      tableNumber: "Table 2",
      customerName: "Priya Patel",
      customerPhone: "9812345678",
      subtotal: 580,
      tax: 29,
      discount: 50,
      couponCode: "SAVE50",
      total: 559,
      status: "pending",
      paymentMethod: "counter_cash",
      paymentStatus: "unpaid",
      items: [
        { menuItemId: "item-5", name: "Dal Makhani Grand Special", price: 290, quantity: 1, isVeg: true },
        { menuItemId: "item-9", name: "Butter Garlic Naan", price: 75, quantity: 2, isVeg: true },
        { menuItemId: "item-14", name: "Sizzling Brownie with Ice Cream", price: 210, quantity: 1, isVeg: true },
      ],
      createdAt: getMinutesAgo(18),
      updatedAt: getMinutesAgo(18),
    },
    {
      id: "ord-103",
      restaurantId: "rest-001",
      tableId: "tbl-1",
      tableNumber: "Table 1",
      customerName: "Rohan Verma",
      customerPhone: "9823456789",
      subtotal: 300,
      tax: 15,
      discount: 0,
      total: 315,
      status: "ready",
      paymentMethod: "upi_online",
      paymentStatus: "paid",
      items: [
        { menuItemId: "item-12", name: "Virgin Mint Mojito", price: 150, quantity: 2, isVeg: true },
      ],
      createdAt: getMinutesAgo(14),
      updatedAt: getMinutesAgo(2),
    },
    {
      id: "ord-104",
      restaurantId: "rest-001",
      tableId: "tbl-6",
      tableNumber: "Patio 1",
      customerName: "Sameer Khan",
      customerPhone: "9899887766",
      subtotal: 550,
      tax: 28,
      discount: 0,
      total: 578,
      status: "served",
      paymentMethod: "counter_cash",
      paymentStatus: "paid",
      rating: 5,
      reviewFeedback: "The Kolkata Mutton Dum Biryani was phenomenal! Super aromatic and succulent meat.",
      items: [
        { menuItemId: "item-11", name: "Kolkata Mutton Dum Biryani", price: 460, quantity: 1, isVeg: false },
        { menuItemId: "item-13", name: "Masala Chaas (Spiced Buttermilk)", price: 90, quantity: 1, isVeg: true },
      ],
      createdAt: getMinutesAgo(25),
      updatedAt: getMinutesAgo(10),
    },
    {
      id: "ord-105",
      restaurantId: "rest-001",
      tableId: "tbl-3",
      tableNumber: "Table 3",
      customerName: "Ananya Deshmukh",
      customerPhone: "9833445566",
      subtotal: 650,
      tax: 32,
      discount: 0,
      total: 682,
      status: "completed",
      paymentMethod: "upi_online",
      paymentStatus: "paid",
      rating: 5,
      reviewFeedback: "Amazing hospitality and the Dal Makhani Grand Special was rich and creamy. Fast QR ordering!",
      items: [
        { menuItemId: "item-5", name: "Dal Makhani Grand Special", price: 290, quantity: 1, isVeg: true },
        { menuItemId: "item-9", name: "Butter Garlic Naan", price: 75, quantity: 2, isVeg: true },
        { menuItemId: "item-14", name: "Sizzling Brownie with Ice Cream", price: 210, quantity: 1, isVeg: true },
      ],
      createdAt: getMinutesAgo(45),
      updatedAt: getMinutesAgo(20),
    },
    {
      id: "ord-106",
      restaurantId: "rest-001",
      tableId: "tbl-5",
      tableNumber: "Table 5",
      customerName: "Vikram Malhotra",
      customerPhone: "9877001122",
      subtotal: 420,
      tax: 21,
      discount: 0,
      total: 441,
      status: "completed",
      paymentMethod: "counter_cash",
      paymentStatus: "paid",
      rating: 4,
      reviewFeedback: "Crispy paneer tikka and chilled virgin mojito. Loved the vibe!",
      items: [
        { menuItemId: "item-1", name: "Paneer Tikka Angara", price: 280, quantity: 1, isVeg: true },
        { menuItemId: "item-12", name: "Virgin Mint Mojito", price: 150, quantity: 1, isVeg: true },
      ],
      createdAt: getMinutesAgo(75),
      updatedAt: getMinutesAgo(40),
    },
  ];
  return [...demoOrdersStore];
}

export function getDemoTableOrders(tableId: string, activeOnly: boolean = false): Order[] {
  const cleanNum = tableId.replace(/\D/g, "");
  return demoOrdersStore.filter((o) => {
    const matches = (
      o.tableId === tableId ||
      o.tableNumber.toLowerCase() === tableId.toLowerCase() ||
      (cleanNum && o.tableNumber.toLowerCase().includes(cleanNum))
    );
    if (!matches) return false;
    if (activeOnly) {
      return o.status !== "completed" && o.status !== "cancelled";
    }
    return true;
  });
}

export function vacateDemoTable(tableId: string): void {
  const cleanNum = tableId.replace(/\D/g, "");
  demoOrdersStore = demoOrdersStore.map((o) => {
    const matches = (
      o.tableId === tableId ||
      o.tableNumber.toLowerCase() === tableId.toLowerCase() ||
      (cleanNum && o.tableNumber.toLowerCase().includes(cleanNum))
    );
    if (matches && o.status !== "cancelled") {
      return { ...o, status: "completed", paymentStatus: "paid", updatedAt: new Date().toISOString() };
    }
    return o;
  });

  demoServiceRequestsStore = demoServiceRequestsStore.map((r) => {
    const matches = (
      r.tableId === tableId ||
      (cleanNum && r.tableNumber.toLowerCase().includes(cleanNum))
    );
    if (matches) {
      return { ...r, status: "attended" };
    }
    return r;
  });
}

export function addDemoOrder(order: Order): Order {
  demoOrdersStore = [order, ...demoOrdersStore];
  return order;
}

export function updateDemoOrderStatus(
  orderId: string,
  status?: Order["status"],
  paymentStatus?: Order["paymentStatus"],
  tableId?: string,
  tableNumber?: string
): Order | null {
  const idx = demoOrdersStore.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  const updated: Order = {
    ...demoOrdersStore[idx],
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(tableId ? { tableId } : {}),
    ...(tableNumber ? { tableNumber } : {}),
    updatedAt: new Date().toISOString(),
  };
  demoOrdersStore[idx] = updated;
  return updated;
}

export function addDemoServiceRequest(req: ServiceRequest): ServiceRequest {
  demoServiceRequestsStore = [req, ...demoServiceRequestsStore];
  return req;
}

export function attendDemoServiceRequest(requestId: string): boolean {
  const idx = demoServiceRequestsStore.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;
  demoServiceRequestsStore[idx] = {
    ...demoServiceRequestsStore[idx],
    status: "attended",
  };
  return true;
}
