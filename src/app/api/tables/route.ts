import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isSuperAdminRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: "asc" },
    });

    return NextResponse.json(tables);
  } catch (err) {
    console.error("GET /api/tables error:", err);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to add tables." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot add tables. Owner access required." }, { status: 403 });
    }

    const body = await request.json();
    const { restaurantId, tableNumber, seats } = body;

    if (!restaurantId || !tableNumber) {
      return NextResponse.json({ error: "Missing required table fields" }, { status: 400 });
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

    if (!session && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized: Please log in as owner to delete tables." }, { status: 401 });
    }
    if (session?.role === "staff") {
      return NextResponse.json({ error: "Unauthorized: Staff cannot delete tables. Owner access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return NextResponse.json({ error: "Missing tableId" }, { status: 400 });
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
