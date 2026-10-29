"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  Restaurant, 
  Order, 
  ServiceRequest, 
  MenuItem, 
  Table,
  AuthUser 
} from "@/types";
import { 
  ChefHat, 
  QrCode, 
  Menu as MenuIcon, 
  Settings, 
  Bell, 
  Printer, 
  Download, 
  Plus, 
  Search, 
  Droplets, 
  Receipt, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  Store,
  Check,
  TrendingUp,
  BarChart3,
  DollarSign,
  Star,
  Users,
  FileText,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  Key,
  LogOut,
  Eye,
  EyeOff,
  User as UserIcon,
  ShieldCheck,
  Ban,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Wrench
} from "lucide-react";

export default function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState<"kds" | "analytics" | "menu" | "tables" | "settings">("kds");
  const [restaurantSlug, setRestaurantSlug] = useState("grand-spice");
  const [availableRestaurants, setAvailableRestaurants] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sound Chime State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrdersCountRef = useRef(0);
  const prevRequestsCountRef = useRef(0);
  const lastLoadedSlugRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // KDS filter & search
  const [kdsFilter, setKdsFilter] = useState<"active" | "pending" | "cooking" | "ready" | "unpaid" | "all">("active");
  const [kdsSearch, setKdsSearch] = useState("");

  // Single Table Print Modal
  const [singlePrintTable, setSinglePrintTable] = useState<Table | null>(null);

  // Authentication & Session State (Roadmap P-02)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authTab, setAuthTab] = useState<"owner" | "staff">("owner");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [staffRestaurantSlug, setStaffRestaurantSlug] = useState("grand-spice");
  const [staffPinInput, setStaffPinInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Security Credentials in Settings
  const [newOwnerPassword, setNewOwnerPassword] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [credSaveMsg, setCredSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Table QR Cache
  const [tableQRs, setTableQRs] = useState<Record<string, string>>({});

  // Menu Search
  const [menuSearch, setMenuSearch] = useState("");

  // KOT Slip Modal
  const [selectedKotOrder, setSelectedKotOrder] = useState<Order | null>(null);

  // Add Table Modal State
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // Add Dish Modal State
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("");
  const [newDishCategory, setNewDishCategory] = useState("");
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);
  const [newDishDesc, setNewDishDesc] = useState("");
  const [newDishImage, setNewDishImage] = useState("");
  const [isSubmittingDish, setIsSubmittingDish] = useState(false);

  // Settings Form State
  const [settingsName, setSettingsName] = useState("");
  const [settingsCurrency, setSettingsCurrency] = useState("₹");
  const [settingsTax, setSettingsTax] = useState(5);
  const [settingsUpi, setSettingsUpi] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsAddress, setSettingsAddress] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  // Verify session on mount
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const querySlug = sp?.get("slug");
        if (querySlug) {
          setStaffRestaurantSlug(querySlug);
          setLoginIdentifier(querySlug);
        }

        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setAuthUser(data.user);
            setRestaurantSlug(data.user.slug);
            setStaffRestaurantSlug(data.user.slug);
            setNewOwnerEmail(data.user.ownerEmail || "");
            setNewOwnerName(data.user.ownerName || "");
          }
        }
      } catch (err) {
        console.error("Auth session check error:", err);
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkAuthSession();
  }, []);

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      setLoginError("Please enter your login email/slug and password.");
      return;
    }
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthUser(data.user);
        setRestaurantSlug(data.user.slug);
        setStaffRestaurantSlug(data.user.slug);
        setNewOwnerEmail(data.user.ownerEmail || "");
        setNewOwnerName(data.user.ownerName || "");
      } else {
        setLoginError(data.error || "Incorrect login credentials.");
      }
    } catch {
      setLoginError("Failed to connect to authentication service.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStaffPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPinInput || staffPinInput.length < 4) {
      setLoginError("Please enter 4-digit staff PIN.");
      return;
    }
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pin_login",
          slug: staffRestaurantSlug,
          pin: staffPinInput,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthUser(data.user);
        setRestaurantSlug(data.user.slug);
      } else {
        setLoginError(data.error || "Incorrect 4-digit staff PIN. Default is 1234.");
      }
    } catch {
      setLoginError("Failed to connect to authentication service.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setAuthUser(null);
    setLoginPassword("");
    setStaffPinInput("");
    setLoginError(null);
  };

  const handleUpdateCredentials = async () => {
    setIsSavingCreds(true);
    setCredSaveMsg(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_credentials",
          newPassword: newOwnerPassword,
          newStaffPin: newStaffPin,
          ownerEmail: newOwnerEmail,
          ownerName: newOwnerName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCredSaveMsg({ type: "success", text: "Security credentials updated in SQLite database!" });
        setNewOwnerPassword("");
        if (data.user) setAuthUser(data.user);
      } else {
        setCredSaveMsg({ type: "error", text: data.error || "Failed to update security credentials." });
      }
    } catch {
      setCredSaveMsg({ type: "error", text: "Server error updating credentials." });
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Web Audio API Synthesizer Chime for New Order Sound (Handles Autoplay & Suspended state)
  const playNewOrderChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(587.33, now, 0.25); // D5
      playTone(880.00, now + 0.15, 0.4); // A5
      playTone(1174.66, now + 0.3, 0.6); // D6
    } catch {
      // AudioContext blocked
    }
  };

  // Waiter & Service Request notification sound
  const playServiceChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // AudioContext blocked
    }
  };

  // Fetch all registered restaurants for the switcher
  useEffect(() => {
    async function loadRestaurantsList() {
      try {
        const res = await fetch("/api/restaurants");
        if (res.ok) {
          const list = await res.json();
          setAvailableRestaurants(list);
        }
      } catch {
        // ignore
      }
    }
    loadRestaurantsList();
  }, []);

  // Reset alert counters when switching restaurant
  useEffect(() => {
    prevOrdersCountRef.current = 0;
    prevRequestsCountRef.current = 0;
  }, [restaurantSlug]);

  // Fetch current restaurant data
  const loadDashboardData = async () => {
    if (!authUser) return;
    try {
      const restRes = await fetch(`/api/restaurants/${restaurantSlug}`);
      if (restRes.ok) {
        const restData: Restaurant = await restRes.json();
        setRestaurant(restData);

        // Auto sync form fields when switching restaurant or on initial load
        if (lastLoadedSlugRef.current !== restData.slug) {
          lastLoadedSlugRef.current = restData.slug;
          setSettingsName(restData.name);
          setSettingsCurrency(restData.currencySymbol || "₹");
          setSettingsTax(restData.taxRatePercent || 5);
          setSettingsUpi(restData.upiId || "");
          setSettingsPhone(restData.phone || "");
          setSettingsAddress(restData.address || "");
        }

        // Fetch Orders
        const ordRes = await fetch(`/api/orders?restaurantId=${restData.id}`);
        if (ordRes.ok) {
          const ordData: Order[] = await ordRes.json();
          
          if (prevOrdersCountRef.current > 0 && ordData.length > prevOrdersCountRef.current) {
            playNewOrderChime();
          }
          prevOrdersCountRef.current = ordData.length;
          setOrders(ordData);
        }

        // Fetch Service Requests
        const reqRes = await fetch(`/api/service-requests?restaurantId=${restData.id}`);
        if (reqRes.ok) {
          const reqData: ServiceRequest[] = await reqRes.json();
          const pendingCount = reqData.filter((r) => r.status === "pending").length;
          if (prevRequestsCountRef.current > 0 && pendingCount > prevRequestsCountRef.current) {
            playServiceChime();
          }
          prevRequestsCountRef.current = pendingCount;
          setServiceRequests(reqData);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authUser) return;
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000); // 4-second polling
    return () => clearInterval(interval);
  }, [restaurantSlug, authUser]);

  // Generate QR codes for tables
  useEffect(() => {
    if (!restaurant) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    const generateQRs = async () => {
      const mod = await import("qrcode");
      const QRCode = mod.default || mod;
      const qrs: Record<string, string> = {};
      for (const tbl of restaurant.tables) {
        const tableUrl = `${origin}/r/${restaurant.slug}/t/${tbl.id}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(tableUrl, {
            width: 320,
            margin: 2,
            color: { dark: "#0f172a", light: "#ffffff" },
          });
          qrs[tbl.id] = qrDataUrl;
        } catch (err) {
          console.error("Failed to generate QR for", tbl.id, err);
        }
      }
      setTableQRs(qrs);
    };

    generateQRs();
  }, [restaurant]);

  // Order status transitions
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: Order["status"]) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });
      if (res.ok) {
        loadDashboardData();
      } else {
        alert("Failed to update status");
      }
    } catch {
      alert("Failed to update status");
    }
  };

  // 1-Click Payment Status toggle
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: "paid" | "unpaid") => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
        );
      } else {
        alert("Failed to update payment status");
      }
    } catch {
      alert("Error updating payment status");
    }
  };

  // Cancel order handler
  const handleCancelOrder = async (orderId: string, tableNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order for ${tableNumber}? This will mark it cancelled.`)) return;
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "cancelled" }),
      });
      if (res.ok) {
        loadDashboardData();
      } else {
        alert("Failed to cancel order");
      }
    } catch {
      alert("Error cancelling order");
    }
  };

  // Delete Dish Handler
  const handleDeleteDish = async (itemId: string, dishName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${dishName}" from the menu?`)) return;
    try {
      const res = await fetch(`/api/menu?itemId=${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRestaurant((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            menuItems: prev.menuItems.filter((it) => it.id !== itemId),
          };
        });
      } else {
        alert("Failed to delete dish");
      }
    } catch {
      alert("Error deleting dish");
    }
  };

  // Delete Table Handler
  const handleDeleteTable = async (tableId: string, tableNumber: string) => {
    if (!confirm(`Are you sure you want to delete "${tableNumber}" and remove its QR code?`)) return;
    try {
      const res = await fetch(`/api/tables?tableId=${tableId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRestaurant((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tables: prev.tables.filter((tbl) => tbl.id !== tableId),
          };
        });
        loadDashboardData();
      } else {
        alert("Failed to delete table");
      }
    } catch {
      alert("Error deleting table");
    }
  };

  // Attend service request
  const handleAttendRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch {
      alert("Failed to clear request");
    }
  };

  // Toggle item availability
  const handleToggleAvailability = async (itemId: string) => {
    if (!restaurant) return;
    try {
      const res = await fetch("/api/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: restaurant.slug, itemId }),
      });
      if (res.ok) {
        setRestaurant((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            menuItems: prev.menuItems.map((item) =>
              item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
            ),
          };
        });
      }
    } catch {
      alert("Failed to toggle availability");
    }
  };

  // Add Table Handler
  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newTableNum.trim()) return;
    setIsSubmittingTable(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableNumber: newTableNum.trim(),
          seats: Number(newTableSeats) || 4,
        }),
      });
      if (res.ok) {
        setNewTableNum("");
        setIsAddTableOpen(false);
        loadDashboardData();
      } else {
        alert("Failed to add table");
      }
    } catch {
      alert("Error adding table");
    } finally {
      setIsSubmittingTable(false);
    }
  };

  // Add Dish Handler
  const handleAddDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newDishName.trim() || !newDishPrice) return;
    setIsSubmittingDish(true);
    try {
      const categoryId = newDishCategory || restaurant.categories[0]?.id;
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          categoryId,
          name: newDishName.trim(),
          description: newDishDesc.trim(),
          price: Number(newDishPrice),
          isVeg: newDishIsVeg,
          imageUrl: newDishImage.trim(),
        }),
      });
      if (res.ok) {
        setNewDishName("");
        setNewDishPrice("");
        setNewDishDesc("");
        setNewDishImage("");
        setIsAddDishOpen(false);
        loadDashboardData();
      } else {
        alert("Failed to add dish");
      }
    } catch {
      alert("Error adding dish");
    } finally {
      setIsSubmittingDish(false);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async () => {
    if (!restaurant) return;
    setIsSavingSettings(true);
    setSettingsSaveMsg(null);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsName,
          currencySymbol: settingsCurrency,
          taxRatePercent: Number(settingsTax),
          upiId: settingsUpi,
          phone: settingsPhone,
          address: settingsAddress,
        }),
      });
      if (res.ok) {
        setSettingsSaveMsg("Settings saved successfully to database! ✓");
        setTimeout(() => setSettingsSaveMsg(null), 3500);
        loadDashboardData();
      } else {
        alert("Failed to save settings");
      }
    } catch {
      alert("Error saving settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Filtered orders for KDS
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      let matchesFilter = true;
      if (kdsFilter === "active") {
        matchesFilter = o.status === "pending" || o.status === "cooking" || o.status === "ready";
      } else if (kdsFilter === "pending") matchesFilter = o.status === "pending";
      else if (kdsFilter === "cooking") matchesFilter = o.status === "cooking";
      else if (kdsFilter === "ready") matchesFilter = o.status === "ready";
      else if (kdsFilter === "unpaid") matchesFilter = o.paymentStatus !== "paid" && o.status !== "cancelled";

      if (!matchesFilter) return false;

      if (kdsSearch.trim()) {
        const query = kdsSearch.toLowerCase().trim();
        const matchesTable = o.tableNumber.toLowerCase().includes(query);
        const matchesId = o.id.toLowerCase().includes(query);
        const matchesCustomer = (o.customerName || "").toLowerCase().includes(query);
        const matchesDish = o.items.some((it) => it.name.toLowerCase().includes(query));
        return matchesTable || matchesId || matchesCustomer || matchesDish;
      }
      return true;
    });
  }, [orders, kdsFilter, kdsSearch]);

  // Analytics Calculations
  const analyticsData = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelled");
    const totalRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);
    const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
    
    // Top dish counter
    const dishCounts: Record<string, { name: string; count: number; revenue: number; isVeg: boolean }> = {};
    validOrders.forEach((ord) => {
      ord.items.forEach((it) => {
        if (!dishCounts[it.name]) {
          dishCounts[it.name] = { name: it.name, count: 0, revenue: 0, isVeg: it.isVeg };
        }
        dishCounts[it.name].count += it.quantity;
        dishCounts[it.name].revenue += it.price * it.quantity;
      });
    });

    const topDishes = Object.values(dishCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    // Ratings
    const ratedOrders = orders.filter((o) => o.rating && o.rating > 0);
    const avgRating = ratedOrders.length > 0
      ? (ratedOrders.reduce((acc, o) => acc + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
      : "5.0";

    return {
      totalRevenue,
      totalOrders: validOrders.length,
      avgOrderValue,
      topDishes,
      avgRating,
      ratingCount: ratedOrders.length,
    };
  }, [orders]);

  // Active Pending Service Requests
  const pendingRequests = serviceRequests.filter((r) => r.status === "pending");

  // Authentication Guard: Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-2" />
        <span className="ml-3 font-semibold text-sm">Verifying Secure Session...</span>
      </div>
    );
  }

  // Authentication Guard: Login Screen
  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
        {/* Top Header */}
        <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-orange-600/30">
                ⚡
              </div>
              <span className="font-extrabold text-base text-white">ScanBite SaaS</span>
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold text-orange-400 hover:text-orange-300 transition flex items-center gap-1"
            >
              <span>Register New Restaurant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Login Container */}
        <main className="max-w-md w-full mx-auto p-4 sm:p-6 my-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-600/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Partner Login</h1>
              <p className="text-xs text-slate-400 mt-1">
                Access your restaurant live orders, kitchen display &amp; settings.
              </p>
            </div>

            {/* Tab Switcher: Owner vs Staff */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => { setAuthTab("owner"); setLoginError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authTab === "owner"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Owner Password</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("staff"); setLoginError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authTab === "staff"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Staff 4-Digit PIN</span>
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
                <X className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {authTab === "owner" ? (
              <form onSubmit={handleOwnerLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                    <span>Owner Email or Restaurant Slug</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. owner@grandspice.com or grand-spice"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2.5 rounded-xl text-white font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-400" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter dashboard password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2.5 pr-10 rounded-xl text-white font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full mt-2 bg-orange-600 hover:bg-orange-500 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition active:scale-95 disabled:opacity-50"
                >
                  {isLoggingIn ? "Authenticating..." : "Sign In to Dashboard →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleStaffPinLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-orange-400" />
                    <span>Select Restaurant</span>
                  </label>
                  <select
                    value={staffRestaurantSlug}
                    onChange={(e) => setStaffRestaurantSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2.5 rounded-xl text-white font-medium focus:outline-none"
                  >
                    {availableRestaurants.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.name} ({r.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-orange-400" />
                    <span>Kitchen / Floor 4-Digit PIN</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={staffPinInput}
                    onChange={(e) => setStaffPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full text-center text-3xl tracking-widest font-mono bg-slate-950 border border-slate-700 focus:border-orange-500 text-white rounded-2xl py-2.5 outline-none font-bold"
                  />
                  <p className="text-[10px] text-slate-500 text-center mt-1">Default PIN is 1234</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || staffPinInput.length < 4}
                  className="w-full mt-2 bg-orange-600 hover:bg-orange-500 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition active:scale-95 disabled:opacity-50"
                >
                  {isLoggingIn ? "Checking PIN..." : "Open Kitchen Display (Staff) →"}
                </button>
              </form>
            )}

            {/* Quick 1-Tap Demo Credentials Box */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                ⚡ Quick Demo Fast Access
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("owner");
                    setLoginIdentifier("owner@grandspice.com");
                    setLoginPassword("admin123");
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] text-left text-slate-300 hover:text-white transition"
                >
                  <div className="font-bold text-orange-400">👑 Grand Spice Owner</div>
                  <div className="text-[10px] text-slate-500">Pass: admin123</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("staff");
                    setStaffRestaurantSlug("grand-spice");
                    setStaffPinInput("1234");
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] text-left text-slate-300 hover:text-white transition"
                >
                  <div className="font-bold text-amber-400">👨‍🍳 Kitchen Staff</div>
                  <div className="text-[10px] text-slate-500">PIN: 1234</div>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/register"
              className="text-xs font-bold text-slate-400 hover:text-white transition inline-flex items-center gap-1"
            >
              <span>Want to register a new cafe or restaurant?</span>
              <span className="text-orange-400 underline">Get started free</span>
            </Link>
          </div>
        </main>

        <footer className="text-center py-4 text-[11px] text-slate-600 border-t border-slate-900">
          ScanBite Restaurant Operations &amp; QR Ordering Platform • Protected by Session Auth
        </footer>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-2" />
        <span className="ml-3 font-semibold">Loading Live Dashboard...</span>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-900 text-white text-center">
        <Store className="w-12 h-12 text-orange-400 mb-3" />
        <h2 className="text-xl font-bold mb-2">Restaurant Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">Slug &ldquo;{restaurantSlug}&rdquo; does not exist.</p>
        <button
          onClick={() => setRestaurantSlug("grand-spice")}
          className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl"
        >
          Switch to Grand Spice Demo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-500/30">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                {availableRestaurants.length > 1 ? (
                  <select
                    value={restaurantSlug}
                    onChange={(e) => setRestaurantSlug(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white font-bold text-xs sm:text-sm px-2 py-1 rounded-lg focus:outline-none"
                  >
                    {availableRestaurants.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h1 className="font-bold text-base text-white tracking-wide">{restaurant.name}</h1>
                )}

                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Kitchen & Staff Operations Console</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab("kds")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "kds"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen</span>
              {filteredOrders.length > 0 && (
                <span className="bg-white text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {filteredOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "analytics"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("menu")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "menu"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <MenuIcon className="w-4 h-4" />
              <span>Menu</span>
            </button>

            <button
              onClick={() => setActiveTab("tables")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "tables"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRs</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "settings"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Sound Toggle & Account Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!soundEnabled) setSoundEnabled(true);
                playNewOrderChime();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 text-xs font-bold flex items-center gap-1 transition"
              title="Test Sound Chime (Unlocks AudioContext in Browser)"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Test Sound</span>
            </button>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playNewOrderChime();
              }}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? "bg-orange-950/60 border-orange-500/40 text-orange-400"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
              title={soundEnabled ? "Sound Alerts Active (Click to mute)" : "Sound Muted (Click to enable)"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <a
              href={`/r/${restaurant.slug}/t/${restaurant.tables[0]?.id || "tbl-1"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
              <span>Diner Menu ({restaurant.tables[0]?.tableNumber || "Table 1"})</span>
            </a>

            <Link
              href="/admin"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-xs font-bold text-amber-300 border border-amber-600/40 transition"
              title="Super Admin Master Console"
            >
              <span>👑 Super Admin</span>
            </Link>

            {/* User Account Info & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-bold text-white flex items-center justify-end gap-1">
                  {authUser?.role === "owner" ? (
                    <span className="text-amber-400 font-extrabold flex items-center gap-1">
                      👑 {authUser.ownerName || restaurant.name}
                    </span>
                  ) : (
                    <span className="text-cyan-400 font-extrabold flex items-center gap-1">
                      👨‍🍳 Staff Mode
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {authUser?.ownerEmail || restaurant.slug}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition shadow-sm active:scale-95"
                title="Sign Out / Lock Dashboard"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Live System Broadcast Banner */}
      {restaurant.platformSetting?.broadcastMessage && (
        <div className="bg-gradient-to-r from-orange-950 via-amber-950 to-slate-900 border-b border-orange-500/40 text-orange-200 px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-orange-400 animate-pulse flex-shrink-0" />
            <span>
              <strong className="text-orange-400 uppercase tracking-wider mr-1.5">📢 System Broadcast:</strong>
              {restaurant.platformSetting.broadcastMessage}
            </span>
          </div>
        </div>
      )}

      {/* Platform Maintenance Mode Alert */}
      {restaurant.platformSetting?.isMaintenance && (
        <div className="bg-amber-600 text-slate-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
          <Wrench className="w-4 h-4 flex-shrink-0" />
          <span>🛠️ Platform Maintenance Mode is currently active across the system. Core updates in progress.</span>
        </div>
      )}

      {/* Account Suspended Alert */}
      {restaurant.isActive === false && (
        <div className="bg-rose-600 text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
          <span>⚠️ Account Suspended: Customer digital QR ordering is currently disabled for this restaurant. Please contact platform admin to renew subscription.</span>
        </div>
      )}

      {/* Real-time Waiter Calls Bar */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 shadow-sm font-semibold text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1 font-extrabold uppercase bg-slate-900 text-amber-400 px-2 py-0.5 rounded text-[10px]">
              <Bell className="w-3 h-3 animate-bounce" /> ATTENTION REQUIRED:
            </span>
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="inline-flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full text-slate-900 shadow-sm"
              >
                <span>
                  <strong>{req.tableNumber}</strong>: {
                    req.type === "water" ? "💧 Needs Water" : 
                    req.type === "bill" ? "🧾 Requested Bill" : 
                    req.type === "cleaning" ? "🧹 Clean Table" : 
                    "🛎️ Called Waiter"
                  }
                </span>
                <button
                  onClick={() => handleAttendRequest(req.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                >
                  Clear ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ===================== TAB 1: KITCHEN DISPLAY (KDS) ===================== */}
        {activeTab === "kds" && (
          <div className="space-y-6">
            {/* Quick Status Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">New Pending</span>
                  <div className="text-xl font-black text-amber-900 mt-0.5">
                    {orders.filter((o) => o.status === "pending").length}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                  ⏳
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-orange-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">In Kitchen</span>
                  <div className="text-xl font-black text-orange-900 mt-0.5">
                    {orders.filter((o) => o.status === "cooking").length}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                  👨‍🍳
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Ready to Serve</span>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">
                    {orders.filter((o) => o.status === "ready").length}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  🔔
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Unpaid Bills</span>
                  <div className="text-xl font-black text-rose-900 mt-0.5">
                    {orders.filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled").length}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                  💵
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setKdsFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    kdsFilter === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Active ({orders.filter((o) => ["pending", "cooking", "ready"].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setKdsFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    kdsFilter === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pending ({orders.filter((o) => o.status === "pending").length})
                </button>
                <button
                  onClick={() => setKdsFilter("cooking")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    kdsFilter === "cooking" ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cooking ({orders.filter((o) => o.status === "cooking").length})
                </button>
                <button
                  onClick={() => setKdsFilter("ready")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    kdsFilter === "ready" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ready ({orders.filter((o) => o.status === "ready").length})
                </button>
                <button
                  onClick={() => setKdsFilter("unpaid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    kdsFilter === "unpaid" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Unpaid ({orders.filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled").length})
                </button>
                <button
                  onClick={() => setKdsFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    kdsFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({orders.length})
                </button>
              </div>

              {/* KDS Search Input */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search table, order #, dish..."
                  value={kdsSearch}
                  onChange={(e) => setKdsSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
                {kdsSearch && (
                  <button
                    onClick={() => setKdsSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-syncing 4s • Chime {soundEnabled ? "ON 🔔" : "MUTED"}</span>
              </div>
            </div>

            {/* Orders Ticket Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
                <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-lg">No Orders in this view</h3>
                <p className="text-slate-500 text-xs mt-1">
                  When a customer scans a table QR code and submits an order, it appears here instantly!
                </p>
                <a
                  href={`/r/${restaurant.slug}/t/${restaurant.tables[0]?.id || "tbl-1"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
                >
                  Place a Test Order as Diner <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

                  const statusConfig = {
                    pending: {
                      cardBorder: "border-amber-300 ring-2 ring-amber-400/20",
                      badge: "bg-amber-100 text-amber-900 border-amber-300",
                      label: "Pending / New",
                      nextBtnText: "Start Cooking 👨‍🍳",
                      nextBtnAction: () => handleUpdateOrderStatus(order.id, "cooking"),
                      nextBtnClass: "bg-orange-500 hover:bg-orange-600 text-white",
                    },
                    cooking: {
                      cardBorder: "border-orange-300 ring-2 ring-orange-500/20",
                      badge: "bg-orange-100 text-orange-900 border-orange-300",
                      label: "Cooking in Kitchen",
                      nextBtnText: "Mark Ready 🔔",
                      nextBtnAction: () => handleUpdateOrderStatus(order.id, "ready"),
                      nextBtnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
                    },
                    ready: {
                      cardBorder: "border-emerald-300 ring-2 ring-emerald-500/20",
                      badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
                      label: "Ready to Serve",
                      nextBtnText: "Mark Served ✅",
                      nextBtnAction: () => handleUpdateOrderStatus(order.id, "served"),
                      nextBtnClass: "bg-blue-600 hover:bg-blue-700 text-white",
                    },
                    served: {
                      cardBorder: "border-slate-200 opacity-75",
                      badge: "bg-slate-100 text-slate-800 border-slate-300",
                      label: "Served at Table",
                      nextBtnText: "Complete & Close",
                      nextBtnAction: () => handleUpdateOrderStatus(order.id, "completed"),
                      nextBtnClass: "bg-slate-700 hover:bg-slate-800 text-white",
                    },
                    completed: {
                      cardBorder: "border-slate-200 opacity-60",
                      badge: "bg-slate-100 text-slate-600 border-slate-200",
                      label: "Completed",
                      nextBtnText: "Archived",
                      nextBtnAction: () => {},
                      nextBtnClass: "hidden",
                    },
                    cancelled: {
                      cardBorder: "border-red-200 opacity-50",
                      badge: "bg-red-100 text-red-800 border-red-200",
                      label: "Cancelled",
                      nextBtnText: "",
                      nextBtnAction: () => {},
                      nextBtnClass: "hidden",
                    },
                  };

                  const config = statusConfig[order.status];

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-sm transition hover:shadow-md ${config.cardBorder}`}
                    >
                      {/* Ticket Header */}
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-xl font-black text-slate-900 tracking-tight">
                              {order.tableNumber}
                            </span>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>#{order.id.slice(-4)}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">
                                {minutesAgo <= 0 ? "Just now" : `${minutesAgo}m ago`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedKotOrder(order)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                              title="Print Thermal KOT Slip"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.badge}`}>
                              {config.label}
                            </span>
                          </div>
                        </div>

                        {/* Customer / Payment detail */}
                        <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50 gap-2">
                          <span className="text-slate-500 truncate">
                            Diner: <strong className="text-slate-800">{order.customerName || "Walk-in Guest"}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePaymentStatus(order.id, order.paymentStatus === "paid" ? "unpaid" : "paid")}
                            className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border transition shadow-xs flex items-center gap-1 ${
                              order.paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                            }`}
                            title="Click to toggle Paid/Unpaid"
                          >
                            <span>{order.paymentStatus === "paid" ? "✅ Paid" : "⏳ Unpaid"}</span>
                            <span className="opacity-70 text-[9px]">({order.paymentMethod?.replace("_", " ") || "Cash"})</span>
                          </button>
                        </div>

                        {/* Items Checklist */}
                        <div className="py-3 space-y-2.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between text-sm">
                              <div className="flex items-start gap-2">
                                <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full inline-block ${
                                        item.isVeg ? "bg-emerald-500" : "bg-red-500"
                                      }`}
                                    />
                                    <span>{item.name}</span>
                                  </div>
                                  {item.notes && (
                                    <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 font-medium border border-amber-200/60">
                                      Note: {item.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-slate-600">
                                {restaurant.currencySymbol}
                                {item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ticket Footer */}
                      <div className="pt-3 border-t border-slate-100">
                        {order.discount && order.discount > 0 ? (
                          <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold mb-1.5">
                            <span>Discount ({order.couponCode || "Coupon"})</span>
                            <span>-{restaurant.currencySymbol}{order.discount}</span>
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-3">
                          <span>Total Amount</span>
                          <span className="text-base text-slate-900">
                            {restaurant.currencySymbol}
                            {order.total}
                          </span>
                        </div>

                        {/* Status Change Action Button */}
                        <div className="flex items-center gap-2">
                          {config.nextBtnText && (
                            <button
                              onClick={config.nextBtnAction}
                              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5 ${config.nextBtnClass}`}
                            >
                              <span>{config.nextBtnText}</span>
                            </button>
                          )}
                          {["pending", "cooking"].includes(order.status) && (
                            <button
                              onClick={() => handleCancelOrder(order.id, order.tableNumber)}
                              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition active:scale-95 flex items-center justify-center gap-1"
                              title="Cancel / Reject this order"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: BUSINESS ANALYTICS ===================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {restaurant.currencySymbol}
                  {analyticsData.totalRevenue}
                </div>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">Across all tables</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                  <FileText className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{analyticsData.totalOrders}</div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Orders processed</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Avg Order Value</span>
                  <TrendingUp className="w-5 h-5 text-sky-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {restaurant.currencySymbol}
                  {analyticsData.avgOrderValue}
                </div>
                <p className="text-[11px] text-sky-600 font-medium mt-1">Per dining table</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Guest Rating</span>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {analyticsData.avgRating} <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{analyticsData.ratingCount} guest reviews</p>
              </div>
            </div>

            {/* Leaderboard: Top Selling Dishes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Top Selling Dishes Leaderboard</span>
              </h3>

              <div className="space-y-3">
                {analyticsData.topDishes.map((dish, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-200 font-black text-xs text-slate-700 flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full ${dish.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">{dish.name}</span>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-xs text-slate-900">{dish.count} ordered</div>
                      <div className="text-[10px] text-slate-400">{restaurant.currencySymbol}{dish.revenue} earned</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: MENU & STOCK MANAGEMENT ===================== */}
        {activeTab === "menu" && (
          <div className="space-y-6">
            {/* Header / Filter */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Menu Catalog & Instant Stock Toggle</h2>
                <p className="text-xs text-slate-500">
                  Switch any finished dish to &ldquo;Out of Stock&rdquo; to instantly prevent diner orders.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dish..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:bg-white"
                  />
                </div>

                <button
                  onClick={() => setIsAddDishOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add New Dish
                </button>
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Dish</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Live Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {restaurant.menuItems
                    .filter((it) => it.name.toLowerCase().includes(menuSearch.toLowerCase()))
                    .map((item) => {
                      const category = restaurant.categories.find((c) => c.id === item.categoryId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{item.name}</div>
                              <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {category?.icon} {category?.name}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {restaurant.currencySymbol}
                            {item.price}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] ${
                                item.isVeg ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                              }`}
                            >
                              {item.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleAvailability(item.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                item.isAvailable
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  item.isAvailable ? "bg-emerald-600" : "bg-red-600"
                                }`}
                              />
                              <span>{item.isAvailable ? "In Stock (Available)" : "Sold Out (Disabled)"}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteDish(item.id, item.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title={`Delete "${item.name}"`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: TABLE & QR CODE GENERATOR ===================== */}
        {activeTab === "tables" && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Table QR Stands & Generator</h2>
                <p className="text-xs text-slate-500">
                  Download or print high-resolution QR tent cards for your restaurant tables.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddTableOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Table
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition active:scale-95"
                >
                  <Printer className="w-4 h-4" /> Print All Tent Cards
                </button>
              </div>
            </div>

            {/* Tables Grid */}
            <div id="printable-qr-grid" className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${selectedKotOrder ? "no-print" : ""}`}>
              {restaurant.tables.map((table) => {
                const qrImage = tableQRs[table.id];
                const dinerUrl = `/r/${restaurant.slug}/t/${table.id}`;

                return (
                  <div
                    key={table.id}
                    className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:border-orange-500 transition break-inside-avoid"
                  >
                    {/* Header */}
                    <div className="mb-2">
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">
                        {restaurant.name}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-1">{table.tableNumber}</h3>
                      <p className="text-[11px] text-slate-400">Scan to View Menu & Order</p>
                    </div>

                    {/* QR Code Container */}
                    <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                      {qrImage ? (
                        <img
                          src={qrImage}
                          alt={`QR Code for ${table.tableNumber}`}
                          className="w-44 h-44 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400">
                          Generating QR...
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] font-semibold text-slate-600">
                      Zero app install • Fast ordering
                    </p>

                    {/* Action Links */}
                    <div className="no-print mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold gap-1">
                      <a
                        href={dinerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Test Link
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSinglePrintTable(table)}
                          className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 transition"
                          title="Print this single table tent card"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Print</span>
                        </button>

                        {qrImage && (
                          <a
                            href={qrImage}
                            download={`${table.tableNumber}-QR.png`}
                            className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 transition"
                            title="Download QR Image PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title={`Delete ${table.tableNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: SETTINGS ===================== */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Restaurant & Billing Settings</h2>
              <p className="text-xs text-slate-500">Configure your business details, taxes, and UPI payment info.</p>
            </div>

            {settingsSaveMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{settingsSaveMsg}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settingsCurrency}
                    onChange={(e) => setSettingsCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST / Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settingsTax}
                    onChange={(e) => setSettingsTax(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UPI ID for Direct Table Payments</label>
                <input
                  type="text"
                  placeholder="e.g. restaurant@icici"
                  value={settingsUpi}
                  onChange={(e) => setSettingsUpi(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Customers who select &ldquo;Pay via UPI&rdquo; will be prompted to scan or pay directly to this VPA.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={settingsPhone}
                    onChange={(e) => setSettingsPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={settingsAddress}
                    onChange={(e) => setSettingsAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Security & Credentials Management (Roadmap P-02) */}
              <div className="pt-6 border-t border-slate-100">
                <div className="mb-3">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    <span>Security &amp; Dashboard Credentials</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Update your owner password, email, and staff 4-digit PIN stored directly in SQLite.
                  </p>
                </div>

                {authUser?.role !== "owner" && (
                  <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>You are signed in as Staff. Owner password and email can only be updated when logged in as Owner.</span>
                  </div>
                )}

                {credSaveMsg && (
                  <div
                    className={`mb-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      credSaveMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <span>{credSaveMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Owner Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Owner Login Email</label>
                    <input
                      type="email"
                      placeholder="owner@grandspice.com"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Dashboard Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={newOwnerPassword}
                      onChange={(e) => setNewOwnerPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Staff Quick PIN (4 Digits)</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Default: 1234"
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-mono tracking-widest text-center font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdateCredentials}
                    disabled={isSavingCreds || authUser?.role !== "owner"}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow transition active:scale-95 disabled:opacity-50"
                  >
                    {isSavingCreds ? "Updating Credentials..." : "Update Security Credentials"}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition active:scale-95 disabled:opacity-50"
              >
                {isSavingSettings ? "Saving to Database..." : "Save Settings to Database"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===================== MODAL: KOT THERMAL SLIP PREVIEW & PRINT ===================== */}
      {selectedKotOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print-modal-container">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 no-print">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-orange-500" />
                <span>Thermal KOT Slip Preview</span>
              </h3>
              <button
                onClick={() => setSelectedKotOrder(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 80mm Receipt Look */}
            <div id="printable-kot-slip" className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl font-mono text-xs text-slate-800 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-extrabold uppercase">{restaurant.name}</div>
                <div className="text-[10px] text-slate-500">*** KITCHEN ORDER TICKET (KOT) ***</div>
                <div className="text-[10px] mt-1">Date: {new Date(selectedKotOrder.createdAt).toLocaleDateString()} {new Date(selectedKotOrder.createdAt).toLocaleTimeString()}</div>
              </div>

              <div className="flex justify-between font-bold text-sm py-1 border-b border-dashed border-slate-300">
                <span>{selectedKotOrder.tableNumber}</span>
                <span>#{selectedKotOrder.id.slice(-4)}</span>
              </div>

              <div className="flex justify-between text-[11px] py-1 border-b border-dashed border-slate-300">
                <span>Diner: {selectedKotOrder.customerName || "Walk-in Guest"}</span>
                <span className="font-bold uppercase text-slate-900">
                  {selectedKotOrder.paymentStatus === "paid" ? "PAID" : "UNPAID"} ({selectedKotOrder.paymentMethod?.replace("_", " ")})
                </span>
              </div>

              <div className="space-y-1.5 py-1">
                {selectedKotOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <div>
                      <span className="font-extrabold">{it.quantity}x</span> {it.name}
                      {it.notes && <div className="text-[10px] font-sans text-amber-700">** {it.notes} **</div>}
                    </div>
                  </div>
                ))}
              </div>

              {selectedKotOrder.discount && selectedKotOrder.discount > 0 ? (
                <div className="flex justify-between text-xs py-0.5 border-t border-dashed border-slate-300">
                  <span>Discount ({selectedKotOrder.couponCode || "Promo"})</span>
                  <span>-{restaurant.currencySymbol}{selectedKotOrder.discount}</span>
                </div>
              ) : null}

              <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold">
                <span>Total Amount</span>
                <span>{restaurant.currencySymbol}{selectedKotOrder.total}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2 no-print">
              <button
                onClick={() => setSelectedKotOrder(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print KOT Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: SINGLE TABLE TENT CARD PRINT ===================== */}
      {singlePrintTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print-modal-container">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 no-print">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-orange-500" />
                <span>Print Table QR Tent Card</span>
              </h3>
              <button
                onClick={() => setSinglePrintTable(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-single-qr" className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-2 py-0.5 rounded">
                {restaurant.name}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{singlePrintTable.tableNumber}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Scan to View Menu &amp; Order</p>

              <div className="my-4 p-3 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
                {tableQRs[singlePrintTable.id] ? (
                  <img
                    src={tableQRs[singlePrintTable.id]}
                    alt={`QR Code for ${singlePrintTable.tableNumber}`}
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="text-[11px] font-bold text-slate-700">Zero App Download Needed</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Fast Contactless Digital Ordering</div>
            </div>

            <div className="mt-4 flex gap-2 no-print">
              <button
                type="button"
                onClick={() => setSinglePrintTable(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD NEW DISH ===================== */}
      {isAddDishOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Add New Food Dish</h3>
              <button
                onClick={() => setIsAddDishOpen(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDishSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tandoori Soya Chaap"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ({restaurant.currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    placeholder="250"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {restaurant.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dietary Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dietary"
                      checked={newDishIsVeg}
                      onChange={() => setNewDishIsVeg(true)}
                    />
                    <span className="font-semibold text-emerald-700">🟢 Veg</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dietary"
                      checked={!newDishIsVeg}
                      onChange={() => setNewDishIsVeg(false)}
                    />
                    <span className="font-semibold text-red-700">🔴 Non-Veg</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Marinated in spiced yogurt and grilled to perfection."
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newDishImage}
                  onChange={(e) => setNewDishImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDishOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDish}
                  className="px-5 py-2 bg-orange-600 text-white rounded-xl font-bold shadow hover:bg-orange-700 disabled:opacity-50"
                >
                  {isSubmittingDish ? "Adding..." : "Add Dish to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD NEW TABLE ===================== */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Add New Table</h3>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Table Number or Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 9, Rooftop 2, Booth 3"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Seats Count</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTableOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTable}
                  className="px-5 py-2 bg-orange-600 text-white rounded-xl font-bold shadow hover:bg-orange-700 disabled:opacity-50"
                >
                  {isSubmittingTable ? "Creating..." : "Generate Table QR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
