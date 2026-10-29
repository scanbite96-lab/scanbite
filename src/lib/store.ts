import { prisma } from "./prisma";
import { Restaurant, Order, ServiceRequest, MenuItem, OrderStatus } from "@/types";

export const getRestaurantBySlug = async (slug: string): Promise<Restaurant | null> => {
  try {
    const rest = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: { orderBy: { sortOrder: "asc" } },
        menuItems: true,
        tables: true,
      },
    });
    if (!rest) return null;
    return rest as unknown as Restaurant;
  } catch (err) {
    console.error("Prisma getRestaurantBySlug error:", err);
    return null;
  }
};

export const getOrdersForRestaurant = async (restaurantId: string): Promise<Order[]> => {
  try {
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => ({
      ...o,
      status: o.status as OrderStatus,
      rating: o.rating ?? undefined,
      reviewFeedback: o.reviewFeedback ?? undefined,
      discount: o.discount ?? 0,
      couponCode: o.couponCode ?? undefined,
      items: o.items.map((it) => ({
        menuItemId: it.menuItemId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        isVeg: it.isVeg,
        notes: it.notes,
      })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Prisma getOrders error:", err);
    return [];
  }
};

export const getTableOrders = async (restaurantId: string, tableId: string): Promise<Order[]> => {
  try {
    const cleanNum = tableId.replace(/\D/g, "");
    const matchingTable = await prisma.table.findFirst({
      where: {
        restaurantId,
        OR: [
          { id: tableId },
          { tableNumber: tableId },
          ...(cleanNum ? [{ tableNumber: `Table ${cleanNum}` }] : []),
        ],
      },
    });

    const targetTableId = matchingTable ? matchingTable.id : tableId;
    const targetTableNumber = matchingTable ? matchingTable.tableNumber : (cleanNum ? `Table ${cleanNum}` : tableId);

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        OR: [
          { tableId: targetTableId },
          { tableNumber: targetTableNumber },
          { tableId },
        ],
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => ({
      ...o,
      status: o.status as OrderStatus,
      rating: o.rating ?? undefined,
      reviewFeedback: o.reviewFeedback ?? undefined,
      discount: o.discount ?? 0,
      couponCode: o.couponCode ?? undefined,
      items: o.items.map((it) => ({
        menuItemId: it.menuItemId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        isVeg: it.isVeg,
        notes: it.notes,
      })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Prisma getTableOrders error:", err);
    return [];
  }
};

export const createOrder = async (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order | null> => {
  try {
    let validTableId = orderData.tableId;
    const tableExists = await prisma.table.findUnique({ where: { id: validTableId } });
    if (!tableExists) {
      const cleanNum = orderData.tableNumber ? orderData.tableNumber.replace(/\D/g, "") : "";
      const matchingTable = await prisma.table.findFirst({
        where: {
          restaurantId: orderData.restaurantId,
          OR: [
            { tableNumber: orderData.tableNumber },
            ...(cleanNum ? [{ tableNumber: `Table ${cleanNum}` }] : []),
            { id: orderData.tableId },
          ],
        },
      });

      if (matchingTable) {
        validTableId = matchingTable.id;
      } else {
        const createdTbl = await prisma.table.create({
          data: {
            restaurantId: orderData.restaurantId,
            tableNumber: orderData.tableNumber || (cleanNum ? `Table ${cleanNum}` : "Table 1"),
            seats: 4,
          },
        });
        validTableId = createdTbl.id;
      }
    }

    const order = await prisma.order.create({
      data: {
        restaurantId: orderData.restaurantId,
        tableId: validTableId,
        tableNumber: orderData.tableNumber,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        discount: orderData.discount || 0,
        couponCode: orderData.couponCode || null,
        total: orderData.total,
        status: orderData.status,
        paymentMethod: orderData.paymentMethod || "counter_cash",
        paymentStatus: orderData.paymentStatus || "unpaid",
        items: {
          create: orderData.items.map((it) => ({
            menuItemId: it.menuItemId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            isVeg: it.isVeg,
            notes: it.notes,
          })),
        },
      },
      include: { items: true },
    });

    return {
      ...order,
      status: order.status as OrderStatus,
      rating: order.rating ?? undefined,
      reviewFeedback: order.reviewFeedback ?? undefined,
      discount: order.discount ?? 0,
      couponCode: order.couponCode ?? undefined,
      items: order.items.map((it) => ({
        menuItemId: it.menuItemId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        isVeg: it.isVeg,
        notes: it.notes,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  } catch (err) {
    console.error("Prisma createOrder error:", err);
    return null;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status?: Order["status"],
  paymentStatus?: Order["paymentStatus"]
): Promise<Order | null> => {
  try {
    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });
    return {
      ...updated,
      status: updated.status as OrderStatus,
      rating: updated.rating ?? undefined,
      reviewFeedback: updated.reviewFeedback ?? undefined,
      discount: updated.discount ?? 0,
      couponCode: updated.couponCode ?? undefined,
      items: updated.items.map((it) => ({
        menuItemId: it.menuItemId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        isVeg: it.isVeg,
        notes: it.notes,
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (err) {
    console.error("Prisma updateOrderStatus error:", err);
    return null;
  }
};

export const updateOrderRating = async (orderId: string, rating: number, reviewFeedback?: string): Promise<boolean> => {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        rating,
        reviewFeedback,
      },
    });
    return true;
  } catch (err) {
    console.error("Prisma updateOrderRating error:", err);
    return false;
  }
};

export const createServiceRequest = async (
  restaurantId: string,
  tableId: string,
  tableNumber: string,
  type: ServiceRequest["type"]
): Promise<ServiceRequest | null> => {
  try {
    let validTableId = tableId;
    const tableExists = await prisma.table.findUnique({ where: { id: validTableId } });
    if (!tableExists) {
      const cleanNum = tableNumber ? tableNumber.replace(/\D/g, "") : "";
      const matchingTable = await prisma.table.findFirst({
        where: {
          restaurantId,
          OR: [
            { tableNumber },
            ...(cleanNum ? [{ tableNumber: `Table ${cleanNum}` }] : []),
          ],
        },
      });
      if (matchingTable) {
        validTableId = matchingTable.id;
      } else {
        const createdTbl = await prisma.table.create({
          data: {
            restaurantId,
            tableNumber: tableNumber || (cleanNum ? `Table ${cleanNum}` : "Table 1"),
            seats: 4,
          },
        });
        validTableId = createdTbl.id;
      }
    }

    const req = await prisma.serviceRequest.create({
      data: {
        restaurantId,
        tableId: validTableId,
        tableNumber,
        type,
        status: "pending",
      },
    });
    return {
      ...req,
      type: req.type as ServiceRequest["type"],
      status: req.status as ServiceRequest["status"],
      createdAt: req.createdAt.toISOString(),
    };
  } catch (err) {
    console.error("Prisma createServiceRequest error:", err);
    return null;
  }
};

export const getServiceRequests = async (restaurantId: string): Promise<ServiceRequest[]> => {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
    return requests.map((r) => ({
      ...r,
      type: r.type as ServiceRequest["type"],
      status: r.status as ServiceRequest["status"],
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("Prisma getServiceRequests error:", err);
    return [];
  }
};

export const attendServiceRequest = async (requestId: string): Promise<boolean> => {
  try {
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: "attended" },
    });
    return true;
  } catch (err) {
    console.error("Prisma attendServiceRequest error:", err);
    return false;
  }
};

export const toggleItemAvailability = async (slug: string, itemId: string): Promise<MenuItem | null> => {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
    });
    if (!item) return null;
    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !item.isAvailable },
    });
    return updated as unknown as MenuItem;
  } catch (err) {
    console.error("Prisma toggleItemAvailability error:", err);
    return null;
  }
};

export const getSuperAdminOverview = async () => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        tables: true,
        orders: {
          select: { total: true, status: true, createdAt: true },
        },
        _count: {
          select: { menuItems: true, tables: true, orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalPlatformGmv = 0;
    let totalOrders = 0;
    let totalTables = 0;
    let activeRestaurants = 0;
    const planBreakdown = {
      trial: 0,
      starter: 0,
      pro: 0,
      enterprise: 0,
    };

    const restaurantRows = restaurants.map((r) => {
      const gmv = r.orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0);
      totalPlatformGmv += gmv;
      totalOrders += r._count.orders;
      totalTables += r._count.tables;
      if (r.isActive) activeRestaurants++;

      const planKey = (r.plan || "starter") as keyof typeof planBreakdown;
      if (planBreakdown[planKey] !== undefined) {
        planBreakdown[planKey]++;
      } else {
        planBreakdown.starter++;
      }

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        phone: r.phone,
        city: r.city || "Delhi NCR",
        ownerName: r.ownerName || "Partner",
        ownerEmail: r.ownerEmail,
        password: r.password || "admin123",
        staffPin: r.staffPin || "1234",
        plan: r.plan || "starter",
        planExpiresAt: r.planExpiresAt ? r.planExpiresAt.toISOString() : null,
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
        tablesCount: r._count.tables,
        menuItemsCount: r._count.menuItems,
        ordersCount: r._count.orders,
        gmv: Math.round(gmv),
      };
    });

    // Calculate Estimated MRR based on plans: Starter ₹999, Pro ₹2,499, Enterprise ₹4,999
    const estimatedMrr =
      planBreakdown.starter * 999 +
      planBreakdown.pro * 2499 +
      planBreakdown.enterprise * 4999;

    const setting = await prisma.platformSetting.findUnique({
      where: { id: "global" },
    });

    return {
      metrics: {
        totalRestaurants: restaurants.length,
        activeRestaurants,
        totalTables,
        totalOrders,
        totalPlatformGmv: Math.round(totalPlatformGmv),
        estimatedMrr,
        planBreakdown,
      },
      restaurants: restaurantRows,
      platformSetting: setting || {
        id: "global",
        broadcastMessage: null,
        isMaintenance: false,
        supportPhone: "+91 98765 43210",
      },
    };
  } catch (err) {
    console.error("Prisma getSuperAdminOverview error:", err);
    return null;
  }
};

export const updateSuperAdminRestaurant = async (
  restaurantId: string,
  data: {
    isActive?: boolean;
    plan?: string;
    city?: string;
    ownerName?: string;
    ownerEmail?: string;
    phone?: string;
    password?: string;
    staffPin?: string;
    daysToAdd?: number;
    clearExpiry?: boolean;
  }
) => {
  try {
    const updatePayload: Record<string, unknown> = {};
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.plan !== undefined) updatePayload.plan = data.plan;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.ownerName !== undefined) updatePayload.ownerName = data.ownerName;
    if (data.ownerEmail !== undefined) updatePayload.ownerEmail = data.ownerEmail.trim().toLowerCase();
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.password !== undefined && data.password.trim()) updatePayload.password = data.password.trim();
    if (data.staffPin !== undefined && data.staffPin.trim()) updatePayload.staffPin = data.staffPin.trim();

    if (data.clearExpiry) {
      updatePayload.planExpiresAt = null;
    } else if (data.daysToAdd !== undefined && data.daysToAdd > 0) {
      const current = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      const baseDate = current?.planExpiresAt && current.planExpiresAt > new Date()
        ? current.planExpiresAt
        : new Date();
      const newExpiry = new Date(baseDate.getTime() + data.daysToAdd * 24 * 60 * 60 * 1000);
      updatePayload.planExpiresAt = newExpiry;
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updatePayload,
    });
    return updated;
  } catch (err) {
    console.error("Prisma updateSuperAdminRestaurant error:", err);
    return null;
  }
};

export const deleteRestaurant = async (restaurantId: string) => {
  try {
    // Safe cascading delete transaction for SQLite
    await prisma.$transaction([
      prisma.orderItem.deleteMany({
        where: { order: { restaurantId } },
      }),
      prisma.order.deleteMany({
        where: { restaurantId },
      }),
      prisma.serviceRequest.deleteMany({
        where: { restaurantId },
      }),
      prisma.menuItem.deleteMany({
        where: { restaurantId },
      }),
      prisma.category.deleteMany({
        where: { restaurantId },
      }),
      prisma.table.deleteMany({
        where: { restaurantId },
      }),
      prisma.restaurant.delete({
        where: { id: restaurantId },
      }),
    ]);
    return true;
  } catch (err) {
    console.error("Prisma deleteRestaurant error:", err);
    return false;
  }
};

export const updatePlatformSetting = async (
  broadcastMessage?: string | null,
  isMaintenance?: boolean,
  supportPhone?: string
) => {
  try {
    const data: Record<string, unknown> = {};
    if (broadcastMessage !== undefined) data.broadcastMessage = broadcastMessage;
    if (isMaintenance !== undefined) data.isMaintenance = isMaintenance;
    if (supportPhone !== undefined) data.supportPhone = supportPhone;

    const setting = await prisma.platformSetting.upsert({
      where: { id: "global" },
      update: data,
      create: {
        id: "global",
        broadcastMessage: broadcastMessage || null,
        isMaintenance: isMaintenance || false,
        supportPhone: supportPhone || "+91 98765 43210",
      },
    });
    return setting;
  } catch (err) {
    console.error("Prisma updatePlatformSetting error:", err);
    return null;
  }
};
