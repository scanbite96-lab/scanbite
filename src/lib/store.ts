import { prisma } from "./prisma";
import { Restaurant, Order, ServiceRequest, MenuItem, OrderStatus } from "@/types";
import {
  DEMO_RESTAURANT,
  getDemoOrders,
  getDemoTableOrders,
  addDemoOrder,
  updateDemoOrderStatus,
  demoServiceRequestsStore,
  addDemoServiceRequest,
  attendDemoServiceRequest,
  vacateDemoTable,
} from "./demoData";

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
    if (rest) {
      // Omit sensitive credentials from public output
      const { password, staffPin, ...safeRest } = rest as Record<string, unknown>;
      return safeRest as unknown as Restaurant;
    }
  } catch (err) {
    console.error("Prisma getRestaurantBySlug error:", err);
  }

  // Bulletproof fallback for demo restaurant on serverless / read-only Vercel
  if (slug === "grand-spice") {
    return DEMO_RESTAURANT;
  }
  return null;
};

export const seedDemoOrdersInDb = async (): Promise<boolean> => {
  try {
    // 1. Ensure cat-5 and item-14 exist in DB so foreign key constraints are satisfied
    let cat5 = await prisma.category.findUnique({ where: { id: "cat-5" } });
    if (!cat5) {
      await prisma.category.create({
        data: {
          id: "cat-5",
          restaurantId: "rest-001",
          name: "Desserts & Sweets",
          icon: "🍨",
          sortOrder: 5,
        },
      });
    }

    let it14 = await prisma.menuItem.findUnique({ where: { id: "item-14" } });
    if (!it14) {
      await prisma.menuItem.create({
        data: {
          id: "item-14",
          restaurantId: "rest-001",
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
      });
    }

    const demoOrders = [
      {
        id: "ord-101",
        restaurantId: "rest-001",
        tableId: "tbl-4",
        tableNumber: "Table 4",
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        subtotal: 690,
        tax: 35,
        discount: 0,
        total: 725,
        status: "cooking",
        paymentMethod: "counter_cash",
        paymentStatus: "unpaid",
        createdAt: new Date(Date.now() - 4 * 60000),
        items: [
          { menuItemId: "item-1", name: "Paneer Tikka Angara", price: 280, quantity: 1, isVeg: true, notes: "Extra spicy please", orderedByName: "Rahul" },
          { menuItemId: "item-7", name: "Old Delhi Butter Chicken", price: 410, quantity: 1, isVeg: false, orderedByName: "Aakash" },
        ],
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
        createdAt: new Date(Date.now() - 18 * 60000),
        items: [
          { menuItemId: "item-5", name: "Dal Makhani Grand Special", price: 290, quantity: 1, isVeg: true },
          { menuItemId: "item-9", name: "Butter Garlic Naan", price: 75, quantity: 2, isVeg: true },
          { menuItemId: "item-14", name: "Sizzling Brownie with Ice Cream", price: 210, quantity: 1, isVeg: true },
        ],
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
        createdAt: new Date(Date.now() - 14 * 60000),
        items: [
          { menuItemId: "item-12", name: "Virgin Mint Mojito", price: 150, quantity: 2, isVeg: true },
        ],
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
        createdAt: new Date(Date.now() - 25 * 60000),
        items: [
          { menuItemId: "item-11", name: "Kolkata Mutton Dum Biryani", price: 460, quantity: 1, isVeg: false },
          { menuItemId: "item-13", name: "Masala Chaas (Spiced Buttermilk)", price: 90, quantity: 1, isVeg: true },
        ],
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
        createdAt: new Date(Date.now() - 45 * 60000),
        items: [
          { menuItemId: "item-5", name: "Dal Makhani Grand Special", price: 290, quantity: 1, isVeg: true },
          { menuItemId: "item-9", name: "Butter Garlic Naan", price: 75, quantity: 2, isVeg: true },
          { menuItemId: "item-14", name: "Sizzling Brownie with Ice Cream", price: 210, quantity: 1, isVeg: true },
        ],
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
        createdAt: new Date(Date.now() - 75 * 60000),
        items: [
          { menuItemId: "item-1", name: "Paneer Tikka Angara", price: 280, quantity: 1, isVeg: true },
          { menuItemId: "item-12", name: "Virgin Mint Mojito", price: 150, quantity: 1, isVeg: true },
        ],
      },
    ];

    for (const o of demoOrders) {
      await prisma.order.upsert({
        where: { id: o.id },
        create: {
          id: o.id,
          restaurantId: o.restaurantId,
          tableId: o.tableId,
          tableNumber: o.tableNumber,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          subtotal: o.subtotal,
          tax: o.tax,
          discount: o.discount,
          couponCode: o.couponCode,
          total: o.total,
          status: o.status,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          rating: o.rating,
          reviewFeedback: o.reviewFeedback,
          createdAt: o.createdAt,
          items: {
            create: o.items.map((it: any) => ({
              menuItemId: it.menuItemId,
              name: it.name,
              price: it.price,
              quantity: it.quantity,
              isVeg: it.isVeg,
              notes: it.notes || null,
              orderedByName: it.orderedByName || null,
            })),
          },
        },
        update: {
          status: o.status,
          paymentStatus: o.paymentStatus,
          tableId: o.tableId,
          tableNumber: o.tableNumber,
        },
      });
    }
    return true;
  } catch (err) {
    console.error("seedDemoOrdersInDb error:", err);
    return false;
  }
};

export const getOrdersForRestaurant = async (restaurantId: string): Promise<Order[]> => {
  try {
    let orders = await prisma.order.findMany({
      where: { restaurantId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    // If demo restaurant has 0 orders in PostgreSQL, auto-seed them so status transitions persist seamlessly
    if ((!orders || orders.length === 0) && (restaurantId === "rest-001" || restaurantId === "grand-spice")) {
      await seedDemoOrdersInDb();
      orders = await prisma.order.findMany({
        where: { restaurantId: "rest-001" },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (orders && orders.length > 0) {
      const formatted = orders.map((o) => ({
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
          orderedByName: it.orderedByName ?? undefined,
          variantName: it.variantName ?? undefined,
          selectedAddons: (it.selectedAddons as any) ?? undefined,
        })),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }));

      return formatted;
    }
  } catch (err) {
    console.error("Prisma getOrders error:", err);
  }

  if (restaurantId === "rest-001" || restaurantId === "grand-spice") {
    return getDemoOrders();
  }
  return [];
};

export const getTableOrders = async (restaurantId: string, tableId: string, activeOnly: boolean = false): Promise<Order[]> => {
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
        ...(activeOnly ? { status: { notIn: ["completed", "cancelled"] } } : {}),
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
        orderedByName: it.orderedByName ?? undefined,
        variantName: it.variantName ?? undefined,
        selectedAddons: (it.selectedAddons as any) ?? undefined,
      })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Prisma getTableOrders error:", err);
  }

  if (restaurantId === "rest-001" || restaurantId === "grand-spice") {
    return getDemoTableOrders(tableId, activeOnly);
  }
  return [];
};

export const vacateTable = async (restaurantId: string, tableId: string): Promise<boolean> => {
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

    // 1. Mark all active orders for this table as completed & paid
    await prisma.order.updateMany({
      where: {
        restaurantId,
        OR: [
          { tableId: targetTableId },
          { tableNumber: targetTableNumber },
          { tableId },
        ],
        status: { notIn: ["completed", "cancelled"] },
      },
      data: {
        status: "completed",
        paymentStatus: "paid",
      },
    });

    // 2. Clear any shared TableCart and diners
    const tableCart = await prisma.tableCart.findFirst({
      where: {
        restaurantId,
        OR: [
          { tableId: targetTableId },
          { tableId },
        ],
      },
    });
    if (tableCart) {
      await prisma.tableCartItem.deleteMany({
        where: { cartId: tableCart.id },
      });
      await prisma.tableDiner.deleteMany({
        where: { cartId: tableCart.id },
      });
    }

    // 3. Attend any pending service requests for this table
    await prisma.serviceRequest.updateMany({
      where: {
        restaurantId,
        tableId: targetTableId,
        status: "pending",
      },
      data: {
        status: "attended",
      },
    });

    vacateDemoTable(tableId);
    return true;
  } catch (err) {
    console.error("Prisma vacateTable error:", err);
    vacateDemoTable(tableId);
    return true;
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
            variantName: it.variantName || null,
            selectedAddons: it.selectedAddons ? it.selectedAddons : undefined,
            orderedByName: it.orderedByName || null,
          })),
        },
      },
      include: { items: true },
    });

    // Auto-decrement portion counts and auto-mark sold out at 0 portions
    for (const it of orderData.items) {
      if (it.menuItemId && it.menuItemId !== "item-custom") {
        try {
          const menuItem = await prisma.menuItem.findUnique({
            where: { id: it.menuItemId },
            select: { id: true, stockCount: true, isAvailable: true },
          });

          if (menuItem && menuItem.stockCount !== null && menuItem.stockCount !== undefined && menuItem.stockCount >= 0) {
            const remaining = Math.max(0, menuItem.stockCount - it.quantity);
            await prisma.menuItem.update({
              where: { id: menuItem.id },
              data: {
                stockCount: remaining,
                ...(remaining === 0 ? { isAvailable: false } : {}),
              },
            });
          }
        } catch (stockErr) {
          console.warn("Stock decrement warning for item:", it.menuItemId, stockErr);
        }
      }
    }

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
        variantName: it.variantName ?? undefined,
        selectedAddons: (it.selectedAddons as any) ?? undefined,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  } catch (err) {
    console.error("Prisma createOrder error:", err);
    if (orderData.restaurantId === "rest-001" || orderData.restaurantId === "grand-spice") {
      const newDemoOrder: Order = {
        id: `ord-${Date.now()}`,
        restaurantId: "rest-001",
        tableId: orderData.tableId || "tbl-4",
        tableNumber: orderData.tableNumber || "Table 4",
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        discount: orderData.discount || 0,
        couponCode: orderData.couponCode || undefined,
        total: orderData.total,
        status: orderData.status || "pending",
        paymentMethod: orderData.paymentMethod || "counter_cash",
        paymentStatus: orderData.paymentStatus || "unpaid",
        items: orderData.items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return addDemoOrder(newDemoOrder);
    }
    return null;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status?: Order["status"],
  paymentStatus?: Order["paymentStatus"],
  tableId?: string,
  tableNumber?: string
): Promise<Order | null> => {
  try {
    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (tableId) updateData.tableId = tableId;
    if (tableNumber) updateData.tableNumber = tableNumber;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });

    // Also sync in-memory demo store if applicable
    updateDemoOrderStatus(orderId, status, paymentStatus, tableId, tableNumber);

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
        variantName: it.variantName ?? undefined,
        selectedAddons: (it.selectedAddons as any) ?? undefined,
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (err) {
    const demoUpdated = updateDemoOrderStatus(orderId, status, paymentStatus);
    if (demoUpdated) return demoUpdated;
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
    if (restaurantId === "rest-001" || restaurantId === "grand-spice") {
      const demoReq: ServiceRequest = {
        id: `req-${Date.now()}`,
        restaurantId: "rest-001",
        tableId,
        tableNumber,
        type,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      return addDemoServiceRequest(demoReq);
    }
    return null;
  }
};

export const getServiceRequests = async (restaurantId: string): Promise<ServiceRequest[]> => {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
    if (requests && requests.length > 0) {
      return requests.map((r) => ({
        ...r,
        type: r.type as ServiceRequest["type"],
        status: r.status as ServiceRequest["status"],
        createdAt: r.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    console.error("Prisma getServiceRequests error:", err);
  }

  if (restaurantId === "rest-001" || restaurantId === "grand-spice") {
    return [...demoServiceRequestsStore];
  }
  return [];
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
    return attendDemoServiceRequest(requestId);
  }
};

export const toggleItemAvailability = async (slug: string, itemId: string): Promise<MenuItem | null> => {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
    });
    if (item) {
      const nextAvailable = !item.isAvailable;
      const updated = await prisma.menuItem.update({
        where: { id: itemId },
        data: { 
          isAvailable: nextAvailable,
          ...(nextAvailable && item.stockCount === 0 ? { stockCount: -1 } : {}),
        },
      });
      return updated as unknown as MenuItem;
    }
  } catch (err) {
    console.error("Prisma toggleItemAvailability error:", err);
  }

  // Fallback for demo restaurant in memory
  const demoItem = DEMO_RESTAURANT.menuItems.find((m) => m.id === itemId);
  if (demoItem) {
    demoItem.isAvailable = !demoItem.isAvailable;
    if (demoItem.isAvailable && demoItem.stockCount === 0) demoItem.stockCount = -1;
    return demoItem;
  }
  return null;
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

    // Today's statistics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let todayOrdersCount = 0;
    let todayGmv = 0;

    restaurants.forEach((r) => {
      r.orders.forEach((o) => {
        if (new Date(o.createdAt) >= startOfToday) {
          todayOrdersCount++;
          if (o.status !== "cancelled") {
            todayGmv += o.total || 0;
          }
        }
      });
    });

    const averageOrderValue = totalOrders > 0 ? Math.round(totalPlatformGmv / totalOrders) : 0;

    // Fetch Global Recent Orders across all restaurants (latest 60)
    const recentOrders = await prisma.order.findMany({
      take: 60,
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: {
          select: { id: true, name: true, slug: true, city: true },
        },
        items: true,
      },
    });

    const formattedRecentOrders = recentOrders.map((o) => ({
      id: o.id,
      restaurantId: o.restaurantId,
      restaurantName: o.restaurant?.name || "Unknown",
      restaurantSlug: o.restaurant?.slug || "",
      city: o.restaurant?.city || "Delhi NCR",
      tableNumber: o.tableNumber,
      customerName: o.customerName || "Walk-in Guest",
      customerPhone: o.customerPhone || null,
      subtotal: o.subtotal,
      tax: o.tax,
      discount: o.discount || 0,
      total: o.total,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      itemsCount: o.items.reduce((s, it) => s + it.quantity, 0),
      itemsSummary: o.items.map((it) => `${it.quantity}x ${it.name}`).join(", "),
      createdAt: o.createdAt.toISOString(),
    }));

    // System Diagnostics
    const [totalMenuItemsCount, totalCategoriesCount] = await Promise.all([
      prisma.menuItem.count(),
      prisma.category.count(),
    ]);

    const mem = process.memoryUsage();
    const systemHealth = {
      dbStatus: "Healthy (Connected)",
      nodeVersion: process.version,
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      uptimeSeconds: Math.round(process.uptime()),
      totalMenuItems: totalMenuItemsCount,
      totalCategories: totalCategoriesCount,
      totalTables,
      totalOrders,
      totalRestaurants: restaurants.length,
      serverTime: new Date().toISOString(),
    };

    // Collect distinct cities
    const citiesSet = new Set<string>();
    restaurants.forEach((r) => {
      if (r.city && r.city.trim()) citiesSet.add(r.city.trim());
    });
    const cities = Array.from(citiesSet);

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
        todayOrdersCount,
        todayGmv: Math.round(todayGmv),
        averageOrderValue,
        planBreakdown,
      },
      restaurants: restaurantRows,
      recentOrders: formattedRecentOrders,
      systemHealth,
      cities,
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
    // Safe cascading delete transaction
    await prisma.$transaction([
      prisma.tableCartItem.deleteMany({
        where: { cart: { restaurantId } },
      }),
      prisma.tableDiner.deleteMany({
        where: { cart: { restaurantId } },
      }),
      prisma.tableCart.deleteMany({
        where: { restaurantId },
      }),
      prisma.staff.deleteMany({
        where: { restaurantId },
      }),
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
