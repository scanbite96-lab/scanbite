import { NextRequest, NextResponse } from "next/server";
import { getServiceRequests, createServiceRequest, attendServiceRequest } from "@/lib/store";
import { getSessionUser, isSuperAdminRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  const requests = await getServiceRequests(restaurantId);
  return NextResponse.json(requests);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, tableId, tableNumber, type } = body;

    if (!restaurantId || !tableId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const req = await createServiceRequest(restaurantId, tableId, tableNumber, type);
    return NextResponse.json(req, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const isSuperAdmin = isSuperAdminRequest(request);

    if (session?.role === "staff" && !session.permissions?.canManageRequests) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to attend dining table requests." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const ok = await attendServiceRequest(requestId);
    if (!ok) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to attend request" }, { status: 500 });
  }
}
