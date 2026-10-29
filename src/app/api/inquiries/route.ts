import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const INQUIRIES_FILE = path.join(process.cwd(), "inquiries.json");

function getInquiries() {
  try {
    if (fs.existsSync(INQUIRIES_FILE)) {
      return JSON.parse(fs.readFileSync(INQUIRIES_FILE, "utf8"));
    }
  } catch {}
  return [];
}

function saveInquiry(item: any) {
  try {
    const list = getInquiries();
    list.unshift({ ...item, id: `inq-${Date.now()}`, createdAt: new Date().toISOString() });
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(list.slice(0, 100), null, 2), "utf8");
  } catch {}
}

export async function GET() {
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
