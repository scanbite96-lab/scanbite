"use client";

import { useEffect, useState, useMemo, useRef, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { Restaurant, MenuItem, Order, OrderItem, PortionVariant, DishAddon, TableCart, TableDiner, TableCartItem } from "@/types";
import { DEMO_RESTAURANT } from "@/lib/demoData";
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
  Check,
  Users,
  UserPlus,
  Share2,
  Split
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

  // Cart: Map of cartKey -> Cart item entry
  const [cart, setCart] = useState<
    Record<
      string,
      {
        cartKey: string;
        item: MenuItem;
        quantity: number;
        notes: string;
        variantName?: string;
        selectedAddons?: DishAddon[];
        unitPrice: number;
      }
    >
  >({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);

  // Customisation Modal State (Portion Sizes & Add-ons)
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<PortionVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<DishAddon[]>([]);
  const [customizingQty, setCustomizingQty] = useState<number>(1);

  // Promo Code State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percentOff?: number; flatOff?: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Diner identity for Group Ordering
  const [dinerId, setDinerId] = useState<string>("");
  const [dinerName, setDinerName] = useState<string>("");
  const [isDinerNameModalOpen, setIsDinerNameModalOpen] = useState(false);
  const [tempDinerName, setTempDinerName] = useState("");

  // Shared Table Cart from database
  const [tableCart, setTableCart] = useState<TableCart | null>(null);

  // Customer form details with localStorage persistence
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"counter_cash" | "upi_online">("upi_online");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Table active orders & Rating state
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [showUpiForOrder, setShowUpiForOrder] = useState<Record<string, boolean>>({});
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});
  const [submittedRatingMap, setSubmittedRatingMap] = useState<Record<string, boolean>>({});
  const previousStatusMap = useRef<Record<string, string>>({});
  const prevOrdersCountRef = useRef<number>(0);

  // Service request cooldown timer (seconds remaining)
  const [serviceCooldowns, setServiceCooldowns] = useState<Record<string, number>>({});

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Fetch restaurant details
  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const res = await fetch(`/api/restaurants?slug=${slug}`);
        if (!res.ok) {
          if (slug === "grand-spice") {
            setRestaurant(DEMO_RESTAURANT);
            return;
          }
          throw new Error("Restaurant not found");
        }
        const data = await res.json();
        if (!data || data.error || !data.tables || data.tables.length === 0) {
          if (slug === "grand-spice") {
            setRestaurant(DEMO_RESTAURANT);
            return;
          }
          throw new Error(data?.error || "Restaurant not found");
        }
        setRestaurant(data);
      } catch (err: unknown) {
        if (slug === "grand-spice") {
          setRestaurant(DEMO_RESTAURANT);
          setError(null);
        } else if (err instanceof Error) {
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

    // Diner identity for group orders
    let savedId = localStorage.getItem("scanbite_diner_id");
    if (!savedId) {
      savedId = `diner_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("scanbite_diner_id", savedId);
    }
    setDinerId(savedId);

    const savedName = localStorage.getItem("scanbite_diner_name");
    if (savedName && !savedName.startsWith("Diner ")) {
      setDinerName(savedName);
      setTempDinerName(savedName);
      setCustomerName(savedName);
    } else {
      setDinerName("");
      setTempDinerName("");
      setCustomerName("");
      try {
        localStorage.removeItem("scanbite_diner_name");
      } catch {}
    }

    const storageKey = `scanbite_cart_${slug}_${tableParam}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized: Record<string, { cartKey: string; item: MenuItem; quantity: number; notes: string; variantName?: string; selectedAddons?: DishAddon[]; unitPrice: number }> = {};
        for (const [key, val] of Object.entries<any>(parsed)) {
          if (val && val.item) {
            normalized[key] = {
              cartKey: val.cartKey || key,
              item: val.item,
              quantity: Number(val.quantity) || 1,
              notes: val.notes || "",
              variantName: val.variantName || undefined,
              selectedAddons: val.selectedAddons || [],
              unitPrice: Number(val.unitPrice ?? val.item.price),
            };
          }
        }
        setCart(normalized);
      }
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
    setDinerName(val);
    setTempDinerName(val);
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
      const res = await fetch(`/api/orders?restaurantId=${restaurant.id}&tableId=${currentTable.id}&activeOnly=true`);
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

        if (prevOrdersCountRef.current > 0 && data.length === 0) {
          setIsOrdersOpen(false);
          showToast(lang === "hi" ? "टेबल का ऑर्डर पूरा हुआ। मेन्यू तैयार है! 🍽️" : "Order completed! Fresh menu ready 🍽️");
        }

        prevOrdersCountRef.current = data.length;
        setTableOrders(data);
      }
    } catch {
      // ignore
    }
  };

  // 4b. Sync Shared Table Cart
  const syncTableCart = async () => {
    if (!restaurant || !currentTable) return;
    try {
      const res = await fetch(`/api/cart?restaurantId=${restaurant.id}&tableId=${currentTable.id}&tableNumber=${encodeURIComponent(currentTable.tableNumber)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.cart) {
          setTableCart(data.cart);
        }
      }
    } catch {
      // ignore
    }
  };

  const joinTableCart = async (nameToUse?: string) => {
    if (!restaurant || !currentTable || !dinerId) return;
    const activeName = (nameToUse || dinerName || customerName).trim() || "Guest";
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          restaurantId: restaurant.id,
          tableId: currentTable.id,
          tableNumber: currentTable.tableNumber,
          dinerId,
          dinerName: activeName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.cart) {
          setTableCart(data.cart);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (restaurant && currentTable && dinerId) {
      joinTableCart();
      syncTableCart();
    }
  }, [restaurant, currentTable, dinerId]);

  useEffect(() => {
    fetchOrders();
    syncTableCart();
    const interval = setInterval(() => {
      fetchOrders();
      syncTableCart();
    }, 3500); // 3.5-second real-time sync for orders and table cart
    return () => clearInterval(interval);
  }, [restaurant, currentTable]);

  // Cart operations with haptic vibration feedback
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  // Open Customisation Bottom Sheet Modal
  const openCustomiseModal = (item: MenuItem) => {
    setCustomizingItem(item);
    setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
    setSelectedAddons([]);
    setCustomizingQty(1);
  };

  const handleItemAddClick = (item: MenuItem) => {
    const hasVariants = Boolean(item.variants && item.variants.length > 0);
    const hasAddons = Boolean(item.addons && item.addons.length > 0);
    if (hasVariants || hasAddons) {
      openCustomiseModal(item);
    } else {
      addToCart(item);
    }
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    triggerHaptic();

    const variantPart = selectedVariant ? selectedVariant.name : "base";
    const addonIds = [...selectedAddons].map((a) => a.id).sort().join("-");
    const cartKey = `${customizingItem.id}_${variantPart}_${addonIds || "none"}`;

    const basePrice = selectedVariant ? selectedVariant.price : customizingItem.price;
    const addonsSum = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = basePrice + addonsSum;

    // Optimistically update local cart
    setCart((prev) => {
      const existing = prev[cartKey];
      const newQty = (existing?.quantity || 0) + customizingQty;
      return {
        ...prev,
        [cartKey]: {
          cartKey,
          item: customizingItem,
          quantity: newQty,
          notes: existing?.notes || "",
          variantName: selectedVariant?.name,
          selectedAddons: selectedAddons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
          unitPrice,
        },
      };
    });

    // Also sync to shared table cart in database
    if (restaurant && currentTable && dinerId) {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          restaurantId: restaurant.id,
          tableId: currentTable.id,
          tableNumber: currentTable.tableNumber,
          dinerId,
          dinerName: dinerName || customerName || "Guest",
          item: {
            id: customizingItem.id,
            name: customizingItem.name,
            price: unitPrice,
            isVeg: customizingItem.isVeg,
          },
          quantity: customizingQty,
          variantName: selectedVariant?.name,
          selectedAddons: selectedAddons.map((a) => ({ name: a.name, price: a.price })),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.cart) setTableCart(data.cart);
        })
        .catch(() => {});
    }

    const variantLabel = selectedVariant ? ` (${selectedVariant.name})` : "";
    showToast(
      lang === "hi"
        ? `✅ ${customizingItem.name}${variantLabel} कार्ट में जोड़ा गया!`
        : `✅ Added ${customizingItem.name}${variantLabel} to cart!`
    );
    setCustomizingItem(null);
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
        [item.id]: {
          cartKey: item.id,
          item,
          quantity: 1,
          notes: "",
          unitPrice: item.price,
        },
      };
    });

    // Also sync to shared table cart in database
    if (restaurant && currentTable && dinerId) {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          restaurantId: restaurant.id,
          tableId: currentTable.id,
          tableNumber: currentTable.tableNumber,
          dinerId,
          dinerName: dinerName || customerName || "Guest",
          item: {
            id: item.id,
            name: item.name,
            price: item.price,
            isVeg: item.isVeg,
          },
          quantity: 1,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.cart) setTableCart(data.cart);
        })
        .catch(() => {});
    }
  };

  const incrementCartKey = (key: string) => {
    triggerHaptic();
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: { ...existing, quantity: existing.quantity + 1 },
      };
    });
  };

  const decrementCartKey = (key: string) => {
    triggerHaptic();
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return {
        ...prev,
        [key]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const updateSharedCartItem = async (itemId: string, newQty: number, newNotes?: string) => {
    triggerHaptic();
    if (newQty <= 0) {
      removeSharedCartItem(itemId);
      return;
    }

    setTableCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId
            ? { ...it, quantity: newQty, notes: newNotes !== undefined ? newNotes : it.notes }
            : it
        ),
      };
    });

    if (restaurant && currentTable) {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_item",
            tableId: currentTable.id,
            itemId,
            quantity: newQty,
            notes: newNotes,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.cart) setTableCart(data.cart);
        }
      } catch {}
    }
  };

  const removeSharedCartItem = async (itemId: string) => {
    triggerHaptic();
    setTableCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((it) => it.id !== itemId),
      };
    });

    if (restaurant && currentTable) {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "remove_item",
            tableId: currentTable.id,
            itemId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.cart) setTableCart(data.cart);
        }
      } catch {}
    }
  };

  const removeFromCart = (keyOrId: string) => {
    decrementCartKey(keyOrId);
    if (tableCart && tableCart.items) {
      const myItem = tableCart.items.find((it) => it.menuItemId === keyOrId && (it.dinerId === dinerId || it.dinerName === dinerName))
        || tableCart.items.find((it) => it.menuItemId === keyOrId);
      if (myItem) {
        updateSharedCartItem(myItem.id, myItem.quantity - 1);
      }
    }
  };

  const getItemCartQuantity = (itemId: string) => {
    if (tableCart && tableCart.items && tableCart.items.length > 0) {
      return tableCart.items
        .filter((it) => it.menuItemId === itemId)
        .reduce((sum, it) => sum + it.quantity, 0);
    }
    return Object.values(cart)
      .filter((c) => c.item.id === itemId)
      .reduce((sum, c) => sum + c.quantity, 0);
  };

  const clearEntireCart = () => {
    setCart({});
    setTableCart((prev) => (prev ? { ...prev, items: [] } : null));
    setAppliedCoupon(null);
    setCouponInput("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(`scanbite_cart_${slug}_${tableParam}`);
    }
    if (restaurant && currentTable) {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear_cart",
          tableId: currentTable.id,
        }),
      }).catch(() => {});
    }
    showToast(lang === "hi" ? "कार्ट खाली कर दिया गया है" : "Cart cleared");
  };

  const updateItemNotes = (cartKey: string, notes: string) => {
    setCart((prev) => {
      if (!prev[cartKey]) return prev;
      return {
        ...prev,
        [cartKey]: { ...prev[cartKey], notes },
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

  // Shared table cart items
  const sharedItems = tableCart?.items || [];
  const hasSharedItems = sharedItems.length > 0;

  // Cart calculations
  const cartItems = Object.values(cart);
  const cartCount = hasSharedItems
    ? sharedItems.reduce((acc, c) => acc + c.quantity, 0)
    : cartItems.reduce((acc, c) => acc + c.quantity, 0);

  const subtotal = hasSharedItems
    ? sharedItems.reduce((acc, c) => acc + c.price * c.quantity, 0)
    : cartItems.reduce((acc, c) => acc + (c.unitPrice ?? c.item.price) * c.quantity, 0);

  const myShareSubtotal = hasSharedItems
    ? sharedItems
        .filter((c) => c.dinerId === dinerId || c.dinerName === dinerName)
        .reduce((acc, c) => acc + c.price * c.quantity, 0)
    : subtotal;
  
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

  // Place Order (Master Order for Table)
  const handlePlaceOrder = async () => {
    if (cartCount === 0 || !restaurant || !currentTable) return;
    setIsPlacingOrder(true);
    try {
      const orderPayloadItems: OrderItem[] = hasSharedItems
        ? sharedItems.map((c) => ({
            menuItemId: c.menuItemId,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            isVeg: c.isVeg,
            notes: c.notes || undefined,
            variantName: c.variantName || undefined,
            selectedAddons:
              c.selectedAddons && Array.isArray(c.selectedAddons) && c.selectedAddons.length > 0
                ? (c.selectedAddons as any[]).map((a) => ({ name: a.name, price: a.price }))
                : undefined,
            orderedByName: c.dinerName || dinerName || "Guest",
          }))
        : cartItems.map((c) => ({
            menuItemId: c.item.id,
            name: c.item.name,
            price: c.unitPrice ?? c.item.price,
            quantity: c.quantity,
            isVeg: c.item.isVeg,
            notes: c.notes || undefined,
            variantName: c.variantName || undefined,
            selectedAddons:
              c.selectedAddons && c.selectedAddons.length > 0
                ? c.selectedAddons.map((a) => ({ name: a.name, price: a.price }))
                : undefined,
            orderedByName: dinerName || customerName || "Guest",
          }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: currentTable.id,
          tableNumber: currentTable.tableNumber,
          customerName: customerName.trim() || dinerName.trim() || undefined,
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
      setTableCart((prev) => (prev ? { ...prev, items: [] } : null));
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
    const itemsList = ord.items.map((it) => {
      const variantStr = it.variantName ? ` [${it.variantName}]` : "";
      const addonsStr = it.selectedAddons && it.selectedAddons.length > 0
        ? `\n   ↳ + ${it.selectedAddons.map((a: any) => `${a.name} (+${restaurant.currencySymbol}${a.price})`).join(", ")}`
        : "";
      return `• ${it.quantity}x ${it.name}${variantStr} (${restaurant.currencySymbol}${it.price * it.quantity})${addonsStr}`;
    }).join("\n");
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

  // Reset/Vacate Table for new customer or fresh session
  const handleResetTableSession = async () => {
    if (!restaurant || !currentTable) return;
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vacate_table",
          restaurantId: restaurant.id,
          tableId: currentTable.id,
        }),
      });
    } catch {
      // ignore
    }
    clearEntireCart();
    setTableOrders([]);
    setIsOrdersOpen(false);
    showToast(lang === "hi" ? "✨ टेबल खाली कर दी गई है! नए सिरे से मेन्यू तैयार है 🍽️" : "✨ Table reset! Fresh menu ready for new order 🍽️");
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
    const inCartIds = new Set(Object.values(cart).map((c) => c.item.id));
    return restaurant.menuItems
      .filter((it) => !inCartIds.has(it.id) && it.isAvailable && (it.isBestseller || it.categoryId.includes("cat-4") || it.categoryId.includes("cat-5") || it.name.toLowerCase().includes("shake") || it.name.toLowerCase().includes("cooler")))
      .slice(0, 4);
  }, [restaurant, cart]);

  // Filtered and Categorically Sorted Menu Items
  const filteredItems = useMemo(() => {
    if (!restaurant) return [];
    const catMap = new Map(restaurant.categories.map((c) => [c.id, c.name.toLowerCase()]));
    const catOrderMap = new Map(restaurant.categories.map((c, idx) => [c.id, c.sortOrder ?? idx]));

    const items = restaurant.menuItems.filter((item) => {
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

    // Ensure logical menu ordering: Starters -> Main Course -> Breads/Rice -> Beverages -> Desserts
    // And bestsellers at the top of each category
    return items.sort((a, b) => {
      const orderA = catOrderMap.get(a.categoryId) ?? 99;
      const orderB = catOrderMap.get(b.categoryId) ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      if (a.isBestseller && !b.isBestseller) return -1;
      if (!a.isBestseller && b.isBestseller) return 1;
      return 0;
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
    if (slug === "grand-spice") {
      setRestaurant(DEMO_RESTAURANT);
      setError(null);
      return null;
    }
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
      {/* Demo View Banner (Scrolls naturally with page) */}
      {slug === "grand-spice" && (
        <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 flex items-center justify-between">
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

      {/* Restaurant Hero Info & Waiter Quick Buttons (Scrolls away naturally) */}
      <section className="bg-white border-b border-slate-200/70">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60 flex items-center gap-1">
                  <span>📍 {currentTable?.tableNumber}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsTablePickerOpen(true)}
                  className="text-[10px] text-slate-400 hover:text-orange-600 underline transition"
                  title="Switch Table"
                >
                  (change)
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

          {/* Group Diners & Live Table Cart Bar */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-100">
            {tableCart?.diners && tableCart.diners.length > 1 ? (
              <div className="bg-gradient-to-r from-sky-50 via-sky-50/60 to-indigo-50/50 border border-sky-100 rounded-2xl p-3 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-black text-slate-800">
                      {t.groupOrdering}
                    </span>
                    <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full border border-sky-200">
                      {tableCart.diners.length} {t.peopleCount}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDinerNameModalOpen(true)}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 transition"
                  >
                    <span className="text-slate-500 font-medium">{t.joinedAs}</span>
                    <span className="underline font-black text-sky-800">{dinerName || "Set Name"}</span>
                    <span className="text-[10px]">✏️</span>
                  </button>
                </div>

                {/* Diners list chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tableCart.diners.map((d) => {
                    const isMe = d.dinerId === dinerId || d.name === dinerName;
                    return (
                      <span
                        key={d.dinerId}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition ${
                          isMe
                            ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                            : "bg-white text-slate-700 border-sky-200"
                        }`}
                      >
                        <span>👤 {d.name}</span>
                        {isMe && <span className="text-[9px] opacity-90 font-medium">(You)</span>}
                      </span>
                    );
                  })}

                  {/* Invite Friends / Share Table Link button */}
                  <button
                    type="button"
                    onClick={() => {
                      const url = typeof window !== "undefined" ? window.location.href : "";
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(url);
                        showToast(lang === "hi" ? "🔗 टेबल लिंक कॉपी हो गया! दोस्तों को भेजें।" : "🔗 Table link copied! Share with your table friends.");
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-sky-700 border border-dashed border-sky-300 hover:bg-sky-50 active:scale-95 transition"
                  >
                    <Share2 className="w-2.5 h-2.5" />
                    <span>{lang === "hi" ? "+ साथी जोड़ें" : "+ Invite"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs py-1 px-1">
                <button
                  type="button"
                  onClick={() => setIsDinerNameModalOpen(true)}
                  className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <span className="text-slate-400">👤 {lang === "hi" ? "ऑर्डर कर्ता:" : "Ordering as:"}</span>
                  <span className="font-bold text-slate-800 underline">{dinerName || (lang === "hi" ? "आप (नाम जोड़ें)" : "You (Set Name)")}</span>
                  <span className="text-[10px]">✏️</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(url);
                      showToast(lang === "hi" ? "🔗 टेबल लिंक कॉपी हो गया! दोस्तों को भेजें।" : "🔗 Table link copied! Share with your table friends.");
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/70 transition"
                >
                  <Users className="w-3 h-3 text-sky-600" />
                  <span>{lang === "hi" ? "👥 ग्रुप ऑर्डर (+साथी जोड़ें)" : "👥 Group Order (+Invite)"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Smart Compact Sticky Filter Bar (Docks cleanly at top when scrolling) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 pt-2.5 pb-2 space-y-2">
          {/* Search Bar + Live Orders Quick Access */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-800 placeholder-slate-400 pl-9 pr-8 py-2 text-base sm:text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition border border-slate-200/50"
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

            {/* Quick Orders Tracker Button when scrolled */}
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="relative p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition border border-orange-200/60 shrink-0"
              title="View Table Orders"
            >
              <Clock className="w-4 h-4" />
              {tableOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {tableOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* 3-Way Dietary Filter (All / Veg 🟢 / Non-Veg 🔴) */}
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-xl">
            <button
              onClick={() => setDietaryFilter("all")}
              className={`py-1 text-xs font-bold rounded-lg transition ${
                dietaryFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.dietAll}
            </button>
            <button
              onClick={() => setDietaryFilter("veg")}
              className={`py-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                dietaryFilter === "veg" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 border border-white" />
              <span>{t.dietVeg}</span>
            </button>
            <button
              onClick={() => setDietaryFilter("non_veg")}
              className={`py-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                dietaryFilter === "non_veg" ? "bg-red-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 border border-white" />
              <span>{t.dietNonVeg}</span>
            </button>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="border-t border-slate-100 overflow-x-auto no-scrollbar py-2 px-4 max-w-md mx-auto flex items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-xs"
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
                  ? "bg-orange-600 text-white shadow-xs"
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

      {/* Dishes List with Anti-Clip Scroll Margins */}
      <main className="max-w-md mx-auto px-4 pt-3.5 pb-32 space-y-3.5">
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
          filteredItems.map((item, idx) => {
            const inCartQty = getItemCartQuantity(item.id);
            const hasCustomisation = Boolean((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0));
            const prevItem = idx > 0 ? filteredItems[idx - 1] : null;
            const isNewCategory = selectedCategory === "all" && !searchQuery.trim() && (!prevItem || prevItem.categoryId !== item.categoryId);
            const currentCat = restaurant.categories.find((c) => c.id === item.categoryId);

            return (
              <Fragment key={item.id}>
                {isNewCategory && currentCat && (
                  <div className="pt-2 pb-0.5 flex items-center justify-between border-b border-slate-200/70 mb-1 scroll-mt-44">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-slate-700">
                      <span>{currentCat.icon}</span>
                      <span>{currentCat.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {categoryCounts[currentCat.id] || 0}
                    </span>
                  </div>
                )}
                <div
                  className={`bg-white rounded-2xl p-3.5 border transition shadow-xs flex gap-3.5 scroll-mt-44 ${
                    item.isAvailable ? "border-slate-200/80 hover:border-orange-200" : "border-slate-200 opacity-60 bg-slate-50"
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
                    {item.variants && item.variants.length > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase leading-none">
                          {t.fromPrice}
                        </span>
                        <span className="text-sm font-black text-slate-900 leading-tight">
                          {restaurant.currencySymbol}
                          {Math.min(...item.variants.map((v) => v.price))}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-extrabold text-slate-900">
                        {restaurant.currencySymbol}
                        {item.price}
                      </span>
                    )}

                    {/* Add Button or Stepper */}
                    {item.isAvailable ? (
                      hasCustomisation ? (
                        <div className="flex items-center gap-1.5">
                          {inCartQty > 0 && (
                            <span className="text-[10px] font-black bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-md border border-orange-200">
                              {inCartQty} {lang === "hi" ? "कार्ट में" : "in cart"}
                            </span>
                          )}
                          <button
                            onClick={() => openCustomiseModal(item)}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition active:scale-95 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t.customise}</span>
                          </button>
                        </div>
                      ) : inCartQty === 0 ? (
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
            </Fragment>
          );
        })
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom">
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
              {hasSharedItems ? (
                sharedItems.map((it) => {
                  const isMyItem = it.dinerId === dinerId || it.dinerName === dinerName;
                  return (
                    <div key={it.id} className="pt-3 first:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center shrink-0 ${
                                it.isVeg ? "border-emerald-600" : "border-red-600"
                              }`}
                            >
                              <span
                                className={`w-1 h-1 rounded-full ${
                                  it.isVeg ? "bg-emerald-600" : "bg-red-600"
                                }`}
                              />
                            </span>
                            <span className="font-bold text-slate-800 text-xs">{it.name}</span>
                            {it.variantName && (
                              <span className="text-[10px] font-extrabold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded border border-orange-200">
                                {it.variantName}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                                isMyItem
                                  ? "bg-sky-100 text-sky-800 border-sky-300"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              👤 {it.dinerName} {isMyItem ? "(You)" : ""}
                            </span>
                          </div>

                          {it.selectedAddons && Array.isArray(it.selectedAddons) && it.selectedAddons.length > 0 && (
                            <div className="text-[10px] text-slate-500 font-medium pl-4 mt-0.5">
                              + {(it.selectedAddons as any[]).map((a: any) => `${a.name} (+${restaurant.currencySymbol}${a.price})`).join(", ")}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 pl-4 mt-0.5 font-medium">
                            {restaurant.currencySymbol}{it.price} each
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="flex items-center bg-slate-100 rounded-lg font-bold text-xs">
                            <button
                              onClick={() => updateSharedCartItem(it.id, it.quantity - 1)}
                              className="px-2 py-1 text-slate-600 hover:text-slate-900 active:scale-95 transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-1.5 text-slate-900">{it.quantity}</span>
                            <button
                              onClick={() => updateSharedCartItem(it.id, it.quantity + 1)}
                              className="px-2 py-1 text-slate-600 hover:text-slate-900 active:scale-95 transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-black text-slate-900 w-14 text-right">
                            {restaurant.currencySymbol}
                            {it.price * it.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Special notes per item */}
                      <input
                        type="text"
                        placeholder={t.cookingNotePlaceholder}
                        value={it.notes || ""}
                        onChange={(e) => updateSharedCartItem(it.id, it.quantity, e.target.value)}
                        className="w-full mt-1.5 bg-slate-50 text-base sm:text-[11px] text-slate-700 placeholder-slate-400 px-2.5 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  );
                })
              ) : (
                cartItems.map(({ cartKey, item, quantity, notes, variantName, selectedAddons, unitPrice }) => (
                  <div key={cartKey} className="pt-3 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center shrink-0 ${
                              item.isVeg ? "border-emerald-600" : "border-red-600"
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                item.isVeg ? "bg-emerald-600" : "bg-red-600"
                              }`}
                            />
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{item.name}</span>
                          {variantName && (
                            <span className="text-[10px] font-extrabold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded border border-orange-200">
                              {variantName}
                            </span>
                          )}
                        </div>

                        {selectedAddons && selectedAddons.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-medium pl-4 mt-0.5">
                            + {selectedAddons.map((a) => `${a.name} (+${restaurant.currencySymbol}${a.price})`).join(", ")}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 pl-4 mt-0.5 font-medium">
                          {restaurant.currencySymbol}{unitPrice} each
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center bg-slate-100 rounded-lg font-bold text-xs">
                          <button
                            onClick={() => decrementCartKey(cartKey)}
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 active:scale-95 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-1.5 text-slate-900">{quantity}</span>
                          <button
                            onClick={() => incrementCartKey(cartKey)}
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 active:scale-95 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-black text-slate-900 w-14 text-right">
                          {restaurant.currencySymbol}
                          {unitPrice * quantity}
                        </span>
                      </div>
                    </div>

                    {/* Special notes per item */}
                    <input
                      type="text"
                      placeholder={t.cookingNotePlaceholder}
                      value={notes}
                      onChange={(e) => updateItemNotes(cartKey, e.target.value)}
                      className="w-full mt-1.5 bg-slate-50 text-base sm:text-[11px] text-slate-700 placeholder-slate-400 px-2.5 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ))
              )}

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
                      className="w-full pl-8 pr-2 py-1.5 text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-lg uppercase font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
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
                    className="bg-slate-50 text-base sm:text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <input
                    type="tel"
                    placeholder={t.phoneForBill}
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="bg-slate-50 text-base sm:text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                {/* Personal Share preview in Group Cart */}
                {hasSharedItems && myShareSubtotal > 0 && (
                  <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200/80 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-sky-900 font-bold">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>{lang === "hi" ? "आपका व्यक्तिगत हिस्सा:" : "Your Share in Cart:"}</span>
                    </div>
                    <span className="text-xs font-black text-sky-800">
                      {restaurant.currencySymbol}{Math.round((myShareSubtotal / subtotal) * grandTotal)}
                    </span>
                  </div>
                )}

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
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-slate-100 bg-slate-50">
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
              <div className="flex items-center gap-2">
                {tableOrders.some((o) => o.status === "served" || o.status === "completed" || o.paymentStatus === "paid") && (
                  <button
                    onClick={handleResetTableSession}
                    title="Start fresh session / vacate table"
                    className="text-[11px] font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-slate-200 transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>🔄 {lang === "hi" ? "टेबल खाली करें" : "Reset Table"}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOrdersOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
                          <div key={idx} className="text-slate-800">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold flex items-center gap-1.5 flex-wrap">
                                <span>{it.quantity}x</span>
                                <span>{it.name}</span>
                                {it.variantName && (
                                  <span className="text-[10px] font-black bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded border border-orange-200">
                                    {it.variantName}
                                  </span>
                                )}
                              </span>
                              <span className="font-bold">
                                {restaurant.currencySymbol}
                                {it.price * it.quantity}
                              </span>
                            </div>
                            {it.selectedAddons && it.selectedAddons.length > 0 && (
                              <div className="text-[10px] text-slate-500 pl-4 mt-0.5">
                                + {it.selectedAddons.map((a: any) => `${a.name} (+${restaurant.currencySymbol}${a.price})`).join(", ")}
                              </div>
                            )}
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
                        <div className="mt-3 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2.5">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{t.paymentCompleted} ({order.paymentMethod?.replace("_", " ")})</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {lang === "hi" 
                              ? "🎉 आपका बिल भुगतान सफल हो चुका है! नीचे से व्हाट्सएप बिल रसीद प्राप्त करें या नई डिश मंगाने के लिए मेन्यू देखें।" 
                              : "🎉 Payment settled successfully! Download your WhatsApp bill receipt below or browse the menu to order more dishes."}
                          </p>
                          <button
                            type="button"
                            onClick={handleResetTableSession}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>{lang === "hi" ? "नया ऑर्डर शुरू करें / मेन्यू देखें 🍽️" : "Start New Order / Browse Menu 🍽️"}</span>
                          </button>
                        </div>
                      ) : order.paymentMethod === "counter_cash" && !showUpiForOrder[order.id] ? (
                        <div className="mt-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900">
                            <Receipt className="w-4 h-4 text-amber-600" />
                            <span>{lang === "hi" ? "बिलिंग काउंटर पर नकद भुगतान करें" : "Pay at Billing Counter (Cash)"}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {lang === "hi" 
                              ? `कुल देय राशि: ${restaurant.currencySymbol}${order.total}। कृपया भोजन के बाद काउंटर पर नकद भुगतान करें।` 
                              : `Total payable: ${restaurant.currencySymbol}${order.total}. Please settle bill at the counter after your meal.`}
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowUpiForOrder((prev) => ({ ...prev, [order.id]: true }))}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 underline pt-1"
                          >
                            <Split className="w-3.5 h-3.5" />
                            <span>{lang === "hi" ? "या अभी UPI / ऑनलाइन QR से भुगतान करें →" : "Or pay via UPI / QR code instead →"}</span>
                          </button>
                        </div>
                      ) : (
                        <OrderUpiBox 
                          order={order} 
                          restaurant={restaurant} 
                          tableNumber={currentTable?.tableNumber} 
                          myDinerName={dinerName}
                          lang={lang}
                        />
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
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-slate-50 border-t border-slate-100 flex gap-2">
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

            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-slate-50 border-t border-slate-100">
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

      {/* Customisation Drawer Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
              <div className="flex items-start gap-2.5">
                <span
                  className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center shrink-0 mt-0.5 ${
                    customizingItem.isVeg ? "border-emerald-600" : "border-red-600"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      customizingItem.isVeg ? "bg-emerald-600" : "bg-red-600"
                    }`}
                  />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {customizingItem.name}
                  </h3>
                  <p className="text-xs text-orange-600 font-bold mt-0.5">
                    {t.customiseItem}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Scrollable options */}
            <div className="p-4 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
              {/* Section 1: Portion Size (Single-Select Radio) */}
              {customizingItem.variants && customizingItem.variants.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🍽️</span>
                      <span>{t.choosePortion}</span>
                    </h4>
                    <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                      {lang === "hi" ? "अनिवार्य" : "Required"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {customizingItem.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id || selectedVariant?.name === v.name;
                      return (
                        <button
                          key={v.id || v.name}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between transition active:scale-[0.99] ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/70 shadow-xs ring-1 ring-orange-500"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                                isSelected ? "border-orange-600" : "border-slate-300"
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-orange-600" />}
                            </div>
                            <span className={`text-xs font-bold ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                              {v.name}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-900">
                            {restaurant.currencySymbol}{v.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Add-ons / Extras (Multi-Select Checkboxes) */}
              {customizingItem.addons && customizingItem.addons.length > 0 && (
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>✨</span>
                      <span>{t.addOns}</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lang === "hi" ? "वैकल्पिक" : "Optional"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {customizingItem.addons.map((addon) => {
                      const isChecked = selectedAddons.some((a) => a.id === addon.id || a.name === addon.name);
                      return (
                        <button
                          key={addon.id || addon.name}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedAddons((prev) => prev.filter((a) => a.id !== addon.id && a.name !== addon.name));
                            } else {
                              setSelectedAddons((prev) => [...prev, addon]);
                            }
                          }}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between transition active:scale-[0.99] ${
                            isChecked
                              ? "border-orange-500 bg-orange-50/70 shadow-xs ring-1 ring-orange-500"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                                isChecked ? "bg-orange-600 border-orange-600" : "border-slate-300 bg-white"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                            </div>
                            <span className={`text-xs font-bold ${isChecked ? "text-slate-900" : "text-slate-700"}`}>
                              {addon.name}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-orange-600">
                            +{restaurant.currencySymbol}{addon.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer: Stepper + Total Price + Add to Cart button */}
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-slate-50 border-t border-slate-100 flex items-center gap-3">
              {/* Quantity Stepper */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-xs font-extrabold text-xs">
                <button
                  type="button"
                  onClick={() => setCustomizingQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 active:scale-95 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-slate-900">{customizingQty}</span>
                <button
                  type="button"
                  onClick={() => setCustomizingQty((q) => q + 1)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart button */}
              {(() => {
                const basePrice = selectedVariant ? selectedVariant.price : customizingItem.price;
                const addonsSum = selectedAddons.reduce((acc, a) => acc + a.price, 0);
                const totalModalPrice = (basePrice + addonsSum) * customizingQty;

                return (
                  <button
                    type="button"
                    onClick={handleConfirmCustomization}
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-between px-4"
                  >
                    <span>{lang === "hi" ? "कार्ट में जोड़ें" : "Add to Cart"}</span>
                    <span className="text-white font-black text-sm">
                      {restaurant.currencySymbol}{totalModalPrice}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Diner Name Change / Set Modal */}
      {isDinerNameModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {lang === "hi" ? "टेबल पर आपका नाम" : "Your Name at Table"}
                </h3>
              </div>
              <button
                onClick={() => setIsDinerNameModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {t.enterNamePrompt}
            </p>
            <input
              type="text"
              placeholder={lang === "hi" ? "जैसे: आकाश, राहुल, प्रिया" : "e.g. Aakash, Rahul, Priya"}
              value={tempDinerName}
              onChange={(e) => setTempDinerName(e.target.value)}
              className="w-full text-base sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const trimmed = tempDinerName.trim();
                  handleNameChange(trimmed);
                  joinTableCart(trimmed || undefined);
                  setIsDinerNameModalOpen(false);
                  showToast(trimmed ? (lang === "hi" ? `✅ स्वागत है ${trimmed}!` : `✅ Welcome, ${trimmed}!`) : (lang === "hi" ? "नाम अपडेट हुआ" : "Name updated"));
                }}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                {lang === "hi" ? "सुरक्षित करें" : "Save & Join"}
              </button>
              <button
                type="button"
                onClick={() => setIsDinerNameModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
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
  myDinerName,
  lang = "en",
}: {
  order: Order;
  restaurant: Restaurant;
  tableNumber?: string;
  myDinerName?: string;
  lang?: Language;
}) {
  const [splitTab, setSplitTab] = useState<"full" | "equal" | "itemized">("full");
  const [equalCount, setEqualCount] = useState<number>(2);

  // Extract diners from order.items
  const dinersInOrder = useMemo(() => {
    const set = new Set<string>();
    order.items.forEach((it) => {
      if (it.orderedByName) set.add(it.orderedByName);
    });
    const list = Array.from(set);
    return list.length > 0 ? list : ["Guest"];
  }, [order.items]);

  const [selectedDiner, setSelectedDiner] = useState<string>(
    myDinerName && dinersInOrder.includes(myDinerName) ? myDinerName : dinersInOrder[0] || "Guest"
  );

  useEffect(() => {
    if (myDinerName && dinersInOrder.includes(myDinerName)) {
      setSelectedDiner(myDinerName);
    }
  }, [myDinerName, dinersInOrder]);

  // Compute itemized share for selectedDiner
  const dinerItems = useMemo(() => {
    return order.items.filter((it) => (it.orderedByName || "Guest") === selectedDiner);
  }, [order.items, selectedDiner]);

  const dinerSubtotal = useMemo(() => {
    return dinerItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  }, [dinerItems]);

  const itemizedAmount = useMemo(() => {
    if (order.subtotal <= 0) return order.total;
    const ratio = dinerSubtotal / order.subtotal;
    return Math.max(1, Math.round(ratio * order.total));
  }, [dinerSubtotal, order.subtotal, order.total]);

  // Compute active amount and note
  const { amountToPay, noteLabel, shareDescription } = useMemo(() => {
    if (splitTab === "equal") {
      const perHead = Math.ceil(order.total / Math.max(1, equalCount));
      return {
        amountToPay: perHead,
        noteLabel: `Equal Split 1 of ${equalCount}`,
        shareDescription: `${restaurant.currencySymbol}${perHead} ${lang === "hi" ? "प्रति व्यक्ति" : "per person"} (${equalCount} ${lang === "hi" ? "लोग" : "people"})`,
      };
    }
    if (splitTab === "itemized") {
      return {
        amountToPay: itemizedAmount,
        noteLabel: `Share of ${selectedDiner}`,
        shareDescription: `${restaurant.currencySymbol}${itemizedAmount} (${selectedDiner})`,
      };
    }
    return {
      amountToPay: order.total,
      noteLabel: `Full Bill`,
      shareDescription: `${restaurant.currencySymbol}${order.total} (${lang === "hi" ? "पूरा बिल" : "Full Bill"})`,
    };
  }, [splitTab, equalCount, selectedDiner, itemizedAmount, order.total, restaurant.currencySymbol, lang]);

  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const uri = useMemo(() => {
    const vpa = (restaurant.upiId || "restaurant@upi").trim();
    const name = encodeURIComponent(restaurant.name);
    const tableTag = encodeURIComponent(tableNumber || order.tableNumber || "Table");
    const amountStr = Number(amountToPay).toFixed(2);
    return `upi://pay?pa=${vpa}&pn=${name}&am=${amountStr}&cu=INR&tn=Bill%20Order%20${order.id.slice(-4)}%20${tableTag}%20(${encodeURIComponent(noteLabel)})`;
  }, [restaurant, order, tableNumber, amountToPay, noteLabel]);

  useEffect(() => {
    QRCode.toDataURL(uri, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [uri]);

  // WhatsApp share message
  const shareWhatsAppSplit = () => {
    const vpa = restaurant.upiId || "restaurant@upi";
    let text = `🍽️ *${restaurant.name}* (${tableNumber || order.tableNumber})\n` +
      `🧾 Order #${order.id.slice(-4)}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `*Split Bill: ${shareDescription}*\n` +
      `Amount: ${restaurant.currencySymbol}${amountToPay}\n`;

    if (splitTab === "itemized" && dinerItems.length > 0) {
      text += `Items for ${selectedDiner}:\n` +
        dinerItems.map((it) => `• ${it.quantity}x ${it.name} (${restaurant.currencySymbol}${it.price * it.quantity})`).join("\n") +
        `\n━━━━━━━━━━━━━━━━\n`;
    }

    text += `UPI ID: ${vpa}\n` +
      `Pay directly via UPI link:\n${uri}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Split className="w-4 h-4 text-orange-600" />
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
            {lang === "hi" ? "बिल भुगतान और विभाजन (Split)" : "Pay & Split Bill"}
          </h4>
        </div>
        <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
          Order #{order.id.slice(-4)}
        </span>
      </div>

      {/* 3 Split Tabs */}
      <div className="grid grid-cols-3 gap-1 p-0.5 bg-orange-100/70 rounded-xl mb-3">
        <button
          type="button"
          onClick={() => setSplitTab("full")}
          className={`py-1.5 px-1 text-[11px] font-extrabold rounded-lg transition ${
            splitTab === "full"
              ? "bg-white text-orange-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {lang === "hi" ? "पूरा बिल" : "Full Bill"}
        </button>
        <button
          type="button"
          onClick={() => setSplitTab("equal")}
          className={`py-1.5 px-1 text-[11px] font-extrabold rounded-lg transition ${
            splitTab === "equal"
              ? "bg-white text-orange-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {lang === "hi" ? "बराबर बांटें" : "Equal Split"}
        </button>
        <button
          type="button"
          onClick={() => setSplitTab("itemized")}
          className={`py-1.5 px-1 text-[11px] font-extrabold rounded-lg transition ${
            splitTab === "itemized"
              ? "bg-white text-orange-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {lang === "hi" ? "मेरा हिस्सा" : "My Share"}
        </button>
      </div>

      {/* Tab 2: Equal Split Controls */}
      {splitTab === "equal" && (
        <div className="bg-white rounded-xl p-2.5 border border-orange-200/70 mb-3 flex items-center justify-between">
          <div className="text-left">
            <span className="text-xs font-bold text-slate-800 block">
              {lang === "hi" ? "व्यक्तियों की संख्या" : "Number of People"}
            </span>
            <span className="text-[10px] text-slate-400">
              {restaurant.currencySymbol}{order.total} ÷ {equalCount}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setEqualCount((c) => Math.max(2, c - 1))}
              className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-sm shadow-xs hover:bg-slate-50 active:scale-95 transition"
            >
              -
            </button>
            <span className="font-extrabold text-xs px-2 text-slate-900">{equalCount}</span>
            <button
              type="button"
              onClick={() => setEqualCount((c) => Math.min(20, c + 1))}
              className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-sm shadow-xs hover:bg-slate-50 active:scale-95 transition"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Itemized / Diner Picker */}
      {splitTab === "itemized" && (
        <div className="bg-white rounded-xl p-2.5 border border-orange-200/70 mb-3 text-left">
          <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">
            {lang === "hi" ? "किसका हिस्सा देखना है?" : "Select Diner:"}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {dinersInOrder.map((dn) => (
              <button
                key={dn}
                type="button"
                onClick={() => setSelectedDiner(dn)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                  selectedDiner === dn
                    ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                👤 {dn} {dn === myDinerName ? "(You)" : ""}
              </button>
            ))}
          </div>

          {/* List of items ordered by selected diner */}
          <div className="border-t border-slate-100 pt-1.5 space-y-1">
            {dinerItems.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] text-slate-600">
                <span>{it.quantity}x {it.name}</span>
                <span className="font-bold text-slate-900">
                  {restaurant.currencySymbol}{it.price * it.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amount Display */}
      <div className="text-center mb-2">
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
          {lang === "hi" ? "भुगतान राशि:" : "Amount to Pay:"}
        </span>
        <div className="text-2xl font-black text-orange-600">
          {restaurant.currencySymbol}{amountToPay}
        </div>
        <p className="text-[10px] text-slate-500 font-medium">
          VPA: <strong>{restaurant.upiId || "restaurant@upi"}</strong>
        </p>
      </div>

      {/* QR Code */}
      {qrUrl ? (
        <img
          src={qrUrl}
          alt={`UPI QR Code for ${noteLabel}`}
          className="w-36 h-36 mx-auto rounded-xl border border-slate-200 p-1.5 bg-white shadow-sm"
        />
      ) : (
        <div className="w-36 h-36 mx-auto bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
          Generating QR...
        </div>
      )}

      {/* Action Buttons: 1-Tap UPI App + Share on WhatsApp */}
      <div className="flex flex-col gap-2 mt-3">
        <a
          href={uri}
          className="w-full py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <span>Open in UPI App (GPay / PhonePe)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          type="button"
          onClick={shareWhatsAppSplit}
          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{lang === "hi" ? "व्हाट्सएप पर शेयर करें" : "Share Split on WhatsApp"}</span>
        </button>
      </div>
    </div>
  );
}
