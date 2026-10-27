"use client";

import { useEffect, useState, useMemo } from "react";
import QRCode from "qrcode";
import { 
  Restaurant, 
  Order, 
  ServiceRequest, 
  MenuItem, 
  Table 
} from "@/types";
import { 
  ChefHat, 
  QrCode, 
  Menu as MenuIcon, 
  Settings, 
  Bell, 
  CheckCircle, 
  Clock, 
  Printer, 
  Download, 
  Plus, 
  Search, 
  Flame, 
  Droplets, 
  Receipt, 
  Volume2, 
  VolumeX, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState<"kds" | "menu" | "tables" | "settings">("kds");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // KDS filter
  const [kdsFilter, setKdsFilter] = useState<"active" | "pending" | "cooking" | "ready" | "all">("active");

  // Table QR Cache
  const [tableQRs, setTableQRs] = useState<Record<string, string>>({});

  // Menu Search
  const [menuSearch, setMenuSearch] = useState("");

  // Add Table Modal
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newTableSeats, setNewTableSeats] = useState(4);

  // Add Dish Modal
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("");
  const [newDishCategory, setNewDishCategory] = useState("");
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);
  const [newDishDesc, setNewDishDesc] = useState("");

  // Fetch all initial data
  const loadDashboardData = async () => {
    try {
      const restRes = await fetch("/api/restaurants/grand-spice");
      if (restRes.ok) {
        const restData: Restaurant = await restRes.json();
        setRestaurant(restData);

        // Fetch Orders
        const ordRes = await fetch(`/api/orders?restaurantId=${restData.id}`);
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(ordData);
        }

        // Fetch Service Requests
        const reqRes = await fetch(`/api/service-requests?restaurantId=${restData.id}`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
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
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000); // Poll every 4 seconds for real-time kitchen
    return () => clearInterval(interval);
  }, []);

  // Generate QR codes for tables
  useEffect(() => {
    if (!restaurant) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    const generateQRs = async () => {
      const qrs: Record<string, string> = {};
      for (const tbl of restaurant.tables) {
        const tableUrl = `${origin}/r/${restaurant.slug}/t/${tbl.id}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(tableUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: "#1e293b",
              light: "#ffffff",
            },
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
      }
    } catch {
      alert("Failed to update status");
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
        // Optimistic update
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

  // Filtered orders for KDS
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (kdsFilter === "active") {
        return o.status === "pending" || o.status === "cooking" || o.status === "ready";
      }
      if (kdsFilter === "pending") return o.status === "pending";
      if (kdsFilter === "cooking") return o.status === "cooking";
      if (kdsFilter === "ready") return o.status === "ready";
      return true; // "all"
    });
  }, [orders, kdsFilter]);

  // Active Pending Service Requests
  const pendingRequests = serviceRequests.filter((r) => r.status === "pending");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-2" />
        <span className="ml-3 font-semibold">Loading Live Dashboard...</span>
      </div>
    );
  }

  if (!restaurant) {
    return <div className="p-8 text-center text-slate-700">Failed to load restaurant data.</div>;
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
                <h1 className="font-bold text-base text-white tracking-wide">{restaurant.name}</h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Owner & Kitchen Operations Console</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab("kds")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "kds"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen Display</span>
              {filteredOrders.length > 0 && (
                <span className="bg-white text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {filteredOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("menu")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "menu"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <MenuIcon className="w-4 h-4" />
              <span>Menu & Stock</span>
            </button>

            <button
              onClick={() => setActiveTab("tables")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "tables"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Table QRs</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "settings"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Action: Open Customer Menu in new tab */}
          <div className="flex items-center gap-2">
            <a
              href={`/r/${restaurant.slug}/t/tbl-4`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
              <span>Test Diner Menu (Table 4)</span>
            </a>
          </div>
        </div>
      </header>

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
                  <strong>{req.tableNumber}</strong>: {req.type === "water" ? "💧 Needs Water" : req.type === "bill" ? "🧾 Requested Bill" : "🛎️ Called Waiter"}
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
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setKdsFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    kdsFilter === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Active Orders ({orders.filter((o) => ["pending", "cooking", "ready"].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setKdsFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    kdsFilter === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  New Pending ({orders.filter((o) => o.status === "pending").length})
                </button>
                <button
                  onClick={() => setKdsFilter("cooking")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    kdsFilter === "cooking" ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cooking ({orders.filter((o) => o.status === "cooking").length})
                </button>
                <button
                  onClick={() => setKdsFilter("ready")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    kdsFilter === "ready" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ready to Serve ({orders.filter((o) => o.status === "ready").length})
                </button>
                <button
                  onClick={() => setKdsFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    kdsFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All History ({orders.length})
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-refreshing every 4s</span>
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
                  href={`/r/${restaurant.slug}/t/tbl-4`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
                >
                  Place a Test Order as Table 4 <ChevronRight className="w-4 h-4" />
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

                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.badge}`}>
                            {config.label}
                          </span>
                        </div>

                        {/* Customer / Payment detail */}
                        <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-b border-slate-50">
                          <span>Diner: <strong className="text-slate-800">{order.customerName || "Walk-in Guest"}</strong></span>
                          <span className="font-semibold capitalize text-orange-600">
                            {order.paymentMethod?.replace("_", " ")}
                          </span>
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
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-3">
                          <span>Total Amount</span>
                          <span className="text-base text-slate-900">
                            {restaurant.currencySymbol}
                            {order.total}
                          </span>
                        </div>

                        {/* Status Change Action Button */}
                        {config.nextBtnText && (
                          <button
                            onClick={config.nextBtnAction}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5 ${config.nextBtnClass}`}
                          >
                            <span>{config.nextBtnText}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: MENU & STOCK MANAGEMENT ===================== */}
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
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> Add New Dish
                </button>
              </div>
            </div>

            {/* Menu Items Table / Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Dish</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Live Availability</th>
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
                              src={item.imageUrl || ""}
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
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: TABLE & QR CODE GENERATOR ===================== */}
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
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
                >
                  <Printer className="w-4 h-4" /> Print All Tent Cards
                </button>
              </div>
            </div>

            {/* Tables Grid */}
            <div id="printable-qr-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {restaurant.tables.map((table) => {
                const qrImage = tableQRs[table.id];
                const dinerUrl = `/r/${restaurant.slug}/t/${table.id}`;

                return (
                  <div
                    key={table.id}
                    className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:border-orange-500 transition"
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
                    <div className="no-print mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold">
                      <a
                        href={dinerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Test Link
                      </a>

                      {qrImage && (
                        <a
                          href={qrImage}
                          download={`${table.tableNumber}-QR.png`}
                          className="text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Save PNG
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: SETTINGS ===================== */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Restaurant & Billing Settings</h2>
              <p className="text-xs text-slate-500">Configure your business details, taxes, and UPI payment info.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  defaultValue={restaurant.name}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    defaultValue={restaurant.currencySymbol}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST / Tax Rate (%)</label>
                  <input
                    type="number"
                    defaultValue={restaurant.taxRatePercent}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UPI ID for Direct Table Payments</label>
                <input
                  type="text"
                  defaultValue={restaurant.upiId || ""}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Customers who select &ldquo;Pay via UPI&rdquo; will be prompted to scan or pay directly to this VPA.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address & Contact Phone</label>
                <input
                  type="text"
                  defaultValue={`${restaurant.address} • ${restaurant.phone}`}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => alert("Settings updated successfully!")}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
