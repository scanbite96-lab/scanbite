"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  QrCode, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Key, 
  RefreshCw, 
  Megaphone, 
  Plus, 
  Phone, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  Clock,
  ArrowRight,
  Shield,
  Layers,
  ChefHat
} from "lucide-react";
import { SuperAdminMetrics } from "@/types";

interface AdminRestaurantRow {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  city: string;
  ownerName: string;
  ownerEmail: string | null;
  plan: string;
  planExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  tablesCount: number;
  menuItemsCount: number;
  ordersCount: number;
  gmv: number;
}

interface PlatformSetting {
  id: string;
  broadcastMessage: string | null;
  isMaintenance: boolean;
  supportPhone: string | null;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [restaurants, setRestaurants] = useState<AdminRestaurantRow[]>([]);
  const [setting, setSetting] = useState<PlatformSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [selectedRestForPlan, setSelectedRestForPlan] = useState<AdminRestaurantRow | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanValue, setSelectedPlanValue] = useState("starter");
  const [daysToAdd, setDaysToAdd] = useState(30);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const [isAddRestModalOpen, setIsAddRestModalOpen] = useState(false);
  const [newRestForm, setNewRestForm] = useState({
    name: "",
    slug: "",
    ownerName: "",
    phone: "",
    city: "Delhi NCR",
    plan: "starter",
    initialTables: 6,
  });
  const [isSubmittingNewRest, setIsSubmittingNewRest] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setRestaurants(data.restaurants);
        setSetting(data.platformSetting);
        if (data.platformSetting?.broadcastMessage) {
          setBroadcastMessage(data.platformSetting.broadcastMessage);
        }
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filtered Restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.phone && r.phone.includes(searchTerm)) ||
        r.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPlan = planFilter === "all" || r.plan.toLowerCase() === planFilter.toLowerCase();
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.isActive) ||
        (statusFilter === "suspended" && !r.isActive);

      return matchSearch && matchPlan && matchStatus;
    });
  }, [restaurants, searchTerm, planFilter, statusFilter]);

  // Toggle Active / Suspended
  const handleToggleStatus = async (restaurant: AdminRestaurantRow) => {
    const newStatus = !restaurant.isActive;
    const confirmMsg = newStatus
      ? `Re-activate ${restaurant.name}? Their digital menus will become available immediately.`
      : `Suspend ${restaurant.name}? Their customers won't be able to place orders until re-activated.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-restaurant",
          restaurantId: restaurant.id,
          isActive: newStatus,
        }),
      });
      if (res.ok) {
        showToast(`✅ ${restaurant.name} ${newStatus ? "Activated" : "Suspended"} successfully!`);
        fetchAdminData();
      }
    } catch {
      showToast("❌ Failed to update status");
    }
  };

  // Update Plan & Validity
  const handleUpdatePlan = async () => {
    if (!selectedRestForPlan) return;
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-restaurant",
          restaurantId: selectedRestForPlan.id,
          plan: selectedPlanValue,
          daysToAdd: Number(daysToAdd) || 0,
        }),
      });
      if (res.ok) {
        showToast(`🎉 Plan updated to ${selectedPlanValue.toUpperCase()} (+${daysToAdd} days)!`);
        setIsPlanModalOpen(false);
        fetchAdminData();
      }
    } catch {
      showToast("❌ Failed to update plan");
    }
  };

  // Update Broadcast Message
  const handleSaveBroadcast = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-broadcast",
          broadcastMessage: broadcastMessage.trim() || null,
        }),
      });
      if (res.ok) {
        showToast("📢 Broadcast announcement updated across all dashboards!");
        setIsBroadcastModalOpen(false);
        fetchAdminData();
      }
    } catch {
      showToast("❌ Failed to update broadcast");
    }
  };

  // Delete Restaurant
  const handleDeleteRestaurant = async (restaurant: AdminRestaurantRow) => {
    if (!confirm(`Are you sure you want to permanently delete "${restaurant.name}"? This will delete all its menu items, tables, and past orders.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin?restaurantId=${restaurant.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`🗑️ Restaurant ${restaurant.name} deleted`);
        fetchAdminData();
      }
    } catch {
      showToast("❌ Delete failed");
    }
  };

  // Quick Onboard new restaurant
  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestForm.name.trim()) return;
    setIsSubmittingNewRest(true);
    try {
      const slug = newRestForm.slug.trim() || newRestForm.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRestForm.name,
          slug,
          phone: newRestForm.phone || "+91 98765 00000",
          address: `${newRestForm.city}, India`,
          upiId: `${slug}@upi`,
          initialTables: Number(newRestForm.initialTables) || 6,
        }),
      });
      if (res.ok) {
        // Also update plan
        const created = await res.json();
        await fetch("/api/admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update-restaurant",
            restaurantId: created.id,
            plan: newRestForm.plan,
            city: newRestForm.city,
            ownerName: newRestForm.ownerName || "Partner",
            daysToAdd: 30,
          }),
        });
        showToast(`🎉 Restaurant "${newRestForm.name}" onboarded successfully!`);
        setIsAddRestModalOpen(false);
        setNewRestForm({
          name: "",
          slug: "",
          ownerName: "",
          phone: "",
          city: "Delhi NCR",
          plan: "starter",
          initialTables: 6,
        });
        fetchAdminData();
      } else {
        showToast("❌ Slug already exists or invalid data");
      }
    } catch {
      showToast("❌ Failed to create restaurant");
    } finally {
      setIsSubmittingNewRest(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/40";
      case "enterprise":
        return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/40";
      case "trial":
        return "bg-slate-800 text-slate-300 border border-slate-700";
      default: // starter
        return "bg-blue-500/20 text-blue-400 border border-blue-500/40";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-orange-500/60 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-black flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">ScanBite</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded-full">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Platform Founder & Master Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition"
            >
              <Megaphone className="w-4 h-4 text-orange-400" />
              <span>Broadcast Notice</span>
            </button>

            <button
              onClick={() => setIsAddRestModalOpen(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard Restaurant</span>
            </button>

            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Role Description */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 rounded-3xl border border-slate-800/80 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-orange-600/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-400 text-xs font-bold mb-2">
                👑 Super Admin Command Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome, Platform Owner
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Yahan se aap poore SaaS platform ko control karte hain: har hotel/restaurant ka subscription plan,
                unke live orders ki sales (GMV), 1-click owner dashboard access, aur platform broadcast notices.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAdminData}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700/80 transition flex items-center gap-2 text-xs font-bold"
                title="Refresh Live Data"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Fleet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Restaurants */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Restaurants</span>
              <Building2 className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics ? metrics.totalRestaurants : "..."}
            </div>
            <div className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{metrics ? metrics.activeRestaurants : 0} Live & Active</span>
            </div>
          </div>

          {/* Card 2: Platform GMV */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Platform GMV</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              ₹{metrics ? metrics.totalPlatformGmv.toLocaleString("en-IN") : "0"}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Combined Client Sales
            </div>
          </div>

          {/* Card 3: SaaS MRR */}
          <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-600/30 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Your SaaS MRR</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">
              ₹{metrics ? metrics.estimatedMrr.toLocaleString("en-IN") : "0"}
              <span className="text-xs text-slate-400 font-normal">/mo</span>
            </div>
            <div className="text-[11px] text-amber-400/80 font-medium mt-1">
              Recurring Subscriptions
            </div>
          </div>

          {/* Card 4: Total Orders */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <ChefHat className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics ? metrics.totalOrders : "0"}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Processed through QR
            </div>
          </div>

          {/* Card 5: Total Tables */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Tables</span>
              <QrCode className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics ? metrics.totalTables : "0"}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              QR Standees Deployed
            </div>
          </div>
        </div>

        {/* Global Broadcast Banner Alert */}
        {setting?.broadcastMessage && (
          <div className="bg-gradient-to-r from-orange-950/80 via-amber-950/60 to-slate-900 border border-orange-500/40 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-orange-400 flex-shrink-0 animate-pulse" />
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 mr-2">
                  Live System Broadcast:
                </span>
                <span className="text-xs text-slate-200 font-medium">
                  {setting.broadcastMessage}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="text-xs text-orange-400 hover:text-orange-300 font-bold underline flex-shrink-0"
            >
              Edit Notice
            </button>
          </div>
        )}

        {/* Plan Breakdown Quick Bar */}
        {metrics && (
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
            <div className="text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Subscription Tier Breakdown:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                Free Trial: <b className="text-white">{metrics.planBreakdown.trial}</b>
              </span>
              <span className="px-3 py-1 rounded-lg bg-blue-950/50 text-blue-400 border border-blue-800/60">
                Starter (₹999/mo): <b className="text-white">{metrics.planBreakdown.starter}</b>
              </span>
              <span className="px-3 py-1 rounded-lg bg-purple-950/50 text-purple-400 border border-purple-800/60">
                Pro (₹2,499/mo): <b className="text-white">{metrics.planBreakdown.pro}</b>
              </span>
              <span className="px-3 py-1 rounded-lg bg-amber-950/50 text-amber-400 border border-amber-800/60">
                Enterprise (₹4,999/mo): <b className="text-white">{metrics.planBreakdown.enterprise}</b>
              </span>
            </div>
          </div>
        )}

        {/* Restaurant Directory Table */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl">
          {/* Table Header & Search Filter */}
          <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Restaurant Partners Fleet</span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {filteredRestaurants.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage accounts, grant subscriptions, impersonate owner consoles, and toggle active status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search restaurant, owner, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-orange-500 w-60"
                />
              </div>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Plans</option>
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Restaurant & City</th>
                  <th className="py-3.5 px-4 font-bold">Owner & Contact</th>
                  <th className="py-3.5 px-4 font-bold">Plan & Validity</th>
                  <th className="py-3.5 px-4 font-bold">Tables & Menu</th>
                  <th className="py-3.5 px-4 font-bold">Lifetime Sales</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-6 font-bold text-right">Master Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No restaurants match your search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredRestaurants.map((rest) => (
                    <tr key={rest.id} className="hover:bg-slate-800/30 transition">
                      {/* Name & City */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-950/60 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400">
                            {rest.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{rest.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-orange-400/90">/{rest.slug}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {rest.city}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Phone */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-200">{rest.ownerName}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{rest.phone || "No phone"}</span>
                        </div>
                      </td>

                      {/* Plan & Expiry */}
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getPlanBadge(rest.plan)}`}>
                          {rest.plan}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {rest.planExpiresAt
                              ? new Date(rest.planExpiresAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "No Expiry"}
                          </span>
                        </div>
                      </td>

                      {/* Tables & Items */}
                      <td className="py-4 px-4">
                        <div className="text-slate-200">
                          <b className="text-white">{rest.tablesCount}</b> Tables
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {rest.menuItemsCount} Dishes in menu
                        </div>
                      </td>

                      {/* GMV */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-emerald-400 text-sm">
                          ₹{rest.gmv.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {rest.ordersCount} orders placed
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {rest.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Master Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1-Click Login as Owner (Impersonate) */}
                          <Link
                            href={`/dashboard?slug=${rest.slug}`}
                            target="_blank"
                            className="p-2 bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white rounded-xl border border-orange-500/30 transition flex items-center gap-1.5 font-bold"
                            title="Open Restaurant Owner Dashboard"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Login</span>
                          </Link>

                          {/* Plan Switcher */}
                          <button
                            onClick={() => {
                              setSelectedRestForPlan(rest);
                              setSelectedPlanValue(rest.plan);
                              setIsPlanModalOpen(true);
                            }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                            title="Change Subscription Plan"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Suspend / Resume toggle */}
                          <button
                            onClick={() => handleToggleStatus(rest)}
                            className={`p-2 rounded-xl border transition ${
                              rest.isActive
                                ? "bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border-rose-800/40"
                                : "bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800/40"
                            }`}
                            title={rest.isActive ? "Suspend Restaurant" : "Activate Restaurant"}
                          >
                            {rest.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteRestaurant(rest)}
                            className="p-2 bg-slate-800/50 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 rounded-xl border border-slate-700/50 transition"
                            title="Delete Restaurant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ================= MODAL 1: PLAN SWITCHER & RENEWAL ================= */}
      {isPlanModalOpen && selectedRestForPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Update Plan & Validity
                </h3>
                <p className="text-xs text-orange-400 font-bold mt-0.5">
                  {selectedRestForPlan.name}
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Select Subscription Plan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "trial", name: "Free Trial", price: "₹0" },
                    { id: "starter", name: "Starter", price: "₹999/mo" },
                    { id: "pro", name: "Pro Plan", price: "₹2,499/mo" },
                    { id: "enterprise", name: "Enterprise", price: "₹4,999/mo" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanValue(p.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedPlanValue === p.id
                          ? "bg-orange-950/60 border-orange-500 text-white font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[11px] text-orange-400">{p.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Extend Validity By (Days)
                </label>
                <select
                  value={daysToAdd}
                  onChange={(e) => setDaysToAdd(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value={15}>+15 Days (Trial Extension)</option>
                  <option value={30}>+30 Days (1 Month)</option>
                  <option value={90}>+90 Days (Quarterly)</option>
                  <option value={365}>+365 Days (1 Full Year)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePlan}
                className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
              >
                Confirm Plan Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: BROADCAST NOTICE ================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">
                  Platform Broadcast Announcement
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Yeh notice saare registered restaurants ke live dashboard aur staff console par sabse upar banner ke roop mein dikhega.
            </p>

            <div>
              <textarea
                rows={3}
                placeholder="Example: Scheduled system maintenance tonight at 2:00 AM IST for 15 minutes."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setBroadcastMessage("");
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear Notice
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBroadcast}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Publish Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: DIRECT ONBOARD RESTAURANT ================= */}
      {isAddRestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleCreateRestaurant} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">
                  Direct Onboard Restaurant
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-400 font-bold mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Punjab Dhaba"
                  value={newRestForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
                    setNewRestForm({ ...newRestForm, name, slug });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="royal-punjab"
                  value={newRestForm.slug}
                  onChange={(e) => setNewRestForm({ ...newRestForm, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Owner Partner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Singh"
                  value={newRestForm.ownerName}
                  onChange={(e) => setNewRestForm({ ...newRestForm, ownerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newRestForm.phone}
                  onChange={(e) => setNewRestForm({ ...newRestForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delhi NCR, Mumbai, Jaipur"
                  value={newRestForm.city}
                  onChange={(e) => setNewRestForm({ ...newRestForm, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Subscription Tier
                </label>
                <select
                  value={newRestForm.plan}
                  onChange={(e) => setNewRestForm({ ...newRestForm, plan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="trial">Free Trial (15 Days)</option>
                  <option value="starter">Starter Plan (₹999/mo)</option>
                  <option value="pro">Pro Plan (₹2,499/mo)</option>
                  <option value="enterprise">Enterprise (₹4,999/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Initial QR Tables
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newRestForm.initialTables}
                  onChange={(e) => setNewRestForm({ ...newRestForm, initialTables: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddRestModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingNewRest}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition disabled:opacity-50"
              >
                {isSubmittingNewRest ? "Creating..." : "Launch Restaurant Fleet"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
