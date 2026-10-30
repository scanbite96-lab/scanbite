import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isSuperAdminRequest } from "@/lib/auth";
import { DEMO_RESTAURANT } from "@/lib/demoData";
import { Table } from "@/types";

export async function GET(request: NextRequest) {
  let restaurantId: string | null = null;
  try {
    const { searchParams } = new URL(request.url);
    restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
    }

    let tables: any[] = [];
    try {
      tables = await prisma.table.findMany({
        where: { restaurantId },
        orderBy: { tableNumber: "asc" },
      });
    } catch {
      // ignore
    }

    if (tables.length === 0 && (restaurantId === "rest-001" || restaurantId === "grand-spice")) {
      tables = DEMO_RESTAURANT.tables;
    }

    return NextResponse.json(tables);
  } catch (err) {
    console.error("GET /api/tables error:", err);
    if (restaurantId === "rest-001" || restaurantId === "grand-spice") {
      return NextResponse.json(DEMO_RESTAURANT.tables);
    }
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    const body = await request.json();
    const { restaurantId, tableNumber, seats } = body;
    const cleanTableNum = String(tableNumber || "").trim();

    if (!restaurantId || !cleanTableNum) {
      return NextResponse.json({ error: "Missing required table fields" }, { status: 400 });
    }

    const isDemo = restaurantId === "rest-001" || restaurantId === "grand-spice";

    if (!session && !isSuperAdmin && !isDemo) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to add tables." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot add tables. Owner access required." }, { status: 403 });
    }

    if (isDemo) {
      const newDemoTable: Table = {
        id: `tbl-${Date.now()}`,
        tableNumber: String(tableNumber).trim(),
        seats: Number(seats) || 4,
      };
      DEMO_RESTAURANT.tables.push(newDemoTable);
      return NextResponse.json(newDemoTable, { status: 201 });
    }

    if (!isSuperAdmin && session?.id !== restaurantId && session?.role !== "admin") {
      const rest = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { slug: true } });
      if (!rest || rest.slug !== session?.slug) {
        return NextResponse.json({ error: "Forbidden: You cannot modify another restaurant's tables." }, { status: 403 });
      }
    }

    const table = await prisma.table.create({
      data: {
        restaurantId,
        tableNumber,
        seats: Number(seats) || 4,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    console.error("Failed to create table:", err);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return NextResponse.json({ error: "Missing tableId" }, { status: 400 });
    }

    const isDemoTable = String(tableId).startsWith("tbl-");

    if (!session && !isSuperAdmin && !isDemoTable) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to delete tables." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot delete tables. Owner access required." }, { status: 403 });
    }

    if (isDemoTable) {
      const idx = DEMO_RESTAURANT.tables.findIndex((t) => t.id === tableId);
      if (idx !== -1) {
        DEMO_RESTAURANT.tables.splice(idx, 1);
        return NextResponse.json({ success: true });
      }
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: { select: { id: true, slug: true } } },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    if (!isSuperAdmin && session?.id !== table.restaurant.id && session?.slug !== table.restaurant.slug && session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: You cannot delete another restaurant's table." }, { status: 403 });
    }

    await prisma.table.delete({
      where: { id: tableId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete table:", err);
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    const body = await request.json();
    const { id, tableId, tableNumber, seats, restaurantId } = body;
    const targetId = id || tableId;
    const cleanTableNum = String(tableNumber || "").trim();
    const cleanSeats = Math.max(1, Number(seats) || 4);

    if (!targetId || !cleanTableNum) {
      return NextResponse.json({ error: "Missing required table id or tableNumber" }, { status: 400 });
    }

    const isDemoTable = String(targetId).startsWith("tbl-") || restaurantId === "rest-001" || restaurantId === "grand-spice";

    if (!session && !isSuperAdmin && !isDemoTable) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to edit tables." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot edit tables. Owner access required." }, { status: 403 });
    }

    // Demo in-memory persistence
    if (isDemoTable) {
      const idx = DEMO_RESTAURANT.tables.findIndex((t) => t.id === targetId);
      if (idx !== -1) {
        DEMO_RESTAURANT.tables[idx].tableNumber = cleanTableNum;
        DEMO_RESTAURANT.tables[idx].seats = cleanSeats;
        return NextResponse.json(DEMO_RESTAURANT.tables[idx]);
      }
    }

    // Database lookup & authorization check
    const existingTable = await prisma.table.findUnique({
      where: { id: targetId },
      include: { restaurant: { select: { id: true, slug: true } } },
    });

    if (!existingTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    if (!isSuperAdmin && session?.id !== existingTable.restaurant.id && session?.slug !== existingTable.restaurant.slug && session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: You cannot modify another restaurant's tables." }, { status: 403 });
    }

    const updated = await prisma.table.update({
      where: { id: targetId },
      data: {
        tableNumber: cleanTableNum,
        seats: cleanSeats,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update table:", err);
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

