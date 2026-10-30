import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { isSuperAdminRequest } from "@/lib/auth";

const INQUIRIES_FILE = path.join(os.tmpdir(), "scanbite_inquiries.json");
const memoryInquiries: any[] = [];

function getInquiries(): any[] {
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

function saveInquiry(item: any) {
  const newRecord = { ...item, id: `inq-${Date.now()}`, createdAt: new Date().toISOString() };
  memoryInquiries.unshift(newRecord);
  if (memoryInquiries.length > 100) memoryInquiries.length = 100;

  try {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(memoryInquiries, null, 2), "utf8");
  } catch {
    // Graceful fallback to memory array on read-only serverless filesystems
  }
}

export async function GET(req: NextRequest) {
  if (!isSuperAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
  }
  return NextResponse.json({ inquiries: getInquiries() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    saveInquiry(body);
    return NextResponse.json({ success: true, message: "Inquiry received" });
  } catch {
    return NextResponse.json({ success: true });
  }
}
