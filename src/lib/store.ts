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
    const orders = await prisma.order.findMany({
      where: { restaurantId, tableId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => ({
      ...o,
      status: o.status as OrderStatus,
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
    const order = await prisma.order.create({
      data: {
        restaurantId: orderData.restaurantId,
        tableId: orderData.tableId,
        tableNumber: orderData.tableNumber,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
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

export const updateOrderStatus = async (orderId: string, status: Order["status"]): Promise<Order | null> => {
  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });
    return {
      ...updated,
      status: updated.status as OrderStatus,
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

export const createServiceRequest = async (
  restaurantId: string,
  tableId: string,
  tableNumber: string,
  type: ServiceRequest["type"]
): Promise<ServiceRequest | null> => {
  try {
    const req = await prisma.serviceRequest.create({
      data: {
        restaurantId,
        tableId,
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
