"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  Restaurant, 
  Order, 
  ServiceRequest, 
  MenuItem, 
  Table,
  AuthUser,
  Staff
} from "@/types";
import { DEMO_RESTAURANT } from "@/lib/demoData";
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
  Wrench,
  Clock,
  UserPlus,
  Package,
  Boxes,
  UserCheck,
  UserX,
  BadgeCheck,
  Pencil,
  ArrowRightLeft,
  Smartphone,
  LayoutGrid
} from "lucide-react";

export default function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState<"kds" | "analytics" | "menu" | "tables" | "staff" | "settings">("kds");
  const [restaurantSlug, setRestaurantSlug] = useState("grand-spice");
  const [availableRestaurants, setAvailableRestaurants] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sound Chime State & Seen IDs tracking (Prevents repeated phantom chimes)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialOrdersLoadedRef = useRef<boolean>(false);
  const knownRequestIdsRef = useRef<Set<string>>(new Set());
  const isInitialReqsLoadedRef = useRef<boolean>(false);
  const lastLoadedSlugRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastQrFingerprintRef = useRef<string>("");
  const restaurantRef = useRef<Restaurant | null>(null);
  const isDashboardPollingRef = useRef<boolean>(false);
  const lastDashboardOrdersFpRef = useRef<string>("");
  const lastDashboardReqsFpRef = useRef<string>("");

  // KDS filter & search
  const [kdsFilter, setKdsFilter] = useState<"active" | "pending" | "cooking" | "ready" | "served" | "unpaid" | "all">("active");
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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isBroadcastDismissed, setIsBroadcastDismissed] = useState(false);

  // Quick Dish Stock Modal for Kitchen Staff
  const [isStaffStockModalOpen, setIsStaffStockModalOpen] = useState(false);
  const [stockModalSearch, setStockModalSearch] = useState("");

  const isOwner = authUser?.role === "owner";
  const isStaff = authUser?.role === "staff";

  // Role-based Granular Permissions
  const canManageOrders = isOwner || (isStaff && (authUser?.permissions?.canManageOrders ?? true));
  const canManageMenu = isOwner || (isStaff && Boolean(authUser?.permissions?.canManageMenu));
  const canManageBilling = isOwner || (isStaff && Boolean(authUser?.permissions?.canManageBilling));
  const canManageRequests = isOwner || (isStaff && (authUser?.permissions?.canManageRequests ?? true));

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

  // Stock Portion Adjustment Modal
  const [editingStockDish, setEditingStockDish] = useState<MenuItem | null>(null);
  const [stockPortionInput, setStockPortionInput] = useState("");
  const [stockThresholdInput, setStockThresholdInput] = useState("5");
  const [isSavingStock, setIsSavingStock] = useState(false);

  // Staff Management State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"waiter" | "chef" | "cashier" | "manager">("waiter");
  const [addStaffPin, setAddStaffPin] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffIsActive, setNewStaffIsActive] = useState(true);
  const [newStaffOrders, setNewStaffOrders] = useState(true);
  const [newStaffMenu, setNewStaffMenu] = useState(false);
  const [newStaffBilling, setNewStaffBilling] = useState(false);
  const [newStaffRequests, setNewStaffRequests] = useState(true);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffMsg, setStaffMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [staffToast, setStaffToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStaffToast({ type, text });
    setTimeout(() => {
      setStaffToast((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffRole, setEditStaffRole] = useState<"waiter" | "chef" | "cashier" | "manager">("waiter");
  const [editStaffPin, setEditStaffPin] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffIsActive, setEditStaffIsActive] = useState(true);
  const [editStaffOrders, setEditStaffOrders] = useState(true);
  const [editStaffMenu, setEditStaffMenu] = useState(false);
  const [editStaffBilling, setEditStaffBilling] = useState(false);
  const [editStaffRequests, setEditStaffRequests] = useState(true);
  const [isSavingEditStaff, setIsSavingEditStaff] = useState(false);
  const [editStaffError, setEditStaffError] = useState<string | null>(null);

  // Floor Plan Grid State [P-07]
  const [tablesViewMode, setTablesViewMode] = useState<"floor" | "cards">("floor");
  const [tablesFilter, setTablesFilter] = useState<"all" | "vacant" | "dining" | "bill" | "alert">("all");
  const [tablesSearchQuery, setTablesSearchQuery] = useState("");
  const [shiftingTable, setShiftingTable] = useState<{ fromTableId: string; fromTableNumber: string; orderId: string } | null>(null);
  const [selectedShiftTargetId, setSelectedShiftTargetId] = useState("");
  const [isShiftingOrder, setIsShiftingOrder] = useState(false);

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
  const [newDishStock, setNewDishStock] = useState("-1");
  const [newDishLowThreshold, setNewDishLowThreshold] = useState(5);
  const [isSubmittingDish, setIsSubmittingDish] = useState(false);

  // Dish Customisation Form State (Portion Sizes & Add-ons)
  const [newDishVariants, setNewDishVariants] = useState<Array<{ name: string; price: number }>>([]);
  const [newDishAddons, setNewDishAddons] = useState<Array<{ name: string; price: number }>>([]);
  const [variantInputName, setVariantInputName] = useState("");
  const [variantInputPrice, setVariantInputPrice] = useState("");
  const [addonInputName, setAddonInputName] = useState("");
  const [addonInputPrice, setAddonInputPrice] = useState("");

  // Settings Form State
  const [settingsName, setSettingsName] = useState("");
  const [settingsCurrency, setSettingsCurrency] = useState("₹");
  const [settingsTax, setSettingsTax] = useState(5);
  const [settingsUpi, setSettingsUpi] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsAddress, setSettingsAddress] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  // Category Filter & Management State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("🍽️");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Edit Dish Modal State
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [editDishName, setEditDishName] = useState("");
  const [editDishPrice, setEditDishPrice] = useState("");
  const [editDishCategory, setEditDishCategory] = useState("");
  const [editDishIsVeg, setEditDishIsVeg] = useState(true);
  const [editDishDesc, setEditDishDesc] = useState("");
  const [editDishImage, setEditDishImage] = useState("");
  const [editDishStock, setEditDishStock] = useState("-1");
  const [editDishLowThreshold, setEditDishLowThreshold] = useState(5);
  const [editDishVariants, setEditDishVariants] = useState<Array<{ id?: string; name: string; price: number }>>([]);
  const [editDishAddons, setEditDishAddons] = useState<Array<{ id?: string; name: string; price: number }>>([]);
  const [editVariantInputName, setEditVariantInputName] = useState("");
  const [editVariantInputPrice, setEditVariantInputPrice] = useState("");
  const [editAddonInputName, setEditAddonInputName] = useState("");
  const [editAddonInputPrice, setEditAddonInputPrice] = useState("");
  const [isSubmittingEditDish, setIsSubmittingEditDish] = useState(false);

  // Edit Table Modal State
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editTableNum, setEditTableNum] = useState("");
  const [editTableSeats, setEditTableSeats] = useState(4);
  const [isUpdatingTable, setIsUpdatingTable] = useState(false);

  // Analytics Time Range State
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<"today" | "yesterday" | "this_week" | "this_month" | "all">("all");

  // Dynamic UPI Payment QR Preview State
  const [upiPreviewQr, setUpiPreviewQr] = useState<string | null>(null);

  // Preset Emoji Palette for Categories
  const CATEGORY_ICONS_PRESET = [
    "🍽️", "🍢", "🍛", "🫓", "🍹", "🍨", "🍕", "🍔", 
    "🍜", "🥗", "☕", "🍰", "🥟", "🥪", "🍱", "🍲", 
    "🥤", "🌮", "🌯", "🍟", "🥞", "🍣", "🍺", "🍷"
  ];

  // Verify session on mount
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const querySlug = sp?.get("slug");
        const queryDemo = sp?.get("demo") === "true";

        if (queryDemo) {
          setIsDemoMode(true);
          try {
            await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "demo_login" }),
            });
          } catch {
            // ignore
          }
          const demoUser: AuthUser = {
            id: "rest-001",
            name: "The Grand Spice Kitchen",
            slug: "grand-spice",
            ownerEmail: "owner@grandspice.com",
            ownerName: "Rajesh Sharma",
            role: "owner",
            staffPin: "1234",
            permissions: {
              canManageOrders: true,
              canManageMenu: true,
              canManageBilling: true,
              canManageRequests: true,
            },
          };
          setAuthUser(demoUser);
          setRestaurantSlug("grand-spice");
          setStaffRestaurantSlug("grand-spice");
          setNewOwnerEmail("owner@grandspice.com");
          setNewOwnerName("Rajesh Sharma");
          setActiveTab("kds");
          setIsAuthLoading(false);
          return;
        }

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
            if (data.user.role === "owner") {
              setActiveTab("analytics");
            } else {
              if (data.user.permissions?.canManageOrders) {
                setActiveTab("kds");
              } else if (data.user.permissions?.canManageRequests || data.user.permissions?.canManageBilling) {
                setActiveTab("tables");
              } else if (data.user.permissions?.canManageMenu) {
                setActiveTab("menu");
              } else {
                setActiveTab("kds");
              }
            }
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

  // Staff Guard: Staff can only access tabs granted by the Owner (KDS, Menu, and/or Floor Tables)
  useEffect(() => {
    if (isStaff) {
      const allowedTabs: ("kds" | "menu" | "tables")[] = [];
      if (canManageOrders || canManageBilling) {
        allowedTabs.push("kds");
      }
      if (canManageMenu) {
        allowedTabs.push("menu");
      }
      if (canManageRequests || canManageBilling) {
        allowedTabs.push("tables");
      }
      if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab as any)) {
        setActiveTab(allowedTabs[0]);
      }
    }
  }, [isStaff, canManageOrders, canManageBilling, canManageRequests, canManageMenu, activeTab]);

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
        setActiveTab("analytics");
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
        if (data.user.permissions?.canManageOrders) {
          setActiveTab("kds");
        } else if (data.user.permissions?.canManageRequests || data.user.permissions?.canManageBilling) {
          setActiveTab("tables");
        } else if (data.user.permissions?.canManageMenu) {
          setActiveTab("menu");
        } else {
          setActiveTab("kds");
        }
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
        setCredSaveMsg({ type: "success", text: "Security credentials updated in Cloud PostgreSQL database!" });
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

  // Reset alert tracking when switching restaurant
  useEffect(() => {
    knownOrderIdsRef.current.clear();
    isInitialOrdersLoadedRef.current = false;
    knownRequestIdsRef.current.clear();
    isInitialReqsLoadedRef.current = false;
    lastDashboardOrdersFpRef.current = "";
    lastDashboardReqsFpRef.current = "";
    restaurantRef.current = null;
  }, [restaurantSlug]);

  // Fetch current restaurant data:
  // - isFullRefresh = true: Complete metadata load (initial mount, restaurant switch, staff/menu/settings update)
  // - isFullRefresh = false: Ultra-fast background operational poll (Orders & Service Requests only)
  // Decoupled to permanently eliminate the 2-3 second auto-refresh flicker & UI re-render storm
  const loadDashboardData = async (isFullRefresh = true) => {
    if (!authUser) return;
    const currentRest = restaurantRef.current;

    // Fast-path: Background operational poll (Orders & Service Requests only)
    if (!isFullRefresh && currentRest?.id) {
      if (typeof document !== "undefined" && document.hidden) return;
      if (isDashboardPollingRef.current) return;
      isDashboardPollingRef.current = true;
      try {
        const [ordRes, reqRes] = await Promise.all([
          fetch(`/api/orders?restaurantId=${currentRest.id}`),
          fetch(`/api/service-requests?restaurantId=${currentRest.id}`),
        ]);

        // Process Orders
        if (ordRes.ok) {
          const ordData: Order[] = await ordRes.json();
          const ordArray = Array.isArray(ordData) ? ordData : [];
          const ordFp = ordArray.map((o) => `${o.id}_${o.status}_${o.paymentStatus}_${o.items?.length || 0}`).join("|");

          // Bulletproof Chime: Only ring when a genuinely brand-new order arrives (< 60s ago)
          if (!isInitialOrdersLoadedRef.current) {
            ordArray.forEach((o) => knownOrderIdsRef.current.add(o.id));
            isInitialOrdersLoadedRef.current = true;
          } else {
            const brandNewOrders = ordArray.filter((o) => !knownOrderIdsRef.current.has(o.id));
            if (brandNewOrders.length > 0) {
              const hasFreshOrder = brandNewOrders.some(
                (o) => Date.now() - new Date(o.createdAt).getTime() < 60000
              );
              if (hasFreshOrder) {
                playNewOrderChime();
              }
              brandNewOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
            }
          }

          if (ordFp !== lastDashboardOrdersFpRef.current) {
            lastDashboardOrdersFpRef.current = ordFp;
            setOrders(ordArray);
          }
        }

        // Process Service Requests
        if (reqRes.ok) {
          const reqData: ServiceRequest[] = await reqRes.json();
          const reqArray = Array.isArray(reqData) ? reqData : [];
          const pendingReqs = reqArray.filter((r) => r.status === "pending");
          const reqFp = reqArray.map((r) => `${r.id}_${r.status}`).join("|");

          if (!isInitialReqsLoadedRef.current) {
            pendingReqs.forEach((r) => knownRequestIdsRef.current.add(r.id));
            isInitialReqsLoadedRef.current = true;
          } else {
            const brandNewReqs = pendingReqs.filter((r) => !knownRequestIdsRef.current.has(r.id));
            if (brandNewReqs.length > 0) {
              const hasFreshReq = brandNewReqs.some(
                (r) => Date.now() - new Date(r.createdAt).getTime() < 60000
              );
              if (hasFreshReq) {
                playServiceChime();
              }
              brandNewReqs.forEach((r) => knownRequestIdsRef.current.add(r.id));
            }
          }

          if (reqFp !== lastDashboardReqsFpRef.current) {
            lastDashboardReqsFpRef.current = reqFp;
            setServiceRequests(reqArray);
          }
        }
      } catch (err) {
        console.warn("Silent dashboard poll warning:", err);
      } finally {
        isDashboardPollingRef.current = false;
      }
      return;
    }

    // Full Refresh: Restaurant Metadata, Menu, Tables, Staff & Form fields
    try {
      let restData: Restaurant | null = null;
      try {
        const restRes = await fetch(`/api/restaurants/${restaurantSlug}`);
        if (restRes.ok) {
          const json = await restRes.json();
          if (json && !json.error && json.slug) {
            restData = json;
          }
        }
      } catch {
        // ignore
      }

      if (!restData && (restaurantSlug === "grand-spice" || isDemoMode)) {
        restData = DEMO_RESTAURANT;
      }

      if (restData) {
        restaurantRef.current = restData;
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
          if (restData.ownerName) setNewOwnerName(restData.ownerName);
          if (restData.ownerEmail) setNewOwnerEmail(restData.ownerEmail);
        }

        // Fetch Orders
        try {
          const ordRes = await fetch(`/api/orders?restaurantId=${restData.id}`);
          if (ordRes.ok) {
            const ordData: Order[] = await ordRes.json();
            const ordArray = Array.isArray(ordData) ? ordData : [];
            const ordFp = ordArray.map((o) => `${o.id}_${o.status}_${o.paymentStatus}_${o.items?.length || 0}`).join("|");
            lastDashboardOrdersFpRef.current = ordFp;
            
            // Bulletproof Chime: Only ring when a genuinely brand-new order arrives (< 60s ago)
            if (!isInitialOrdersLoadedRef.current) {
              ordArray.forEach((o) => knownOrderIdsRef.current.add(o.id));
              isInitialOrdersLoadedRef.current = true;
            } else {
              const brandNewOrders = ordArray.filter((o) => !knownOrderIdsRef.current.has(o.id));
              if (brandNewOrders.length > 0) {
                const hasFreshOrder = brandNewOrders.some(
                  (o) => Date.now() - new Date(o.createdAt).getTime() < 60000
                );
                if (hasFreshOrder) {
                  playNewOrderChime();
                }
                brandNewOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
              }
            }
            setOrders(ordArray);
          }
        } catch {
          // ignore
        }

        // Fetch Service Requests
        try {
          const reqRes = await fetch(`/api/service-requests?restaurantId=${restData.id}`);
          if (reqRes.ok) {
            const reqData: ServiceRequest[] = await reqRes.json();
            const reqArray = Array.isArray(reqData) ? reqData : [];
            const pendingReqs = reqArray.filter((r) => r.status === "pending");
            const reqFp = reqArray.map((r) => `${r.id}_${r.status}`).join("|");
            lastDashboardReqsFpRef.current = reqFp;

            if (!isInitialReqsLoadedRef.current) {
              pendingReqs.forEach((r) => knownRequestIdsRef.current.add(r.id));
              isInitialReqsLoadedRef.current = true;
            } else {
              const brandNewReqs = pendingReqs.filter((r) => !knownRequestIdsRef.current.has(r.id));
              if (brandNewReqs.length > 0) {
                const hasFreshReq = brandNewReqs.some(
                  (r) => Date.now() - new Date(r.createdAt).getTime() < 60000
                );
                if (hasFreshReq) {
                  playServiceChime();
                }
                brandNewReqs.forEach((r) => knownRequestIdsRef.current.add(r.id));
              }
            }
            setServiceRequests(reqArray);
          }
        } catch {
          // ignore
        }

        // Fetch Staff Directory if Owner
        if (authUser?.role === "owner") {
          try {
            const stRes = await fetch(`/api/staff?restaurantId=${restData.id}`);
            if (stRes.ok) {
              const stData = await stRes.json();
              setStaffList(stData.staff || []);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (restaurantSlug === "grand-spice" || isDemoMode) {
        restaurantRef.current = DEMO_RESTAURANT;
        setRestaurant(DEMO_RESTAURANT);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authUser) return;
    loadDashboardData(true);

    // Smart Polling: Pause when browser tab is hidden/minimized to save bandwidth and DB queries
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      loadDashboardData(false);
    }, 5000);

    // Instant refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        loadDashboardData(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [restaurantSlug, authUser]);

  // Generate QR codes for tables (memoized to eliminate 4-second CPU storm)
  useEffect(() => {
    if (!restaurant) return;
    const fingerprint = `${restaurant.slug}:${(restaurant.tables || []).map((t) => `${t.id}:${t.tableNumber}`).join(",")}`;
    if (fingerprint === lastQrFingerprintRef.current) return;
    lastQrFingerprintRef.current = fingerprint;

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

  // Generate Live Dynamic UPI Payment QR Preview for Settings
  useEffect(() => {
    const vpa = settingsUpi.trim();
    if (!vpa) {
      setUpiPreviewQr(null);
      return;
    }
    let isCancelled = false;
    const generateUpiQr = async () => {
      try {
        const mod = await import("qrcode");
        const QRCode = mod.default || mod;
        const uri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(settingsName || restaurant?.name || "Restaurant")}&cu=INR`;
        const dataUrl = await QRCode.toDataURL(uri, {
          width: 240,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!isCancelled) setUpiPreviewQr(dataUrl);
      } catch (err) {
        console.error("Failed to generate UPI QR preview:", err);
        if (!isCancelled) setUpiPreviewQr(null);
      }
    };
    generateUpiQr();
    return () => {
      isCancelled = true;
    };
  }, [settingsUpi, settingsName, restaurant?.name]);

  // Reset Demo Orders Handler
  const handleResetDemoOrders = async () => {
    showToast("Reloading 4 active demo orders...", "success");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_demo_orders" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          data.orders.forEach((o: Order) => knownOrderIdsRef.current.add(o.id));
          setOrders(data.orders);
          setKdsFilter("active");
          showToast("4 Active Demo Orders Loaded into Kitchen Console! 👨‍🍳", "success");
          return;
        }
      }
    } catch (err) {
      console.error("Reset demo orders error:", err);
    }
    loadDashboardData();
  };

  // Order status transitions
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: Order["status"]) => {
    if (!canManageOrders) {
      showToast("Unauthorized: You do not have permission to advance kitchen orders.", "error");
      return;
    }
    // Optimistic UI update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    const statusLabels: Record<string, string> = {
      pending: "Placed & Pending",
      cooking: "Cooking in Kitchen 👨‍🍳",
      ready: "Ready to Serve 🔔",
      served: "Served to Table ✅",
      completed: "Completed & Closed 🏁",
      cancelled: "Cancelled",
    };
    showToast(`Order updated: ${statusLabels[nextStatus] || nextStatus}`, "success");
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });
      if (!res.ok) {
        loadDashboardData();
      }
    } catch {
      loadDashboardData();
    }
  };

  // 1-Click Payment Status toggle
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: "paid" | "unpaid") => {
    if (!canManageBilling) {
      showToast("Unauthorized: Only Owner or staff with Billing permissions can mark orders as Paid/Unpaid.", "error");
      return;
    }
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
    );
    showToast(`Order marked as ${paymentStatus === "paid" ? "Paid (Settled) 💵" : "Unpaid"}`, "success");
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentStatus }),
      });
      if (!res.ok) {
        loadDashboardData();
      }
    } catch {
      loadDashboardData();
    }
  };

  // Cancel order handler
  const handleCancelOrder = async (orderId: string, tableNumber: string) => {
    if (!canManageOrders) {
      showToast("Unauthorized: You do not have permission to cancel orders.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to cancel order for ${tableNumber}? This will mark it cancelled.`)) return;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
    showToast(`Order for ${tableNumber} has been cancelled.`, "success");
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "cancelled" }),
      });
      if (!res.ok) {
        loadDashboardData();
      }
    } catch {
      loadDashboardData();
    }
  };

  // Vacate and reset table for next guests
  const handleVacateTable = async (tableId: string, tableNumber: string) => {
    if (!canManageOrders && !canManageRequests && !canManageBilling) {
      showToast("Unauthorized: You do not have permission to manage tables.", "error");
      return;
    }
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vacate_table",
          restaurantId: restaurant?.id,
          tableId,
        }),
      });
      if (res.ok) {
        showToast(`${tableNumber} cleared & ready for next guests! 🧹`, "success");
        loadDashboardData();
      } else {
        showToast("Failed to vacate table.", "error");
      }
    } catch {
      showToast("Network error vacating table.", "error");
    }
  };

  // Shift / Transfer Order from Table A to Table B [P-07]
  const handleConfirmShiftTable = async () => {
    if (!shiftingTable || !selectedShiftTargetId) return;
    const targetTable = restaurant?.tables.find((t) => t.id === selectedShiftTargetId);
    if (!targetTable) return;

    setIsShiftingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: shiftingTable.orderId,
          tableId: targetTable.id,
          tableNumber: targetTable.tableNumber,
        }),
      });

      if (res.ok) {
        showToast(`Order shifted from ${shiftingTable.fromTableNumber} to ${targetTable.tableNumber}! 🔀`, "success");
        setShiftingTable(null);
        setSelectedShiftTargetId("");
        loadDashboardData();
      } else {
        showToast("Failed to shift table order.", "error");
      }
    } catch {
      showToast("Network error shifting table order.", "error");
    } finally {
      setIsShiftingOrder(false);
    }
  };

  // Delete Dish Handler
  const handleDeleteDish = async (itemId: string, dishName: string) => {
    if (!isOwner) {
      showToast("Unauthorized: Only the restaurant owner can delete menu dishes.", "error");
      return;
    }
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
        showToast(`"${dishName}" deleted from menu.`, "success");
      } else {
        showToast("Failed to delete dish.", "error");
      }
    } catch {
      showToast("Error deleting dish.", "error");
    }
  };

  // Delete Table Handler
  const handleDeleteTable = async (tableId: string, tableNumber: string) => {
    if (!isOwner) {
      showToast("Unauthorized: Only the restaurant owner can delete tables.", "error");
      return;
    }
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
        showToast(`"${tableNumber}" deleted.`, "success");
        loadDashboardData();
      } else {
        showToast("Failed to delete table.", "error");
      }
    } catch {
      showToast("Error deleting table.", "error");
    }
  };

  // Attend service request
  const handleAttendRequest = async (requestId: string) => {
    if (!canManageRequests && !canManageBilling) {
      showToast("Unauthorized: You do not have permission to attend dining table service requests.", "error");
      return;
    }
    try {
      const res = await fetch("/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        showToast("Table request attended & resolved. ✓", "success");
        loadDashboardData();
      } else {
        showToast("Failed to clear request.", "error");
      }
    } catch {
      showToast("Failed to clear request.", "error");
    }
  };

  // Toggle item availability
  const handleToggleAvailability = async (itemId: string) => {
    if (!restaurant) return;
    if (!canManageMenu) {
      showToast("Unauthorized: You do not have permission to toggle dish availability.", "error");
      return;
    }
    try {
      const res = await fetch("/api/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: restaurant.slug, itemId }),
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setRestaurant((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            menuItems: prev.menuItems.map((item) =>
              item.id === itemId ? { ...item, ...updatedItem } : item
            ),
          };
        });
        showToast(`Dish is now ${updatedItem.isAvailable ? "Available In-Stock" : "Marked Sold Out"}`, "success");
      } else {
        showToast("Failed to toggle availability.", "error");
      }
    } catch {
      showToast("Failed to toggle availability.", "error");
    }
  };

  // Add Table Handler
  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showToast("Unauthorized: Only the restaurant owner can add new tables.", "error");
      return;
    }
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
        showToast(`Table "${newTableNum.trim()}" added successfully!`, "success");
        setNewTableNum("");
        setIsAddTableOpen(false);
        loadDashboardData();
      } else {
        showToast("Failed to add table.", "error");
      }
    } catch {
      showToast("Error adding table.", "error");
    } finally {
      setIsSubmittingTable(false);
    }
  };

  // Staff Management Handlers
  const handleRolePresetChange = (role: "waiter" | "chef" | "cashier" | "manager") => {
    setNewStaffRole(role);
    if (role === "chef") {
      setNewStaffOrders(true);
      setNewStaffMenu(true);
      setNewStaffBilling(false);
      setNewStaffRequests(false);
    } else if (role === "waiter") {
      setNewStaffOrders(true);
      setNewStaffMenu(false);
      setNewStaffBilling(false);
      setNewStaffRequests(true);
    } else if (role === "cashier") {
      setNewStaffOrders(true);
      setNewStaffMenu(false);
      setNewStaffBilling(true);
      setNewStaffRequests(false);
    } else if (role === "manager") {
      setNewStaffOrders(true);
      setNewStaffMenu(true);
      setNewStaffBilling(true);
      setNewStaffRequests(true);
    }
  };

  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setAddStaffPin(pin);
  };

  const loadStaffMembers = async () => {
    if (!restaurant) return;
    setIsStaffLoading(true);
    try {
      const res = await fetch(`/api/staff?restaurantId=${restaurant.id}`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch {
      // ignore
    } finally {
      setIsStaffLoading(false);
    }
  };

  useEffect(() => {
    if (restaurant && isOwner && activeTab === "staff") {
      loadStaffMembers();
    }
  }, [restaurant, isOwner, activeTab]);

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newStaffName.trim() || !addStaffPin.trim()) return;
    setIsSubmittingStaff(true);
    setStaffMsg(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          name: newStaffName.trim(),
          role: newStaffRole,
          pin: addStaffPin.trim(),
          phone: newStaffPhone.trim() || undefined,
          isActive: newStaffIsActive,
          canManageOrders: newStaffOrders,
          canManageMenu: newStaffMenu,
          canManageBilling: newStaffBilling,
          canManageRequests: newStaffRequests,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStaffMsg({ type: "success", text: `Staff member "${newStaffName}" added successfully!` });
        setStaffToast({ type: "success", text: `Staff member "${newStaffName}" added successfully!` });
        setTimeout(() => setStaffToast(null), 4000);
        setNewStaffName("");
        setAddStaffPin("");
        setNewStaffPhone("");
        setIsAddStaffOpen(false);
        loadStaffMembers();
      } else {
        setStaffMsg({ type: "error", text: data.error || "Failed to add staff member." });
      }
    } catch {
      setStaffMsg({ type: "error", text: "Error saving staff member." });
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleToggleStaffActive = async (staffId: string, currentStatus: boolean, name: string) => {
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          isActive: !currentStatus,
        }),
      });
      if (res.ok) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, isActive: !currentStatus } : s))
        );
        showToast(`"${name}" is now ${!currentStatus ? "Online Active" : "Disabled Offline"}.`, "success");
      } else {
        showToast("Failed to toggle staff active status.", "error");
      }
    } catch {
      showToast("Error toggling staff status.", "error");
    }
  };

  const handleToggleStaffPermission = async (
    staffId: string,
    permKey: "canManageOrders" | "canManageMenu" | "canManageBilling" | "canManageRequests",
    currentVal: boolean
  ) => {
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          [permKey]: !currentVal,
        }),
      });
      if (res.ok) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, [permKey]: !currentVal } : s))
        );
        showToast("Permission updated successfully.", "success");
      } else {
        showToast("Failed to update staff permission.", "error");
      }
    } catch {
      showToast("Error updating permission.", "error");
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove staff member "${staffName}"?`)) return;
    try {
      const res = await fetch(`/api/staff?staffId=${staffId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStaffList((prev) => prev.filter((s) => s.id !== staffId));
        showToast(`Staff member "${staffName}" removed successfully.`, "success");
      } else {
        showToast("Failed to delete staff member.", "error");
      }
    } catch {
      showToast("Error deleting staff member.", "error");
    }
  };

  // Edit Staff Handlers
  const handleEditRolePresetChange = (role: "waiter" | "chef" | "cashier" | "manager") => {
    setEditStaffRole(role);
    if (role === "chef") {
      setEditStaffOrders(true);
      setEditStaffMenu(true);
      setEditStaffBilling(false);
      setEditStaffRequests(false);
    } else if (role === "waiter") {
      setEditStaffOrders(true);
      setEditStaffMenu(false);
      setEditStaffBilling(false);
      setEditStaffRequests(true);
    } else if (role === "cashier") {
      setEditStaffOrders(true);
      setEditStaffMenu(false);
      setEditStaffBilling(true);
      setEditStaffRequests(false);
    } else if (role === "manager") {
      setEditStaffOrders(true);
      setEditStaffMenu(true);
      setEditStaffBilling(true);
      setEditStaffRequests(true);
    }
  };

  const generateEditRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setEditStaffPin(pin);
  };

  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editStaffName.trim() || !editStaffPin.trim()) return;
    setIsSavingEditStaff(true);
    setEditStaffError(null);
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: editingStaff.id,
          name: editStaffName.trim(),
          role: editStaffRole,
          pin: editStaffPin.trim(),
          phone: editStaffPhone.trim() || undefined,
          isActive: editStaffIsActive,
          canManageOrders: editStaffOrders,
          canManageMenu: editStaffMenu,
          canManageBilling: editStaffBilling,
          canManageRequests: editStaffRequests,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === editingStaff.id ? { ...s, ...data } : s))
        );
        setStaffToast({ type: "success", text: `Staff details for "${editStaffName}" updated successfully!` });
        setTimeout(() => setStaffToast(null), 4000);
        setEditingStaff(null);
      } else {
        setEditStaffError(data.error || "Failed to update staff member.");
      }
    } catch {
      setEditStaffError("Error updating staff details.");
    } finally {
      setIsSavingEditStaff(false);
    }
  };

  // Stock Portion Save Handler
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockDish) return;
    setIsSavingStock(true);
    try {
      const newStock = stockPortionInput.trim() === "" ? -1 : Number(stockPortionInput);
      const newThreshold = Number(stockThresholdInput) || 5;

      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: editingStockDish.id,
          stockCount: newStock,
          lowStockThreshold: newThreshold,
        }),
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setRestaurant((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            menuItems: prev.menuItems.map((it) => (it.id === editingStockDish.id ? { ...it, ...updatedItem } : it)),
          };
        });
        showToast(`Stock updated for "${editingStockDish.name}"`, "success");
        setEditingStockDish(null);
      } else {
        showToast("Failed to save stock portions.", "error");
      }
    } catch {
      showToast("Error saving stock portions.", "error");
    } finally {
      setIsSavingStock(false);
    }
  };

  // Add Dish Handler
  const handleAddDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showToast("Unauthorized: Only the restaurant owner can add new dishes.", "error");
      return;
    }
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
          stockCount: newDishStock ? Number(newDishStock) : -1,
          lowStockThreshold: Number(newDishLowThreshold) || 5,
          variants: newDishVariants.length > 0 ? newDishVariants.map((v, i) => ({ id: `v-${Date.now()}-${i}`, ...v })) : undefined,
          addons: newDishAddons.length > 0 ? newDishAddons.map((a, i) => ({ id: `a-${Date.now()}-${i}`, ...a })) : undefined,
        }),
      });
      if (res.ok) {
        showToast(`Dish "${newDishName.trim()}" added to menu! ✓`, "success");
        setNewDishName("");
        setNewDishPrice("");
        setNewDishDesc("");
        setNewDishImage("");
        setNewDishVariants([]);
        setNewDishAddons([]);
        setVariantInputName("");
        setVariantInputPrice("");
        setAddonInputName("");
        setAddonInputPrice("");
        setIsAddDishOpen(false);
        loadDashboardData();
      } else {
        showToast("Failed to add dish.", "error");
      }
    } catch {
      showToast("Error adding dish.", "error");
    } finally {
      setIsSubmittingDish(false);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async () => {
    if (!isOwner) {
      showToast("Unauthorized: Only the restaurant owner can modify restaurant settings.", "error");
      return;
    }
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
        showToast("Settings saved successfully to database! ✓", "success");
        setSettingsSaveMsg("Settings saved successfully to database! ✓");
        setTimeout(() => setSettingsSaveMsg(null), 3500);
        loadDashboardData();
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch {
      showToast("Error saving settings.", "error");
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
      else if (kdsFilter === "served") matchesFilter = o.status === "served";
      else if (kdsFilter === "unpaid") matchesFilter = o.paymentStatus !== "paid" && o.status !== "cancelled";

      if (!matchesFilter) return false;

      if (kdsSearch.trim()) {
        const query = kdsSearch.toLowerCase().trim();
        const matchesTable = o.tableNumber.toLowerCase().includes(query);
        const matchesId = o.id.toLowerCase().includes(query);
        const matchesCustomer = (o.customerName || "").toLowerCase().includes(query);
        const matchesPhone = (o.customerPhone || "").toLowerCase().includes(query);
        const matchesDish = o.items.some((it) => it.name.toLowerCase().includes(query));
        const matchesDiner = o.items.some((it) => (it.orderedByName || "").toLowerCase().includes(query));
        return matchesTable || matchesId || matchesCustomer || matchesPhone || matchesDish || matchesDiner;
      }
      return true;
    });
  }, [orders, kdsFilter, kdsSearch]);

  // Analytics Filtered Orders Memo
  const filteredAnalyticsOrders = useMemo(() => {
    if (analyticsTimeRange === "all") return orders;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (analyticsTimeRange === "today") {
      return orders.filter((o) => new Date(o.createdAt) >= startOfToday);
    }
    if (analyticsTimeRange === "yesterday") {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      return orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfYesterday && d < startOfToday;
      });
    }
    if (analyticsTimeRange === "this_week") {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7; // Monday as start of week
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
      return orders.filter((o) => new Date(o.createdAt) >= startOfWeek);
    }
    if (analyticsTimeRange === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return orders.filter((o) => new Date(o.createdAt) >= startOfMonth);
    }
    return orders;
  }, [orders, analyticsTimeRange]);

  const customerReviews = useMemo(() => {
    return orders
      .filter((o) => (o.rating && o.rating > 0) || (o.reviewFeedback && o.reviewFeedback.trim().length > 0))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const unpaidOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled");
  }, [orders]);
  const unpaidCount = unpaidOrders.length;
  const unpaidTotalBalance = useMemo(() => {
    return unpaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [unpaidOrders]);

  // Format currency integers cleanly without decimal noise
  const formatCurrency = (val: number) => {
    return `${restaurant?.currencySymbol || "₹"}${Math.round(val || 0).toLocaleString("en-IN")}`;
  };

  // Edit Dish Handlers
  const openEditDishModal = (dish: MenuItem) => {
    setEditingDish(dish);
    setEditDishName(dish.name);
    setEditDishPrice(dish.price.toString());
    setEditDishCategory(dish.categoryId);
    setEditDishIsVeg(dish.isVeg);
    setEditDishDesc(dish.description || "");
    setEditDishImage(dish.imageUrl || "");
    setEditDishStock(dish.stockCount !== null && dish.stockCount !== undefined ? dish.stockCount.toString() : "-1");
    setEditDishLowThreshold(dish.lowStockThreshold ?? 5);
    setEditDishVariants(dish.variants ? JSON.parse(JSON.stringify(dish.variants)) : []);
    setEditDishAddons(dish.addons ? JSON.parse(JSON.stringify(dish.addons)) : []);
    setEditVariantInputName("");
    setEditVariantInputPrice("");
    setEditAddonInputName("");
    setEditAddonInputPrice("");
  };

  const handleEditDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !editingDish || !restaurant) return;
    if (!editDishName.trim() || !editDishPrice) {
      showToast("Dish name and price are required.", "error");
      return;
    }
    setIsSubmittingEditDish(true);
    try {
      const payload = {
        itemId: editingDish.id,
        name: editDishName.trim(),
        price: Number(editDishPrice),
        categoryId: editDishCategory || editingDish.categoryId,
        isVeg: editDishIsVeg,
        description: editDishDesc.trim(),
        imageUrl: editDishImage.trim(),
        stockCount: editDishStock.trim() === "" ? -1 : Number(editDishStock),
        lowStockThreshold: Number(editDishLowThreshold) || 5,
        variants: editDishVariants,
        addons: editDishAddons,
      };

      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setRestaurant((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            menuItems: prev.menuItems.map((it) => (it.id === editingDish.id ? { ...it, ...updatedItem } : it)),
          };
        });
        showToast(`Dish "${editDishName.trim()}" updated successfully! ✓`, "success");
        setEditingDish(null);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to update dish.", "error");
      }
    } catch {
      showToast("Network error updating dish.", "error");
    } finally {
      setIsSubmittingEditDish(false);
    }
  };

  // Category Management Handlers
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !restaurant) return;
    if (!newCategoryName.trim()) {
      showToast("Category name is required.", "error");
      return;
    }
    setIsSubmittingCategory(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addCategory",
          restaurantId: restaurant.id,
          name: newCategoryName.trim(),
          icon: newCategoryIcon || "🍽️",
        }),
      });

      if (res.ok) {
        const newCat = await res.json();
        setRestaurant((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            categories: [...prev.categories, newCat],
          };
        });
        showToast(`Category "${newCategoryName.trim()}" created! ✓`, "success");
        setNewCategoryName("");
        setNewCategoryIcon("🍽️");
        loadDashboardData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to create category.", "error");
      }
    } catch {
      showToast("Network error creating category.", "error");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!isOwner) return;
    const dishCount = restaurant?.menuItems.filter((it) => it.categoryId === catId).length || 0;
    if (dishCount > 0) {
      if (!confirm(`Warning: Category "${catName}" has ${dishCount} dishes assigned. Deleting this category will delete all assigned dishes. Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    }

    try {
      const res = await fetch(`/api/menu?categoryId=${catId}`, { method: "DELETE" });
      if (res.ok) {
        setRestaurant((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            categories: prev.categories.filter((c) => c.id !== catId),
            menuItems: prev.menuItems.filter((it) => it.categoryId !== catId),
          };
        });
        if (selectedCategoryFilter === catId) {
          setSelectedCategoryFilter("all");
        }
        showToast(`Category "${catName}" removed.`, "success");
        loadDashboardData();
      } else {
        showToast("Failed to delete category.", "error");
      }
    } catch {
      showToast("Network error deleting category.", "error");
    }
  };

  // Edit Table Handlers
  const handleOpenEditTable = (table: Table) => {
    setEditingTable(table);
    setEditTableNum(table.tableNumber);
    setEditTableSeats(table.seats || 4);
  };

  const handleEditTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !restaurant || !editTableNum.trim()) return;
    setIsUpdatingTable(true);
    try {
      const res = await fetch("/api/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTable.id,
          tableNumber: editTableNum.trim(),
          seats: Number(editTableSeats) || 4,
          restaurantId: restaurant.id,
        }),
      });
      if (res.ok) {
        showToast(`Table updated to "${editTableNum.trim()}" (${editTableSeats} seats)! ✓`, "success");
        setEditingTable(null);
        loadDashboardData();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to update table.", "error");
      }
    } catch {
      showToast("Error updating table.", "error");
    } finally {
      setIsUpdatingTable(false);
    }
  };

  // Export Sales Report to CSV Handler
  const handleExportSalesReport = () => {
    const records = filteredAnalyticsOrders.filter((o) => o.status !== "cancelled");
    if (records.length === 0) {
      showToast("No sales records available to export for this date range.", "error");
      return;
    }

    const headers = [
      "Order ID",
      "Date",
      "Table Number",
      "Customer Name",
      "Customer Phone",
      "Items Ordered",
      "Subtotal",
      "Tax",
      "Discount",
      "Total Amount",
      "Payment Status",
      "Payment Method",
      "Order Status",
    ];

    const escapeCsv = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    const rows = records.map((o) => [
      escapeCsv(o.id),
      escapeCsv(new Date(o.createdAt).toLocaleString("en-IN")),
      escapeCsv(o.tableNumber),
      escapeCsv(o.customerName || "Walk-in Guest"),
      escapeCsv(o.customerPhone || "N/A"),
      escapeCsv(o.items.map((i) => `${i.quantity}x ${i.name}`).join("; ")),
      escapeCsv(Math.round(o.subtotal)),
      escapeCsv(Math.round(o.tax)),
      escapeCsv(Math.round(o.discount || 0)),
      escapeCsv(Math.round(o.total)),
      escapeCsv(o.paymentStatus),
      escapeCsv(o.paymentMethod || "counter_cash"),
      escapeCsv(o.status),
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `sales-report-${restaurant?.slug || "restaurant"}-${analyticsTimeRange}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${records.length} sales records to CSV successfully! ✓`, "success");
  };

  // Analytics Calculations
  const analyticsData = useMemo(() => {
    const validOrders = filteredAnalyticsOrders.filter((o) => o.status !== "cancelled");
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
  }, [filteredAnalyticsOrders, orders]);

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

            {/* 1-Click Instant Demo Button */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-600/15 via-amber-600/15 to-orange-600/15 border border-orange-500/30 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-orange-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Just exploring ScanBite?</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                No password required. Test our live Kitchen KDS, staff management, and menu stock in 1 click!
              </p>
              <button
                type="button"
                onClick={async () => {
                  setIsDemoMode(true);
                  try {
                    await fetch("/api/auth", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "demo_login" }),
                    });
                  } catch {}
                  const demoUser: AuthUser = {
                    id: "rest-001",
                    name: "The Grand Spice Kitchen",
                    slug: "grand-spice",
                    ownerEmail: "owner@grandspice.com",
                    ownerName: "Rajesh Sharma",
                    role: "owner",
                    staffPin: "1234",
                    permissions: {
                      canManageOrders: true,
                      canManageMenu: true,
                      canManageBilling: true,
                      canManageRequests: true,
                    },
                  };
                  setAuthUser(demoUser);
                  setRestaurantSlug("grand-spice");
                  setStaffRestaurantSlug("grand-spice");
                  setNewOwnerEmail("owner@grandspice.com");
                  setNewOwnerName("Rajesh Sharma");
                  setActiveTab("kds");
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition active:scale-95"
              >
                <ChefHat className="w-4 h-4" />
                <span>Enter Live Interactive Demo (No Login Needed) →</span>
              </button>
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
                  {availableRestaurants.length > 1 && !restaurantSlug ? (
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
                  ) : (
                    <div className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-between">
                      <span>{availableRestaurants.find((r) => r.slug === staffRestaurantSlug)?.name || restaurant?.name || staffRestaurantSlug}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({staffRestaurantSlug})</span>
                    </div>
                  )}
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
    if (restaurantSlug === "grand-spice" || isDemoMode) {
      setRestaurant(DEMO_RESTAURANT);
      return null;
    }
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
      {/* ===================== UNIFIED STICKY TOP CONTAINER ===================== */}
      <div className="sticky top-0 z-40 bg-slate-900 shadow-md">
        {/* 1. Interactive Demo Mode Top Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white text-xs font-bold py-2 px-4 border-b border-orange-400/30 flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs">🌟 ScanBite Interactive Demo Mode (Grand Spice) • Try advancing orders, managing stock & kitchen!</span>
            </div>
            <Link
              href="/register"
              className="bg-white text-slate-950 hover:bg-slate-100 px-2.5 py-0.5 rounded-lg text-[11px] font-black transition shrink-0 shadow-xs"
            >
              Get ScanBite For Your Restaurant →
            </Link>
          </div>
        )}

        {/* 2. Main Navigation Header */}
        <header className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            {/* Row 1: Brand Info & Top Action Controls */}
            <div className="py-2.5 flex items-center justify-between gap-3 border-b border-slate-800/80">
              {/* Brand & Identity */}
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-orange-500/30 shrink-0">
                  ⚡
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {authUser?.role === "admin" && availableRestaurants.length > 1 ? (
                      <select
                        value={restaurantSlug}
                        onChange={(e) => setRestaurantSlug(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white font-bold text-xs sm:text-sm px-2 py-1 rounded-lg focus:outline-none max-w-[120px] sm:max-w-[180px] md:max-w-[240px]"
                      >
                        {availableRestaurants.map((r) => (
                          <option key={r.slug} value={r.slug}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <h1 className="font-bold text-sm sm:text-base text-white tracking-wide truncate max-w-[150px] sm:max-w-[240px] md:max-w-none">{restaurant.name}</h1>
                    )}

                    {/* LIVE badge: green dot on xs, pill on sm+ — never overlaps buttons */}
                    <span className="shrink-0 hidden sm:flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      LIVE
                    </span>
                    <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse sm:hidden" />
                  </div>
                  <p className="hidden md:block text-[11px] text-slate-400 truncate">
                    {isOwner ? "Owner Executive & Management Command Center" : "Kitchen Display & Floor Operations"}
                  </p>
                </div>
              </div>

              {/* Action Controls & User Account */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-1">
                {/* Test Sound — icon only on xs/sm, label on md+ */}
                <button
                  onClick={() => {
                    if (!soundEnabled) setSoundEnabled(true);
                    playNewOrderChime();
                  }}
                  className="p-1.5 md:px-2.5 md:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                  title="Test Sound Chime (Unlocks AudioContext in Browser)"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Test Sound</span>
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) playNewOrderChime();
                  }}
                  className={`p-1.5 sm:p-2 rounded-xl border transition cursor-pointer ${
                    soundEnabled
                      ? "bg-orange-950/60 border-orange-500/40 text-orange-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                  title={soundEnabled ? "Sound Alerts Active (Click to mute)" : "Sound Muted (Click to enable)"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Waiter / Captain Mobile Mode Link */}
                <Link
                  href="/waiter"
                  target="_blank"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-xs font-bold text-orange-400 border border-orange-500/30 transition whitespace-nowrap cursor-pointer shadow-sm"
                  title="Open Dedicated Mobile Waiter & Captain Mode (/waiter)"
                >
                  <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Waiter Mode</span>
                </Link>

                {/* Diner Menu Preview Link — lg+ only so it doesn't crowd tablet */}
                <a
                  href={`/r/${restaurant.slug}/t/${restaurant.tables[0]?.id || "tbl-1"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                  <span>Diner Menu ({restaurant.tables[0]?.tableNumber || "Table 1"})</span>
                </a>

                {/* Staff Sold Out Modal Button (if staff floor mode) */}
                {!isOwner && canManageMenu && (
                  <button
                    onClick={() => setIsStaffStockModalOpen(true)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 hover:text-white p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
                    title="Mark Finished Dishes Out of Stock"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Mark Sold Out</span>
                  </button>
                )}

                {/* User Account Info & Sign Out */}
                <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-800">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-[11px] font-bold text-white flex items-center justify-end gap-1 whitespace-nowrap">
                      {isOwner ? (
                        <span className="text-amber-400 font-extrabold flex items-center gap-1">
                          👑 {authUser?.ownerName || restaurant.name} (Owner)
                        </span>
                      ) : (
                        <span className="text-cyan-400 font-extrabold flex items-center gap-1">
                          👨‍🍳 {authUser?.staffName || "Staff"}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                      {isOwner ? (authUser?.ownerEmail || restaurant.slug) : "Floor Mode"}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                    title="Sign Out / Lock Dashboard"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Navigation Tabs Bar — scrollable with right-fade hint on mobile */}
            <div className="relative py-1.5">
              {/* gradient hint so users know more tabs exist off-screen */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 lg:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pr-6 lg:pr-0">
              {isOwner ? (
                <nav className="flex items-center gap-1.5 py-0.5">
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === "analytics"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("kds")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === "kds"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Live Kitchen</span>
                    {filteredOrders.length > 0 && (
                      <span className="bg-white text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                        {filteredOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("menu")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === "menu"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <Boxes className="w-4 h-4" />
                    <span>Menu &amp; Stock</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tables")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === "tables"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Tables &amp; QRs</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("staff")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === "staff"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Staff &amp; Roles</span>
                    {staffList.length > 0 && (
                      <span className="bg-slate-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                        {staffList.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === "settings"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings &amp; PIN</span>
                  </button>
                </nav>
              ) : (
                <div className="flex items-center gap-2 py-0.5">
                  <nav className="flex items-center gap-1.5">
                    {canManageOrders && (
                      <button
                        onClick={() => setActiveTab("kds")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                          activeTab === "kds"
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                        }`}
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Kitchen KDS</span>
                        {filteredOrders.length > 0 && (
                          <span className="bg-white text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                            {filteredOrders.length}
                          </span>
                        )}
                      </button>
                    )}
                    {canManageMenu && (
                      <button
                        onClick={() => setActiveTab("menu")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                          activeTab === "menu"
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                        }`}
                      >
                        <Boxes className="w-4 h-4" />
                        <span>Menu &amp; Stock</span>
                      </button>
                    )}
                    {(canManageRequests || canManageBilling) && (
                      <button
                        onClick={() => setActiveTab("tables")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                          activeTab === "tables"
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Floor Tables</span>
                        {pendingRequests.length > 0 && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5 animate-pulse">
                            {pendingRequests.length}
                          </span>
                        )}
                      </button>
                    )}
                  </nav>

                  <div className="bg-amber-950/60 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap">
                    <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>{authUser?.staffName || "Staff"} ({authUser?.staffRole?.toUpperCase() || "STAFF"})</span>
                  </div>
                </div>
              )}
            </div>
            </div>{/* end relative fade wrapper */}
          </div>
        </header>

        {/* 3. Live System Broadcast Banner */}
        {restaurant.platformSetting?.broadcastMessage && !isBroadcastDismissed && (
          <div className="bg-gradient-to-r from-orange-950 via-amber-950 to-slate-900 border-b border-orange-500/30 text-orange-200 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-400 animate-pulse shrink-0" />
              <span>
                <strong className="text-orange-400 uppercase tracking-wider mr-1.5">📢 System Broadcast:</strong>
                {restaurant.platformSetting.broadcastMessage}
              </span>
            </div>
            <button
              onClick={() => setIsBroadcastDismissed(true)}
              className="text-orange-400/80 hover:text-white p-1 rounded-md transition cursor-pointer"
              title="Dismiss Broadcast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4. Platform Maintenance Mode Alert */}
        {restaurant.platformSetting?.isMaintenance && (
          <div className="bg-amber-600 text-slate-950 px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span>🛠️ Platform Maintenance Mode is currently active across the system. Core updates in progress.</span>
          </div>
        )}

        {/* 5. Account Suspended Alert */}
        {restaurant.isActive === false && (
          <div className="bg-rose-600 text-white p-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
            <Ban className="w-3.5 h-3.5 shrink-0" />
            <span>⚠️ Account Suspended: Customer digital QR ordering is currently disabled for this restaurant. Please contact platform admin to renew subscription.</span>
          </div>
        )}

        {/* 6. Plan Expired Alert */}
        {restaurant.planExpiresAt && new Date(restaurant.planExpiresAt) < new Date() && (
          <div className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span>⚠️ Plan Expired: Subscription ended on {new Date(restaurant.planExpiresAt).toLocaleDateString()}. Please renew to avoid disruptions in digital table ordering.</span>
          </div>
        )}

        {/* 7. Real-time Waiter Calls Bar */}
        {pendingRequests.length > 0 && (
          <div className="bg-amber-500 text-slate-900 px-4 py-1.5 shadow-xs font-semibold text-xs flex items-center justify-between border-b border-amber-600">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="flex items-center gap-1 font-extrabold uppercase bg-slate-900 text-amber-400 px-2 py-0.5 rounded text-[10px] shrink-0">
                <Bell className="w-3 h-3 animate-bounce" /> ATTENTION REQUIRED:
              </span>
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="inline-flex items-center gap-2 bg-white/90 px-3 py-0.5 rounded-full text-slate-900 shadow-xs shrink-0"
                >
                  <span className="whitespace-nowrap">
                    <strong>{req.tableNumber}</strong>: {
                      req.type === "water" ? "💧 Needs Water" : 
                      req.type === "bill" ? "🧾 Requested Bill" : 
                      req.type === "cleaning" ? "🧹 Clean Table" : 
                      "🛎️ Called Waiter"
                    }
                  </span>
                  <button
                    onClick={() => handleAttendRequest(req.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer"
                  >
                    Clear ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
                  <div className="text-xl font-black text-rose-900 mt-0.5 flex items-baseline gap-1.5">
                    <span>{unpaidCount}</span>
                    <span className="text-xs font-bold text-rose-600">
                      ({restaurant?.currencySymbol || "₹"}{Math.round(unpaidTotalBalance).toLocaleString("en-IN")})
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5">Outstanding balance</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                  💵
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                <button
                  onClick={() => setKdsFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    kdsFilter === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Active ({orders.filter((o) => ["pending", "cooking", "ready"].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setKdsFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    kdsFilter === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pending ({orders.filter((o) => o.status === "pending").length})
                </button>
                <button
                  onClick={() => setKdsFilter("cooking")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    kdsFilter === "cooking" ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cooking ({orders.filter((o) => o.status === "cooking").length})
                </button>
                <button
                  onClick={() => setKdsFilter("ready")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    kdsFilter === "ready" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ready ({orders.filter((o) => o.status === "ready").length})
                </button>
                <button
                  onClick={() => setKdsFilter("served")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    kdsFilter === "served" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Served ({orders.filter((o) => o.status === "served").length})
                </button>
                <button
                  onClick={() => setKdsFilter("unpaid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    kdsFilter === "unpaid" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Unpaid ({unpaidCount} • {restaurant?.currencySymbol || "₹"}{Math.round(unpaidTotalBalance).toLocaleString("en-IN")})
                </button>
                <button
                  onClick={() => setKdsFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    kdsFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({orders.length})
                </button>
              </div>

              {/* KDS Search Input, Reset Demo Orders & Live Sync Indicator */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <div className="relative min-w-[180px] sm:min-w-[220px] flex-1 sm:flex-initial">
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {(isDemoMode || restaurant?.slug === "grand-spice" || restaurant?.id === "rest-001") && (
                  <button
                    onClick={handleResetDemoOrders}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 whitespace-nowrap cursor-pointer shrink-0"
                    title="Reload 4 active demo orders in kitchen (Pending, Cooking, Ready)"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Demo Tickets</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap pl-2 border-l border-slate-200 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Auto-sync 4s • Chime {soundEnabled ? "ON 🔔" : "MUTED"}</span>
                </div>
              </div>
            </div>

            {/* Orders Ticket Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto">
                <ChefHat className="w-14 h-14 text-orange-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-lg">No Orders in this view</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  {orders.length > 0
                    ? `You currently have ${orders.length} total orders recorded, but none matching the "${kdsFilter}" view filter.`
                    : "When a customer scans a table QR code and submits an order, it appears here in real-time!"}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  {(isDemoMode || restaurant?.slug === "grand-spice" || restaurant?.id === "rest-001") && (
                    <button
                      onClick={handleResetDemoOrders}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reload 4 Active Demo Orders</span>
                    </button>
                  )}
                  {kdsFilter !== "all" && orders.length > 0 && (
                    <button
                      onClick={() => setKdsFilter("all")}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <span>View All ({orders.length}) Orders</span>
                    </button>
                  )}
                  <a
                    href={`/r/${restaurant.slug}/t/${restaurant.tables[0]?.id || "tbl-1"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
                  >
                    <span>📱 Place a Test Order as Diner</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
                  const minutesAgo = Math.max(0, Math.floor((Date.now() - (isNaN(orderTime) ? Date.now() : orderTime)) / 60000));
                  const isCookingOrPending = order.status === "pending" || order.status === "cooking";
                  const isDelayed = isCookingOrPending && minutesAgo >= 15;
                  const isSevereDelay = isCookingOrPending && minutesAgo >= 20;

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
                      className={`bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-sm transition hover:shadow-md ${
                        isSevereDelay
                          ? "border-rose-400 ring-2 ring-rose-500/60 shadow-rose-100 bg-rose-50/10 animate-pulse"
                          : isDelayed
                          ? "border-amber-400 ring-2 ring-amber-500/50 shadow-amber-100 bg-amber-50/10 animate-pulse"
                          : config.cardBorder
                      }`}
                    >
                      {/* Delayed Alert Top Banner */}
                      {isDelayed && (
                        <div className={`-mx-5 -mt-5 mb-3 px-4 py-1.5 text-[10px] font-extrabold flex items-center justify-between rounded-t-2xl ${
                          isSevereDelay ? "bg-rose-600 text-white animate-pulse" : "bg-amber-500 text-white"
                        }`}>
                          <span>⚠️ Kitchen Delay: Order in queue for {minutesAgo} minutes!</span>
                          <span className="uppercase text-[9px] font-bold">Needs Priority</span>
                        </div>
                      )}

                      {/* Ticket Header */}
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-xl font-black text-slate-900 tracking-tight">
                              {order.tableNumber}
                            </span>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span>#{order.id.slice(-4)}</span>
                              <span>•</span>
                              <span className={`font-semibold ${isDelayed ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                                {minutesAgo <= 0 ? "Just now" : `${minutesAgo}m ago`}
                              </span>
                              {isDelayed && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  isSevereDelay ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                                }`}>
                                  <Clock className="w-3 h-3 text-rose-600" />
                                  <span>{isSevereDelay ? `🔥 Overdue ${minutesAgo}m` : `⚠️ Delayed ${minutesAgo}m`}</span>
                                </span>
                              )}
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
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-500 truncate">
                              Diner: <strong className="text-slate-800">{order.customerName || "Walk-in Guest"}</strong>
                            </span>
                            {order.customerPhone && (
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="text-[11px] font-semibold text-slate-500 hover:text-orange-600 flex items-center gap-1 mt-0.5"
                                title="Call Diner"
                              >
                                <span>📞 {order.customerPhone}</span>
                              </a>
                            )}
                          </div>
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
                                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${
                                        item.isVeg ? "bg-emerald-500" : "bg-red-500"
                                      }`}
                                    />
                                    <span>{item.name}</span>
                                    {item.variantName && (
                                      <span className="text-[10px] bg-orange-100 text-orange-800 font-extrabold px-1.5 py-0.5 rounded border border-orange-200">
                                        {item.variantName}
                                      </span>
                                    )}
                                    {item.orderedByName && (
                                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                                        👤 {item.orderedByName}
                                      </span>
                                    )}
                                  </div>
                                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                                    <div className="text-[10px] text-slate-500 font-medium pl-4 mt-0.5">
                                      + {item.selectedAddons.map((a: any) => `${a.name} (+${restaurant.currencySymbol}${a.price})`).join(", ")}
                                    </div>
                                  )}
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
                          {["served", "completed"].includes(order.status) && (
                            <button
                              type="button"
                              onClick={() => handleVacateTable(order.tableId, order.tableNumber)}
                              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition active:scale-95 flex items-center justify-center gap-1 shrink-0"
                              title="Clear table for next guest"
                            >
                              <span>🧹 Vacate</span>
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

        {/* ===================== TAB 2: BUSINESS ANALYTICS (OWNER ONLY) ===================== */}
        {isOwner && activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytics Header: Date Range Filter Bar & CSV Export Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                {[
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "this_week", label: "This Week" },
                  { id: "this_month", label: "This Month" },
                  { id: "all", label: "All Time" },
                ].map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setAnalyticsTimeRange(range.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      analyticsTimeRange === range.id
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportSalesReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                title="Download CSV sales report matching active date range"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sales CSV</span>
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(analyticsData.totalRevenue)}
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
                  {formatCurrency(analyticsData.avgOrderValue)}
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
                      <div className="text-[10px] text-slate-400">{formatCurrency(dish.revenue)} earned</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews & Diner Feedback Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-base text-slate-900">Customer Reviews &amp; Diner Feedback</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {customerReviews.length} Reviews
                </span>
              </div>

              {customerReviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No customer reviews recorded yet. Diners can rate their meal and leave feedback after dining.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerReviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-xs text-slate-900">{rev.customerName || "Diner Guest"}</span>
                            <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                              {rev.tableNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= (rev.rating || 5)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 fill-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rev.reviewFeedback && (
                          <p className="text-xs text-slate-600 italic mt-1 leading-relaxed">
                            &ldquo;{rev.reviewFeedback}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                        <span>{new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        <span>Order #{rev.id.slice(-4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: MENU & STOCK MANAGEMENT ===================== */}
        {(isOwner || canManageMenu) && activeTab === "menu" && (
          <div className="space-y-6">
            {/* Header / Filter */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-orange-600 shrink-0" />
                    <span>Menu Catalog &amp; Stock Portion Tracking (स्टॉक एवं पोर्शन नियंत्रण)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track remaining daily portions, set low stock alert thresholds, and toggle Sold Out when batches finish.
                  </p>
                </div>

                {/* Search + Owner Buttons — stack vertically on xs, row on sm+ */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search dish..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full sm:w-auto pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:bg-white"
                    />
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex-1 sm:flex-none bg-white hover:bg-orange-50 text-orange-600 border border-orange-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Manage Categories
                      </button>
                      <button
                        onClick={() => setIsAddDishOpen(true)}
                        className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-orange-600/20 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Add New Dish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  selectedCategoryFilter === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>All Dishes</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategoryFilter === "all" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                }`}>
                  {restaurant.menuItems.length}
                </span>
              </button>

              {restaurant.categories.map((cat) => {
                const count = restaurant.menuItems.filter((it) => it.categoryId === cat.id).length;
                const isSelected = selectedCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-orange-600 text-white shadow-sm shadow-orange-600/20 border-orange-600"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? "bg-orange-700 text-orange-100" : "bg-slate-100 text-slate-600"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
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
                    <th className="py-3 px-4">Stock Portions (स्टॉक)</th>
                    <th className="py-3 px-4">Live Availability</th>
                    {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {restaurant.menuItems
                    .filter((it) => {
                      const matchesSearch = it.name.toLowerCase().includes(menuSearch.toLowerCase());
                      const matchesCategory = selectedCategoryFilter === "all" || it.categoryId === selectedCategoryFilter;
                      return matchesSearch && matchesCategory;
                    })
                    .map((item) => {
                      const category = restaurant.categories.find((c) => c.id === item.categoryId);
                      const isUnlimited = item.stockCount === null || item.stockCount === undefined || item.stockCount < 0;
                      const isSoldOut = !item.isAvailable || item.stockCount === 0;
                      const isLowStock = !isUnlimited && !isSoldOut && item.stockCount !== null && item.stockCount !== undefined && item.stockCount <= (item.lowStockThreshold ?? 5);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{item.name}</span>
                                {item.variants && item.variants.length > 0 && (
                                  <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-extrabold border border-orange-200">
                                    {item.variants.length} Sizes (Half/Full)
                                  </span>
                                )}
                                {item.addons && item.addons.length > 0 && (
                                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-extrabold border border-sky-200">
                                    {item.addons.length} Extras
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                              {item.variants && item.variants.length > 0 && (
                                <div className="text-[10px] text-orange-700 font-semibold mt-0.5">
                                  🍽️ Sizes: {item.variants.map((v) => `${v.name} (₹${v.price})`).join(", ")}
                                </div>
                              )}
                              {item.addons && item.addons.length > 0 && (
                                <div className="text-[10px] text-sky-700 font-semibold">
                                  ✨ Extras: {item.addons.map((a) => `${a.name} (+₹${a.price})`).join(", ")}
                                </div>
                              )}
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

                          {/* Stock Portion Column */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {isUnlimited ? (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                                  <span>♾️ Unlimited</span>
                                </span>
                              ) : isSoldOut ? (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 font-extrabold px-2.5 py-1 rounded-lg text-[11px]">
                                  <span>🔴 Sold Out (0)</span>
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-300 font-extrabold px-2.5 py-1 rounded-lg text-[11px]">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Low: {item.stockCount} left</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                                  <span>🟢 {item.stockCount} left</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStockDish(item);
                                  setStockPortionInput(item.stockCount !== null && item.stockCount !== undefined ? item.stockCount.toString() : "-1");
                                  setStockThresholdInput((item.lowStockThreshold ?? 5).toString());
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 transition"
                                title="Adjust Daily Stock Portions"
                              >
                                <Boxes className="w-3.5 h-3.5 text-slate-600" />
                                <span>Adjust</span>
                              </button>
                            </div>
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

                          {isOwner && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditDishModal(item)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition"
                                  title={`Edit "${item.name}"`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDish(item.id, item.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title={`Delete "${item.name}"`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: INTERACTIVE FLOOR PLAN & TABLE QR STANDS [P-07] ===================== */}
        {(isOwner || canManageRequests || canManageBilling) && activeTab === "tables" && (
          <div className="space-y-6">
            {/* Top Navigation & View Mode Toggle */}
            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">Interactive Floor Plan & Tables</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Real-time occupancy status, table order tracking, service alerts & tent cards.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTablesViewMode("floor")}
                    className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                      tablesViewMode === "floor"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
                    <span>Live Floor Grid (फ्लोर प्लान)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTablesViewMode("cards")}
                    className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                      tablesViewMode === "cards"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-slate-600" />
                    <span>QR Tent Cards (प्रिंट स्टैंड)</span>
                  </button>
                </div>

                {isOwner && (
                  <button
                    onClick={() => setIsAddTableOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-orange-600/20"
                  >
                    <Plus className="w-4 h-4" /> Add Table
                  </button>
                )}

                {tablesViewMode === "cards" && (
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition active:scale-95"
                  >
                    <Printer className="w-4 h-4" /> Print All Tent Cards
                  </button>
                )}
              </div>
            </div>

            {(() => {
              // Compute live metrics across all tables
              let vacantCount = 0;
              let diningCount = 0;
              let billPendingCount = 0;
              let alertCount = 0;
              let totalUnpaidAmount = 0;
              let totalSeats = 0;

              const tableStatusMap = new Map<string, any>();

              restaurant.tables.forEach((table) => {
                totalSeats += table.seats || 4;
                const cleanNum = table.tableNumber.replace(/\D/g, "");

                const activeOrders = orders.filter((o) => {
                  const matches = (
                    o.tableId === table.id ||
                    o.tableNumber.toLowerCase() === table.tableNumber.toLowerCase() ||
                    (cleanNum && o.tableNumber.toLowerCase().includes(cleanNum))
                  );
                  return matches && o.status !== "completed" && o.status !== "cancelled";
                });

                const serviceReqs = serviceRequests.filter((r) => {
                  const matches = (
                    r.tableId === table.id ||
                    r.tableNumber.toLowerCase() === table.tableNumber.toLowerCase() ||
                    (cleanNum && r.tableNumber.toLowerCase().includes(cleanNum))
                  );
                  return matches && r.status === "pending";
                });

                const hasAlert = serviceReqs.length > 0;
                const isOccupied = activeOrders.length > 0;
                const hasUnpaid = activeOrders.some((o) => o.paymentStatus !== "paid");
                const isAllServed = isOccupied && activeOrders.every((o) => o.status === "served");
                const isBillPending = hasUnpaid && (isAllServed || serviceReqs.some((r) => r.type === "bill"));
                const isDining = isOccupied && !isBillPending;
                const isVacant = !isOccupied && !hasAlert;
                const totalActiveAmount = activeOrders.reduce((sum, o) => sum + o.total, 0);

                if (hasAlert) alertCount++;
                if (isBillPending) billPendingCount++;
                else if (isDining) diningCount++;
                else if (isVacant) vacantCount++;

                activeOrders.forEach((o) => {
                  if (o.paymentStatus !== "paid") totalUnpaidAmount += o.total;
                });

                const firstOrder = activeOrders[0];
                tableStatusMap.set(table.id, {
                  activeOrders,
                  serviceReqs,
                  hasAlert,
                  isOccupied,
                  hasUnpaid,
                  isAllServed,
                  isBillPending,
                  isDining,
                  isVacant,
                  totalActiveAmount,
                  dinerName: firstOrder?.customerName,
                  earliestOrderTime: firstOrder?.createdAt,
                });
              });

              // Filter tables by search query and category pill
              const filteredTables = restaurant.tables.filter((t) => {
                const info = tableStatusMap.get(t.id);
                if (!info) return true;

                // Search query match
                if (tablesSearchQuery.trim()) {
                  const q = tablesSearchQuery.trim().toLowerCase();
                  const matchesNum = t.tableNumber.toLowerCase().includes(q);
                  const matchesDiner = info.dinerName?.toLowerCase().includes(q);
                  if (!matchesNum && !matchesDiner) return false;
                }

                // Status pill filter
                if (tablesFilter === "vacant") return info.isVacant;
                if (tablesFilter === "dining") return info.isDining;
                if (tablesFilter === "bill") return info.isBillPending;
                if (tablesFilter === "alert") return info.hasAlert;
                return true;
              });

              return (
                <div className="space-y-6">
                  {/* Floor Plan Mode */}
                  {tablesViewMode === "floor" && (
                    <>
                      {/* Top KPI Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {/* 1. All Tables */}
                        <button
                          type="button"
                          onClick={() => setTablesFilter("all")}
                          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                            tablesFilter === "all"
                              ? "bg-slate-900 border-slate-900 text-white shadow-md"
                              : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Tables</span>
                            <span className="text-sm">🏢</span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{restaurant.tables.length}</span>
                            <span className={`text-[10px] font-semibold ${tablesFilter === "all" ? "text-slate-300" : "text-slate-500"}`}>
                              ({totalSeats} Seats)
                            </span>
                          </div>
                        </button>

                        {/* 2. Vacant Tables */}
                        <button
                          type="button"
                          onClick={() => setTablesFilter("vacant")}
                          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                            tablesFilter === "vacant"
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                              : "bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Vacant (खाली)</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                          </div>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{vacantCount}</span>
                            <span className="text-[10px] font-semibold opacity-80">Ready for walk-ins</span>
                          </div>
                        </button>

                        {/* 3. Dining / Cooking */}
                        <button
                          type="button"
                          onClick={() => setTablesFilter("dining")}
                          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                            tablesFilter === "dining"
                              ? "bg-rose-600 border-rose-600 text-white shadow-md"
                              : "bg-rose-50/60 border-rose-200 text-rose-900 hover:border-rose-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Dining (व्यस्त)</span>
                            <span className="text-sm">👨‍🍳</span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{diningCount}</span>
                            <span className="text-[10px] font-semibold opacity-80">Orders in progress</span>
                          </div>
                        </button>

                        {/* 4. Bill Pending */}
                        <button
                          type="button"
                          onClick={() => setTablesFilter("bill")}
                          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                            tablesFilter === "bill"
                              ? "bg-amber-600 border-amber-600 text-white shadow-md"
                              : "bg-amber-50/60 border-amber-200 text-amber-900 hover:border-amber-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Bill Pending (बिल)</span>
                            <span className="text-sm">🧾</span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{billPendingCount}</span>
                            <span className="text-[10px] font-semibold opacity-80">{restaurant.currencySymbol}{totalUnpaidAmount}</span>
                          </div>
                        </button>

                        {/* 5. Service Alerts */}
                        <button
                          type="button"
                          onClick={() => setTablesFilter("alert")}
                          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between col-span-2 sm:col-span-1 ${
                            tablesFilter === "alert"
                              ? "bg-sky-600 border-sky-600 text-white shadow-md"
                              : alertCount > 0
                              ? "bg-sky-50 border-sky-300 text-sky-900 ring-2 ring-sky-300 animate-pulse"
                              : "bg-sky-50/40 border-sky-200 text-sky-900 hover:border-sky-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Alerts (सहायता)</span>
                            <span className="text-sm">🛎️</span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{alertCount}</span>
                            <span className="text-[10px] font-semibold opacity-80">{alertCount > 0 ? "Calls pending" : "No active calls"}</span>
                          </div>
                        </button>
                      </div>

                      {/* Filter Pills & Live Search Bar */}
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTablesFilter("all")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              tablesFilter === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            All Tables ({restaurant.tables.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTablesFilter("vacant")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              tablesFilter === "vacant" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Vacant ({vacantCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTablesFilter("dining")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              tablesFilter === "dining" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Dining ({diningCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTablesFilter("bill")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              tablesFilter === "bill" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Bill Pending ({billPendingCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTablesFilter("alert")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              tablesFilter === "alert" ? "bg-sky-600 text-white shadow-xs" : "bg-sky-50 text-sky-800 hover:bg-sky-100"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            <span>Service Calls ({alertCount})</span>
                          </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[200px]">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search Table # or Diner..."
                            value={tablesSearchQuery}
                            onChange={(e) => setTablesSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-medium"
                          />
                          {tablesSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setTablesSearchQuery("")}
                              className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Floor Plan Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {filteredTables.map((table) => {
                          const info = tableStatusMap.get(table.id);
                          const dinerUrl = `/r/${restaurant.slug}/t/${table.id}`;

                          let cardBorder = "border-slate-200 bg-white";
                          let statusLabel = "🟢 Vacant / Free (खाली)";
                          let statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";

                          if (info.hasAlert) {
                            cardBorder = "border-sky-400 bg-gradient-to-b from-sky-50/60 to-white ring-2 ring-sky-300/60 shadow-md";
                            statusLabel = "🔵 Service Alert (सहायता)";
                            statusBadge = "bg-sky-100 text-sky-900 border-sky-300 animate-pulse";
                          } else if (info.isBillPending) {
                            cardBorder = "border-amber-400 bg-gradient-to-b from-amber-50/60 to-white ring-2 ring-amber-300/60 shadow-md";
                            statusLabel = `🟡 Bill Pending (${restaurant.currencySymbol}${info.totalActiveAmount})`;
                            statusBadge = "bg-amber-100 text-amber-900 border-amber-300";
                          } else if (info.isDining) {
                            cardBorder = "border-rose-300 bg-gradient-to-b from-rose-50/40 to-white shadow-sm";
                            statusLabel = `🔴 Dining (${info.activeOrders.length} order)`;
                            statusBadge = "bg-rose-50 text-rose-800 border-rose-200";
                          }

                          return (
                            <div
                              key={table.id}
                              className={`rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${cardBorder} relative overflow-hidden group hover:shadow-lg`}
                            >
                              {/* Top Row: Table Name, Seats, and Status Badge */}
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                      {table.tableNumber}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        <Users className="w-3 h-3 text-slate-400" />
                                        {table.seats || 4} Seats
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${statusBadge}`}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                </div>

                                {/* Active Service Alerts for Table */}
                                {info.serviceReqs.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {info.serviceReqs.map((req: any) => (
                                      <div
                                        key={req.id}
                                        className="bg-sky-100 border border-sky-300 text-sky-950 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-pulse"
                                      >
                                        <span className="flex items-center gap-1.5">
                                          {req.type === "water" ? "💧 Needs Water (पानी)" :
                                           req.type === "bill" ? "🧾 Bill Requested (बिल)" :
                                           req.type === "cleaning" ? "🧹 Clean Table (सफ़ाई)" :
                                           "🛎️ Called Waiter (वेटर)"}
                                        </span>
                                        {(canManageRequests || canManageBilling) && (
                                          <button
                                            type="button"
                                            onClick={() => handleAttendRequest(req.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs cursor-pointer transition active:scale-95"
                                          >
                                            Clear ✓
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Occupied Table Dining Info */}
                                {info.isOccupied ? (
                                  <div className="mt-3.5 p-3 rounded-2xl bg-white/90 border border-slate-100 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-800 flex items-center gap-1 truncate max-w-[140px]">
                                        <Users className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                        {info.dinerName || "Dining Guests"}
                                      </span>
                                      <span className="font-extrabold text-orange-600 text-sm">
                                        {restaurant.currencySymbol}{info.totalActiveAmount}
                                      </span>
                                    </div>

                                    {/* Order items count & elapsed time */}
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                      <span>
                                        {info.activeOrders.reduce((sum: number, o: any) => sum + o.items.length, 0)} Items Ordered
                                      </span>
                                      {info.earliestOrderTime && (
                                        <span className="flex items-center gap-1 text-slate-400">
                                          <Clock className="w-3 h-3" />
                                          {Math.max(1, Math.round((Date.now() - new Date(info.earliestOrderTime).getTime()) / 60000))}m ago
                                        </span>
                                      )}
                                    </div>

                                    {/* Recent Item Names Peek */}
                                    <div className="text-[10px] text-slate-600 font-medium truncate pt-1 border-t border-slate-50">
                                      {info.activeOrders.flatMap((o: any) => o.items.map((it: any) => it.name)).slice(0, 3).join(", ")}
                                      {info.activeOrders.flatMap((o: any) => o.items).length > 3 ? "..." : ""}
                                    </div>
                                  </div>
                                ) : (
                                  /* Vacant Table Friendly State */
                                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 flex flex-col items-center justify-center text-center text-xs">
                                    <span className="text-xl">✨</span>
                                    <span className="font-bold text-emerald-800 mt-1">Clean & Sanitized</span>
                                    <span className="text-[11px] text-emerald-600/80 mt-0.5">Ready for next walk-in guests</span>
                                  </div>
                                )}
                              </div>

                              {/* Card Action Footer */}
                              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                                {info.isOccupied ? (
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {/* Vacate Table */}
                                    <button
                                      type="button"
                                      onClick={() => handleVacateTable(table.id, table.tableNumber)}
                                      className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold shadow-xs transition active:scale-95 flex items-center justify-center gap-1"
                                      title="Vacate and reset table for next guest"
                                    >
                                      <span>🧹 Vacate</span>
                                    </button>

                                    {/* View KOT / Bill */}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedKotOrder(info.activeOrders[0])}
                                      className="py-1.5 px-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold shadow-xs transition active:scale-95 flex items-center justify-center gap-1"
                                      title="Print or view KOT order slip"
                                    >
                                      <Receipt className="w-3 h-3 text-orange-400" />
                                      <span>Bill/KOT</span>
                                    </button>

                                    {/* Shift Table */}
                                    <button
                                      type="button"
                                      onClick={() => setShiftingTable({ fromTableId: table.id, fromTableNumber: table.tableNumber, orderId: info.activeOrders[0].id })}
                                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition active:scale-95 flex items-center justify-center gap-1"
                                      title="Transfer this order to another table"
                                    >
                                      <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                                      <span>Shift</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <a
                                      href={dinerUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>Test QR Link</span>
                                    </a>

                                    <div className="flex items-center gap-1">
                                      {isOwner && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditTable(table)}
                                            className="text-slate-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-50 transition"
                                            title={`Edit ${table.tableNumber}`}
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                                            title={`Delete ${table.tableNumber}`}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {filteredTables.length === 0 && (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                          <span className="text-3xl">🔍</span>
                          <h4 className="text-sm font-bold text-slate-900">No tables match your filter</h4>
                          <p className="text-xs text-slate-400">Try selecting a different filter pill or clear your search query.</p>
                          <button
                            type="button"
                            onClick={() => { setTablesFilter("all"); setTablesSearchQuery(""); }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                          >
                            Show All Tables
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* QR Tent Cards Printable View */}
                  {tablesViewMode === "cards" && (
                    <div id="printable-qr-grid" className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${selectedKotOrder ? "no-print" : ""}`}>
                      {restaurant.tables.map((table) => {
                        const qrImage = tableQRs[table.id];
                        const dinerUrl = `/r/${restaurant.slug}/t/${table.id}`;

                        const cleanNum = table.tableNumber.replace(/\D/g, "");
                        const activeOrders = orders.filter((o) => {
                          const matches = (
                            o.tableId === table.id ||
                            o.tableNumber.toLowerCase() === table.tableNumber.toLowerCase() ||
                            (cleanNum && o.tableNumber.toLowerCase().includes(cleanNum))
                          );
                          return matches && o.status !== "completed" && o.status !== "cancelled";
                        });

                        const isOccupied = activeOrders.length > 0;
                        const hasUnpaid = activeOrders.some((o) => o.paymentStatus !== "paid");
                        const isAllServed = isOccupied && activeOrders.every((o) => o.status === "served");
                        const totalActiveAmount = activeOrders.reduce((sum, o) => sum + o.total, 0);

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
                              <div className="flex items-center justify-center gap-1.5 mt-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  {table.seats || 4} Seats
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">Scan to View Menu &amp; Order</p>
                            </div>

                            {/* Live Table Status Badge & Vacate Action */}
                            <div className="no-print my-2 flex flex-col items-center gap-1.5 w-full">
                              {!isOccupied ? (
                                <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                  <span>Vacant / Free (साफ़ टेबल)</span>
                                </span>
                              ) : (
                                <div className="w-full flex flex-col items-center gap-1.5">
                                  <span
                                    className={`text-[11px] font-black px-3 py-1 rounded-full border flex items-center gap-1 ${
                                      !hasUnpaid
                                        ? "bg-purple-50 text-purple-800 border-purple-200"
                                        : isAllServed
                                        ? "bg-rose-50 text-rose-800 border-rose-300 animate-pulse"
                                        : "bg-orange-50 text-orange-800 border-orange-200"
                                    }`}
                                  >
                                    {!hasUnpaid
                                      ? "🟣 Bill Paid (Ready to Vacate)"
                                      : isAllServed
                                      ? `🔴 Bill Pending (${restaurant.currencySymbol}${totalActiveAmount})`
                                      : `🟡 Dining (${activeOrders.length} active order)`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleVacateTable(table.id, table.tableNumber)}
                                    className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center justify-center gap-1"
                                    title="Vacate and reset table for next guest"
                                  >
                                    <span>🧹 Vacate Table (टेबल खाली करें)</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Live Table Service Calls for this Table */}
                            {(() => {
                              const tableServiceReqs = serviceRequests.filter((r) => {
                                const matches = (
                                  r.tableId === table.id ||
                                  r.tableNumber.toLowerCase() === table.tableNumber.toLowerCase() ||
                                  (cleanNum && r.tableNumber.toLowerCase().includes(cleanNum))
                                );
                                return matches && r.status === "pending";
                              });
                              if (tableServiceReqs.length === 0) return null;
                              return (
                                <div className="no-print my-1.5 w-full space-y-1">
                                  {tableServiceReqs.map((req) => (
                                    <div
                                      key={req.id}
                                      className="bg-amber-100 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-pulse"
                                    >
                                      <span className="flex items-center gap-1">
                                        {req.type === "water" ? "💧 Needs Water" :
                                         req.type === "bill" ? "🧾 Bill Requested" :
                                         req.type === "cleaning" ? "🧹 Clean Table" :
                                         "🛎️ Called Waiter"}
                                      </span>
                                      {(canManageRequests || canManageBilling) && (
                                        <button
                                          type="button"
                                          onClick={() => handleAttendRequest(req.id)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs cursor-pointer"
                                        >
                                          Clear ✓
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}

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

                                {isOwner && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTable(table)}
                                      className="text-slate-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-50 transition"
                                      title={`Edit ${table.tableNumber}`}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                                      title={`Delete ${table.tableNumber}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ===================== TAB 5: STAFF & ROLE DELEGATION (OWNER ONLY) ===================== */}
        {isOwner && activeTab === "staff" && (
          <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  <span>Staff &amp; Role Delegation (स्टाफ़ प्रबंधन एवं अधिकार)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add staff members, assign individual 4-digit PINs, toggle online access, and configure who manages kitchen, orders, menu stock, or billing.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsAddStaffOpen(true);
                  setStaffMsg(null);
                  handleRolePresetChange("waiter");
                  generateRandomPin();
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-orange-600/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </div>

            {/* Visual Feedback Toast */}
            {staffToast && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 border ${
                  staffToast.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{staffToast.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStaffToast(null)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
                  <Users className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{staffList.length}</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Registered team members</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Active Online</span>
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {staffList.filter((s) => s.isActive).length}
                </div>
                <p className="text-[10px] text-emerald-600 mt-0.5">Enabled for login</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Chefs (Kitchen)</span>
                  <ChefHat className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {staffList.filter((s) => s.role === "chef").length}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Kitchen staff</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Service &amp; Billing</span>
                  <CreditCard className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-2xl font-black text-sky-600">
                  {staffList.filter((s) => ["waiter", "cashier", "manager"].includes(s.role)).length}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Waiters &amp; Cashiers</p>
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {isStaffLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                  <span>Loading team directory...</span>
                </div>
              ) : staffList.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">No individual staff members added yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Your team is currently using the restaurant default PIN ({(restaurant as any).staffPin || "1234"}). Add staff members to give individual roles, PINs, and granular rights!
                  </p>
                  <button
                    onClick={() => {
                      setIsAddStaffOpen(true);
                      setStaffMsg(null);
                      handleRolePresetChange("waiter");
                      generateRandomPin();
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
                  >
                    + Add First Staff Member
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Online Status (लॉगिन स्थिति)</th>
                        <th className="py-3 px-4">Quick PIN</th>
                        <th className="py-3 px-4">Delegated Rights (कार्य अधिकार एवं अनुमतियाँ)</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {staffList.map((st) => {
                        const isRevealed = revealedPins[st.id];
                        const roleColor = 
                          st.role === "chef" ? "bg-amber-100 text-amber-800 border-amber-200" :
                          st.role === "manager" ? "bg-purple-100 text-purple-800 border-purple-200" :
                          st.role === "cashier" ? "bg-sky-100 text-sky-800 border-sky-200" :
                          "bg-emerald-100 text-emerald-800 border-emerald-200";

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{st.name}</div>
                              {st.phone && <div className="text-[11px] text-slate-400">{st.phone}</div>}
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] border capitalize ${roleColor}`}>
                                {st.role === "chef" && "👨‍🍳 Chef"}
                                {st.role === "waiter" && "🤵 Waiter"}
                                {st.role === "cashier" && "💳 Cashier"}
                                {st.role === "manager" && "👔 Manager"}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleStaffActive(st.id, st.isActive, st.name)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 border ${
                                  st.isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                }`}
                                title="Click to toggle online active status"
                              >
                                <span className={`w-2 h-2 rounded-full ${st.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                                <span>{st.isActive ? "Online Active" : "Disabled Offline"}</span>
                              </button>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                  {isRevealed ? st.pin : "••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setRevealedPins((prev) => ({ ...prev, [st.id]: !prev[st.id] }))}
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                                  title={isRevealed ? "Hide PIN" : "Reveal PIN"}
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffPermission(st.id, "canManageOrders", st.canManageOrders)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                    st.canManageOrders
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                                      : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/60"
                                  }`}
                                  title="Click to toggle Orders / Kitchen KDS permission"
                                >
                                  🍳 Orders / KDS
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffPermission(st.id, "canManageMenu", st.canManageMenu)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                    st.canManageMenu
                                      ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs"
                                      : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/60"
                                  }`}
                                  title="Click to toggle Menu & Stock Portions permission"
                                >
                                  📋 Menu &amp; Stock
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffPermission(st.id, "canManageBilling", st.canManageBilling)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                    st.canManageBilling
                                      ? "bg-sky-50 text-sky-800 border-sky-300 shadow-xs"
                                      : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/60"
                                  }`}
                                  title="Click to toggle Billing & Payment Clearance permission"
                                >
                                  💳 Billing / Paid
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffPermission(st.id, "canManageRequests", st.canManageRequests)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                    st.canManageRequests
                                      ? "bg-purple-50 text-purple-800 border-purple-300 shadow-xs"
                                      : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/60"
                                  }`}
                                  title="Click to toggle Table Calls & Requests permission"
                                >
                                  🔔 Table Calls
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStaff(st);
                                    setEditStaffName(st.name);
                                    setEditStaffRole(st.role as "waiter" | "chef" | "cashier" | "manager");
                                    setEditStaffPin(st.pin);
                                    setEditStaffPhone(st.phone || "");
                                    setEditStaffIsActive(st.isActive);
                                    setEditStaffOrders(st.canManageOrders);
                                    setEditStaffMenu(st.canManageMenu);
                                    setEditStaffBilling(st.canManageBilling);
                                    setEditStaffRequests(st.canManageRequests);
                                    setEditStaffError(null);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                                  title={`Edit "${st.name}"`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaff(st.id, st.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title={`Remove "${st.name}"`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 6: SETTINGS (OWNER ONLY) ===================== */}
        {isOwner && activeTab === "settings" && (
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

                {/* Live Diner UPI QR Preview */}
                {settingsUpi.trim() ? (
                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                      {upiPreviewQr ? (
                        <img
                          src={upiPreviewQr}
                          alt={`UPI QR for ${settingsUpi.trim()}`}
                          className="w-28 h-28 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-28 h-28 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                          Generating UPI QR...
                        </div>
                      )}
                    </div>
                    <div className="text-left space-y-1 w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Diner UPI Preview
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-800">{settingsUpi.trim()}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        This is the live QR code diners scan to pay directly at the table. Fully compatible with Google Pay, PhonePe, Paytm, BHIM, and bank UPI apps.
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 break-all bg-white p-1.5 rounded border border-slate-100">
                        upi://pay?pa={settingsUpi.trim()}&amp;pn={encodeURIComponent(settingsName || restaurant?.name || "Restaurant")}&amp;cu=INR
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Enter a valid UPI ID (e.g. <code>restaurant@icici</code>) above to enable table payments and view the diner QR preview.</span>
                  </div>
                )}
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
                    Update your owner password, email, and staff 4-digit PIN stored securely in Cloud PostgreSQL.
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
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                      🔒 Staff members who sign in with this 4-digit PIN can ONLY view live kitchen orders and table requests. They CANNOT see your sales revenue, customer ratings, change prices, or access these settings.
                    </p>
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
                <div>
                  <div>Diner: {selectedKotOrder.customerName || "Walk-in Guest"}</div>
                  {selectedKotOrder.customerPhone && (
                    <div className="text-[10px] font-mono text-slate-700 mt-0.5">
                      Phone: {selectedKotOrder.customerPhone}
                    </div>
                  )}
                </div>
                <span className="font-bold uppercase text-slate-900 self-center">
                  {selectedKotOrder.paymentStatus === "paid" ? "PAID" : "UNPAID"} ({selectedKotOrder.paymentMethod?.replace("_", " ")})
                </span>
              </div>

              <div className="space-y-1.5 py-1">
                {selectedKotOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <div>
                      <span className="font-extrabold">{it.quantity}x</span> {it.name}
                      {it.variantName && (
                        <span className="ml-1 text-[11px] font-bold text-orange-600 uppercase">
                          [{it.variantName}]
                        </span>
                      )}
                      {it.orderedByName && (
                        <span className="ml-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-200">
                          (Diner: {it.orderedByName})
                        </span>
                      )}
                      {it.selectedAddons && it.selectedAddons.length > 0 && (
                        <div className="text-[10px] text-slate-500 pl-4">
                          + {it.selectedAddons.map((a: any) => `${a.name} (+${restaurant.currencySymbol}${a.price})`).join(", ")}
                        </div>
                      )}
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
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Daily Portion Limit</label>
                  <input
                    type="number"
                    placeholder="-1 for Unlimited"
                    value={newDishStock}
                    onChange={(e) => setNewDishStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">-1 = Unlimited, &ge;0 = Portions</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={newDishLowThreshold}
                    onChange={(e) => setNewDishLowThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Alert badge when &le; threshold</p>
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

              {/* Portion Sizes (Half / Full Plate) */}
              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>🍽️</span>
                    <span>Portion Sizes (Half / Full Plate - Optional)</span>
                  </label>
                  <span className="text-[10px] text-orange-600 font-bold">{newDishVariants.length} Added</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Size (e.g. Half Plate)"
                    value={variantInputName}
                    onChange={(e) => setVariantInputName(e.target.value)}
                    className="flex-1 min-w-[120px] bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={variantInputPrice}
                    onChange={(e) => setVariantInputPrice(e.target.value)}
                    className="w-20 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (variantInputName.trim() && variantInputPrice) {
                        setNewDishVariants((prev) => [
                          ...prev,
                          { name: variantInputName.trim(), price: Number(variantInputPrice) },
                        ]);
                        setVariantInputName("");
                        setVariantInputPrice("");
                      }
                    }}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs whitespace-nowrap"
                  >
                    + Add Size
                  </button>
                </div>
                {newDishVariants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {newDishVariants.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-slate-800 border border-orange-200 shadow-2xs"
                      >
                        <span>{v.name}: {restaurant.currencySymbol}{v.price}</span>
                        <button
                          type="button"
                          onClick={() => setNewDishVariants((prev) => prev.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 font-black"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add-ons / Extras (Extra Cheese, Dip) */}
              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Add-ons / Extras (Extra Cheese, Dip - Optional)</span>
                  </label>
                  <span className="text-[10px] text-sky-600 font-bold">{newDishAddons.length} Added</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Add-on (e.g. Extra Cheese)"
                    value={addonInputName}
                    onChange={(e) => setAddonInputName(e.target.value)}
                    className="flex-1 min-w-[120px] bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="+Price (₹)"
                    value={addonInputPrice}
                    onChange={(e) => setAddonInputPrice(e.target.value)}
                    className="w-20 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (addonInputName.trim() && addonInputPrice) {
                        setNewDishAddons((prev) => [
                          ...prev,
                          { name: addonInputName.trim(), price: Number(addonInputPrice) },
                        ]);
                        setAddonInputName("");
                        setAddonInputPrice("");
                      }
                    }}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs whitespace-nowrap"
                  >
                    + Add Extra
                  </button>
                </div>
                {newDishAddons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {newDishAddons.map((a, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-slate-800 border border-sky-200 shadow-2xs"
                      >
                        <span>{a.name}: +{restaurant.currencySymbol}{a.price}</span>
                        <button
                          type="button"
                          onClick={() => setNewDishAddons((prev) => prev.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 font-black"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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

      {/* ===================== MODAL: EDIT DISH ===================== */}
      {editingDish && restaurant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Food Dish</h3>
                <p className="text-[11px] text-slate-400">Update pricing, category, portion stock &amp; variants</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditDishSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tandoori Soya Chaap"
                  value={editDishName}
                  onChange={(e) => setEditDishName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ({restaurant.currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    placeholder="250"
                    value={editDishPrice}
                    onChange={(e) => setEditDishPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editDishCategory}
                    onChange={(e) => setEditDishCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
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
                <label className="block font-bold text-slate-700 mb-1">Dietary Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDishIsVeg(true)}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                      editDishIsVeg
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>🟢 Veg (शाकाहारी)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDishIsVeg(false)}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                      !editDishIsVeg
                        ? "bg-red-50 border-red-500 text-red-800"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>🔴 Non-Veg (माँसाहारी)</span>
                  </button>
                </div>
              </div>

              {/* Stock Management */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Portions</label>
                  <input
                    type="number"
                    placeholder="-1 for unlimited"
                    value={editDishStock}
                    onChange={(e) => setEditDishStock(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">-1 = Unlimited</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    min={1}
                    value={editDishLowThreshold}
                    onChange={(e) => setEditDishLowThreshold(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Threshold</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Freshly prepared with authentic whole spices..."
                  value={editDishDesc}
                  onChange={(e) => setEditDishDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Portion Sizes / Variants */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                <label className="block font-bold text-slate-800 mb-1">Portion Sizes / Variants (Half/Full)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Size (e.g. Half, Full)"
                    value={editVariantInputName}
                    onChange={(e) => setEditVariantInputName(e.target.value)}
                    className="flex-1 min-w-[120px] bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={editVariantInputPrice}
                    onChange={(e) => setEditVariantInputPrice(e.target.value)}
                    className="w-20 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editVariantInputName.trim() && editVariantInputPrice) {
                        setEditDishVariants([
                          ...editDishVariants,
                          { id: `v-${Date.now()}`, name: editVariantInputName.trim(), price: Number(editVariantInputPrice) },
                        ]);
                        setEditVariantInputName("");
                        setEditVariantInputPrice("");
                      }
                    }}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 whitespace-nowrap"
                  >
                    + Add Size
                  </button>
                </div>
                {editDishVariants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editDishVariants.map((v, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-900 text-[11px] font-bold border border-orange-200">
                        {v.name} ({restaurant.currencySymbol}{v.price})
                        <button
                          type="button"
                          onClick={() => setEditDishVariants(editDishVariants.filter((_, idx) => idx !== i))}
                          className="hover:text-red-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Addons */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                <label className="block font-bold text-slate-800 mb-1">Add-ons / Extras (Extra Cheese, Dips)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Addon (e.g. Extra Cheese)"
                    value={editAddonInputName}
                    onChange={(e) => setEditAddonInputName(e.target.value)}
                    className="flex-1 min-w-[120px] bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Extra ₹"
                    value={editAddonInputPrice}
                    onChange={(e) => setEditAddonInputPrice(e.target.value)}
                    className="w-20 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editAddonInputName.trim() && editAddonInputPrice) {
                        setEditDishAddons([
                          ...editDishAddons,
                          { id: `a-${Date.now()}`, name: editAddonInputName.trim(), price: Number(editAddonInputPrice) },
                        ]);
                        setEditAddonInputName("");
                        setEditAddonInputPrice("");
                      }
                    }}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-xl font-bold text-xs hover:bg-sky-700 whitespace-nowrap"
                  >
                    + Add Extra
                  </button>
                </div>
                {editDishAddons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editDishAddons.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 text-[11px] font-bold border border-sky-200">
                        {a.name} (+{restaurant.currencySymbol}{a.price})
                        <button
                          type="button"
                          onClick={() => setEditDishAddons(editDishAddons.filter((_, idx) => idx !== i))}
                          className="hover:text-red-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editDishImage}
                  onChange={(e) => setEditDishImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditDish}
                  className="px-5 py-2 bg-orange-600 text-white rounded-xl font-bold shadow hover:bg-orange-700 disabled:opacity-50 transition"
                >
                  {isSubmittingEditDish ? "Saving Changes..." : "Save Dish Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MANAGE CATEGORIES ===================== */}
      {isCategoryModalOpen && restaurant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Manage Menu Categories</h3>
                <p className="text-[11px] text-slate-400">Add, organize, or remove menu sections</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create New Category Form */}
            <form onSubmit={handleAddCategorySubmit} className="space-y-3.5 mb-6 p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80">
              <h4 className="font-bold text-xs text-orange-950 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-orange-600" />
                <span>Add New Category</span>
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Pick an Icon</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-orange-200 max-h-24 overflow-y-auto">
                  {CATEGORY_ICONS_PRESET.map((icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewCategoryIcon(icon)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                        newCategoryIcon === icon
                          ? "bg-orange-500 text-white scale-110 shadow-xs"
                          : "hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Name *</label>
                <div className="flex gap-2">
                  <span className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-base shrink-0 shadow-xs">
                    {newCategoryIcon}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Woodfired Pizzas, Desserts"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingCategory}
                    className="px-3.5 py-1.5 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 disabled:opacity-50 shrink-0"
                  >
                    {isSubmittingCategory ? "Adding..." : "+ Create"}
                  </button>
                </div>
              </div>
            </form>

            {/* Existing Categories Directory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Current Categories ({restaurant.categories.length})</span>
                <span className="text-[10px] text-slate-400">Total dishes assigned</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {restaurant.categories.map((cat) => {
                  const dishCount = restaurant.menuItems.filter((it) => it.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{cat.icon}</span>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{cat.name}</div>
                          <div className="text-[10px] text-slate-400">{dishCount} dishes in this category</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={`Delete category "${cat.name}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
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

      {/* ===================== MODAL: EDIT TABLE ===================== */}
      {editingTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Table Details</h3>
                <p className="text-[11px] text-slate-400">Update table name &amp; seating capacity</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditTableSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Table Name / Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rooftop VIP, Booth 3, Table 5"
                  value={editTableNum}
                  onChange={(e) => setEditTableNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editTableSeats}
                  onChange={(e) => setEditTableSeats(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTable}
                  className="px-5 py-2 bg-orange-600 text-white rounded-xl font-bold shadow hover:bg-orange-700 disabled:opacity-50 transition"
                >
                  {isUpdatingTable ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: KITCHEN STAFF QUICK STOCK TOGGLE ===================== */}
      {isStaffStockModalOpen && restaurant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Kitchen Dish Availability</h3>
                  <p className="text-[11px] text-slate-400">Toggle Sold Out for finished dishes. Diners cannot order unavailable items.</p>
                </div>
              </div>
              <button
                onClick={() => setIsStaffStockModalOpen(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Dishes */}
            <div className="relative mb-3 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search dishes (e.g. Paneer, Biryani, Naan)..."
                value={stockModalSearch}
                onChange={(e) => setStockModalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Dishes List */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {restaurant.menuItems
                .filter((item) =>
                  stockModalSearch.trim() === "" ||
                  item.name.toLowerCase().includes(stockModalSearch.toLowerCase().trim())
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      item.isAvailable
                        ? "bg-slate-50 border-slate-200"
                        : "bg-rose-50/60 border-rose-200 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          item.isVeg ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <div className="truncate">
                        <span className={`text-xs font-bold block truncate ${!item.isAvailable ? "line-through text-slate-500" : "text-slate-900"}`}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {restaurant.categories.find((c) => c.id === item.categoryId)?.name || "Dish"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 ${
                        item.isAvailable
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-rose-600 hover:bg-rose-700 text-white"
                      }`}
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5" />
                          <span>Sold Out</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 text-[11px] text-slate-400 shrink-0">
              <span>Prices and dish modifications require Owner login.</span>
              <button
                type="button"
                onClick={() => setIsStaffStockModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD NEW STAFF MEMBER ===================== */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add Staff Member (नया स्टाफ़ सदस्य)</h3>
                  <p className="text-[11px] text-slate-400">Assign role, 4-digit PIN, online status, and delegated responsibilities.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {staffMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  staffMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                <span>{staffMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Staff Member Name * (नाम)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar / Chef Vikram"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Role Selection Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Role Selection (भूमिका चुनें)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRolePresetChange("waiter")}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      newStaffRole === "waiter"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-extrabold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <span className="text-lg">🤵</span>
                    <span className="text-xs">Waiter</span>
                    <span className="text-[10px] text-slate-400">Floor &amp; Calls</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePresetChange("chef")}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      newStaffRole === "chef"
                        ? "bg-amber-50 border-amber-500 text-amber-900 font-extrabold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <span className="text-lg">👨‍🍳</span>
                    <span className="text-xs">Chef</span>
                    <span className="text-[10px] text-slate-400">Kitchen &amp; Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePresetChange("cashier")}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      newStaffRole === "cashier"
                        ? "bg-sky-50 border-sky-500 text-sky-900 font-extrabold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <span className="text-lg">💳</span>
                    <span className="text-xs">Cashier</span>
                    <span className="text-[10px] text-slate-400">Bills &amp; Payment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePresetChange("manager")}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      newStaffRole === "manager"
                        ? "bg-purple-50 border-purple-500 text-purple-900 font-extrabold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <span className="text-lg">👔</span>
                    <span className="text-xs">Manager</span>
                    <span className="text-[10px] text-slate-400">All Operations</span>
                  </button>
                </div>
              </div>

              {/* PIN & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">4-Digit Login PIN * (पिन)</label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
                    >
                      🎲 Generate PIN
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. 5421"
                    value={addStaffPin}
                    onChange={(e) => setAddStaffPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-slate-900 font-mono tracking-widest text-center font-bold text-sm focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Staff uses this PIN to quickly sign in.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone (फ़ोन नंबर - ऐच्छिक)</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Online Activation Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Enable Online Access (ऑनलाइन सक्रिय करें)</div>
                  <div className="text-[11px] text-slate-500">When enabled, this staff member can log in and manage tasks.</div>
                </div>
                <input
                  type="checkbox"
                  checked={newStaffIsActive}
                  onChange={(e) => setNewStaffIsActive(e.target.checked)}
                  className="w-5 h-5 accent-orange-600 cursor-pointer"
                />
              </div>

              {/* Granular Responsibilities Delegation */}
              <div className="pt-2">
                <label className="block font-bold text-slate-800 mb-1.5">
                  Delegated Responsibilities (कार्य अधिकार)
                </label>
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🍳 Kitchen Orders &amp; KDS</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Advance order status: Cooking, Ready, Served, Cancel.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newStaffOrders}
                      onChange={(e) => setNewStaffOrders(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </label>

                  <div className="border-t border-slate-200 my-1.5" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>📋 Menu Catalog &amp; Stock Portions</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Toggle dish Sold Out and adjust daily remaining portions.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newStaffMenu}
                      onChange={(e) => setNewStaffMenu(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </label>

                  <div className="border-t border-slate-200 my-1.5" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>💳 Billing &amp; Payment Clearance</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Mark orders as Paid / Unpaid and print KOT receipts.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newStaffBilling}
                      onChange={(e) => setNewStaffBilling(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </label>

                  <div className="border-t border-slate-200 my-1.5" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🔔 Dining Table Service Calls</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Receive and attend Water, Cleaning, Waiter, and Bill calls.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newStaffRequests}
                      onChange={(e) => setNewStaffRequests(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-600/20 disabled:opacity-50"
                >
                  {isSubmittingStaff ? "Adding Staff..." : "Save Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT STAFF MEMBER ===================== */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Staff Member / अधिकार बदलें</h3>
                  <p className="text-[11px] text-slate-400">Modify staff details, 4-digit PIN, and delegated permissions.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editStaffError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editStaffError}</span>
              </div>
            )}

            <form onSubmit={handleEditStaffSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Role Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role &amp; Responsibility Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditRolePresetChange("waiter")}
                    className={`p-2.5 rounded-xl border text-left font-bold transition ${
                      editStaffRole === "waiter"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-sm">🤵 Waiter</div>
                    <div className="text-[10px] text-slate-400 font-normal">Orders &amp; Calls</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditRolePresetChange("chef")}
                    className={`p-2.5 rounded-xl border text-left font-bold transition ${
                      editStaffRole === "chef"
                        ? "bg-amber-50 border-amber-400 text-amber-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-sm">👨‍🍳 Chef</div>
                    <div className="text-[10px] text-slate-400 font-normal">KDS &amp; Stock</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditRolePresetChange("cashier")}
                    className={`p-2.5 rounded-xl border text-left font-bold transition ${
                      editStaffRole === "cashier"
                        ? "bg-sky-50 border-sky-400 text-sky-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-sm">💳 Cashier</div>
                    <div className="text-[10px] text-slate-400 font-normal">Billing &amp; Paid</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditRolePresetChange("manager")}
                    className={`p-2.5 rounded-xl border text-left font-bold transition ${
                      editStaffRole === "manager"
                        ? "bg-purple-50 border-purple-400 text-purple-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-sm">👔 Manager</div>
                    <div className="text-[10px] text-slate-400 font-normal">Full Floor</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 4-digit PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">4-Digit Login PIN *</label>
                    <button
                      type="button"
                      onClick={generateEditRandomPin}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>New PIN</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="[0-9]{4}"
                    placeholder="4-digit PIN (e.g. 5678)"
                    value={editStaffPin}
                    onChange={(e) => setEditStaffPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-mono font-bold tracking-widest text-center text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone / WhatsApp (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={editStaffPhone}
                    onChange={(e) => setEditStaffPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Online Access Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Staff Online Login Access (लॉगिन स्थिति)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">When disabled, this staff member cannot log in with their PIN.</div>
                </div>
                <input
                  type="checkbox"
                  checked={editStaffIsActive}
                  onChange={(e) => setEditStaffIsActive(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Granular Permissions (कार्य अधिकार) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Delegated Responsibilities (कार्य अधिकार)
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🍳 Orders / Kitchen KDS Status</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Advance order from Pending → Preparing → Ready → Served.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editStaffOrders}
                      onChange={(e) => setEditStaffOrders(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </label>

                  <div className="border-t border-slate-200 my-1.5" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>📋 Menu Catalog &amp; Daily Stock Control</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Toggle dish availability &amp; set daily remaining portions.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editStaffMenu}
                      onChange={(e) => setEditStaffMenu(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </label>

                  <div className="border-t border-slate-200 my-1.5" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>💳 Billing &amp; Payment Clearance</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Mark orders as Paid / Unpaid and print KOT receipts.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editStaffBilling}
                      onChange={(e) => setEditStaffBilling(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </label>

                  <div className="border-t border-slate-200 my-1.5" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🔔 Dining Table Service Calls</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Receive and attend Water, Cleaning, Waiter, and Bill calls.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editStaffRequests}
                      onChange={(e) => setEditStaffRequests(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditStaff}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-600/20 disabled:opacity-50"
                >
                  {isSavingEditStaff ? "Saving Changes..." : "Update Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADJUST DISH PORTION STOCK ===================== */}
      {editingStockDish && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Adjust Daily Stock Portions</h3>
                  <p className="text-[11px] text-slate-400">Manage portions prepared for today for {editingStockDish.name}.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStockDish(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4 text-xs">
              {/* Dish Info Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <img
                  src={editingStockDish.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"}
                  alt={editingStockDish.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-200 shrink-0"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{editingStockDish.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {restaurant.currencySymbol}{editingStockDish.price} • {editingStockDish.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Quick Portion Presets</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = stockPortionInput === "" || Number(stockPortionInput) < 0 ? 0 : Number(stockPortionInput);
                      setStockPortionInput((cur + 10).toString());
                    }}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-800 transition"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = stockPortionInput === "" || Number(stockPortionInput) < 0 ? 0 : Number(stockPortionInput);
                      setStockPortionInput((cur + 25).toString());
                    }}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-800 transition"
                  >
                    +25
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = stockPortionInput === "" || Number(stockPortionInput) < 0 ? 0 : Number(stockPortionInput);
                      setStockPortionInput((cur + 50).toString());
                    }}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-800 transition"
                  >
                    +50
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockPortionInput("-1")}
                    className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition border border-emerald-200"
                    title="Unlimited Portions"
                  >
                    ♾️ Unlim
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockPortionInput("0")}
                    className="py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl font-bold transition border border-rose-200"
                    title="Mark Sold Out"
                  >
                    🔴 0 (Sold)
                  </button>
                </div>
              </div>

              {/* Exact Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Portions Available (संख्या)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="-1 for unlimited"
                    value={stockPortionInput}
                    onChange={(e) => setStockPortionInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">-1 = Unlimited portions</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="5"
                    value={stockThresholdInput}
                    onChange={(e) => setStockThresholdInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Alerts kitchen when &le; this count</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStockDish(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStock}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-600/20 disabled:opacity-50"
                >
                  {isSavingStock ? "Saving..." : "Save Stock Count"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Table Shift / Transfer Modal [P-07] */}
      {shiftingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Shift Table Order</h3>
                  <p className="text-xs text-slate-500">
                    Transfer order from <strong className="text-orange-600">{shiftingTable.fromTableNumber}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShiftingTable(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Select Destination Table (नया टेबल चुनें):
              </label>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                {restaurant?.tables
                  .filter((t) => t.id !== shiftingTable.fromTableId)
                  .map((t) => {
                    const isSelected = selectedShiftTargetId === t.id;
                    const cleanNum = t.tableNumber.replace(/\D/g, "");
                    const isOccupied = orders.some((o) => {
                      const matches = (
                        o.tableId === t.id ||
                        o.tableNumber.toLowerCase() === t.tableNumber.toLowerCase() ||
                        (cleanNum && o.tableNumber.toLowerCase().includes(cleanNum))
                      );
                      return matches && o.status !== "completed" && o.status !== "cancelled";
                    });

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedShiftTargetId(t.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition ${
                          isSelected
                            ? "bg-orange-50 border-orange-500 ring-2 ring-orange-400/40 text-orange-900"
                            : isOccupied
                            ? "bg-slate-50 border-slate-200 text-slate-500"
                            : "bg-white border-slate-200 hover:border-orange-300 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm">{t.tableNumber}</span>
                          <span className="text-[10px] font-semibold text-slate-400">{t.seats || 4} Seats</span>
                        </div>
                        <span className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 ${
                          isOccupied ? "text-rose-600" : "text-emerald-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {isOccupied ? "Occupied" : "Free / Vacant"}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShiftingTable(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedShiftTargetId || isShiftingOrder}
                onClick={handleConfirmShiftTable}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 disabled:opacity-50 flex items-center gap-1.5 transition active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{isShiftingOrder ? "Transferring..." : "Confirm Transfer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
{/* Global Dashboard Toast Feedback */}
      {staffToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xl border ${
              staffToast.type === "success"
                ? "bg-slate-900 text-emerald-400 border-emerald-500/50"
                : "bg-slate-900 text-rose-400 border-rose-500/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {staffToast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-white text-xs">{staffToast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStaffToast(null)}
              className="ml-3 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
