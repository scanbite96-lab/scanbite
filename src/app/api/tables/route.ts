import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, tableNumber, seats } = body;

    if (!restaurantId || !tableNumber) {
      return NextResponse.json({ error: "Missing required table fields" }, { status: 400 });
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
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return NextResponse.json({ error: "Missing tableId" }, { status: 400 });
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
