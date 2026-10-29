"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { Restaurant, MenuItem, Order, OrderItem } from "@/types";
import { translations, Language } from "@/lib/translations";
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Clock, 
  BellRing, 
  Droplets, 
  Receipt, 
  X, 
  ChevronRight, 
  UtensilsCrossed,
  Sparkles,
  ExternalLink,
  Star,
  Tag,
  CheckCircle2,
  Languages,
  MessageCircle,
  Trash2,
  Check
} from "lucide-react";

export default function CustomerTableMenu() {
  const params = useParams();
  const slug = params.slug as string;
  const tableParam = params.table as string;

  // Language state: English by default
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart: Map of menuItemId -> { item: MenuItem, quantity: number, notes: string }
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number; notes: string }>>({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);

  // Promo Code State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percentOff?: number; flatOff?: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Customer form details with localStorage persistence
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"counter_cash" | "upi_online">("upi_online");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Table active orders & Rating state
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});
  const [submittedRatingMap, setSubmittedRatingMap] = useState<Record<string, boolean>>({});
  const previousStatusMap = useRef<Record<string, string>>({});

  // Service request cooldown timer (seconds remaining)
  const [serviceCooldowns, setServiceCooldowns] = useState<Record<string, number>>({});

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Fetch restaurant details
  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const res = await fetch(`/api/restaurants?slug=${slug}`);
        if (!res.ok) throw new Error("Restaurant not found");
        const data = await res.json();
        setRestaurant(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load restaurant menu");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurant();
  }, [slug]);

  // 2. Smarter Current Table Resolution
  const currentTable = useMemo(() => {
    if (!restaurant) return null;
    const cleanParam = tableParam.toLowerCase().replace(/[^a-z0-9]/g, "");
    const paramNum = tableParam.replace(/\D/g, "");

    const found = restaurant.tables.find((tbl) => {
      const cleanTblId = tbl.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanTblNum = tbl.tableNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
      const tblNum = tbl.tableNumber.replace(/\D/g, "");

      return (
        tbl.id === tableParam ||
        cleanTblId === cleanParam ||
        cleanTblNum === cleanParam ||
        (paramNum !== "" && tblNum === paramNum)
      );
    });

    return found || restaurant.tables[0] || {
      id: tableParam,
      tableNumber: `Table ${paramNum || "1"}`,
      seats: 4,
    };
  }, [restaurant, tableParam]);

  // 3. Cart & Diner Details Persistence (localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `scanbite_cart_${slug}_${tableParam}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCart(JSON.parse(saved));
      }
      const savedName = localStorage.getItem("scanbite_diner_name");
      if (savedName) setCustomerName(savedName);
      const savedPhone = localStorage.getItem("scanbite_diner_phone");
      if (savedPhone) setCustomerPhone(savedPhone);
    } catch {
      // ignore
    } finally {
      setCartLoaded(true);
    }
  }, [slug, tableParam]);

  // Save cart to localStorage
  useEffect(() => {
    if (!cartLoaded || typeof window === "undefined") return;
    const storageKey = `scanbite_cart_${slug}_${tableParam}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart, cartLoaded, slug, tableParam]);

  // Save diner details to localStorage
  const handleNameChange = (val: string) => {
    setCustomerName(val);
    if (typeof window !== "undefined") {
      try { localStorage.setItem("scanbite_diner_name", val); } catch {}
    }
  };

  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    if (typeof window !== "undefined") {
      try { localStorage.setItem("scanbite_diner_phone", val); } catch {}
    }
  };

  // Service cooldown countdown ticker
  useEffect(() => {
    const hasActiveCooldown = Object.values(serviceCooldowns).some((sec) => sec > 0);
    if (!hasActiveCooldown) return;

    const timer = setInterval(() => {
      setServiceCooldowns((prev) => {
        const next: Record<string, number> = {};
        for (const [key, val] of Object.entries(prev)) {
          if (val > 1) next[key] = val - 1;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [serviceCooldowns]);

  // Soft Chime for Customer when food is ready/served
  const playCustomerAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  };

  // 4. Fetch table orders & notify on live status changes
  const fetchOrders = async () => {
    if (!restaurant || !currentTable) return;
    try {
      const res = await fetch(`/api/orders?restaurantId=${restaurant.id}&tableId=${currentTable.id}`);
      if (res.ok) {
        const data: Order[] = await res.json();
        
        data.forEach((ord) => {
          const prev = previousStatusMap.current[ord.id];
          if (prev && prev !== ord.status) {
            if (ord.status === "cooking") {
              showToast(lang === "hi" ? `👨‍🍳 शेफ ने ऑर्डर #${ord.id.slice(-4)} बनाना शुरू कर दिया है!` : `👨‍🍳 Chef has started cooking Order #${ord.id.slice(-4)}!`);
            } else if (ord.status === "ready") {
              playCustomerAlertChime();
              if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
              showToast(lang === "hi" ? `🔔 ऑर्डर #${ord.id.slice(-4)} परोसने के लिए तैयार है!` : `🔔 Order #${ord.id.slice(-4)} is ready to serve!`);
            } else if (ord.status === "served") {
              playCustomerAlertChime();
              showToast(lang === "hi" ? `✅ ऑर्डर #${ord.id.slice(-4)} टेबल पर परोस दिया गया है। भोजन का आनंद लें!` : `✅ Order #${ord.id.slice(-4)} served. Enjoy your meal!`);
            } else if (ord.status === "cancelled") {
              showToast(lang === "hi" ? `❌ ऑर्डर #${ord.id.slice(-4)} रद्द कर दिया गया है।` : `❌ Order #${ord.id.slice(-4)} was cancelled.`);
            }
          }
          previousStatusMap.current[ord.id] = ord.status;
        });

        setTableOrders(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000); // 4-second real-time sync
    return () => clearInterval(interval);
  }, [restaurant, currentTable]);

  // Cart operations with haptic vibration feedback
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  const addToCart = (item: MenuItem) => {
    triggerHaptic();
    setCart((prev) => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [item.id]: { item, quantity: 1, notes: "" },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    triggerHaptic();
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const clearEntireCart = () => {
    setCart({});
    setAppliedCoupon(null);
    setCouponInput("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(`scanbite_cart_${slug}_${tableParam}`);
    }
    showToast(lang === "hi" ? "कार्ट खाली कर दिया गया है" : "Cart cleared");
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], notes },
      };
    });
  };

  // Promo Code Validation
  const applyCouponCode = (codeToApply: string) => {
    setCouponError(null);
    const code = codeToApply.trim().toUpperCase();
    if (!code) return;

    if (code === "WELCOME10") {
      setAppliedCoupon({ code: "WELCOME10", percentOff: 10 });
      showToast(lang === "hi" ? "🎉 कूपन WELCOME10 लागू हुआ! 10% की छूट मिली।" : "🎉 WELCOME10 applied! 10% discount added.");
    } else if (code === "FLAT50") {
      setAppliedCoupon({ code: "FLAT50", flatOff: 50 });
      showToast(lang === "hi" ? "🎉 कूपन FLAT50 लागू हुआ! ₹50 की छूट मिली।" : "🎉 FLAT50 applied! ₹50 discount added.");
    } else if (code === "TASTE20") {
      setAppliedCoupon({ code: "TASTE20", percentOff: 20 });
      showToast(lang === "hi" ? "🎉 कूपन TASTE20 लागू हुआ! 20% की छूट मिली।" : "🎉 TASTE20 applied! 20% discount added.");
    } else {
      setCouponError(lang === "hi" ? "अमान्य कूपन कोड। WELCOME10 या FLAT50 आज़माएं।" : "Invalid promo code. Try WELCOME10 or FLAT50");
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    applyCouponCode(couponInput);
  };

  // Service Request helper (Water, Waiter, Bill) with Spam Prevention Cooldown
  const triggerServiceRequest = async (type: "water" | "waiter" | "bill") => {
    if (!restaurant || !currentTable) return;
    if (serviceCooldowns[type] && serviceCooldowns[type] > 0) return;

    const labels = {
      water: lang === "hi" ? "💧 पीने का पानी मंगवाया गया!" : "💧 Drinking water requested!",
      waiter: lang === "hi" ? "🛎️ वेटर को टेबल पर बुलाया गया!" : "🛎️ Waiter called to your table!",
      bill: lang === "hi" ? "🧾 बिल का अनुरोध काउंटर पर भेजा गया!" : "🧾 Bill request sent to counter!",
    };

    // Set 15s cooldown immediately
    setServiceCooldowns((prev) => ({ ...prev, [type]: 15 }));

    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: currentTable.id,
          tableNumber: currentTable.tableNumber,
          type,
        }),
      });
      if (!res.ok) throw new Error("Service request failed");
      showToast(labels[type]);
    } catch {
      showToast(lang === "hi" ? "अनुरोध भेजने में समस्या हुई। कृपया वेटर को सीधे बताएं।" : "Request failed. Please notify a waiter directly.");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cart calculations
  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);
  const subtotal = cartItems.reduce((acc, c) => acc + c.item.price * c.quantity, 0);
  
  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.percentOff) {
      discountAmount = Math.round((subtotal * appliedCoupon.percentOff) / 100);
    } else if (appliedCoupon.flatOff) {
      discountAmount = Math.min(subtotal, appliedCoupon.flatOff);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = restaurant?.taxRatePercent !== undefined ? restaurant.taxRatePercent : 5;
  const taxAmount = Number(((taxableAmount * taxRate) / 100).toFixed(2));
  const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

  // Place Order
  const handlePlaceOrder = async () => {
    if (cartCount === 0 || !restaurant || !currentTable) return;
    setIsPlacingOrder(true);
    try {
      const orderPayloadItems: OrderItem[] = cartItems.map((c) => ({
        menuItemId: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        isVeg: c.item.isVeg,
        notes: c.notes || undefined,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: currentTable.id,
          tableNumber: currentTable.tableNumber,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: orderPayloadItems,
          subtotal,
          tax: taxAmount,
          discount: discountAmount,
          couponCode: appliedCoupon?.code,
          total: grandTotal,
          paymentMethod,
        }),
      });

      if (!res.ok) throw new Error("Order failed");
      const order: Order = await res.json();

      setCart({});
      setAppliedCoupon(null);
      setCouponInput("");
      if (typeof window !== "undefined") {
        localStorage.removeItem(`scanbite_cart_${slug}_${tableParam}`);
      }
      setIsCartOpen(false);
      fetchOrders();
      setIsOrdersOpen(true);
      showToast(lang === "hi" ? `🎉 ऑर्डर #${order.id.slice(-4)} रसोई में भेज दिया गया!` : `🎉 Order #${order.id.slice(-4)} sent to kitchen!`);
    } catch {
      showToast(lang === "hi" ? "ऑर्डर सबमिट करने में विफल। कृपया पुनः प्रयास करें।" : "Failed to submit order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Generate WhatsApp Bill Receipt Link
  const generateWhatsAppBillUri = (ord: Order) => {
    if (!restaurant) return "#";
    const phone = ord.customerPhone ? ord.customerPhone.replace(/\D/g, "") : "";
    const itemsList = ord.items.map((it) => `• ${it.quantity}x ${it.name} (${restaurant.currencySymbol}${it.price * it.quantity})`).join("\n");
    const discountText = ord.discount && ord.discount > 0 ? `\n🎉 Discount: -${restaurant.currencySymbol}${ord.discount} (${ord.couponCode || "Coupon"})` : "";
    const text = `🍽️ *${restaurant.name}*\n` +
      `📍 Table: ${ord.tableNumber}\n` +
      `🧾 Order: #${ord.id.slice(-4)}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `${itemsList}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `Subtotal: ${restaurant.currencySymbol}${ord.subtotal}\n` +
      `Taxes (GST ${restaurant.taxRatePercent}%): ${restaurant.currencySymbol}${ord.tax}` +
      `${discountText}\n` +
      `*Grand Total: ${restaurant.currencySymbol}${ord.total}*\n` +
      `Payment Status: ${ord.paymentStatus === "paid" ? "✅ Paid" : "⚠️ Unpaid"} (${ord.paymentMethod?.replace("_", " ")})\n` +
      (ord.paymentStatus !== "paid" && restaurant.upiId ? `Pay via UPI: ${restaurant.upiId}\n` : "") +
      `\nThank you for dining with us! 🙏`;

    return phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Submit Star Rating
  const handleRatingSubmit = async (orderId: string, rating: number) => {
    setRatingsMap((prev) => ({ ...prev, [orderId]: rating }));
    try {
      const res = await fetch("/api/orders/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating }),
      });
      if (!res.ok) throw new Error("Rating submit failed");
      setSubmittedRatingMap((prev) => ({ ...prev, [orderId]: true }));
      const msg = rating >= 4
        ? (lang === "hi" ? "⭐ धन्यवाद! हमें Google पर रिव्यू ज़रूर दें!" : "⭐ Thank you! We'd love your Google review!")
        : (lang === "hi" ? "🙏 आपकी प्रतिक्रिया के लिए धन्यवाद!" : "🙏 Thank you for your feedback!");
      showToast(msg);
    } catch {
      // ignore
    }
  };

  // Category counts map
  const categoryCounts = useMemo(() => {
    if (!restaurant) return {};
    const counts: Record<string, number> = { all: restaurant.menuItems.length };
    restaurant.menuItems.forEach((it) => {
      counts[it.categoryId] = (counts[it.categoryId] || 0) + 1;
    });
    return counts;
  }, [restaurant]);

  // Recommended Add-ons (Dishes not in cart, e.g. Desserts & Drinks)
  const recommendedAddons = useMemo(() => {
    if (!restaurant) return [];
    return restaurant.menuItems
      .filter((it) => !cart[it.id] && it.isAvailable && (it.isBestseller || it.categoryId.includes("cat-4") || it.categoryId.includes("cat-5") || it.name.toLowerCase().includes("shake") || it.name.toLowerCase().includes("cooler")))
      .slice(0, 4);
  }, [restaurant, cart]);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    if (!restaurant) return [];
    const catMap = new Map(restaurant.categories.map((c) => [c.id, c.name.toLowerCase()]));

    return restaurant.menuItems.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.categoryId !== selectedCategory) return false;
      
      // Dietary filter
      if (dietaryFilter === "veg" && !item.isVeg) return false;
      if (dietaryFilter === "non_veg" && item.isVeg) return false;

      // Smart Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const catName = catMap.get(item.categoryId) || "";
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) ?? false;
        const matchesCat = catName.includes(q);
        return matchesName || matchesDesc || matchesCat;
      }
      return true;
    });
  }, [restaurant, selectedCategory, dietaryFilter, searchQuery]);

  // Premium Shimmer Skeleton Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 max-w-md mx-auto space-y-4 animate-pulse">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-16 h-4 bg-orange-100 rounded-md" />
            <div className="w-36 h-6 bg-slate-200 rounded-md" />
            <div className="w-24 h-3 bg-slate-100 rounded" />
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          <div className="w-24 h-8 bg-slate-200 rounded-full shrink-0" />
          <div className="w-28 h-8 bg-slate-200 rounded-full shrink-0" />
          <div className="w-28 h-8 bg-slate-200 rounded-full shrink-0" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 border border-slate-200/60 shadow-sm">
              <div className="w-24 h-24 bg-slate-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-full h-3 bg-slate-100 rounded" />
                <div className="w-20 h-4 bg-orange-100 rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (restaurant && restaurant.isActive === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">
          {lang === "hi" ? "सेवा अस्थायी रूप से बंद है" : "Service Temporarily Paused"}
        </h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6">
          {lang === "hi" 
            ? `${restaurant.name} ने अस्थायी रूप से डिजिटल ऑर्डरिंग बंद की है। कृपया वेटर या स्टाफ से संपर्क करें।`
            : `${restaurant.name} has temporarily paused online digital ordering. Please ask the restaurant staff for assistance.`}
        </p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <UtensilsCrossed className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Restaurant Menu Unavailable</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6">
          {error || "Could not find menu for this QR code. Please ask the waiter for assistance."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <span>Return to ScanBite Home</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Demo View Banner */}
      {slug === "grand-spice" && (
        <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white text-[11px]">📱 Diner QR Ordering (Table 4 Demo)</span>
          </div>
          <Link href="/register" className="text-orange-400 hover:text-orange-300 font-bold text-[11px] underline">
            Get QR Menu for your cafe →
          </Link>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-bounce max-w-[90vw] text-center border border-slate-700">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <button
                  onClick={() => setIsTablePickerOpen(true)}
                  className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-0.5 rounded-md flex items-center gap-1 transition border border-orange-200/60"
                  title="Switch Table"
                >
                  <span>{currentTable?.tableNumber}</span>
                  <span className="text-[9px] text-orange-500">▼</span>
                </button>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">{restaurant.name}</h1>
              {restaurant.tagline && (
                <p className="text-xs text-slate-500 line-clamp-1">{restaurant.tagline}</p>
              )}
            </div>

            {/* Language Switcher & Orders Tracker Icon */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-sm"
                title="Switch Language"
              >
                <Languages className="w-3.5 h-3.5 text-orange-600" />
                <span>{lang === "en" ? "हिंदी" : "EN"}</span>
              </button>

              <button
                onClick={() => setIsOrdersOpen(true)}
                className="relative p-2.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition shadow-sm border border-orange-200/60"
                title="View Table Orders"
              >
                <Clock className="w-5 h-5" />
                {tableOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {tableOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Waiter Action Buttons with Cooldown Anti-Spam */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => triggerServiceRequest("water")}
              disabled={Boolean(serviceCooldowns.water)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-60 rounded-lg text-xs font-semibold transition border border-sky-100"
            >
              <Droplets className="w-3.5 h-3.5 shrink-0" />
              <span>
                {serviceCooldowns.water ? `${t.requested} (${serviceCooldowns.water}s)` : t.water}
              </span>
            </button>
            <button
              onClick={() => triggerServiceRequest("waiter")}
              disabled={Boolean(serviceCooldowns.waiter)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-60 rounded-lg text-xs font-semibold transition border border-amber-100"
            >
              <BellRing className="w-3.5 h-3.5 shrink-0" />
              <span>
                {serviceCooldowns.waiter ? `${t.requested} (${serviceCooldowns.waiter}s)` : t.callWaiter}
              </span>
            </button>
            <button
              onClick={() => triggerServiceRequest("bill")}
              disabled={Boolean(serviceCooldowns.bill)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 rounded-lg text-xs font-semibold transition border border-emerald-100"
            >
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span>
                {serviceCooldowns.bill ? `${t.requested} (${serviceCooldowns.bill}s)` : t.getBill}
              </span>
            </button>
          </div>

          {/* Search Bar with Clear Button */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-slate-800 placeholder-slate-400 pl-9 pr-8 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition border border-slate-200/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 3-Way Dietary Filter (All / Veg 🟢 / Non-Veg 🔴) */}
          <div className="grid grid-cols-3 gap-1.5 mt-2.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setDietaryFilter("all")}
              className={`py-1 text-xs font-bold rounded-lg transition ${
                dietaryFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.dietAll}
            </button>
            <button
              onClick={() => setDietaryFilter("veg")}
              className={`py-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                dietaryFilter === "veg" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 border border-white" />
              <span>{t.dietVeg}</span>
            </button>
            <button
              onClick={() => setDietaryFilter("non_veg")}
              className={`py-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                dietaryFilter === "non_veg" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 border border-white" />
              <span>{t.dietNonVeg}</span>
            </button>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="border-t border-slate-100 overflow-x-auto no-scrollbar py-2 px-4 max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>{t.allItems}</span>
            <span className="text-[10px] opacity-75 font-normal">({categoryCounts.all || 0})</span>
          </button>
          {restaurant.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
                selectedCategory === cat.id
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75 font-normal">({categoryCounts[cat.id] || 0})</span>
            </button>
          ))}
        </div>
      </header>

      {/* Dishes List */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 my-8">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">{t.noDishesFound}</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search or diet filter.</p>
            {(searchQuery || dietaryFilter !== "all" || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDietaryFilter("all");
                  setSelectedCategory("all");
                }}
                className="mt-3 px-3 py-1.5 bg-orange-50 text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-100 transition"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const inCartQty = cart[item.id]?.quantity || 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3.5 border transition shadow-sm flex gap-3.5 ${
                  item.isAvailable ? "border-slate-200/70" : "border-slate-200 opacity-60 bg-slate-50"
                }`}
              >
                {/* Food Image */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";
                    }}
                  />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        {t.soldOut}
                      </span>
                    </div>
                  )}
                  {item.isBestseller && item.isAvailable && (
                    <div className="absolute top-1.5 left-1.5 bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      {t.bestseller}
                    </div>
                  )}
                </div>

                {/* Food Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {/* Veg / Non-Veg Icon */}
                      <span
                        className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${
                          item.isVeg ? "border-emerald-600" : "border-red-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? "bg-emerald-600" : "bg-red-600"
                          }`}
                        />
                      </span>

                      {/* Spice meter */}
                      {item.spiceLevel !== undefined && item.spiceLevel > 0 && (
                        <span className="flex text-[11px]" title={`Spice: ${item.spiceLevel}/3`}>
                          {Array.from({ length: item.spiceLevel }).map((_, i) => (
                            <span key={i}>🌶️</span>
                          ))}
                        </span>
                      )}

                      {/* Prep Time */}
                      {item.prepTimeMinutes && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-medium ml-auto">
                          <Clock className="w-3 h-3" />
                          <span>{item.prepTimeMinutes}m</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.name}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="text-sm font-extrabold text-slate-900">
                      {restaurant.currencySymbol}
                      {item.price}
                    </span>

                    {/* Add Button or Stepper */}
                    {item.isAvailable ? (
                      inCartQty === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" /> {t.add}
                        </button>
                      ) : (
                        <div className="flex items-center bg-orange-600 text-white rounded-lg shadow-sm font-bold text-xs">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="px-2.5 py-1.5 hover:bg-orange-700 rounded-l-lg transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2">{inCartQty}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="px-2.5 py-1.5 hover:bg-orange-700 rounded-r-lg transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">{t.soldOut}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">
                {cartCount} {cartCount === 1 ? t.itemAdded : t.itemsAdded}
              </div>
              <div className="text-base font-extrabold text-white">
                {restaurant.currencySymbol}
                {grandTotal}{" "}
                <span className="text-[10px] text-slate-400 font-normal">{t.inclTax}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 transition"
            >
              <ShoppingBag className="w-4 h-4" /> {t.viewCart}
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            {/* Modal Header with Clear Cart */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">{t.yourOrderSummary}</h2>
                <p className="text-xs text-orange-600 font-semibold">{currentTable?.tableNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                {cartCount > 0 && (
                  <button
                    onClick={clearEntireCart}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition text-xs font-semibold flex items-center gap-1"
                    title={t.clearCart}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.clearCart}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-100">
              {cartItems.map(({ item, quantity, notes }) => (
                <div key={item.id} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${
                          item.isVeg ? "border-emerald-600" : "border-red-600"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            item.isVeg ? "bg-emerald-600" : "bg-red-600"
                          }`}
                        />
                      </span>
                      <span className="font-semibold text-slate-800 text-xs">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-100 rounded-lg font-bold text-xs">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 text-slate-900">{quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-900 w-14 text-right">
                        {restaurant.currencySymbol}
                        {item.price * quantity}
                      </span>
                    </div>
                  </div>

                  {/* Special notes per item */}
                  <input
                    type="text"
                    placeholder={t.cookingNotePlaceholder}
                    value={notes}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    className="w-full mt-1.5 bg-slate-50 text-[11px] text-slate-700 placeholder-slate-400 px-2.5 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}

              {/* Recommended Add-ons (Cross-selling) */}
              {recommendedAddons.length > 0 && (
                <div className="pt-4">
                  <p className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>{t.frequentlyOrderedTogether}</span>
                  </p>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {recommendedAddons.map((addon) => (
                      <div
                        key={addon.id}
                        className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex-shrink-0 w-36 flex flex-col justify-between"
                      >
                        <div className="w-full h-16 rounded-lg overflow-hidden mb-1.5 bg-slate-200">
                          <img
                            src={addon.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"}
                            alt={addon.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 line-clamp-1">{addon.name}</div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200">
                          <span className="text-[10px] font-extrabold text-slate-900">
                            {restaurant.currencySymbol}
                            {addon.price}
                          </span>
                          <button
                            onClick={() => addToCart(addon)}
                            className="text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded hover:bg-orange-700 active:scale-95"
                          >
                            + ADD
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo Code Section with Clickable Coupons */}
              <div className="pt-3">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t.couponPlaceholder}
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg uppercase font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition"
                  >
                    {t.apply}
                  </button>
                </form>

                {/* Quick 1-Tap Coupon Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold">{t.availableOffers}</span>
                  <button
                    type="button"
                    onClick={() => applyCouponCode("WELCOME10")}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                      appliedCoupon?.code === "WELCOME10"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                    }`}
                  >
                    WELCOME10 (10% OFF)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCouponCode("FLAT50")}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                      appliedCoupon?.code === "FLAT50"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                    }`}
                  >
                    FLAT50 (₹50 OFF)
                  </button>
                </div>

                {appliedCoupon && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-{restaurant.currencySymbol}{discountAmount})</span>
                  </p>
                )}
                {couponError && <p className="text-[10px] text-red-500 font-medium mt-1">{couponError}</p>}
              </div>

              {/* Customer Details (Optional) */}
              <div className="pt-4 space-y-2">
                <p className="text-xs font-bold text-slate-700">{t.dinerDetails}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t.yourName}
                    value={customerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="bg-slate-50 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <input
                    type="tel"
                    placeholder={t.phoneForBill}
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="bg-slate-50 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="pt-3">
                <p className="text-xs font-bold text-slate-700 mb-2">{t.paymentOption}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi_online")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition ${
                      paymentMethod === "upi_online"
                        ? "border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t.upiQr}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("counter_cash")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition ${
                      paymentMethod === "counter_cash"
                        ? "border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t.cashCounter}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                  {paymentMethod === "upi_online"
                    ? (lang === "hi" ? "💡 ऑर्डर भेजने के तुरंत बाद UPI QR / GPay विकल्प स्क्रीन पर आएगा" : "💡 UPI QR & Tap-to-Pay will appear right after sending to kitchen")
                    : (lang === "hi" ? "💡 भोजन के बाद काउंटर पर नकद या कार्ड से भुगतान करें" : "💡 Settle your bill at the counter after finishing your meal")}
                </p>
              </div>

              {/* Bill Breakdown */}
              <div className="pt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <span>
                    {restaurant.currencySymbol}
                    {subtotal}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>{t.discount} ({appliedCoupon?.code})</span>
                    <span>
                      -{restaurant.currencySymbol}
                      {discountAmount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{lang === "hi" ? `टैक्स (GST ${taxRate}%)` : `Taxes (GST ${taxRate}%)`}</span>
                  <span>
                    {restaurant.currencySymbol}
                    {taxAmount}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>{t.grandTotal}</span>
                  <span className="text-orange-600">
                    {restaurant.currencySymbol}
                    {grandTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Send to Kitchen Button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 active:scale-98 transition disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <span>{t.sendingToKitchen}</span>
                ) : (
                  <>
                    <span>{t.confirmSend} ({restaurant.currencySymbol}{grandTotal})</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Table Orders Tracking Drawer */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">{t.liveOrdersFor} {currentTable?.tableNumber}</h2>
                <p className="text-xs text-slate-500">{t.realTimeStatus}</p>
              </div>
              <button
                onClick={() => setIsOrdersOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {tableOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No active orders yet</p>
                  <p className="text-xs text-slate-400 mt-1">Browse the menu and place your first delicious dish!</p>
                </div>
              ) : (
                tableOrders.map((order) => {
                  const statusColors = {
                    pending: "bg-amber-100 text-amber-800 border-amber-200",
                    cooking: "bg-orange-100 text-orange-800 border-orange-200 animate-pulse",
                    ready: "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold",
                    served: "bg-blue-100 text-blue-800 border-blue-200",
                    completed: "bg-slate-100 text-slate-700 border-slate-200",
                    cancelled: "bg-red-100 text-red-700 border-red-200",
                  };

                  const statusLabels = {
                    pending: lang === "hi" ? "⏳ ऑर्डर प्राप्त हुआ (शेफ का इंतज़ार)" : "⏳ Order Received (Waiting for Chef)",
                    cooking: lang === "hi" ? "👨‍🍳 रसोई में तैयार हो रहा है" : "👨‍🍳 Cooking in Kitchen",
                    ready: lang === "hi" ? "🔔 परोसने के लिए तैयार!" : "🔔 Ready to Serve!",
                    served: lang === "hi" ? "✅ टेबल पर परोस दिया गया" : "✅ Served at Table",
                    completed: lang === "hi" ? "🎉 भुगतान पूरा हुआ" : "🎉 Paid & Completed",
                    cancelled: lang === "hi" ? "❌ रद्द किया गया" : "❌ Cancelled",
                  };

                  const currentRating = ratingsMap[order.id] || order.rating || 0;
                  const hasSubmittedRating = submittedRatingMap[order.id] || Boolean(order.rating);

                  // Visual timeline step (0 to 3)
                  const stepIndex = order.status === "pending" ? 0 
                    : order.status === "cooking" ? 1 
                    : order.status === "ready" ? 2 
                    : order.status === "served" || order.status === "completed" ? 3 : -1;

                  return (
                    <div key={order.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Order #{order.id.slice(-4)}</span>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full border ${
                            statusColors[order.status]
                          }`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>

                      {/* Visual Timeline (if not cancelled) */}
                      {stepIndex >= 0 && (
                        <div className="my-3 px-1">
                          <div className="grid grid-cols-4 gap-1 text-center">
                            <div className={`text-[10px] font-bold ${stepIndex >= 0 ? "text-orange-600" : "text-slate-400"}`}>
                              ⏳ {lang === "hi" ? "प्राप्त" : "Placed"}
                            </div>
                            <div className={`text-[10px] font-bold ${stepIndex >= 1 ? "text-orange-600" : "text-slate-400"}`}>
                              👨‍🍳 {lang === "hi" ? "रसोई" : "Kitchen"}
                            </div>
                            <div className={`text-[10px] font-bold ${stepIndex >= 2 ? "text-orange-600" : "text-slate-400"}`}>
                              🔔 {lang === "hi" ? "तैयार" : "Ready"}
                            </div>
                            <div className={`text-[10px] font-bold ${stepIndex >= 3 ? "text-emerald-600" : "text-slate-400"}`}>
                              ✅ {lang === "hi" ? "परोसा" : "Served"}
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="bg-orange-500 h-full transition-all duration-500" 
                              style={{ width: `${((stepIndex + 1) / 4) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-1.5 my-3 text-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-800">
                            <span>
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-semibold">
                              {restaurant.currencySymbol}
                              {it.price * it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.discount && order.discount > 0 ? (
                        <div className="flex justify-between text-xs text-emerald-600 font-semibold mb-1">
                          <span>{t.discount} {order.couponCode ? `(${order.couponCode})` : ""}</span>
                          <span>-{restaurant.currencySymbol}{order.discount}</span>
                        </div>
                      ) : null}

                      <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600">{t.grandTotal}</span>
                        <span className="text-slate-900 text-sm">
                          {restaurant.currencySymbol}
                          {order.total}
                        </span>
                      </div>

                      {/* Order Payment Status / UPI Box */}
                      {order.paymentStatus === "paid" ? (
                        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{t.paymentCompleted} ({order.paymentMethod?.replace("_", " ")})</span>
                        </div>
                      ) : order.paymentMethod === "upi_online" ? (
                        <OrderUpiBox order={order} restaurant={restaurant} tableNumber={currentTable?.tableNumber} />
                      ) : (
                        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <span className="font-semibold">{t.paymentCounterCash}</span>
                          <span className="font-bold text-[11px] bg-amber-200/60 px-2 py-0.5 rounded">{t.payAtCounter}</span>
                        </div>
                      )}

                      {/* WhatsApp Bill Receipt Button */}
                      <a
                        href={generateWhatsAppBillUri(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-2.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{lang === "hi" ? "व्हाट्सएप पर बिल रसीद प्राप्त करें 💬" : "Get Bill Receipt on WhatsApp 💬"}</span>
                      </a>

                      {/* Interactive Meal Rating & Google Review Boost */}
                      {(order.status === "served" || order.status === "completed") && (
                        <div className="mt-3 pt-3 border-t border-slate-200/90 text-center">
                          <p className="text-[11px] font-bold text-slate-800 mb-1">{t.rateYourMeal}</p>
                          <div className="flex items-center justify-center gap-1 my-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRatingSubmit(order.id, star)}
                                className="p-1 hover:scale-125 transition"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    star <= currentRating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>

                          {currentRating >= 4 && (
                            <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in">
                              <p className="text-[10px] font-bold text-amber-900 mb-1">
                                Loved your experience? Support us with 5-Stars!
                              </p>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(restaurant.name + " " + (restaurant.address || ""))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded-lg shadow-sm"
                              >
                                <span>{t.shareOnGoogle}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {hasSubmittedRating && currentRating < 4 && currentRating > 0 && (
                            <p className="text-[10px] text-slate-500 mt-1">{t.thankYouFeedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions: Order More Dishes + Close */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setIsOrdersOpen(false)}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1"
              >
                <span>{t.addMoreItems}</span>
              </button>
              <button
                onClick={() => setIsOrdersOpen(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Switcher Modal */}
      {isTablePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  {t.switchTable}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === "hi" ? "वर्तमान टेबल: " : "Current: "}
                  <strong className="text-orange-600">{currentTable?.tableNumber}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsTablePickerOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-3">
                {t.selectYourTable}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {restaurant.tables.map((tbl) => {
                  const isCurrent = tbl.id === currentTable?.id;
                  return (
                    <Link
                      key={tbl.id}
                      href={`/r/${slug}/t/${tbl.id}`}
                      onClick={() => setIsTablePickerOpen(false)}
                      className={`p-3 rounded-xl border text-center transition ${
                        isCurrent
                          ? "border-orange-500 bg-orange-50 font-black text-orange-700 shadow-sm"
                          : "border-slate-200 hover:border-orange-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-xs font-bold">{tbl.tableNumber}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isCurrent ? (lang === "hi" ? "वर्तमान" : "Current") : `${tbl.seats || 4} seats`}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setIsTablePickerOpen(false)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
              >
                {lang === "hi" ? "रद्द करें" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderUpiBox({
  order,
  restaurant,
  tableNumber,
}: {
  order: Order;
  restaurant: Restaurant;
  tableNumber?: string;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const uri = useMemo(() => {
    const vpa = (restaurant.upiId || "restaurant@upi").trim();
    const name = encodeURIComponent(restaurant.name);
    const tableTag = encodeURIComponent(tableNumber || order.tableNumber || "Table");
    const amount = Number(order.total).toFixed(2);
    return `upi://pay?pa=${vpa}&pn=${name}&am=${amount}&cu=INR&tn=Bill%20Order%20${order.id.slice(-4)}%20${tableTag}`;
  }, [restaurant, order, tableNumber]);

  useEffect(() => {
    QRCode.toDataURL(uri, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [uri]);

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 text-center bg-orange-50/60 p-3 rounded-xl border border-orange-100">
      <p className="text-[11px] font-bold text-orange-950 mb-1">
        Scan & Pay via UPI for Order #{order.id.slice(-4)}:
      </p>
      <p className="text-[10px] text-slate-500 mb-2">
        VPA: <strong>{restaurant.upiId || "restaurant@upi"}</strong> • Amount: <strong>{restaurant.currencySymbol}{order.total}</strong>
      </p>
      {qrUrl ? (
        <img
          src={qrUrl}
          alt={`UPI QR Code for Order #${order.id}`}
          className="w-36 h-36 mx-auto rounded-lg border border-slate-200 p-1.5 bg-white shadow-sm"
        />
      ) : (
        <div className="w-36 h-36 mx-auto bg-slate-100 rounded-lg animate-pulse flex items-center justify-center text-xs text-slate-400">
          Generating QR...
        </div>
      )}
      <a
        href={uri}
        className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95"
      >
        <span>Open in UPI App (GPay / PhonePe)</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
