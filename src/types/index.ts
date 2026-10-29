export type DishCategory = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  isBestseller?: boolean;
  spiceLevel?: number;
  prepTimeMinutes?: number;
  imageUrl?: string | null;
};

export type Table = {
  id: string;
  tableNumber: string;
  seats: number;
  qrCodeUrl?: string | null;
};

export type OrderItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  notes?: string | null;
};

export type OrderStatus = "pending" | "cooking" | "ready" | "served" | "completed" | "cancelled";

export type Order = {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount?: number | null;
  couponCode?: string | null;
  total: number;
  rating?: number | null;
  reviewFeedback?: string | null;
  status: OrderStatus;
  paymentMethod?: "counter_cash" | "upi_online" | "card" | string | null;
  paymentStatus: "unpaid" | "paid" | string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceRequestType = "water" | "waiter" | "bill" | "cleaning";

export type ServiceRequest = {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  type: ServiceRequestType;
  status: "pending" | "attended";
  createdAt: string;
};

export type PlatformSetting = {
  id: string;
  broadcastMessage?: string | null;
  isMaintenance: boolean;
  supportPhone?: string | null;
  updatedAt?: string;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  plan?: "trial" | "starter" | "pro" | "enterprise" | string;
  planExpiresAt?: string | null;
  isActive?: boolean;
  currency: string;
  currencySymbol: string;
  taxRatePercent: number;
  upiId?: string | null;
  categories: DishCategory[];
  menuItems: MenuItem[];
  tables: Table[];
  platformSetting?: PlatformSetting | null;
};

export type AuthUser = {
  id: string;
  name: string;
  slug: string;
  ownerEmail?: string | null;
  ownerName?: string | null;
  role: "owner" | "staff" | "admin";
};

export type SuperAdminMetrics = {
  totalRestaurants: number;
  activeRestaurants: number;
  totalTables: number;
  totalOrders: number;
  totalPlatformGmv: number;
  estimatedMrr: number;
  planBreakdown: {
    trial: number;
    starter: number;
    pro: number;
    enterprise: number;
  };
};
