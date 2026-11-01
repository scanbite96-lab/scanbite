import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_RESTAURANT, demoOrdersStore } from "@/lib/demoData";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json().catch(() => ({}));
    let targetPhone = body.phone ? String(body.phone).replace(/\D/g, "") : "";

    // 1. Fetch order & restaurant
    let order: any = null;
    let restaurant: any = null;

    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              address: true,
              city: true,
              taxRatePercent: true,
              currencySymbol: true,
              upiId: true,
            },
          },
        },
      });
      if (order?.restaurant) restaurant = order.restaurant;
    } catch {
      // ignore
    }

    if (!order) {
      order = demoOrdersStore.find((o) => o.id === orderId);
      restaurant = {
        name: DEMO_RESTAURANT.name,
        slug: DEMO_RESTAURANT.slug,
        phone: DEMO_RESTAURANT.phone,
        address: DEMO_RESTAURANT.address,
        city: DEMO_RESTAURANT.city,
        taxRatePercent: DEMO_RESTAURANT.taxRatePercent,
        currencySymbol: DEMO_RESTAURANT.currencySymbol,
        upiId: DEMO_RESTAURANT.upiId,
      };
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Determine target phone
    if (!targetPhone && order.customerPhone) {
      targetPhone = String(order.customerPhone).replace(/\D/g, "");
    }

    if (targetPhone.length > 10 && targetPhone.startsWith("91")) {
      targetPhone = targetPhone.slice(2);
    }

    // Save phone to order if provided and not yet saved
    if (targetPhone && (!order.customerPhone || order.customerPhone !== targetPhone)) {
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: { customerPhone: targetPhone },
        });
      } catch {
        order.customerPhone = targetPhone;
      }
    }

    // 2. Build host URL for digital invoice
    const host = request.headers.get("host") || "scanbite-plum.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const receiptUrl = `${protocol}://${host}/receipt/${order.id}`;

    // 3. Format WhatsApp Bill Text
    const symbol = restaurant?.currencySymbol || "₹";
    const itemsText = order.items.map((it: any) => {
      const vStr = it.variantName ? ` [${it.variantName}]` : "";
      const addonStr = it.selectedAddons && Array.isArray(it.selectedAddons) && it.selectedAddons.length > 0
        ? `\n   ↳ + ${it.selectedAddons.map((a: any) => `${a.name} (+${symbol}${a.price})`).join(", ")}`
        : "";
      return `• ${it.quantity}x ${it.name}${vStr} (${symbol}${it.price * it.quantity})${addonStr}`;
    }).join("\n");

    const discountText = order.discount && order.discount > 0 
      ? `\n🎉 Discount: -${symbol}${order.discount} (${order.couponCode || "Coupon"})` 
      : "";

    const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const billMessage = 
      `🍽️ *${restaurant?.name || "ScanBite Restaurant"}*\n` +
      `📍 Table: ${order.tableNumber} | Order: #${order.id.slice(-6)}\n` +
      `👤 Guest: ${order.customerName || "Diner"}\n` +
      `📅 ${dateStr}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${itemsText}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Subtotal: ${symbol}${order.subtotal}\n` +
      `Taxes (GST ${restaurant?.taxRatePercent || 5}%): ${symbol}${order.tax}` +
      `${discountText}\n` +
      `*Grand Total: ${symbol}${order.total}*\n` +
      `Status: ${order.paymentStatus === "paid" ? "✅ PAID" : "⚠️ UNPAID"} (${(order.paymentMethod || "counter_cash").replace("_", " ")})\n` +
      `\n🧾 *Official Tax Invoice & PDF Bill:*\n${receiptUrl}\n\n` +
      `Thank you for dining with us! 🙏 Please visit again.`;

    const encodedText = encodeURIComponent(billMessage);
    const deepLinkUrl = targetPhone 
      ? `https://wa.me/91${targetPhone}?text=${encodedText}` 
      : `https://wa.me/?text=${encodedText}`;

    // 4. Check for Meta WhatsApp Cloud API credentials
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (token && phoneNumberId && targetPhone && targetPhone.length === 10) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: `91${targetPhone}`,
            type: "text",
            text: { preview_url: true, body: billMessage },
          }),
        });

        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          return NextResponse.json({
            success: true,
            mode: "cloud_api",
            messageId: metaJson.messages?.[0]?.id,
            receiptUrl,
            whatsappUrl: deepLinkUrl,
          });
        }
      } catch (metaErr) {
        console.warn("WhatsApp Cloud API failed, falling back to deep_link:", metaErr);
      }
    }

    // Default mode: instant deep link (100% zero-configuration reliable)
    return NextResponse.json({
      success: true,
      mode: "deep_link",
      phone: targetPhone,
      receiptUrl,
      whatsappUrl: deepLinkUrl,
      billMessage,
    });
  } catch (err) {
    console.error("POST /api/orders/[id]/send-whatsapp error:", err);
    return NextResponse.json({ error: "Failed to dispatch WhatsApp bill" }, { status: 500 });
  }
}
