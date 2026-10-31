"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Restaurant, 
  Order, 
  ServiceRequest, 
  MenuItem, 
  Table, 
  AuthUser,
  OrderItem,
  PortionVariant,
  DishAddon
} from "@/types";
import { DEMO_RESTAURANT } from "@/lib/demoData";
import { 
  Bell, 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Droplets, 
  Receipt, 
  Clock, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  LogOut, 
  Search, 
  User, 
  ChevronRight, 
  X, 
  Smartphone, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  Flame,
  ChefHat,
  Info
} from "lucide-react";

export default function WaiterMobilePage() {
  // --- AUTH & SESSION STATE ---
  const [session, setSession] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [slugInput, setSlugInput] = useState<string>("grand-spice");
  const [pinInput, setPinInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // --- RESTAURANT & OPERATIONAL DATA ---
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // --- NAVIGATION TABS ---
  // "alerts" = Live Service & Kitchen Ready Buzzer
  // "tables" = Floor Grid & Table Sessions
  // "punch" = Rapid Waiter POS Order Punching
  const [activeTab, setActiveTab] = useState<"alerts" | "tables" | "punch">("alerts");

  // --- AUDIO & HAPTIC VIBRATION BUZZER ---
  const [soundAndVibeEnabled, setSoundAndVibeEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastAlertsCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);
  const restaurantRef = useRef<Restaurant | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const lastOrdersFpRef = useRef<string>("");
  const lastSrvFpRef = useRef<string>("");

  // --- TABLE FILTER & DETAIL MODAL ---
  const [tableFilter, setTableFilter] = useState<"all" | "vacant" | "dining" | "bill" | "alert">("all");
  const [activeTableModal, setActiveTableModal] = useState<Table | null>(null);

  // --- PUNCH ORDER (POS) STATE ---
  const [selectedPunchTableId, setSelectedPunchTableId] = useState<string>("");
  const [selectedPunchTableNumber, setSelectedPunchTableNumber] = useState<string>("");
  const [dinerGuestName, setDinerGuestName] = useState<string>("");
  const [punchCart, setPunchCart] = useState<Array<{
    menuItem: MenuItem;
    quantity: number;
    selectedVariant?: PortionVariant | null;
    selectedAddons?: DishAddon[];
    notes?: string;
  }>>([]);
  const [searchDishQuery, setSearchDishQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [variantModalItem, setVariantModalItem] = useState<MenuItem | null>(null);
  const [tempVariant, setTempVariant] = useState<PortionVariant | null>(null);
  const [tempAddons, setTempAddons] = useState<DishAddon[]>([]);
  const [isPunchingOrder, setIsPunchingOrder] = useState<boolean>(false);
  const [punchSuccessMsg, setPunchSuccessMsg] = useState<string | null>(null);
  const [isAttendingAction, setIsAttendingAction] = useState<string | null>(null);

  // 1. Check existing Auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedSlug = localStorage.getItem("scanbite_waiter_slug") || "grand-spice";
        setSlugInput(savedSlug);

        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setSession(data.user);
          if (data.user.slug) {
            setSlugInput(data.user.slug);
          }
        }
      } catch (err) {
        console.warn("Auth check failed:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // 2. Fetch Restaurant Data & Live Updates
  // 2. Silent Operational Polling (Orders & Service Requests only)
  // Decoupled from static restaurant/menu data to eliminate 2-3s auto-refresh flickering
  const pollLiveOperationalData = async (targetId?: string, force = false) => {
    const restId = targetId || restaurantRef.current?.id;
    if (!restId) return;

    if (!force) {
      if (typeof document !== "undefined" && document.hidden) return;
      if (isPollingRef.current) return;
    }

    isPollingRef.current = true;
    try {
      const [ordersRes, srvRes] = await Promise.all([
        fetch(`/api/orders?restaurantId=${restId}`),
        fetch(`/api/service-requests?restaurantId=${restId}`),
      ]);

      let hasStateChanged = false;

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const ordArray = Array.isArray(ordersData) ? ordersData : [];
        const ordFp = ordArray.map((o: Order) => `${o.id}_${o.status}_${o.paymentStatus}_${o.items?.length || 0}`).join("|");
        if (force || ordFp !== lastOrdersFpRef.current) {
          lastOrdersFpRef.current = ordFp;
          setOrders(ordArray);
          hasStateChanged = true;
        }
      }

      if (srvRes.ok) {
        const srvData = await srvRes.json();
        const pendingSrv = Array.isArray(srvData) ? srvData.filter((s: ServiceRequest) => s.status === "pending") : [];
        const srvFp = pendingSrv.map((s: ServiceRequest) => `${s.id}_${s.status}`).join("|");
        if (force || srvFp !== lastSrvFpRef.current) {
          lastSrvFpRef.current = srvFp;
          setServiceRequests(pendingSrv);
          hasStateChanged = true;

          // Buzzer Check: If new urgent alert arrived
          const totalAlertsNow = pendingSrv.length;
          if (!isFirstLoadRef.current && totalAlertsNow > lastAlertsCountRef.current) {
            triggerBuzzer();
          }
          lastAlertsCountRef.current = totalAlertsNow;
        }
        isFirstLoadRef.current = false;
      }

      if (hasStateChanged || force) {
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn("Silent live poll warning:", err);
    } finally {
      isPollingRef.current = false;
    }
  };

  // 3. Full Restaurant Metadata Fetch (Only run on mount, slug switch, or manual refresh)
  const fetchRestaurantData = async (slugToUse: string, isSilent = false) => {
    if (!isSilent) setIsLoadingData(true);
    try {
      const res = await fetch(`/api/restaurants/${slugToUse}`);
      if (!res.ok) throw new Error("Restaurant not found");
      const data: Restaurant = await res.json();
      restaurantRef.current = data;
      setRestaurant(data);
      setTables(data.tables || []);
      setMenuItems(data.menuItems || []);
      setCategories(data.categories || []);

      if (!selectedPunchTableId && data.tables && data.tables.length > 0) {
        setSelectedPunchTableId(data.tables[0].id);
        setSelectedPunchTableNumber(data.tables[0].tableNumber);
      }

      // Fetch initial orders & alerts silently without race condition
      await pollLiveOperationalData(data.id, true);
    } catch (err) {
      console.warn("Error fetching waiter data:", err);
      // Fallback for demo
      if (slugToUse === "grand-spice" || !restaurantRef.current) {
        restaurantRef.current = DEMO_RESTAURANT;
        setRestaurant(DEMO_RESTAURANT);
        setTables(DEMO_RESTAURANT.tables);
        setMenuItems(DEMO_RESTAURANT.menuItems);
        setCategories(DEMO_RESTAURANT.categories);
        if (!selectedPunchTableId && DEMO_RESTAURANT.tables.length > 0) {
          setSelectedPunchTableId(DEMO_RESTAURANT.tables[0].id);
          setSelectedPunchTableNumber(DEMO_RESTAURANT.tables[0].tableNumber);
        }
        await pollLiveOperationalData(DEMO_RESTAURANT.id, true);
      }
    } finally {
      if (!isSilent) setIsLoadingData(false);
    }
  };

  // Trigger data fetch on session change or initial load
  useEffect(() => {
    if (session && session.slug) {
      fetchRestaurantData(session.slug);
    } else if (!isLoadingAuth && !session) {
      // Load demo data in background
      fetchRestaurantData(slugInput || "grand-spice");
    }
  }, [session, isLoadingAuth]);

  // Real-time Silent Polling: Pause when tab is hidden, resume immediately on focus
  useEffect(() => {
    if (!session && slugInput !== "grand-spice") return;

    const interval = setInterval(() => {
      pollLiveOperationalData();
    }, 5000);

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        pollLiveOperationalData(undefined, true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, slugInput]);

  // --- SOUND & HAPTIC VIBRATION BUZZER ENGINE ---
  const triggerBuzzer = () => {
    if (!soundAndVibeEnabled || typeof window === "undefined") return;

    // 1. Mobile Physical Vibration (Haptic Feedback)
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([250, 100, 250, 100, 450]);
      } catch {
        // ignore
      }
    }

    // 2. Web Audio API Chime (Synthetic, no external audio file needed)
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      const playChimeTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      playChimeTone(880, now, 0.2); // A5
      playChimeTone(1174.66, now + 0.15, 0.25); // D6
      playChimeTone(1396.91, now + 0.32, 0.4); // F6
    } catch {
      // AudioContext blocked
    }
  };

  // Test sound function
  const handleTestBuzzer = () => {
    triggerBuzzer();
  };

  // --- PIN KEYPAD AUTH HANDLERS ---
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      setAuthError(null);
      if (newPin.length === 4) {
        submitPinLogin(newPin);
      }
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setAuthError(null);
  };

  const handlePinClear = () => {
    setPinInput("");
    setAuthError(null);
  };

  const submitPinLogin = async (pinToSubmit: string) => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      const targetSlug = slugInput.trim().toLowerCase() || "grand-spice";
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pin_login",
          slug: targetSlug,
          pin: pinToSubmit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Incorrect 4-digit PIN. Please try again.");
        setPinInput("");
      } else {
        setSession(data.user);
        localStorage.setItem("scanbite_waiter_slug", targetSlug);
        fetchRestaurantData(targetSlug);
      }
    } catch {
      setAuthError("Failed to verify PIN. Please check internet connection.");
      setPinInput("");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleQuickDemoLogin = (pin = "2345") => {
    setSlugInput("grand-spice");
    setPinInput(pin);
    submitPinLogin(pin);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // ignore
    }
    setSession(null);
    setPinInput("");
  };

  // --- ATTEND SERVICE REQUEST ---
  const handleAttendRequest = async (requestId: string) => {
    setIsAttendingAction(requestId);
    try {
      const res = await fetch("/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        setServiceRequests((prev) => prev.filter((r) => r.id !== requestId));
        if ("vibrate" in navigator) navigator.vibrate(50);
      }
    } catch (err) {
      console.error("Attend error:", err);
    } finally {
      setIsAttendingAction(null);
    }
  };

  // --- MARK FOOD ORDER SERVED ---
  const handleMarkOrderServed = async (orderId: string) => {
    setIsAttendingAction(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "served" }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "served" } : o))
        );
        if ("vibrate" in navigator) navigator.vibrate(50);
      }
    } catch (err) {
      console.error("Serve order error:", err);
    } finally {
      setIsAttendingAction(null);
    }
  };

  // --- VACATE TABLE ---
  const handleVacateTable = async (tableId: string) => {
    if (!restaurant) return;
    setIsAttendingAction(`vacate-${tableId}`);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vacate_table",
          restaurantId: restaurant.id,
          tableId,
        }),
      });
      if (res.ok) {
        // Clear active orders for this table locally
        setOrders((prev) =>
          prev.map((o) => (o.tableId === tableId && o.status !== "cancelled" ? { ...o, status: "completed" } : o))
        );
        setActiveTableModal(null);
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      console.error("Vacate error:", err);
    } finally {
      setIsAttendingAction(null);
    }
  };

  // --- PUNCH ORDER (POS) HANDLERS ---
  const handleOpenVariantPicker = (item: MenuItem) => {
    setVariantModalItem(item);
    setTempVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
    setTempAddons([]);
  };

  const handleConfirmAddVariant = () => {
    if (!variantModalItem) return;
    addToCart(variantModalItem, tempVariant, tempAddons);
    setVariantModalItem(null);
    setTempVariant(null);
    setTempAddons([]);
  };

  const addToCart = (
    item: MenuItem, 
    variant?: PortionVariant | null, 
    addons: DishAddon[] = []
  ) => {
    setPunchCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.menuItem.id === item.id &&
          ci.selectedVariant?.name === variant?.name &&
          JSON.stringify(ci.selectedAddons?.map((a) => a.name).sort()) ===
            JSON.stringify(addons.map((a) => a.name).sort())
      );

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      } else {
        return [
          ...prev,
          {
            menuItem: item,
            quantity: 1,
            selectedVariant: variant,
            selectedAddons: addons,
          },
        ];
      }
    });

    if ("vibrate" in navigator) navigator.vibrate(40);
  };

  const updateCartQty = (index: number, delta: number) => {
    setPunchCart((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].quantity = newQty;
      return copy;
    });
  };

  // Calculate Running Punch Total
  const punchSubtotal = useMemo(() => {
    return punchCart.reduce((sum, item) => {
      const basePrice = item.selectedVariant ? item.selectedVariant.price : item.menuItem.price;
      const addonsPrice = (item.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
      return sum + (basePrice + addonsPrice) * item.quantity;
    }, 0);
  }, [punchCart]);

  const taxRate = restaurant?.taxRatePercent !== undefined ? restaurant.taxRatePercent : 5;
  const punchTax = Number(((punchSubtotal * taxRate) / 100).toFixed(2));
  const punchTotal = Number((punchSubtotal + punchTax).toFixed(2));

  // Submit Waiter Punched Order to Kitchen
  const handleSubmitPunchOrder = async () => {
    if (!restaurant || !selectedPunchTableId || punchCart.length === 0) return;
    setIsPunchingOrder(true);
    setPunchSuccessMsg(null);

    try {
      const orderItems: OrderItem[] = punchCart.map((ci) => {
        const basePrice = ci.selectedVariant ? ci.selectedVariant.price : ci.menuItem.price;
        const addonsPrice = (ci.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
        return {
          menuItemId: ci.menuItem.id,
          name: ci.selectedVariant ? `${ci.menuItem.name} (${ci.selectedVariant.name})` : ci.menuItem.name,
          price: basePrice + addonsPrice,
          quantity: ci.quantity,
          isVeg: ci.menuItem.isVeg,
          notes: ci.notes || null,
          variantName: ci.selectedVariant?.name || null,
          selectedAddons: ci.selectedAddons && ci.selectedAddons.length > 0 
            ? ci.selectedAddons.map((a) => ({ name: a.name, price: a.price })) 
            : null,
          orderedByName: session?.staffName ? `Captain (${session.staffName})` : "Captain Waiter",
        };
      });

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: selectedPunchTableId,
          tableNumber: selectedPunchTableNumber || "Table",
          items: orderItems,
          customerName: dinerGuestName.trim() || `Guest (${selectedPunchTableNumber})`,
          paymentMethod: "counter_cash",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to punch order. Please try again.");
      } else {
        // Success!
        setPunchCart([]);
        setDinerGuestName("");
        setPunchSuccessMsg(`Order #${data.id.slice(-4).toUpperCase()} sent directly to Kitchen! 👨‍🍳`);
        triggerBuzzer();
        // Refresh orders immediately
        pollLiveOperationalData(restaurant.id, true);
        setTimeout(() => setPunchSuccessMsg(null), 5000);
      }
    } catch {
      alert("Error sending order to kitchen. Please check connection.");
    } finally {
      setIsPunchingOrder(false);
    }
  };

  // --- DERIVED METRICS ---
  // Ready to serve food orders
  const readyOrders = useMemo(() => {
    return orders.filter((o) => o.status === "ready");
  }, [orders]);

  // Urgent alerts total count
  const totalUrgentAlertsCount = serviceRequests.length + readyOrders.length;

  // Active dining tables map
  const activeTableOrdersMap = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders.forEach((o) => {
      if (["pending", "cooking", "ready", "served"].includes(o.status)) {
        const arr = map.get(o.tableId) || [];
        arr.push(o);
        map.set(o.tableId, arr);
      }
    });
    return map;
  }, [orders]);

  // Tables with active service requests map
  const tableRequestsMap = useMemo(() => {
    const map = new Map<string, ServiceRequest[]>();
    serviceRequests.forEach((r) => {
      const arr = map.get(r.tableId) || [];
      arr.push(r);
      map.set(r.tableId, arr);
    });
    return map;
  }, [serviceRequests]);

  // Filtered Menu Items for Punch Order
  const filteredMenuItems = useMemo(() => {
    let list = menuItems;
    if (selectedCategory !== "all") {
      list = list.filter((i) => i.categoryId === selectedCategory);
    }
    if (searchDishQuery.trim()) {
      const q = searchDishQuery.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
    }
    return list;
  }, [menuItems, selectedCategory, searchDishQuery]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const activeOrds = activeTableOrdersMap.get(t.id) || [];
      const hasDining = activeOrds.length > 0;
      const hasRequests = (tableRequestsMap.get(t.id) || []).length > 0;
      const hasBillPending = activeOrds.some((o) => o.status === "served" && o.paymentStatus !== "paid");

      if (tableFilter === "vacant") return !hasDining;
      if (tableFilter === "dining") return hasDining && !hasBillPending;
      if (tableFilter === "bill") return hasBillPending;
      if (tableFilter === "alert") return hasRequests;
      return true;
    });
  }, [tables, activeTableOrdersMap, tableRequestsMap, tableFilter]);

  // Format Elapsed Time
  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return "";
    const diff = Math.floor((new Date().getTime() - new Date(isoString).getTime()) / 60000);
    if (diff < 1) return "Just now";
    return `${diff}m ago`;
  };

  // --- RENDER PIN AUTH SCREEN IF NOT LOGGED IN ---
  if (!isLoadingAuth && !session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto selection:bg-orange-500 selection:text-white">
        {/* Top Header */}
        <div className="pt-4 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 mb-3 animate-pulse">
            <Smartphone className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            ScanBite <span className="text-orange-500">Captain</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated Mobile Waiter & Service Mode
          </p>
        </div>

        {/* PIN Entry Box */}
        <div className="my-auto py-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
            {/* Restaurant Slug Input */}
            <div className="mb-5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Restaurant Identifier (Slug)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g. grand-spice"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            {/* 4-Digit PIN Circles */}
            <div className="text-center mb-6">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Enter Your 4-Digit Staff PIN
              </label>
              <div className="flex justify-center items-center gap-3">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pinInput.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-200 border ${
                        isFilled
                          ? "bg-orange-500/20 border-orange-500 text-orange-400 scale-105 shadow-md shadow-orange-500/20"
                          : "bg-slate-950 border-slate-800 text-slate-600"
                      }`}
                    >
                      {isFilled ? "●" : "○"}
                    </div>
                  );
                })}
              </div>

              {authError && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            {/* Tactile Mobile Keypad */}
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(String(digit))}
                  disabled={isSubmittingAuth || pinInput.length >= 4}
                  className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-700/50 text-xl font-bold text-white transition flex items-center justify-center shadow cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handlePinClear}
                className="h-14 rounded-2xl bg-slate-950/80 hover:bg-slate-900 active:scale-95 border border-slate-800 text-xs font-bold text-slate-400 transition flex items-center justify-center cursor-pointer"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit("0")}
                disabled={isSubmittingAuth || pinInput.length >= 4}
                className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-700/50 text-xl font-bold text-white transition flex items-center justify-center shadow cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinBackspace}
                className="h-14 rounded-2xl bg-slate-950/80 hover:bg-slate-900 active:scale-95 border border-slate-800 text-sm font-bold text-rose-400 transition flex items-center justify-center cursor-pointer"
              >
                ⌫
              </button>
            </div>
          </div>

          {/* Quick Demo Login Pill */}
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("2345")}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 active:scale-98 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>1-Tap Demo Captain Login (Amit Waiter - PIN 2345)</span>
            </button>
            <div className="flex justify-between items-center text-[11px] text-slate-500 px-1">
              <span>Default restaurant staff PIN: <strong className="text-slate-400">1234</strong></span>
              <Link href="/dashboard" className="text-orange-400 hover:underline">
                Owner Dashboard →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-600 pb-2">
          ScanBite Waiter Pager OS • Shift Session Protected
        </div>
      </main>
    );
  }

  // --- LOGGED IN CAPTAIN & WAITER OPERATIONAL INTERFACE ---
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 selection:bg-orange-500 selection:text-white max-w-xl mx-auto border-x border-slate-900 shadow-2xl">
      {/* 1. STICKY TOP APP HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Waiter Info & Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md shadow-orange-500/20">
              {session?.staffName ? session.staffName[0].toUpperCase() : "W"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white truncate">
                  {session?.staffName || "Captain"}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {restaurant?.name || "The Grand Spice Kitchen"}
              </p>
            </div>
          </div>

          {/* Controls: Sound Toggle, Refresh, Logout */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Buzzer Sound & Vibration Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !soundAndVibeEnabled;
                setSoundAndVibeEnabled(nextVal);
                if (nextVal) handleTestBuzzer();
              }}
              className={`p-2 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                soundAndVibeEnabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
              }`}
              title={soundAndVibeEnabled ? "Buzzer & Vibration Active (Click to mute)" : "Muted (Click to enable buzzer)"}
            >
              {soundAndVibeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Refresh */}
            <button
              type="button"
              onClick={() => {
                const activeSlug = session?.slug || slugInput || "grand-spice";
                fetchRestaurantData(activeSlug);
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin text-orange-400" : ""}`} />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="End Shift / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Mini KPI Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-slate-900 text-center">
          <div 
            onClick={() => setActiveTab("alerts")} 
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              totalUrgentAlertsCount > 0 
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse" 
                : "bg-slate-900/60 border-slate-800/80 text-slate-400"
            }`}
          >
            <div className="text-xs font-black">{totalUrgentAlertsCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider">Urgent Alerts</div>
          </div>

          <div 
            onClick={() => setActiveTab("tables")} 
            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <div className="text-xs font-black text-white">
              {activeTableOrdersMap.size} / {tables.length}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider">Tables Dining</div>
          </div>

          <div 
            onClick={() => setActiveTab("punch")} 
            className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition cursor-pointer"
          >
            <div className="text-xs font-black">
              {punchCart.reduce((sum, item) => sum + item.quantity, 0)} Items
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider">Take Order</div>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT ACCORDING TO ACTIVE TAB */}
      <div className="p-4 flex-1">
        {/* ========================================================= */}
        {/* TAB 1: 🛎️ URGENT ALERTS (SERVICE REQUESTS + READY FOOD) */}
        {/* ========================================================= */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-400" />
                  Live Table Calls & Kitchen Pickup
                </h2>
                <p className="text-xs text-slate-400">
                  Vibrates & chimes automatically on new table requests
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestBuzzer}
                className="text-[11px] font-bold text-orange-400 hover:text-orange-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 cursor-pointer"
              >
                Test Chime 🔔
              </button>
            </div>

            {/* Empty State */}
            {totalUrgentAlertsCount === 0 && (
              <div className="py-12 px-4 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Sabhi Tables Shant Hain! (All Clear)
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                  Koi bhi pending service call ya food ready alert nahi hai. New order punch karne ke liye niche "Take Order" dabayein.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("punch")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Punch Table Order Now</span>
                </button>
              </div>
            )}

            {/* Section A: Ready Food for Kitchen Pickup */}
            {readyOrders.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 px-1">
                  <span className="flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4" />
                    Kitchen Ready for Pickup ({readyOrders.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Deliver to table</span>
                </div>

                {readyOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/40 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white">
                            {ord.tableNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                            Food Ready 🔔
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Order #{ord.id.slice(-4).toUpperCase()} • {ord.customerName || "Guest"}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isAttendingAction === ord.id}
                        onClick={() => handleMarkOrderServed(ord.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                      >
                        {isAttendingAction === ord.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Delivered ✓</span>
                      </button>
                    </div>

                    {/* Dish Items summary */}
                    <div className="bg-slate-950/80 rounded-xl p-2.5 border border-emerald-500/20 space-y-1">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-200 font-semibold">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-slate-400 text-[11px]">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Section B: Table Service Requests (Water, Waiter, Bill, Cleaning) */}
            {serviceRequests.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 px-1">
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4" />
                    Table Assistance Pings ({serviceRequests.length})
                  </span>
                  <span className="text-[10px] text-slate-400">1-tap attend</span>
                </div>

                {serviceRequests.map((req) => {
                  const isWater = req.type === "water";
                  const isBill = req.type === "bill";
                  const isCleaning = req.type === "cleaning";

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border-2 transition shadow-lg flex items-center justify-between gap-3 ${
                        isWater
                          ? "bg-blue-950/20 border-blue-500/50 shadow-blue-950/30"
                          : isBill
                          ? "bg-amber-950/20 border-amber-500/50 shadow-amber-950/30"
                          : isCleaning
                          ? "bg-purple-950/20 border-purple-500/50 shadow-purple-950/30"
                          : "bg-rose-950/20 border-rose-500/50 shadow-rose-950/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${
                            isWater
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : isBill
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : isCleaning
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-bounce"
                          }`}
                        >
                          {isWater ? "💧" : isBill ? "🧾" : isCleaning ? "🧹" : "🛎️"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-white">
                              {req.tableNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(req.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-300 truncate">
                            {isWater && "Pani Manga Hai (Water Request)"}
                            {isBill && "Bill Manga Hai (Bill Request)"}
                            {isCleaning && "Safai Chahiye (Table Clean)"}
                            {req.type === "waiter" && "Waiter Ko Bulaya (Waiter Call)"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAttendingAction === req.id}
                        onClick={() => handleAttendRequest(req.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 border border-slate-700 hover:border-emerald-500 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
                      >
                        {isAttendingAction === req.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                        <span>Attend ✓</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 🪑 TABLES FLOOR STATUS & QUICK TABLE DETAILS */}
        {/* ========================================================= */}
        {activeTab === "tables" && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: "all", label: "All Tables" },
                { key: "vacant", label: "🟢 Free" },
                { key: "dining", label: "🔴 Dining" },
                { key: "bill", label: "🟡 Bill" },
                { key: "alert", label: "🔵 Call" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTableFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    tableFilter === f.key
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Table Grid (2 columns on mobile) */}
            <div className="grid grid-cols-2 gap-2.5">
              {filteredTables.map((t) => {
                const activeOrds = activeTableOrdersMap.get(t.id) || [];
                const activeRequests = tableRequestsMap.get(t.id) || [];
                const hasDining = activeOrds.length > 0;
                const hasAlert = activeRequests.length > 0;
                const latestOrd = activeOrds[0];
                const hasBillPending = activeOrds.some(
                  (o) => o.status === "served" && o.paymentStatus !== "paid"
                );

                // Compute total bill
                const tableTotal = activeOrds.reduce((sum, o) => sum + o.total, 0);

                // Card border color based on status
                let statusBg = "bg-slate-900/70 border-slate-800";
                let statusBadge = (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    🟢 Free
                  </span>
                );

                if (hasAlert) {
                  statusBg = "bg-blue-950/20 border-blue-500/50 shadow-md shadow-blue-950/20";
                  statusBadge = (
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30 animate-pulse">
                      🔵 Alert
                    </span>
                  );
                } else if (hasBillPending) {
                  statusBg = "bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-950/20";
                  statusBadge = (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      🟡 Bill
                    </span>
                  );
                } else if (hasDining) {
                  statusBg = "bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/20";
                  statusBadge = (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                      🔴 Dining
                    </span>
                  );
                }

                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${statusBg}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="text-base font-black text-white">
                          {t.tableNumber}
                        </span>
                        {statusBadge}
                      </div>

                      {hasDining ? (
                        <div className="space-y-1 mb-3">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            ₹{tableTotal}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {latestOrd?.customerName || "Diner"} • {formatTimeAgo(latestOrd?.createdAt)}
                          </div>
                          <div className="text-[10px] text-orange-400 font-semibold">
                            {activeOrds.reduce((sum, o) => sum + o.items.length, 0)} items running
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mb-3">
                          Ready for guests ({t.seats} seats)
                        </p>
                      )}
                    </div>

                    {/* Quick Action buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPunchTableId(t.id);
                          setSelectedPunchTableNumber(t.tableNumber);
                          setActiveTab("punch");
                        }}
                        className="py-1.5 px-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Take Order"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTableModal(t)}
                        className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="View Details"
                      >
                        <Info className="w-3 h-3" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 📝 PUNCH ORDER (MOBILE WAITER POS DIRECT ORDERING) */}
        {/* ========================================================= */}
        {activeTab === "punch" && (
          <div className="space-y-4">
            {/* Table & Guest Selector Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />
                  Select Table to Order:
                </label>
                <span className="text-[11px] font-bold text-orange-400">
                  {selectedPunchTableNumber || "Choose Table"}
                </span>
              </div>

              {/* Horizontal Scroll Table Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {tables.map((t) => {
                  const isSelected = selectedPunchTableId === t.id;
                  const isOccupied = (activeTableOrdersMap.get(t.id) || []).length > 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedPunchTableId(t.id);
                        setSelectedPunchTableNumber(t.tableNumber);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                          : isOccupied
                          ? "bg-rose-950/40 border border-rose-500/30 text-rose-300"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{t.tableNumber}</span>
                      {isOccupied && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Guest Name input */}
              <div className="pt-2 border-t border-slate-800/80">
                <input
                  type="text"
                  value={dinerGuestName}
                  onChange={(e) => setDinerGuestName(e.target.value)}
                  placeholder={`Guest Name (Optional, e.g. Rahul)`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            {/* Menu Search & Category Pills */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchDishQuery}
                  onChange={(e) => setSearchDishQuery(e.target.value)}
                  placeholder="Search dish (e.g. Biryani, Paneer)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition"
                />
                {searchDishQuery && (
                  <button
                    onClick={() => setSearchDishQuery("")}
                    className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-slate-200 text-slate-950"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-orange-500 text-white"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Success Banner */}
            {punchSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{punchSuccessMsg}</span>
              </div>
            )}

            {/* Menu Items List */}
            <div className="space-y-2">
              {filteredMenuItems.map((item) => {
                const hasVariants = item.variants && item.variants.length > 0;
                const inCartCount = punchCart
                  .filter((ci) => ci.menuItem.id === item.id)
                  .reduce((sum, ci) => sum + ci.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                            item.isVeg ? "border-emerald-500" : "border-rose-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                        </span>
                        <h4 className="font-bold text-xs text-white truncate">
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-orange-400">
                          ₹{item.price}
                        </span>
                        {hasVariants && (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            Variants available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add / Stepper controls */}
                    <div className="shrink-0">
                      {hasVariants ? (
                        <button
                          type="button"
                          onClick={() => handleOpenVariantPicker(item)}
                          className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Customize</span>
                        </button>
                      ) : inCartCount > 0 ? (
                        <div className="flex items-center gap-2 bg-slate-950 border border-orange-500/40 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              const idx = punchCart.findIndex((ci) => ci.menuItem.id === item.id);
                              if (idx >= 0) updateCartQty(idx, -1);
                            }}
                            className="text-slate-400 hover:text-white text-sm font-black p-1 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-white w-4 text-center">
                            {inCartCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="text-orange-400 hover:text-orange-300 text-sm font-black p-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-orange-500 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1 border border-slate-700 hover:border-orange-500 active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. STICKY PUNCH CART BOTTOM BAR (Visible when items in cart) */}
      {punchCart.length > 0 && activeTab === "punch" && (
        <div className="fixed bottom-16 left-0 right-0 max-w-xl mx-auto px-4 z-30">
          <div className="bg-slate-900/95 border-2 border-orange-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-slide-up">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  {punchCart.reduce((s, i) => s + i.quantity, 0)} Items for {selectedPunchTableNumber}
                </span>
              </div>
              <div className="text-base font-black text-orange-400">
                ₹{punchTotal} <span className="text-[10px] text-slate-400 font-normal">(incl. tax)</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isPunchingOrder}
              onClick={handleSubmitPunchOrder}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95 transition cursor-pointer shrink-0"
            >
              {isPunchingOrder ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>🚀 Send to Kitchen (KOT)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. BOTTOM 3-TAB NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg z-40 px-2 py-1.5 flex justify-around items-center">
        {/* Tab 1: Alerts */}
        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition cursor-pointer relative ${
            activeTab === "alerts"
              ? "text-orange-400 font-bold"
              : "text-slate-500 hover:text-slate-300 font-medium"
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {totalUrgentAlertsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                {totalUrgentAlertsCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Alerts</span>
        </button>

        {/* Tab 2: Tables Floor */}
        <button
          type="button"
          onClick={() => setActiveTab("tables")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "tables"
              ? "text-orange-400 font-bold"
              : "text-slate-500 hover:text-slate-300 font-medium"
          }`}
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-[10px]">Floor Plan</span>
        </button>

        {/* Tab 3: Take Order */}
        <button
          type="button"
          onClick={() => setActiveTab("punch")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition cursor-pointer relative ${
            activeTab === "punch"
              ? "text-orange-400 font-bold"
              : "text-slate-500 hover:text-slate-300 font-medium"
          }`}
        >
          <div className="relative">
            <UtensilsCrossed className="w-5 h-5" />
            {punchCart.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[9px] font-black">
                {punchCart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[10px]">Take Order</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* MODAL 1: VARIANT & ADDON PICKER */}
      {/* ========================================================= */}
      {variantModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Customize: {variantModalItem.name}
              </h3>
              <button
                onClick={() => setVariantModalItem(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Portion Variants */}
            {variantModalItem.variants && variantModalItem.variants.length > 0 && (
              <div className="mt-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Size / Portion:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {variantModalItem.variants.map((v) => {
                    const isSelected = tempVariant?.name === v.name;
                    return (
                      <button
                        key={v.id || v.name}
                        type="button"
                        onClick={() => setTempVariant(v)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-orange-500/20 border-orange-500 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-bold text-xs">{v.name}</div>
                        <div className="text-xs font-black text-orange-400">₹{v.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Add-ons */}
            {variantModalItem.addons && variantModalItem.addons.length > 0 && (
              <div className="mt-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Extras / Add-ons:
                </label>
                <div className="space-y-1.5">
                  {variantModalItem.addons.map((a) => {
                    const isChecked = tempAddons.some((addon) => addon.name === a.name);
                    return (
                      <button
                        key={a.id || a.name}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setTempAddons((prev) => prev.filter((item) => item.name !== a.name));
                          } else {
                            setTempAddons((prev) => [...prev, a]);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex justify-between items-center transition cursor-pointer ${
                          isChecked
                            ? "bg-orange-500/10 border-orange-500/50 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                              isChecked ? "bg-orange-500 border-orange-500 text-white" : "border-slate-700"
                            }`}
                          >
                            {isChecked && "✓"}
                          </span>
                          <span className="font-semibold text-xs">{a.name}</span>
                        </div>
                        <span className="text-xs font-bold text-orange-400">+₹{a.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm Add Button */}
            <div className="mt-6 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleConfirmAddVariant}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-98 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Add to Cart • ₹
                  {(tempVariant ? tempVariant.price : variantModalItem.price) +
                    tempAddons.reduce((s, a) => s + a.price, 0)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: TABLE DETAIL & ACTIVE BILL DRAWER */}
      {/* ========================================================= */}
      {activeTableModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-base text-white">
                  {activeTableModal.tableNumber} Overview
                </h3>
                <span className="text-[11px] text-slate-400">
                  Capacity: {activeTableModal.seats} seats
                </span>
              </div>
              <button
                onClick={() => setActiveTableModal(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Active Orders List */}
            {(() => {
              const tableOrders = activeTableOrdersMap.get(activeTableModal.id) || [];
              const totalAmt = tableOrders.reduce((sum, o) => sum + o.total, 0);

              if (tableOrders.length === 0) {
                return (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <p className="mb-3">Table is currently free & sanitized.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPunchTableId(activeTableModal.id);
                        setSelectedPunchTableNumber(activeTableModal.tableNumber);
                        setActiveTableModal(null);
                        setActiveTab("punch");
                      }}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
                    >
                      + Punch Order for this Table
                    </button>
                  </div>
                );
              }

              return (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-400 font-bold">Total Running Bill:</span>
                    <span className="text-base font-black text-orange-400">₹{totalAmt}</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {tableOrders.map((ord) => (
                      <div key={ord.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span>Order #{ord.id.slice(-4).toUpperCase()}</span>
                          <span className="capitalize font-bold text-slate-300">{ord.status}</span>
                        </div>
                        {ord.items.map((it, i) => (
                          <div key={i} className="flex justify-between text-slate-200">
                            <span>{it.quantity}x {it.name}</span>
                            <span>₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Actions: Add Dishes or Vacate */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPunchTableId(activeTableModal.id);
                        setSelectedPunchTableNumber(activeTableModal.tableNumber);
                        setActiveTableModal(null);
                        setActiveTab("punch");
                      }}
                      className="py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Dishes</span>
                    </button>

                    <button
                      type="button"
                      disabled={isAttendingAction === `vacate-${activeTableModal.id}`}
                      onClick={() => handleVacateTable(activeTableModal.id)}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vacate Table</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}
