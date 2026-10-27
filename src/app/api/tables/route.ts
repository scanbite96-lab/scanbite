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
