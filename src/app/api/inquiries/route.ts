import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { isSuperAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INQUIRIES_FILE = path.join(os.tmpdir(), "scanbite_inquiries.json");
const memoryInquiries: any[] = [];

function getFileOrMemoryInquiries(): any[] {
  try {
    if (fs.existsSync(INQUIRIES_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(INQUIRIES_FILE, "utf8"));
      if (Array.isArray(fileData) && fileData.length > 0) {
        return fileData;
      }
    }
  } catch {}
  return memoryInquiries;
}

function saveFileOrMemoryInquiry(item: any) {
  const newRecord = { ...item, id: item.id || `inq-${Date.now()}`, createdAt: new Date().toISOString() };
  memoryInquiries.unshift(newRecord);
  if (memoryInquiries.length > 100) memoryInquiries.length = 100;

  try {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(memoryInquiries, null, 2), "utf8");
  } catch {
    // Graceful fallback to memory array on read-only serverless filesystems
  }
  return newRecord;
}

export async function GET(req: NextRequest) {
  if (!isSuperAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
  }

  try {
    const dbInquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ inquiries: dbInquiries });
  } catch (error) {
    console.error("Failed to query inquiries from database, using file/memory fallback:", error);
    return NextResponse.json({ inquiries: getFileOrMemoryInquiries() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantName, ownerName, phone, city, tablesCount, notes } = body;

    if (!restaurantName || !phone) {
      return NextResponse.json({ error: "Restaurant name and phone number are required." }, { status: 400 });
    }

    try {
      const created = await prisma.inquiry.create({
        data: {
          restaurantName: String(restaurantName).trim(),
          ownerName: ownerName ? String(ownerName).trim() : "Partner",
          phone: String(phone).trim(),
          city: city ? String(city).trim() : "India",
          tablesCount: tablesCount ? String(tablesCount).trim() : null,
          notes: notes ? String(notes).trim() : null,
          status: "new",
        },
      });
      return NextResponse.json({ success: true, message: "Inquiry received and saved to database", inquiry: created });
    } catch (dbError) {
      console.warn("DB save failed, falling back to memory/file:", dbError);
      const fallbackRecord = saveFileOrMemoryInquiry(body);
      return NextResponse.json({ success: true, message: "Inquiry received (cached)", inquiry: fallbackRecord });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process inquiry" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isSuperAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Inquiry ID is required" }, { status: 400 });
    }

    try {
      const updated = await prisma.inquiry.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      });
      return NextResponse.json({ success: true, inquiry: updated });
    } catch (dbError) {
      // Memory fallback if inquiry was stored in memory
      const target = memoryInquiries.find((x) => x.id === id);
      if (target) {
        if (status) target.status = status;
        if (notes !== undefined) target.notes = notes;
        return NextResponse.json({ success: true, inquiry: target });
      }
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update inquiry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSuperAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Inquiry ID is required" }, { status: 400 });
    }

    try {
      await prisma.inquiry.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Inquiry deleted" });
    } catch (dbError) {
      const idx = memoryInquiries.findIndex((x) => x.id === id);
      if (idx !== -1) {
        memoryInquiries.splice(idx, 1);
        return NextResponse.json({ success: true, message: "Inquiry deleted from cache" });
      }
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete inquiry" }, { status: 500 });
  }
}
