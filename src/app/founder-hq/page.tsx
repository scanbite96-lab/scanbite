"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  QrCode, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Key, 
  RefreshCw, 
  Megaphone, 
  Plus, 
  Phone, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  Clock, 
  Shield, 
  Layers, 
  ChefHat, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Wrench, 
  Mail, 
  Download, 
  FileSpreadsheet, 
  Activity, 
  HardDrive, 
  Printer, 
  Receipt, 
  BarChart3, 
  SlidersHorizontal,
  Check,
  X,
  CreditCard,
  Ban,
  ArrowUpDown,
  ShoppingBag,
  Info,
  MessageSquare,
  UserCheck
} from "lucide-react";
import { SuperAdminMetrics, AdminRecentOrder, SystemHealthInfo, Inquiry, InquiryStatus } from "@/types";

interface AdminRestaurantRow {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  city: string;
  ownerName: string;
  ownerEmail: string | null;
  password?: string;
  staffPin?: string;
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

interface TableQrItem {
  id: string;
  tableNumber: string;
  seats: number;
  url: string;
  qrDataUrl: string;
}

export default function SuperAdminDashboard() {
  // Security Gate: Master Passcode
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [masterPassInput, setMasterPassInput] = useState("");
  const [passError, setPassError] = useState<string | null>(null);
  const [showMasterPass, setShowMasterPass] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"restaurants" | "orders" | "analytics" | "health" | "inquiries">("restaurants");

  // Inquiries & Leads State
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesSearch, setInquiriesSearch] = useState("");
  const [inquiriesStatusFilter, setInquiriesStatusFilter] = useState<string>("all");
  const [isUpdatingInquiry, setIsUpdatingInquiry] = useState<string | null>(null);

  // Data State
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [restaurants, setRestaurants] = useState<AdminRestaurantRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminRecentOrder[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthInfo | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [setting, setSetting] = useState<PlatformSetting | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters for Restaurants Hub
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"gmv_desc" | "orders_desc" | "newest" | "expiry_asc">("gmv_desc");

  // Filters for Live Orders Feed
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>("all");
  const [ordersRestaurantFilter, setOrdersRestaurantFilter] = useState<string>("all");

  // Modals
  const [selectedRestForPlan, setSelectedRestForPlan] = useState<AdminRestaurantRow | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanValue, setSelectedPlanValue] = useState("starter");
  const [daysToAdd, setDaysToAdd] = useState<number>(30);

  // Credentials Management Modal
  const [selectedRestForCreds, setSelectedRestForCreds] = useState<AdminRestaurantRow | null>(null);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [credsOwnerName, setCredsOwnerName] = useState("");
  const [credsOwnerEmail, setCredsOwnerEmail] = useState("");
  const [credsPhone, setCredsPhone] = useState("");
  const [credsPassword, setCredsPassword] = useState("");
  const [credsStaffPin, setCredsStaffPin] = useState("");
  const [showCredsPassword, setShowCredsPassword] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Broadcast & Maintenance Modal
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [supportPhoneInput, setSupportPhoneInput] = useState("");
  const [isMaintenanceInput, setIsMaintenanceInput] = useState(false);

  // Direct Onboard Modal
  const [isAddRestModalOpen, setIsAddRestModalOpen] = useState(false);
  const [newRestForm, setNewRestForm] = useState({
    name: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    password: "admin123",
    staffPin: "1234",
    phone: "",
    city: "Delhi NCR",
    plan: "starter",
    initialTables: 6,
  });
  const [isSubmittingNewRest, setIsSubmittingNewRest] = useState(false);

  // QR Standee Kit Modal
  const [isQrKitModalOpen, setIsQrKitModalOpen] = useState(false);
  const [selectedRestForQr, setSelectedRestForQr] = useState<AdminRestaurantRow | null>(null);
  const [tableQrList, setTableQrList] = useState<TableQrItem[]>([]);
  const [loadingQrKit, setLoadingQrKit] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper for authenticated super admin API headers
  const getAdminHeaders = (): Record<string, string> => {
    let key = "";
    if (typeof window !== "undefined") {
      key = sessionStorage.getItem("scanbite_admin_key") || "";
    }
    return {
      "Content-Type": "application/json",
      "x-admin-key": key,
    };
  };

  // Check persistent session auth on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("scanbite_superadmin_auth");
      const storedKey = sessionStorage.getItem("scanbite_admin_key");
      if (stored === "true" && storedKey) {
        setIsAuthorized(true);
        document.cookie = `scanbite_admin_key=${storedKey}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        setIsAuthorized(false);
      }
    }
  }, []);

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = masterPassInput.trim();
    if (clean === "admin2026" || clean === "superadmin" || clean === "founder2026") {
      setIsAuthorized(true);
      sessionStorage.setItem("scanbite_superadmin_auth", "true");
      sessionStorage.setItem("scanbite_admin_key", clean);
      document.cookie = `scanbite_admin_key=${clean}; path=/; max-age=604800; SameSite=Lax`;
      setPassError(null);
      showToast("🔓 Super Admin Command Center Unlocked");
    } else {
      setPassError("Incorrect Master Passcode. (Hint: Default is admin2026)");
    }
  };

  const handleLockAdmin = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("scanbite_superadmin_auth");
    sessionStorage.removeItem("scanbite_admin_key");
    if (typeof document !== "undefined") {
      document.cookie = "scanbite_admin_key=; path=/; max-age=0; SameSite=Lax";
    }
    setMasterPassInput("");
    showToast("🔒 Command Center Locked");
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin", {
        headers: getAdminHeaders(),
      });
      if (res.status === 401) {
        handleLockAdmin();
        setPassError("Session expired. Please enter master passcode.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setRestaurants(data.restaurants || []);
        setRecentOrders(data.recentOrders || []);
        setSystemHealth(data.systemHealth || null);
        setCities(data.cities || []);
        setSetting(data.platformSetting || null);
        if (data.platformSetting) {
          setBroadcastMessage(data.platformSetting.broadcastMessage || "");
          setSupportPhoneInput(data.platformSetting.supportPhone || "+91 98765 43210");
          setIsMaintenanceInput(Boolean(data.platformSetting.isMaintenance));
        }

        // Fetch partner inquiries & leads
        try {
          const inqRes = await fetch("/api/inquiries", { headers: getAdminHeaders() });
          if (inqRes.ok) {
            const inqData = await inqRes.json();
            setInquiries(inqData.inquiries || []);
          }
        } catch (inqErr) {
          console.error("Failed to load inquiries:", inqErr);
        }
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchAdminData();
    }
  }, [isAuthorized]);

  // Filtered & Sorted Restaurants
  const filteredRestaurants = useMemo(() => {
    const list = restaurants.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.ownerEmail && r.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.phone && r.phone.includes(searchTerm)) ||
        r.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPlan = planFilter === "all" || r.plan.toLowerCase() === planFilter.toLowerCase();
      const matchCity = cityFilter === "all" || r.city.toLowerCase() === cityFilter.toLowerCase();
      
      const isExpired = r.planExpiresAt ? new Date(r.planExpiresAt) < new Date() : false;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.isActive) ||
        (statusFilter === "suspended" && !r.isActive) ||
        (statusFilter === "expired" && isExpired);

      return matchSearch && matchPlan && matchCity && matchStatus;
    });

    return list.sort((a, b) => {
      if (sortBy === "gmv_desc") return b.gmv - a.gmv;
      if (sortBy === "orders_desc") return b.ordersCount - a.ordersCount;
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "expiry_asc") {
        const dateA = a.planExpiresAt ? new Date(a.planExpiresAt).getTime() : Infinity;
        const dateB = b.planExpiresAt ? new Date(b.planExpiresAt).getTime() : Infinity;
        return dateA - dateB;
      }
      return 0;
    });
  }, [restaurants, searchTerm, planFilter, cityFilter, statusFilter, sortBy]);

  // Filtered Live Orders
  const filteredOrders = useMemo(() => {
    return recentOrders.filter((o) => {
      const matchSearch =
        o.customerName.toLowerCase().includes(ordersSearch.toLowerCase()) ||
        (o.customerPhone && o.customerPhone.includes(ordersSearch)) ||
        o.restaurantName.toLowerCase().includes(ordersSearch.toLowerCase()) ||
        o.tableNumber.toLowerCase().includes(ordersSearch.toLowerCase()) ||
        o.id.toLowerCase().includes(ordersSearch.toLowerCase());

      const matchStatus =
        ordersStatusFilter === "all" ||
        o.status.toLowerCase() === ordersStatusFilter.toLowerCase();

      const matchRest =
        ordersRestaurantFilter === "all" ||
        o.restaurantId === ordersRestaurantFilter ||
        o.restaurantSlug === ordersRestaurantFilter;

      return matchSearch && matchStatus && matchRest;
    });
  }, [recentOrders, ordersSearch, ordersStatusFilter, ordersRestaurantFilter]);

  // Filtered Leads & Inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchSearch =
        inq.restaurantName.toLowerCase().includes(inquiriesSearch.toLowerCase()) ||
        (inq.ownerName && inq.ownerName.toLowerCase().includes(inquiriesSearch.toLowerCase())) ||
        inq.phone.includes(inquiriesSearch) ||
        (inq.city && inq.city.toLowerCase().includes(inquiriesSearch.toLowerCase())) ||
        (inq.notes && inq.notes.toLowerCase().includes(inquiriesSearch.toLowerCase()));

      const matchStatus =
        inquiriesStatusFilter === "all" || inq.status.toLowerCase() === inquiriesStatusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [inquiries, inquiriesSearch, inquiriesStatusFilter]);

  // Update Inquiry Status
  const handleUpdateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      setIsUpdatingInquiry(id);
      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item))
        );
        showToast(`✅ Lead marked as ${newStatus}`);
      }
    } catch {
      showToast("❌ Failed to update inquiry");
    } finally {
      setIsUpdatingInquiry(null);
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (inq: Inquiry) => {
    if (!confirm(`Are you sure you want to delete inquiry for "${inq.restaurantName}"?`)) return;
    try {
      const res = await fetch(`/api/inquiries?id=${inq.id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setInquiries((prev) => prev.filter((item) => item.id !== inq.id));
        showToast("🗑️ Inquiry deleted");
      }
    } catch {
      showToast("❌ Delete failed");
    }
  };

  // 1-Click Onboard from Lead
  const handleOnboardInquiry = (inq: Inquiry) => {
    const slugCandidate = (inq.restaurantName || "rest")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    let initialTables = 6;
    if (inq.tablesCount) {
      const match = inq.tablesCount.match(/\d+/);
      if (match) initialTables = Math.min(Math.max(parseInt(match[0], 10), 1), 50);
    }

    setNewRestForm({
      name: inq.restaurantName,
      slug: slugCandidate,
      ownerName: inq.ownerName || "Partner",
      ownerEmail: "",
      password: "admin123",
      staffPin: "1234",
      phone: inq.phone || "",
      city: inq.city || "Delhi NCR",
      plan: "starter",
      initialTables: initialTables,
    });
    setIsAddRestModalOpen(true);
    showToast(`📝 Pre-filled onboarding for ${inq.restaurantName}`);
  };

  // 1-Click Impersonate Login
  const handleImpersonate = async (restaurant: AdminRestaurantRow) => {
    try {
      showToast(`🔑 Authorizing Super Admin login for ${restaurant.name}...`);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ action: "impersonate", slug: restaurant.slug }),
      });
      if (res.ok) {
        showToast(`🎉 Access granted! Opening ${restaurant.name} console...`);
        window.open(`/dashboard?slug=${restaurant.slug}`, "_blank");
      } else {
        showToast("❌ Impersonation failed");
      }
    } catch {
      showToast("❌ Impersonation error");
    }
  };

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
        headers: getAdminHeaders(),
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

  // Toggle Maintenance Mode directly
  const handleToggleMaintenance = async () => {
    const newMaintenanceState = !setting?.isMaintenance;
    const msg = newMaintenanceState
      ? "Activate Platform Maintenance Mode? This will display a maintenance warning across all restaurant dashboards and menus."
      : "Deactivate Platform Maintenance Mode? All restaurants will return to regular live operations.";
    if (!confirm(msg)) return;

    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          action: "update-broadcast",
          isMaintenance: newMaintenanceState,
        }),
      });
      if (res.ok) {
        showToast(newMaintenanceState ? "🛠️ Maintenance Mode ACTIVATED" : "✅ Maintenance Mode DEACTIVATED");
        fetchAdminData();
      }
    } catch {
      showToast("❌ Failed to update maintenance mode");
    }
  };

  // Update Plan & Validity
  const handleUpdatePlan = async () => {
    if (!selectedRestForPlan) return;
    try {
      const payload: Record<string, unknown> = {
        action: "update-restaurant",
        restaurantId: selectedRestForPlan.id,
        plan: selectedPlanValue,
      };

      if (daysToAdd === -1) {
        payload.clearExpiry = true;
      } else if (daysToAdd > 0) {
        payload.daysToAdd = Number(daysToAdd);
      }

      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`🎉 Plan updated to ${selectedPlanValue.toUpperCase()}!`);
        setIsPlanModalOpen(false);
        fetchAdminData();
      }
    } catch {
      showToast("❌ Failed to update plan");
    }
  };

  // Open Credentials Modal
  const handleOpenCredsModal = (restaurant: AdminRestaurantRow) => {
    setSelectedRestForCreds(restaurant);
    setCredsOwnerName(restaurant.ownerName || "");
    setCredsOwnerEmail(restaurant.ownerEmail || "");
    setCredsPhone(restaurant.phone || "");
    setCredsPassword(restaurant.password || "admin123");
    setCredsStaffPin(restaurant.staffPin || "1234");
    setShowCredsPassword(false);
    setIsCredsModalOpen(true);
  };

  // Save Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestForCreds) return;
    setIsSavingCreds(true);
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          action: "update-restaurant",
          restaurantId: selectedRestForCreds.id,
          ownerName: credsOwnerName.trim() || undefined,
          ownerEmail: credsOwnerEmail.trim() || undefined,
          phone: credsPhone.trim() || undefined,
          password: credsPassword.trim() || undefined,
          staffPin: credsStaffPin.trim() || undefined,
        }),
      });
      if (res.ok) {
        showToast(`🔑 Credentials for ${selectedRestForCreds.name} updated!`);
        setIsCredsModalOpen(false);
        fetchAdminData();
      } else {
        showToast("❌ Failed to update credentials");
      }
    } catch {
      showToast("❌ Error updating credentials");
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Update Broadcast Message & Settings
  const handleSaveBroadcast = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          action: "update-broadcast",
          broadcastMessage: broadcastMessage.trim() || null,
          isMaintenance: isMaintenanceInput,
          supportPhone: supportPhoneInput.trim() || "+91 98765 43210",
        }),
      });
      if (res.ok) {
        showToast("📢 Broadcast & system settings published successfully!");
        setIsBroadcastModalOpen(false);
        fetchAdminData();
      }
    } catch {
      showToast("❌ Failed to update broadcast settings");
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
        headers: getAdminHeaders(),
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
          name: newRestForm.name.trim(),
          slug,
          ownerName: newRestForm.ownerName.trim() || "Owner",
          ownerEmail: newRestForm.ownerEmail.trim() || undefined,
          password: newRestForm.password.trim() || "admin123",
          staffPin: newRestForm.staffPin.trim() || "1234",
          phone: newRestForm.phone.trim() || "+91 98765 00000",
          city: newRestForm.city.trim() || "Delhi NCR",
          address: `${newRestForm.city.trim() || "Delhi NCR"}, India`,
          plan: newRestForm.plan,
          initialTables: Number(newRestForm.initialTables) || 6,
          tablesCount: Number(newRestForm.initialTables) || 6,
          upiId: `${slug}@upi`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`🎉 Restaurant "${newRestForm.name}" onboarded successfully!`);
        setIsAddRestModalOpen(false);
        setNewRestForm({
          name: "",
          slug: "",
          ownerName: "",
          ownerEmail: "",
          password: "admin123",
          staffPin: "1234",
          phone: "",
          city: "Delhi NCR",
          plan: "starter",
          initialTables: 6,
        });
        fetchAdminData();
      } else {
        showToast(`❌ ${data.error || "Slug already exists or invalid data"}`);
      }
    } catch {
      showToast("❌ Failed to create restaurant");
    } finally {
      setIsSubmittingNewRest(false);
    }
  };

  // Open QR Kit Modal
  const handleOpenQrKitModal = async (restaurant: AdminRestaurantRow) => {
    setSelectedRestForQr(restaurant);
    setIsQrKitModalOpen(true);
    setLoadingQrKit(true);
    try {
      const res = await fetch(`/api/tables?restaurantId=${restaurant.id}`);
      if (res.ok) {
        const tables: Array<{ id: string; tableNumber: string; seats: number }> = await res.json();
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        
        const mod = await import("qrcode");
        const QRCode = mod.default || mod;

        const qrsWithUrls: TableQrItem[] = await Promise.all(
          tables.map(async (t) => {
            const tableMenuUrl = `${origin}/r/${restaurant.slug}/t/${t.id}`;
            const qrDataUrl = await QRCode.toDataURL(tableMenuUrl, {
              margin: 1,
              width: 300,
              color: { dark: "#0f172a", light: "#ffffff" },
            });
            return {
              id: t.id,
              tableNumber: t.tableNumber,
              seats: t.seats,
              url: tableMenuUrl,
              qrDataUrl,
            };
          })
        );
        setTableQrList(qrsWithUrls);
      }
    } catch (err) {
      console.error("Failed to load QR kit:", err);
      showToast("❌ Error loading table QR codes");
    } finally {
      setLoadingQrKit(false);
    }
  };

  // Export Restaurants to CSV
  const handleExportRestaurantsCsv = () => {
    if (restaurants.length === 0) {
      showToast("No restaurant records to export");
      return;
    }
    const headers = [
      "Restaurant Name",
      "Slug",
      "City",
      "Owner Name",
      "Owner Email",
      "Phone",
      "Plan Tier",
      "Status",
      "Plan Expiry Date",
      "Tables Count",
      "Menu Items Count",
      "Total Orders",
      "Total GMV (INR)",
      "Created Date",
    ];

    const rows = restaurants.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      r.slug,
      `"${r.city}"`,
      `"${r.ownerName.replace(/"/g, '""')}"`,
      r.ownerEmail || "N/A",
      r.phone || "N/A",
      r.plan.toUpperCase(),
      r.isActive ? "Active" : "Suspended",
      r.planExpiresAt ? new Date(r.planExpiresAt).toLocaleDateString() : "Lifetime",
      r.tablesCount,
      r.menuItemsCount,
      r.ordersCount,
      r.gmv,
      new Date(r.createdAt).toLocaleDateString(),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scanbite_restaurants_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("📥 Restaurants CSV Exported Successfully!");
  };

  // Export Global Orders to CSV
  const handleExportOrdersCsv = () => {
    if (recentOrders.length === 0) {
      showToast("No order records to export");
      return;
    }
    const headers = [
      "Order ID",
      "Restaurant Name",
      "City",
      "Table",
      "Customer Name",
      "Customer Phone",
      "Items Count",
      "Items Summary",
      "Subtotal",
      "Tax",
      "Discount",
      "Total Amount (INR)",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Order Timestamp",
    ];

    const rows = recentOrders.map((o) => [
      o.id,
      `"${o.restaurantName.replace(/"/g, '""')}"`,
      `"${o.city || "Delhi NCR"}"`,
      o.tableNumber,
      `"${(o.customerName || "Walk-in Guest").replace(/"/g, '""')}"`,
      o.customerPhone || "N/A",
      o.itemsCount,
      `"${(o.itemsSummary || "").replace(/"/g, '""')}"`,
      o.subtotal,
      o.tax,
      o.discount,
      o.total,
      o.paymentMethod || "Counter Cash",
      o.paymentStatus,
      o.status.toUpperCase(),
      new Date(o.createdAt).toLocaleString(),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scanbite_global_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("📥 Global Orders CSV Exported Successfully!");
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-500/40";
      case "served":
        return "bg-cyan-950/60 text-cyan-400 border-cyan-500/40";
      case "ready":
        return "bg-amber-950/60 text-amber-400 border-amber-500/40";
      case "cooking":
        return "bg-orange-950/60 text-orange-400 border-orange-500/40 animate-pulse";
      case "cancelled":
        return "bg-rose-950/60 text-rose-400 border-rose-500/40";
      default: // pending
        return "bg-indigo-950/60 text-indigo-400 border-indigo-500/40";
    }
  };

  // If not authorized yet, render Master Passcode Gate
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white relative overflow-hidden font-sans">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-orange-600/15 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 flex items-center justify-center font-black text-white text-2xl mx-auto shadow-xl shadow-orange-600/30">
              <Shield className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wider uppercase">
              👑 Super Admin Access Gate
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Command Center</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter platform founder master security key to manage all restaurants, database fleet, and SaaS billing.
            </p>
          </div>

          {passError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleUnlockAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Master Security Key
              </label>
              <div className="relative">
                <input
                  type={showMasterPass ? "text" : "password"}
                  required
                  placeholder="Enter Master Passcode (default: admin2026)"
                  value={masterPassInput}
                  onChange={(e) => setMasterPassInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-2xl focus:outline-none focus:border-orange-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowMasterPass(!showMasterPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showMasterPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Default platform founder passcode: <span className="font-mono text-orange-400">admin2026</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-orange-600/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Command Center</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 font-medium">
              ← Return to ScanBite Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
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
                {setting?.isMaintenance && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-300 bg-rose-950/80 border border-rose-600/50 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    MAINTENANCE ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Platform Founder & Master Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* CSV Data Export Dropdown */}
            <div className="hidden lg:flex items-center gap-1">
              <button
                onClick={handleExportRestaurantsCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition"
                title="Export Restaurants Fleet CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Fleet</span>
              </button>
              <button
                onClick={handleExportOrdersCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition"
                title="Export Global Orders CSV"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export Orders</span>
              </button>
            </div>

            {/* Maintenance Mode Quick Toggle */}
            <button
              onClick={handleToggleMaintenance}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                setting?.isMaintenance
                  ? "bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400"
              }`}
              title="Toggle Platform Maintenance Mode"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{setting?.isMaintenance ? "Maintenance: ON" : "Maintenance: OFF"}</span>
            </button>

            {/* Broadcast Notice */}
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition"
            >
              <Megaphone className="w-3.5 h-3.5 text-orange-400" />
              <span>Broadcast</span>
            </button>

            {/* Onboard Restaurant */}
            <button
              onClick={() => setIsAddRestModalOpen(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Onboard Restaurant</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Lock Console */}
            <button
              onClick={handleLockAdmin}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold transition"
              title="Lock Super Admin Console"
            >
              <Lock className="w-4 h-4" />
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
                👑 Founder Operations & Fleet Command
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ScanBite Super Admin Console
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Yahan se aap poore SaaS platform ko control karte hain: har hotel/restaurant ka subscription plan,
                unke live orders ki sales (GMV), 1-click owner console impersonation, security credentials reset, global live orders feed, aur QR standees kit generation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchAdminData}
                disabled={loading}
                className="p-2.5 sm:px-4 sm:py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700/80 transition flex items-center gap-2 text-xs font-bold active:scale-95 disabled:opacity-50"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
                <span className="hidden sm:inline">Refresh Fleet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Total Restaurants */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Restaurants</span>
              <Building2 className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {metrics ? metrics.totalRestaurants : "..."}
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{metrics ? metrics.activeRestaurants : 0} Live & Active</span>
            </div>
          </div>

          {/* Card 2: Platform GMV */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total GMV</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              ₹{metrics ? metrics.totalPlatformGmv.toLocaleString("en-IN") : "0"}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              Lifetime Sales Volume
            </div>
          </div>

          {/* Card 3: Today's GMV & Orders */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Today&apos;s Sales</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-300">
              ₹{metrics?.todayGmv ? metrics.todayGmv.toLocaleString("en-IN") : "0"}
            </div>
            <div className="text-[10px] text-cyan-400 font-bold mt-1">
              {metrics?.todayOrdersCount || 0} Orders Today
            </div>
          </div>

          {/* Card 4: SaaS MRR */}
          <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-600/30 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-300 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">SaaS MRR</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              ₹{metrics ? metrics.estimatedMrr.toLocaleString("en-IN") : "0"}
              <span className="text-[10px] text-slate-400 font-normal">/mo</span>
            </div>
            <div className="text-[10px] text-amber-400/80 font-medium mt-1">
              Recurring Revenue
            </div>
          </div>

          {/* Card 5: Total Orders & AOV */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Orders & AOV</span>
              <ChefHat className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {metrics ? metrics.totalOrders : "0"}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              Avg: ₹{metrics?.averageOrderValue || 0}/order
            </div>
          </div>

          {/* Card 6: Total Tables */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Tables</span>
              <QrCode className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {metrics ? metrics.totalTables : "0"}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              QR Standees Active
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

        {/* Multi-Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("restaurants")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "restaurants"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Restaurants Fleet ({restaurants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Global Live Orders ({recentOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Financials & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("health")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "health"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>System Health & Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveTab("inquiries")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "inquiries"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Partner Leads & Inquiries ({inquiries.length})</span>
            {inquiries.filter((i) => i.status === "new").length > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {inquiries.filter((i) => i.status === "new").length} NEW
              </span>
            )}
          </button>
        </div>

        {/* ================= TAB 1: RESTAURANTS FLEET ================= */}
        {activeTab === "restaurants" && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl">
            {/* Table Header & Search Filter */}
            <div className="p-6 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Restaurant Partners Fleet</span>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                    {filteredRestaurants.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage accounts, grant subscriptions, impersonate owner consoles, reset credentials, and generate QR standee kits.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search restaurant, owner, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-orange-500 w-48 sm:w-60"
                  />
                </div>

                {/* City Filter */}
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

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
                  <option value="expired">Expired Subscriptions</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="gmv_desc">Highest Revenue (GMV)</option>
                  <option value="orders_desc">Most Orders</option>
                  <option value="newest">Newest Joined</option>
                  <option value="expiry_asc">Plan Expiring Soon</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-3.5 px-6 font-bold">Restaurant & Slug</th>
                    <th className="py-3.5 px-6 font-bold">City & Owner</th>
                    <th className="py-3.5 px-6 font-bold">Plan & Validity</th>
                    <th className="py-3.5 px-6 font-bold text-center">Footprint</th>
                    <th className="py-3.5 px-6 font-bold text-right">GMV Sales</th>
                    <th className="py-3.5 px-6 font-bold text-center">Status</th>
                    <th className="py-3.5 px-6 font-bold text-right">Super Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-bold">No restaurants match your filter criteria.</p>
                        <p className="text-xs text-slate-500 mt-1">Try resetting search filters or onboard a new restaurant.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRestaurants.map((rest) => {
                      const isExpired = rest.planExpiresAt ? new Date(rest.planExpiresAt) < new Date() : false;
                      return (
                        <tr key={rest.id} className="hover:bg-slate-800/30 transition">
                          {/* Restaurant Name */}
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                              <span>{rest.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] text-orange-400/90 font-semibold">
                                /{rest.slug}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                • Joined {new Date(rest.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </td>

                          {/* City & Owner */}
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{rest.city}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {rest.ownerName} {rest.phone && `• ${rest.phone}`}
                            </div>
                            {rest.ownerEmail && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {rest.ownerEmail}
                              </div>
                            )}
                          </td>

                          {/* Plan & Validity */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPlanBadge(rest.plan)}`}>
                                {rest.plan}
                              </span>
                              {isExpired && (
                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-600/50 animate-pulse">
                                  EXPIRED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>
                                {rest.planExpiresAt
                                  ? `${isExpired ? "Expired" : "Expires"}: ${new Date(rest.planExpiresAt).toLocaleDateString()}`
                                  : "Lifetime Validity"}
                              </span>
                            </div>
                          </td>

                          {/* Digital Footprint */}
                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex items-center gap-2 text-[11px] bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
                              <span title="Active Tables">
                                🪑 <b>{rest.tablesCount}</b> tbl
                              </span>
                              <span className="text-slate-600">•</span>
                              <span title="Menu Dishes">
                                🍲 <b>{rest.menuItemsCount}</b>
                              </span>
                              <span className="text-slate-600">•</span>
                              <span title="Total Orders">
                                🧾 <b>{rest.ordersCount}</b>
                              </span>
                            </div>
                          </td>

                          {/* GMV */}
                          <td className="py-4 px-6 text-right font-black text-sm text-emerald-400">
                            ₹{rest.gmv.toLocaleString("en-IN")}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6 text-center">
                            {rest.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-950/60 text-rose-400 border border-rose-500/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                Suspended
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Live Customer Menu */}
                              <Link
                                href={`/r/${rest.slug}/t/tbl-1`}
                                target="_blank"
                                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-bold transition shadow-sm"
                                title="View Live Customer Table Menu"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              {/* QR Standee Kit */}
                              <button
                                onClick={() => handleOpenQrKitModal(rest)}
                                className="p-2 bg-slate-950 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-xl border border-slate-800 text-xs font-bold transition shadow-sm"
                                title="View & Print Table QR Standees Kit"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>

                              {/* 1-Click Impersonate */}
                              <button
                                onClick={() => handleImpersonate(rest)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-sm transition active:scale-95"
                                title="1-Click Owner Dashboard Access"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>Login</span>
                              </button>

                              {/* Reset Credentials Modal */}
                              <button
                                onClick={() => handleOpenCredsModal(rest)}
                                className="p-2 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-xl border border-slate-800 text-xs font-bold transition shadow-sm"
                                title="View & Reset Owner Password & Staff PIN"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>

                              {/* Plan Switcher & Renewal */}
                              <button
                                onClick={() => {
                                  setSelectedRestForPlan(rest);
                                  setSelectedPlanValue(rest.plan);
                                  setDaysToAdd(30);
                                  setIsPlanModalOpen(true);
                                }}
                                className="p-2 bg-slate-950 hover:bg-slate-800 text-purple-400 hover:text-purple-300 rounded-xl border border-slate-800 text-xs font-bold transition shadow-sm"
                                title="Extend Validity & Switch Plan"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Active / Suspended */}
                              <button
                                onClick={() => handleToggleStatus(rest)}
                                className={`p-2 rounded-xl border text-xs font-bold transition shadow-sm ${
                                  rest.isActive
                                    ? "bg-slate-950 hover:bg-rose-950 text-rose-400 border-slate-800"
                                    : "bg-slate-950 hover:bg-emerald-950 text-emerald-400 border-slate-800"
                                }`}
                                title={rest.isActive ? "Suspend Restaurant" : "Activate Restaurant"}
                              >
                                {rest.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete Restaurant */}
                              <button
                                onClick={() => handleDeleteRestaurant(rest)}
                                className="p-2 bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-xl border border-slate-800 text-xs font-bold transition shadow-sm"
                                title="Permanently Delete Restaurant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: GLOBAL LIVE ORDERS FEED ================= */}
        {activeTab === "orders" && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl space-y-4">
            {/* Orders Header & Filter Controls */}
            <div className="p-6 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Global Real-time Orders Feed</span>
                  <span className="text-xs bg-slate-800 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                    {filteredOrders.length} Orders
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live pulse of transactions across all restaurants. Track customer table orders, payment types, and order progress.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search customer, phone, order ID..."
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-orange-500 w-48 sm:w-60"
                  />
                </div>

                {/* Restaurant Filter */}
                <select
                  value={ordersRestaurantFilter}
                  onChange={(e) => setOrdersRestaurantFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Restaurants</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={ordersStatusFilter}
                  onChange={(e) => setOrdersStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="cooking">Cooking</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={handleExportOrdersCsv}
                  className="p-2 sm:px-3 sm:py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  title="Export Filtered Orders CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-3 px-6 font-bold">Order ID & Time</th>
                    <th className="py-3 px-6 font-bold">Restaurant & Table</th>
                    <th className="py-3 px-6 font-bold">Customer</th>
                    <th className="py-3 px-6 font-bold">Dishes Ordered</th>
                    <th className="py-3 px-6 font-bold text-right">Amount</th>
                    <th className="py-3 px-6 font-bold text-center">Payment</th>
                    <th className="py-3 px-6 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-bold">No orders match your filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                        {/* ID & Time */}
                        <td className="py-3.5 px-6">
                          <div className="font-mono text-xs font-extrabold text-white">
                            #{ord.id.slice(-6).toUpperCase()}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Restaurant & Table */}
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-200">
                            {ord.restaurantName}
                          </div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 text-orange-400 text-[10px] font-extrabold mt-0.5 border border-slate-800">
                            {ord.tableNumber}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-slate-200">
                            {ord.customerName}
                          </div>
                          {ord.customerPhone && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              {ord.customerPhone}
                            </div>
                          )}
                        </td>

                        {/* Dishes Ordered */}
                        <td className="py-3.5 px-6 max-w-xs">
                          <div className="font-medium text-slate-300 truncate" title={ord.itemsSummary}>
                            {ord.itemsSummary || `${ord.itemsCount} Items`}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Total {ord.itemsCount} portions
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-6 text-right font-black text-sm text-emerald-400">
                          ₹{ord.total}
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-6 text-center">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950 border border-slate-800 text-slate-300 uppercase">
                            {ord.paymentMethod || "Counter Cash"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(ord.status)}`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: FINANCIALS & ANALYTICS ================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Top Revenue Leaderboard */}
            <div className="bg-slate-900/90 border border-slate-800/90 p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span>Restaurant Revenue Leaderboard</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Highest earning restaurant partners ranked by total gross sales (GMV).
                  </p>
                </div>
                <button
                  onClick={handleExportRestaurantsCsv}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Report</span>
                </button>
              </div>

              <div className="space-y-3">
                {[...restaurants]
                  .sort((a, b) => b.gmv - a.gmv)
                  .map((r, idx) => {
                    const percentage = metrics?.totalPlatformGmv 
                      ? Math.round((r.gmv / (metrics.totalPlatformGmv || 1)) * 100)
                      : 0;
                    return (
                      <div key={r.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                            idx === 0 
                              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20" 
                              : idx === 1 
                              ? "bg-slate-300 text-slate-950 font-black" 
                              : idx === 2 
                              ? "bg-amber-800 text-white font-black" 
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-white flex items-center gap-2">
                              <span>{r.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">/{r.slug}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {r.city} • {r.ordersCount} orders • {r.tablesCount} tables
                            </div>
                          </div>
                        </div>

                        <div className="text-right sm:min-w-[140px]">
                          <div className="text-base font-black text-emerald-400">
                            ₹{r.gmv.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {percentage}% of platform sales
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Plan Breakdown & Revenue Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Average Order Value (AOV)
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  ₹{metrics?.averageOrderValue || 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Platform average per dining table session.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Est. SaaS Annual Run-Rate (ARR)
                </span>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  ₹{metrics ? (metrics.estimatedMrr * 12).toLocaleString("en-IN") : "0"}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Projected yearly software subscriptions.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Dining Capacity
                </span>
                <div className="text-2xl font-black text-cyan-300 mt-1">
                  {metrics?.totalTables || 0} Tables
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Real-time QR table menus available across India.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SYSTEM HEALTH & DIAGNOSTICS ================= */}
        {activeTab === "health" && (
          <div className="bg-slate-900/90 border border-slate-800/90 p-6 rounded-3xl shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-cyan-400" />
                <span>Platform System Health & Engine Diagnostics</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Technical infrastructure status, SQLite database connectivity, memory footprint, and server uptime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Database Status</span>
                <div className="text-emerald-400 font-black text-sm flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{systemHealth?.dbStatus || "Healthy (Connected)"}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-2">
                  Engine: SQLite / Prisma ORM
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Node.js Runtime</span>
                <div className="text-white font-mono font-black text-base mt-1">
                  {systemHealth?.nodeVersion || process.version || "Node.js"}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-2">
                  Next.js 14 App Router
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Memory Allocation</span>
                <div className="text-cyan-300 font-black text-base mt-1">
                  {systemHealth?.heapUsedMb || 0} MB <span className="text-xs text-slate-500 font-normal">/ {systemHealth?.heapTotalMb || 0} MB</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  V8 Heap Memory Footprint
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">System Uptime</span>
                <div className="text-amber-300 font-mono font-black text-base mt-1">
                  {systemHealth ? `${Math.floor(systemHealth.uptimeSeconds / 60)}m ${systemHealth.uptimeSeconds % 60}s` : "Live"}
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Continuous Process Execution
                </div>
              </div>
            </div>

            {/* Total Entity Counts in Database */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3">
                Total Database Entity Fleet
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Restaurants</span>
                  <span className="text-lg font-black text-white">{systemHealth?.totalRestaurants || 0}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Categories</span>
                  <span className="text-lg font-black text-white">{systemHealth?.totalCategories || 0}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Menu Dishes</span>
                  <span className="text-lg font-black text-white">{systemHealth?.totalMenuItems || 0}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Tables</span>
                  <span className="text-lg font-black text-white">{systemHealth?.totalTables || 0}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Orders</span>
                  <span className="text-lg font-black text-emerald-400">{systemHealth?.totalOrders || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: PARTNER LEADS & INQUIRIES ================= */}
        {activeTab === "inquiries" && (
          <div className="space-y-6">
            {/* Top KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>
                  <Sparkles className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">{inquiries.length}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Inquiries from /register</span>
              </div>

              <div className="bg-slate-900/90 border border-amber-900/40 p-5 rounded-3xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">New (Uncontacted)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                </div>
                <div className="text-2xl font-black text-amber-300 mt-2">
                  {inquiries.filter((i) => i.status === "new").length}
                </div>
                <span className="text-[11px] text-amber-500/80 mt-1 block">Requires immediate outreach</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">In Discussion</span>
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-300 mt-2">
                  {inquiries.filter((i) => i.status === "contacted" || i.status === "demo_scheduled").length}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Contacted or demo demo scheduled</span>
              </div>

              <div className="bg-slate-900/90 border border-emerald-900/40 p-5 rounded-3xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Converted</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-300 mt-2">
                  {inquiries.filter((i) => i.status === "converted").length}
                </div>
                <span className="text-[11px] text-emerald-500/80 mt-1 block">Active ScanBite restaurants</span>
              </div>
            </div>

            {/* Inquiries Container */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl">
              {/* Filter & Search Header */}
              <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search inquiries by restaurant, owner, phone, city..."
                      value={inquiriesSearch}
                      onChange={(e) => setInquiriesSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    {["all", "new", "contacted", "demo_scheduled", "converted", "closed"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setInquiriesStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                          inquiriesStatusFilter === st
                            ? "bg-orange-600 text-white"
                            : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setInquiriesSearch("");
                    setInquiriesStatusFilter("all");
                    fetchAdminData();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex-shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Inquiry Rows */}
              <div className="divide-y divide-slate-800/80">
                {filteredInquiries.length === 0 ? (
                  <div className="p-12 text-center">
                    <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white">No inquiries found</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {inquiriesSearch || inquiriesStatusFilter !== "all"
                        ? "Try clearing filters to see all leads."
                        : "When prospective restaurant owners register at /register, inquiries will appear here permanently in Neon PostgreSQL."}
                    </p>
                  </div>
                ) : (
                  filteredInquiries.map((inq) => {
                    const cleanPhone = (inq.phone || "").replace(/\D/g, "");
                    const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                    const waMessage = `Hi ${inq.ownerName || "Partner"}! I'm following up from ScanBite regarding your digital QR menu inquiry for "${inq.restaurantName}". Let's get your restaurant set up!`;
                    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

                    return (
                      <div
                        key={inq.id}
                        className="p-5 hover:bg-slate-800/40 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        {/* Main Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-base text-white tracking-tight">
                              {inq.restaurantName}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-700">
                              <MapPin className="w-3 h-3 text-orange-400" />
                              <span>{inq.city || "India"}</span>
                            </span>
                            {inq.tablesCount && (
                              <span className="bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                🪑 {inq.tablesCount}
                              </span>
                            )}
                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                inq.status === "new"
                                  ? "bg-amber-950 text-amber-300 border border-amber-600/50"
                                  : inq.status === "contacted"
                                  ? "bg-blue-950 text-blue-300 border border-blue-600/50"
                                  : inq.status === "demo_scheduled"
                                  ? "bg-purple-950 text-purple-300 border border-purple-600/50"
                                  : inq.status === "converted"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-600/50"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {inq.status.replace("_", " ")}
                            </span>
                          </div>

                          {/* Contact & Date */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5 font-medium text-slate-300">
                              <span>👤</span>
                              <span>{inq.ownerName || "Owner"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <a href={`tel:${inq.phone}`} className="hover:underline">
                                {inq.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(inq.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Notes if any */}
                          {inq.notes && (
                            <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 italic">
                              "{inq.notes}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                          {/* Direct WhatsApp */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                            title="Open WhatsApp Chat"
                          >
                            <span>💬 WhatsApp</span>
                          </a>

                          {/* Direct Phone Call */}
                          <a
                            href={`tel:${inq.phone}`}
                            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition"
                            title="Call Phone"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>Call</span>
                          </a>

                          {/* Status Selector */}
                          <select
                            disabled={isUpdatingInquiry === inq.id}
                            value={inq.status}
                            onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500 cursor-pointer"
                          >
                            <option value="new">Status: New</option>
                            <option value="contacted">Status: Contacted</option>
                            <option value="demo_scheduled">Status: Demo Scheduled</option>
                            <option value="converted">Status: Converted</option>
                            <option value="closed">Status: Closed</option>
                          </select>

                          {/* 1-Click Onboard */}
                          <button
                            onClick={() => handleOnboardInquiry(inq)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-black transition shadow-md shadow-orange-600/20"
                            title="Create restaurant account from this inquiry"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Onboard</span>
                          </button>

                          {/* Delete Lead */}
                          <button
                            onClick={() => handleDeleteInquiry(inq)}
                            className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-950/30 transition"
                            title="Delete inquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL 1: PLAN SWITCHER & RENEWAL ================= */}
      {isPlanModalOpen && selectedRestForPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-base text-white">
                  Manage Plan & Subscription
                </h3>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-slate-400">Target Restaurant:</span>
                <p className="font-extrabold text-white text-sm">{selectedRestForPlan.name}</p>
                <p className="text-xs text-slate-500 font-mono">Slug: {selectedRestForPlan.slug}</p>
              </div>

              {/* Plan Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Subscription Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["trial", "starter", "pro", "enterprise"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPlanValue(p)}
                      className={`p-2.5 rounded-xl border text-xs font-bold uppercase transition ${
                        selectedPlanValue === p
                          ? "bg-purple-950/80 border-purple-500 text-purple-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Validity Days */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Extend Validity
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "Keep Expiry", value: 0 },
                    { label: "+15 Days", value: 15 },
                    { label: "+30 Days (1 Mo)", value: 30 },
                    { label: "+90 Days (3 Mo)", value: 90 },
                    { label: "+365 Days (1 Yr)", value: 365 },
                    { label: "Lifetime (No Expiry)", value: -1 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDaysToAdd(opt.value)}
                      className={`p-2 rounded-xl border font-bold transition text-center ${
                        daysToAdd === opt.value
                          ? "bg-orange-600 border-orange-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePlan}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-600/30 transition active:scale-95"
                >
                  Save & Update Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: BROADCAST & MAINTENANCE ================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-base text-white">
                  Platform Live Broadcast & Operations
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Yeh notice saare registered restaurants ke live dashboard aur customer menus par realtime banner ke roop mein dikhega.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Broadcast Announcement Message
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Special Weekend Offer: 15% flat discount across all tables! or Server maintenance scheduled."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-orange-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Notice hatane ke liye is text box ko khaali karke save karein.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Platform Support Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={supportPhoneInput}
                onChange={(e) => setSupportPhoneInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Maintenance Toggle */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-white block">Platform Maintenance Mode</span>
                <span className="text-[11px] text-slate-400">
                  Enable to notify all restaurant staff and patrons that maintenance is ongoing.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMaintenanceInput(!isMaintenanceInput)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  isMaintenanceInput ? "bg-rose-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    isMaintenanceInput ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBroadcast}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-orange-600/30 transition active:scale-95"
              >
                Publish Broadcast Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CREDENTIALS & SECURITY MANAGEMENT ================= */}
      {isCredsModalOpen && selectedRestForCreds && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Access & Credentials
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedRestForCreds.name} ({selectedRestForCreds.slug})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCredsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  value={credsOwnerName}
                  onChange={(e) => setCredsOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Owner Login Email
                </label>
                <input
                  type="email"
                  value={credsOwnerEmail}
                  onChange={(e) => setCredsOwnerEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={credsPhone}
                  onChange={(e) => setCredsPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Owner Password
                </label>
                <div className="relative">
                  <input
                    type={showCredsPassword ? "text" : "password"}
                    required
                    value={credsPassword}
                    onChange={(e) => setCredsPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredsPassword(!showCredsPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCredsPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Kitchen Staff 4-Digit PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={credsStaffPin}
                  onChange={(e) => setCredsStaffPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  className="w-full bg-slate-950 border border-slate-800 text-cyan-300 text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono tracking-widest font-black"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Used by waiters and chefs for quick floor KDS mode PIN login.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCredsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCreds}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/30 transition active:scale-95 disabled:opacity-50"
                >
                  {isSavingCreds ? "Saving..." : "Save Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: DIRECT ONBOARD RESTAURANT ================= */}
      {isAddRestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-base text-white">
                  Direct Onboard Restaurant
                </h3>
              </div>
              <button
                onClick={() => setIsAddRestModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Punjab Haveli"
                    value={newRestForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
                      setNewRestForm({ ...newRestForm, name, slug });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="royal-punjab"
                    value={newRestForm.slug}
                    onChange={(e) => setNewRestForm({ ...newRestForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    className="w-full bg-slate-950 border border-slate-800 text-orange-400 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gurpreet Singh"
                    value={newRestForm.ownerName}
                    onChange={(e) => setNewRestForm({ ...newRestForm, ownerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    placeholder="owner@haveli.com"
                    value={newRestForm.ownerEmail}
                    onChange={(e) => setNewRestForm({ ...newRestForm, ownerEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Owner Password
                  </label>
                  <input
                    type="text"
                    required
                    value={newRestForm.password}
                    onChange={(e) => setNewRestForm({ ...newRestForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Staff 4-Digit PIN
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={newRestForm.staffPin}
                    onChange={(e) => setNewRestForm({ ...newRestForm, staffPin: e.target.value.replace(/\D/g, "") })}
                    className="w-full bg-slate-950 border border-slate-800 text-cyan-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Delhi NCR"
                    value={newRestForm.city}
                    onChange={(e) => setNewRestForm({ ...newRestForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={newRestForm.plan}
                    onChange={(e) => setNewRestForm({ ...newRestForm, plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                  >
                    <option value="trial">Trial (Free)</option>
                    <option value="starter">Starter (₹999)</option>
                    <option value="pro">Pro (₹2,499)</option>
                    <option value="enterprise">Enterprise (₹4,999)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Initial Tables
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newRestForm.initialTables}
                    onChange={(e) => setNewRestForm({ ...newRestForm, initialTables: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewRest}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-orange-600/30 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingNewRest ? "Onboarding..." : "Register & Launch Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: COMPLETE QR STANDEE KIT ================= */}
      {isQrKitModalOpen && selectedRestForQr && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shadow-lg">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    {selectedRestForQr.name} — QR Standee Kit
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-resolution table QR codes for direct scan-to-order dining.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print All Standees</span>
                </button>
                <button
                  onClick={() => setIsQrKitModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingQrKit ? (
                <div className="py-20 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="font-bold text-sm">Generating Table QR Code Standees...</p>
                </div>
              ) : tableQrList.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <QrCode className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="font-bold text-sm">No tables registered for this restaurant.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {tableQrList.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white text-slate-950 p-5 rounded-2xl border-2 border-slate-200 shadow-xl flex flex-col items-center text-center relative group"
                    >
                      {/* Standee Branding Header */}
                      <div className="font-black text-xs uppercase tracking-widest text-orange-600 mb-1">
                        SCANBITE DIGITAL MENU
                      </div>
                      <div className="font-extrabold text-sm text-slate-900 truncate max-w-[200px]">
                        {selectedRestForQr.name}
                      </div>

                      {/* QR Image */}
                      <div className="my-3 p-2 bg-white rounded-xl border border-slate-200 shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.qrDataUrl}
                          alt={t.tableNumber}
                          className="w-36 h-36 object-contain"
                        />
                      </div>

                      {/* Table Info Pill */}
                      <div className="w-full bg-slate-950 text-white py-1.5 px-3 rounded-xl font-black text-sm mb-2">
                        {t.tableNumber}
                      </div>

                      <div className="text-[11px] text-slate-600 font-medium">
                        Capacity: <b>{t.seats} Guests</b>
                      </div>

                      {/* Quick Download Button */}
                      <div className="mt-3 w-full flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        <a
                          href={t.qrDataUrl}
                          download={`${selectedRestForQr.slug}_${t.tableNumber.replace(/\s+/g, "_")}.png`}
                          className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Save PNG</span>
                        </a>
                        <Link
                          href={t.url}
                          target="_blank"
                          className="py-1 px-2 bg-orange-100 hover:bg-orange-200 text-orange-800 text-[10px] font-bold rounded-lg transition"
                          title="Open Table Link"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Total Standees: <b>{tableQrList.length}</b> tables configured</span>
              <button
                onClick={() => setIsQrKitModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
