export type DishCategory = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
};

export type PortionVariant = {
  id: string;
  name: string;
  price: number;
};

export type DishAddon = {
  id: string;
  name: string;
  price: number;
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
  stockCount?: number | null;
  lowStockThreshold?: number | null;
  variants?: PortionVariant[] | null;
  addons?: DishAddon[] | null;
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
  variantName?: string | null;
  selectedAddons?: Array<{ name: string; price: number }> | null;
  orderedByName?: string | null;
};

export type TableDiner = {
  id: string;
  dinerId: string;
  name: string;
  joinedAt: string;
};

export type TableCartItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  notes?: string | null;
  variantName?: string | null;
  selectedAddons?: Array<{ name: string; price: number }> | null;
  dinerId: string;
  dinerName: string;
};

export type TableCart = {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  diners: TableDiner[];
  items: TableCartItem[];
  updatedAt: string;
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
  staffPin?: string | null;
  categories: DishCategory[];
  menuItems: MenuItem[];
  tables: Table[];
  staff?: Staff[];
  platformSetting?: PlatformSetting | null;
};

export type StaffRole = "chef" | "waiter" | "cashier" | "manager";

export type StaffPermissions = {
  canManageOrders: boolean;
  canManageMenu: boolean;
  canManageBilling: boolean;
  canManageRequests: boolean;
};

export type Staff = {
  id: string;
  restaurantId: string;
  name: string;
  role: StaffRole | string;
  pin: string;
  phone?: string | null;
  isActive: boolean;
  canManageOrders: boolean;
  canManageMenu: boolean;
  canManageBilling: boolean;
  canManageRequests: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  name: string;
  slug: string;
  ownerEmail?: string | null;
  ownerName?: string | null;
  role: "owner" | "staff" | "admin";
  staffPin?: string | null;
  staffId?: string;
  staffName?: string;
  staffRole?: string;
  permissions?: StaffPermissions;
};

export type SuperAdminMetrics = {
  totalRestaurants: number;
  activeRestaurants: number;
  totalTables: number;
  totalOrders: number;
  totalPlatformGmv: number;
  estimatedMrr: number;
  todayOrdersCount?: number;
  todayGmv?: number;
  averageOrderValue?: number;
  planBreakdown: {
    trial: number;
    starter: number;
    pro: number;
    enterprise: number;
  };
};

export type AdminRecentOrder = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  city?: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  itemsCount: number;
  itemsSummary: string;
  createdAt: string;
};

export type SystemHealthInfo = {
  dbStatus: string;
  nodeVersion: string;
  heapUsedMb: number;
  heapTotalMb: number;
  uptimeSeconds: number;
  totalMenuItems: number;
  totalCategories: number;
  totalTables: number;
  totalOrders: number;
  totalRestaurants: number;
  serverTime: string;
};

export type InquiryStatus = "new" | "contacted" | "demo_scheduled" | "converted" | "closed";

export type Inquiry = {
  id: string;
  restaurantName: string;
  ownerName?: string | null;
  phone: string;
  city?: string | null;
  tablesCount?: string | null;
  notes?: string | null;
  status: InquiryStatus;
  createdAt: string;
  updatedAt?: string;
};

