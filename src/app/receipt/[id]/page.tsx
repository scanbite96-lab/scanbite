"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Printer, 
  Share2, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  Phone, 
  MapPin, 
  Sparkles,
  QrCode
} from "lucide-react";

type OrderItem = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  variantName?: string | null;
  selectedAddons?: { name: string; price: number }[] | null;
  orderedByName?: string | null;
};

type OrderData = {
  id: string;
  restaurantId: string;
  tableNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  couponCode?: string | null;
  total: number;
  status: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

type RestaurantData = {
  id?: string;
  name: string;
  slug?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  taxRatePercent?: number;
  currencySymbol?: string;
  upiId?: string | null;
  logoUrl?: string | null;
};

export default function DigitalReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          throw new Error("Unable to load receipt details.");
        }
        const data = await res.json();
        setOrder(data.order);
        setRestaurant(data.restaurant);
      } catch (err: any) {
        console.error("Receipt fetch error:", err);
        setError(err.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [orderId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleWhatsAppShare = () => {
    if (!order) return;
    const symbol = restaurant?.currencySymbol || "₹";
    const text = `🧾 *Tax Invoice - ${restaurant?.name || "ScanBite"}*\n` +
      `📍 Table: ${order.tableNumber} | Order: #${order.id.slice(-6)}\n` +
      `Total: ${symbol}${order.total} (${order.paymentStatus === "paid" ? "✅ Paid" : "⚠️ Unpaid"})\n` +
      `View & Download Official PDF: ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-200">Generating Digital Tax Invoice...</h2>
        <p className="text-xs text-slate-400 mt-1">Fetching verified order records from ScanBite</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-black mb-4">
          ⚠️
        </div>
        <h1 className="text-xl font-black text-rose-300 mb-2">Invoice Not Found</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          {error || "The requested bill receipt could not be located or has expired."}
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition"
        >
          Return to ScanBite Home
        </Link>
      </div>
    );
  }

  const symbol = restaurant?.currencySymbol || "₹";
  const isPaid = order.paymentStatus === "paid";
  const invoiceNumber = `INV-${order.id.slice(-6).toUpperCase()}`;
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-12 px-3 sm:px-6 font-sans text-slate-900">
      {/* Top Floating Action Bar (Hidden in Print) */}
      <div className="max-w-2xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <span>{copied ? "✅ Link Copied" : "🔗 Copy Link"}</span>
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Official Tax Invoice Container */}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Header Ribbon / Status Banner */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${
          isPaid ? "bg-gradient-to-r from-emerald-600 to-teal-700" : "bg-gradient-to-r from-amber-600 to-orange-700"
        }`}>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-white/90" />
            <span className="text-xs font-black uppercase tracking-wider">
              {isPaid ? "Official Tax Invoice & Payment Receipt" : "Tax Invoice • Payment Outstanding"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-black">
            {isPaid ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PAID</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>UNPAID</span>
              </>
            )}
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Restaurant Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {restaurant?.name || "ScanBite Partner Restaurant"}
                </h1>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{restaurant?.address || "Main Dining Area"}, {restaurant?.city || "Delhi NCR"}</span>
              </p>
              {restaurant?.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Phone: {restaurant.phone}</span>
                </p>
              )}
            </div>

            {/* Bill Meta */}
            <div className="text-left sm:text-right text-xs text-slate-600 space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Invoice No:</span>
                <span className="font-mono font-black text-slate-900 text-sm">#{invoiceNumber}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Date & Time:</span>
                <span className="font-semibold text-slate-800">{formattedDate}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Table:</span>
                <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-900 font-extrabold rounded-md text-xs mt-0.5">
                  {order.tableNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Billed To (Guest):</span>
              <p className="font-black text-slate-800 text-sm mt-0.5">
                {order.customerName || "Valued Diner"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">WhatsApp Phone:</span>
              <p className="font-bold text-slate-700 mt-0.5">
                {order.customerPhone ? `+91 ${order.customerPhone}` : "Not Provided"}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Rate</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${it.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span>{it.name}</span>
                        {it.variantName && (
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                            {it.variantName}
                          </span>
                        )}
                      </div>
                      {it.selectedAddons && it.selectedAddons.length > 0 && (
                        <div className="text-[10px] text-slate-500 pl-3.5 mt-0.5">
                          ↳ + {it.selectedAddons.map((a) => `${a.name} (${symbol}${a.price})`).join(", ")}
                        </div>
                      )}
                      {it.orderedByName && (
                        <div className="text-[9px] text-slate-400 pl-3.5 mt-0.5 font-medium">
                          👤 Ordered by {it.orderedByName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-center font-black text-slate-800">
                      {it.quantity}
                    </td>
                    <td className="py-3 text-right font-medium text-slate-600">
                      {symbol}{it.price}
                    </td>
                    <td className="py-3 text-right font-black text-slate-900">
                      {symbol}{it.price * it.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="border-t-2 border-slate-200 pt-4 flex flex-col sm:flex-row justify-between gap-6">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span>Verified ScanBite Digital KOT Invoice</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Computer-generated digital tax invoice. No signature required.
              </p>
              {restaurant?.upiId && (
                <p className="text-[11px] font-mono font-medium text-slate-600">
                  Restaurant UPI: {restaurant.upiId}
                </p>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">{symbol}{order.subtotal}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>GST ({restaurant?.taxRatePercent || 5}%):</span>
                <span className="font-bold text-slate-800">{symbol}{order.tax}</span>
              </div>

              {order.discount !== null && order.discount !== undefined && order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount ({order.couponCode || "Coupon"}):</span>
                  <span>-{symbol}{order.discount}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-slate-900">
                <span className="text-sm font-black uppercase">Grand Total:</span>
                <span className="text-xl font-black">{symbol}{order.total}</span>
              </div>

              <div className="pt-2 text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Method</span>
                <span className="font-bold text-slate-700 uppercase">
                  {(order.paymentMethod || "counter_cash").replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Unpaid Action CTA (If Bill is not yet settled) */}
          {!isPaid && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <div>
                <h4 className="font-black text-amber-900 text-sm">Bill Settlement Pending</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Please pay at the restaurant counter or scan the UPI QR code.
                </p>
              </div>
              {restaurant?.upiId && (
                <a
                  href={`upi://pay?pa=${restaurant.upiId}&pn=${encodeURIComponent(restaurant.name)}&am=${order.total}&cu=INR`}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition whitespace-nowrap"
                >
                  Pay {symbol}{order.total} via UPI 📱
                </a>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center pt-6 border-t border-slate-100 text-[11px] text-slate-400">
            <p>Thank you for dining at <span className="font-bold text-slate-600">{restaurant?.name || "ScanBite Restaurant"}</span>! 🙏</p>
            <p className="mt-0.5 text-[10px]">Powered by ScanBite Cloud SaaS • www.scanbite-plum.vercel.app</p>
          </div>
        </div>
      </div>
    </div>
  );
}
