"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  QrCode, 
  ChefHat, 
  Smartphone, 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Receipt, 
  Droplets, 
  ShieldCheck, 
  Sparkles,
  BarChart3,
  Users,
  Menu,
  X,
  Languages,
  Printer,
  Bell,
  CreditCard,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  HelpCircle,
  Calculator,
  LayoutGrid
} from "lucide-react";

export default function SaaSPlatformHome() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"customer" | "kitchen">("customer");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ROI Calculator states
  const [tablesCount, setTablesCount] = useState<number>(15);
  const [avgBill, setAvgBill] = useState<number>(550);
  const [dailyTurnover, setDailyTurnover] = useState<number>(4);

  useEffect(() => {
    const saved = localStorage.getItem("scanbite_lang");
    if (saved === "hi" || saved === "en") {
      setLang(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "hi" : "en";
    setLang(nextLang);
    localStorage.setItem("scanbite_lang", nextLang);
  };

  // Calculation for ROI
  const dailyOrders = tablesCount * dailyTurnover;
  const currentMonthlyRevenue = dailyOrders * avgBill * 30;
  // 25% faster table turnover & +15% visual upselling leads to ~20% net boost
  const extraMonthlyRevenue = Math.round(currentMonthlyRevenue * 0.20);
  const savedWaiterHours = Math.round(dailyOrders * 4 * 30 / 60); // 4 mins per order saved

  const whatsappSupportUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    lang === "hi" 
      ? "नमस्ते ScanBite टीम! मुझे अपने रेस्टोरेंट के लिए डिजिटल क्यूआर मेन्यू और लाइव डेमो की जानकारी चाहिए।"
      : "Hi ScanBite Team! I'm interested in getting a digital QR menu and live demo for my restaurant."
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-600/30">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">ScanBite</span>
              <span className="text-[10px] ml-1.5 font-bold uppercase tracking-widest text-orange-400 bg-orange-950/60 border border-orange-800/60 px-1.5 py-0.5 rounded">
                SaaS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-orange-400 transition">
              {lang === "hi" ? "फीचर्स" : "Features"}
            </a>
            <a href="#simulator" className="hover:text-orange-400 transition">
              {lang === "hi" ? "लाइव अनुभव" : "Live Experience"}
            </a>
            <a href="#how-it-works" className="hover:text-orange-400 transition">
              {lang === "hi" ? "कार्यप्रणाली" : "How it Works"}
            </a>
            <a href="#calculator" className="hover:text-orange-400 transition">
              {lang === "hi" ? "मुनाफ़ा कैलकुलेटर" : "ROI Calculator"}
            </a>
            <a href="#pricing" className="hover:text-orange-400 transition">
              {lang === "hi" ? "प्लान्स व दाम" : "Pricing"}
            </a>
            <a href="#faq" className="hover:text-orange-400 transition">
              {lang === "hi" ? "सवाल-जवाब" : "FAQ"}
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              aria-label="Toggle Language"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition active:scale-95"
            >
              <Languages className="w-3.5 h-3.5 text-orange-400" />
              <span>{lang === "en" ? "🇮🇳 हिंदी" : "🇬🇧 English"}</span>
            </button>

            {/* Free Trial / Register CTA */}
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-orange-400 border border-orange-500/40 transition active:scale-95 shadow-sm shadow-orange-500/10"
            >
              <span>{lang === "hi" ? "फ्री सेटअप" : "Get ScanBite Free"}</span>
            </Link>

            {/* Live Demo Button */}
            <Link
              href="/dashboard?demo=true"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl shadow-lg shadow-orange-600/25 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>{lang === "hi" ? "लाइव डेमो" : "Explore Demo"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur px-4 pt-3 pb-5 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-300">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-orange-400 transition"
              >
                {lang === "hi" ? "⚡ फीचर्स" : "⚡ Features"}
              </a>
              <a 
                href="#simulator" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-orange-400 transition"
              >
                {lang === "hi" ? "📱 लाइव अनुभव" : "📱 Live Experience"}
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-orange-400 transition"
              >
                {lang === "hi" ? "🔄 कार्यप्रणाली" : "🔄 How it Works"}
              </a>
              <a 
                href="#calculator" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-orange-400 transition"
              >
                {lang === "hi" ? "💰 मुनाफ़ा कैलकुलेटर" : "💰 ROI Calculator"}
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-orange-400 transition"
              >
                {lang === "hi" ? "🏷️ प्लान्स व दाम" : "🏷️ Pricing"}
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-orange-400 transition"
              >
                {lang === "hi" ? "❓ सवाल-जवाब" : "❓ FAQ"}
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-center text-xs font-black text-white shadow-lg shadow-orange-600/30"
              >
                {lang === "hi" ? "🚀 फ्री 14-दिन ट्रायल शुरू करें" : "🚀 Start 14-Day Free Setup"}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-600/20 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-950/50 border border-orange-500/30 text-orange-400 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {lang === "hi" 
                ? "रेस्टोरेंट, कैफे और बार के लिए नेक्स्ट-जेन डिजिटल ऑर्डरिंग सिस्टम"
                : "Next-Gen Restaurant & Cafe Digital Ordering System"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight sm:leading-tight">
            {lang === "hi" ? (
              <>
                अपनी हर टेबल को बनाएं <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                  सुपरफास्ट सेल्फ-ऑर्डरिंग मशीन
                </span>
              </>
            ) : (
              <>
                Turn Every Table Into A <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                  Self-Ordering Machine
                </span>
              </>
            )}
          </h1>

          <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {lang === "hi" 
              ? "ग्राहक टेबल क्यूआर कोड स्कैन करते हैं, स्वादिष्ट फोटो वाला मेन्यू देखते हैं और फोन से ग्रुप ऑर्डर करते हैं। वेटर की भागदौड़ खत्म, मेन्यू रीप्रिंट का खर्च शून्य, और 30% तेज टेबल रोटेशन।"
              : "Diners scan the table QR code, browse high-res photos, and place orders directly from their phones. Zero waiter bottlenecks, zero printed menu reprints, and 30% faster table turnover."}
          </p>

          {/* Interactive Live Demo Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto">
            {/* Pillar 1: Customer Menu */}
            <Link
              href="/r/grand-spice/t/tbl-4"
              target="_blank"
              className="w-full sm:w-auto flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>{lang === "hi" ? "📱 कस्टमर टेबल मेन्यू (Table 4 Demo)" : "📱 Customer QR Menu (Table 4 Demo)"}</span>
            </Link>

            {/* Pillar 2: Kitchen KDS & Dashboard */}
            <Link
              href="/dashboard?demo=true"
              target="_blank"
              className="w-full sm:w-auto flex-1 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl border border-slate-700/80 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4 text-orange-400 shrink-0" />
              <span>{lang === "hi" ? "🍳 किचन KDS व ओनर कंसोल (Live Demo)" : "🍳 Kitchen KDS & Owner Console (Live Demo)"}</span>
            </Link>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              💡 {lang === "hi" 
                ? "ग्राहक फोन से आर्डर करते हैं और किचन में लाइव टिकट पहुंचता है — दोनों टैब्स को खोलकर रियल-टाइम सिंक टेस्ट करें!" 
                : "Diners order on their phones and tickets arrive live in the kitchen — open both tabs to test real-time sync!"}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">0 sec</div>
              <div className="text-xs text-slate-400 mt-1">
                {lang === "hi" ? "शून्य ऐप डाउनलोड झंझट" : "App Install Friction (PWA)"}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-orange-400">+25%</div>
              <div className="text-xs text-slate-400 mt-1">
                {lang === "hi" ? "ज्यादा औसत बिल राशि" : "Higher Avg Order Value"}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">80%</div>
              <div className="text-xs text-slate-400 mt-1">
                {lang === "hi" ? "स्टाफ लोड में कमी" : "Waiter Load Reduction"}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">0% Cut</div>
              <div className="text-xs text-slate-400 mt-1">
                {lang === "hi" ? "सीधा UPI आपके बैंक में" : "Direct UPI to Your Bank"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Product Experience Simulator */}
      <section id="simulator" className="py-16 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === "hi" ? "लाइव सॉफ्टवेयर सिमुलेटर" : "Interactive Product Simulator"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {lang === "hi" ? "एक ही सिस्टम, सीमलेस डाइनिंग फ्लो" : "One Engine, Seamless Dining Flow"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {lang === "hi" 
                ? "नीचे क्लिक करके देखें कि कैसे ग्राहक फोन से आर्डर करते हैं और किचन में रियल-टाइम टिकट पहुंचता है"
                : "Click below to preview how diners order from their phone and chefs receive tickets in real time"}
            </p>
          </div>

          {/* Simulator Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-950 border border-slate-800 gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab("customer")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                  activeTab === "customer"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{lang === "hi" ? "ग्राहक क्यूआर मेन्यू" : "Customer QR Experience"}</span>
              </button>

              <button
                onClick={() => setActiveTab("kitchen")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                  activeTab === "kitchen"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ChefHat className="w-4 h-4" />
                <span>{lang === "hi" ? "किचन KDS कंसोल" : "Kitchen KDS Display"}</span>
              </button>
            </div>
          </div>

          {/* Simulator Content Window */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top Mock Window Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-500 ml-2">
                  {activeTab === "customer" 
                    ? "scanbite-plum.vercel.app/r/grand-spice/t/tbl-4"
                    : "scanbite-plum.vercel.app/dashboard?demo=true"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400">
                  {lang === "hi" ? "लाइव कनेक्टेड" : "Real-Time Synced"}
                </span>
              </div>
            </div>

            {/* TAB 1: Customer Menu Preview */}
            {activeTab === "customer" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{lang === "hi" ? "लाइव ग्रुप ऑर्डरिंग टेबल कार्ट" : "Live Group Ordering Table Cart"}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {lang === "hi" 
                      ? "दोस्त अपनी-अपनी पसंद चुनते हैं, एक ही बिल में लाइव जुड़ता है"
                      : "Friends Order Together in Sync from Their Own Phones"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {lang === "hi"
                      ? "टेबल 4 पर बैठे 4 दोस्त अपने-अपने फोन से क्यूआर स्कैन करते हैं। राहुल पनीर टिक्का जोड़ता है, अंजलि मॉकसेल जोड़ती है। सभी के फोन पर लाइव दिखता है कि किसने क्या आर्डर किया।"
                      : "Diners at Table 4 scan the QR. Rahul adds Paneer Tikka, Anjali adds Virgin Mojito. Items immediately sync across all phones tagged with diner names."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs font-bold text-emerald-400 mb-1">
                        {lang === "hi" ? "💳 3-मोड स्मार्ट बिल स्प्लिट" : "💳 3-Mode Smart Split Bill"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lang === "hi" ? "पूरा बिल, बराबर बाँटें या खुद का हिस्सा UPI QR द्वारा" : "Full Bill, Equal Split, or My Share with dynamic UPI QR"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs font-bold text-amber-400 mb-1">
                        {lang === "hi" ? "🛎️ 1-टैप सर्विस कॉलिंग" : "🛎️ 1-Tap Service Alert"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lang === "hi" ? "पानी 💧, वेटर 🛎️, या बिल 🧾 बिना चिल्लाए" : "Call for Water 💧, Waiter 🛎️, or Bill 🧾 with 1 tap"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/r/grand-spice/t/tbl-4"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition"
                    >
                      <span>{lang === "hi" ? "कस्टमर मेन्यू खोलकर टेस्ट करें" : "Test Live Customer QR Menu"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Mock Phone Display */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner max-w-sm mx-auto w-full">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>The Grand Spice Kitchen</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Table 4
                    </span>
                  </div>

                  {/* Mock Dish Card */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-white">Dal Makhani Bukhara</div>
                        <div className="text-[11px] text-orange-400 font-semibold">₹340</div>
                      </div>
                      <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-lg">
                        + Add
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === "hi" ? "मक्खन और धीमी आंच पर पकी दाल मखनी" : "Slow-cooked black lentils with churned butter & cream"}
                    </div>
                  </div>

                  {/* Mock Shared Cart */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-orange-500/30">
                    <div className="text-[11px] font-bold text-slate-300 flex justify-between items-center mb-2">
                      <span>👥 {lang === "hi" ? "टेबल 4 लाइव कार्ट (2 आइटम्स)" : "Table 4 Shared Cart (2 items)"}</span>
                      <span className="text-orange-400 font-bold">₹580</span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-slate-300">
                        <span>1x Paneer Tikka</span>
                        <span className="text-slate-400">👤 Rahul</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>1x Virgin Mojito</span>
                        <span className="text-slate-400">👤 Anjali</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Kitchen KDS Preview */}
            {activeTab === "kitchen" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold">
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>{lang === "hi" ? "किचन डिस्प्ले सिस्टम (KDS)" : "Kitchen Display System (KDS)"}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {lang === "hi" 
                      ? "शेफ के टैबलेट पर बजती है घंटी, ऑर्डर कभी नहीं छूटता"
                      : "Loud Chime on Chef Tablet, Zero Lost Paper Tickets"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {lang === "hi"
                      ? "जैसे ही कोई ग्राहक ऑर्डर करता है, किचन में तेज बीप साउंड बजता है। टेबल नंबर, समय, और स्पेशल कुकिंग निर्देश (जैसे 'कम मिर्च') स्पष्ट दिखते हैं। 1-क्लिक में थर्मल KOT प्रिंट निकालें।"
                      : "As soon as a diner orders, a loud synthesizer chime plays. Chefs view table number, elapsed timer, diner names, and cooking notes. 1-click thermal KOT slip printing."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs font-bold text-orange-400 mb-1">
                        {lang === "hi" ? "🖨️ थर्मल KOT स्लिप" : "🖨️ Thermal KOT Printing"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lang === "hi" ? "58mm और 80mm प्रिंटर कम्पेटिबल ESC/POS स्लिप" : "1-click ESC/POS thermal printing for kitchen & cashier"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs font-bold text-red-400 mb-1">
                        {lang === "hi" ? "⚡ तुरंत सोल्ड-आउट स्विच" : "⚡ Instant Stock Toggle"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lang === "hi" ? "बिरयानी खत्म? 1 सेकंड में ऑफ करें" : "Biryani finished? Disable in 1-second from kitchen"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/dashboard?demo=true"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition"
                    >
                      <span>{lang === "hi" ? "किचन KDS कंसोल खोलें" : "Open Kitchen KDS Console"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Mock KDS Card */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner max-w-sm mx-auto w-full">
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-white text-xs">TABLE 4 • #ORD-104</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        👨‍🍳 Cooking
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-orange-400" />
                      <span>{lang === "hi" ? "3 मिनट पहले आया" : "3 mins ago (Timer: 03:12)"}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between font-medium text-slate-200">
                        <span>1x Murgh Dum Biryani (Full)</span>
                        <span className="text-[10px] text-slate-400">Diner: Rahul</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-200">
                        <span>2x Butter Garlic Naan</span>
                        <span className="text-[10px] text-slate-400">Diner: Amit</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-orange-950/40 border border-orange-800/40 text-[10px] text-orange-300">
                      📝 Note: &quot;Make biryani medium spicy please&quot;
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold text-center">
                        ✓ Mark Ready
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold">
                        Print KOT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section id="features" className="py-20 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">
              {lang === "hi" ? "शक्तिशाली फीचर्स" : "Powerful Features"}
            </h2>
            <p className="text-3xl font-extrabold text-white">
              {lang === "hi" 
                ? "व्यस्त रेस्टोरेंट और कैफे के लिए खास तौर पर तैयार"
                : "Engineered For Busy Restaurants & Cafes"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "टेबल-स्पेसिफिक डायनामिक क्यूआर" : "Table-Specific Dynamic QR Codes"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "हर टेबल के लिए हाई-रिज़ॉल्यूशन स्टैंडी क्यूआर कार्ड। आर्डर अपने आप टेबल नंबर (जैसे Table 4) के साथ किचन में जाता है।"
                  : "Generate high-resolution printable tent cards for each table. The system automatically tags orders with the table number (e.g. Table 4)."}
              </p>
            </div>

            {/* Feature 2: Group Ordering */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "ग्रुप ऑर्डरिंग (लाइव टेबल कार्ट)" : "Group Ordering (Live Synchronized Cart)"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "एक टेबल पर बैठे कई ग्राहक अपने-अपने फोन से पसंदीदा डिश जोड़ सकते हैं। कार्ट में हर डिश के साथ आर्डर करने वाले का नाम दिखता है।"
                  : "Multiple diners at the same table add dishes from their own phones simultaneously into a shared live cart with diner tags."}
              </p>
            </div>

            {/* Feature 3: Split Bill */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "स्मार्ट बिल स्प्लिट व UPI क्यूआर" : "Smart Split Bill & Dynamic UPI QR"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "3 आसान विकल्प: पूरा बिल, बराबर बाँटें या खुद का हिस्सा (Item-wise)। तुरंत PhonePe/GPay QR कोड बनता है और 1-क्लिक व्हाट्सएप शेयर।"
                  : "3 payment split modes: Full Bill, Equal Split, or My Share item-wise with instant dynamic UPI QR code & WhatsApp breakdown."}
              </p>
            </div>

            {/* Feature 4: KDS */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "लाइव किचन डिस्प्ले सिस्टम (KDS)" : "Live Kitchen Display System (KDS)"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "किचन टैबलेट पर लाउड ऑडियो बीप, टेबल नंबर, ऑर्डर टाइमर और कुकिंग निर्देश (उदा. 'कम तीखा') के साथ लाइव टिकट आते हैं।"
                  : "Chefs receive incoming orders on a tablet with table numbers, timestamps, and custom cooking instructions (e.g. 'less spicy')."}
              </p>
            </div>

            {/* Feature 5: Waiter Mode */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "वेटर मोड व हैप्टिक बजर ऐप" : "Mobile Waiter Mode & Haptic Buzzer"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "कैप्टन और वेटर के फोन पर 4-डिजिट पिन लॉगिन। टेबल सर्विस अलर्ट और 'तैयार खाना' का तुरंत वाइब्रेशन और बीप अलर्ट।"
                  : "Dedicated smartphone portal for floor staff with 4-digit PIN auth, haptic device vibration, and 1-tap table call attendance."}
              </p>
            </div>

            {/* Feature 6: Floor Plan */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "लाइव टेबल फ्लोर ग्रिड प्लान" : "Live Interactive Floor Grid Plan"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "4 कलर-कोडेड टेबल स्थितियां: 🟢 खाली, 🔴 खाना जारी, 🟡 बिल बाकी, 🔵 सर्विस कॉल। 1-क्लिक टेबल ट्रांसफर और खाली करने की सुविधा।"
                  : "4 live color-coded table states: 🟢 Vacant, 🔴 Dining, 🟡 Bill Pending, 🔵 Service Calls with 1-click order shift across tables."}
              </p>
            </div>

            {/* Feature 7: Stock Toggle */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "तुरंत 'सोल्ड आउट' स्टॉक सुरक्षा" : "Instant 'Sold Out' Stock Safeguard"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "स्पेशल बिरयानी या मिठाई खत्म? 1 सेकंड में डैशबोर्ड से बंद करें ताकि ग्राहक वो डिश आर्डर न कर सकें जो उपलब्ध नहीं है।"
                  : "Finished your special Biryani? Toggle it off from the dashboard in 1 second so customers never place orders for unavailable food."}
              </p>
            </div>

            {/* Feature 8: Direct UPI */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "0% कमीशन सीधा UPI भुगतान" : "0% Commission Direct UPI Payments"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "ग्राहक PhonePe, GPay, Paytm से सीधे आपके रेस्टोरेंट VPA पर पैसे भेजते हैं। ScanBite कोई कमीशन या कट नहीं लेता।"
                  : "Customers pay via UPI directly to your restaurant bank VPA. Zero intermediary commission, settlement delay, or platform cuts."}
              </p>
            </div>

            {/* Feature 9: Bilingual & Thermal KOT */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "hi" ? "थर्मल KOT प्रिंट व हिंदी सपोर्ट" : "Thermal KOT Slips & Bilingual Menu"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "एक क्लिक में थर्मल प्रिंटर (58mm/80mm) KOT स्लिप। ग्राहक 1-टैप में पूरा मेन्यू हिंदी में देख सकते हैं और देवनागरी में सर्च कर सकते हैं।"
                  : "Instant 1-click ESC/POS thermal printing for kitchen & cashier. Complete bilingual English & Hindi toggle with Devanagari dish search."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">
              {lang === "hi" ? "आसान प्रक्रिया" : "Effortless Flow"}
            </h2>
            <p className="text-3xl font-extrabold text-white">
              {lang === "hi" 
                ? "3 आसान चरणों में काम करता है ScanBite"
                : "How ScanBite Works In 3 Simple Steps"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative hover:border-orange-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-black flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {lang === "hi" ? "ग्राहक टेबल क्यूआर स्कैन करें" : "Guest Scans Table QR"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "ग्राहक टेबल पर बैठते हैं और फोन कैमरा से स्टैंडी क्यूआर स्कैन करते हैं। किसी भी ऐप को डाउनलोड करने की कोई जरूरत नहीं।"
                  : "Customers sit at their table and scan the stylish tent card with their smartphone camera. No app download or sign-up needed."}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {lang === "hi" ? "फोटो मेन्यू देखें व ग्रुप ऑर्डर करें" : "Browse & Customize Group Order"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "शानदार एचडी फोटो देखें, वेज/नॉनवेज फिल्टर करें, पोर्शन साइज (हाफ/फुल) चुनें, और सभी दोस्त मिलकर लाइव टेबल कार्ट में डिश जोड़ें।"
                  : "Diners view mouthwatering dish photos, filter veg/non-veg, choose portion sizes & addons, and add to shared group table cart."}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {lang === "hi" ? "किचन में लाइव KOT और UPI पेमेंट" : "Live Kitchen Push & Smart Pay"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "hi"
                  ? "ऑर्डर सीधे शेफ के टैबलेट पर बीप के साथ पहुंचता है। ग्राहक कुकिंग प्रगति लाइव ट्रैक करते हैं और फोनपे/जीपे से तुरंत भुगतान करते हैं।"
                  : "Orders instantly appear on the chef's tablet with sound chimes. Diners track cooking in real time and pay via UPI QR or cash."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator Section */}
      <section id="calculator" className="py-20 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-400 text-xs font-bold mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span>{lang === "hi" ? "रेस्टोरेंट रेवेन्यू ग्रोथ कैलकुलेटर" : "Interactive Revenue Growth Calculator"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {lang === "hi" 
                ? "ScanBite से आपके रेस्टोरेंट को कितना अतिरिक्त मुनाफा होगा?"
                : "Calculate Your Restaurant's Extra Monthly Revenue"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {lang === "hi"
                ? "30% तेज टेबल रोटेशन और फोटो आधारित अपसेलिंग से आपकी कमाई का अनुमान लगाएं"
                : "Estimate your earnings boost through faster table turns and high-res photo upselling"}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders Side */}
            <div className="lg:col-span-7 space-y-6">
              {/* Slider 1: Tables */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300">
                    {lang === "hi" ? "कुल डाइनिंग टेबल्स:" : "Total Dining Tables:"}
                  </span>
                  <span className="text-orange-400 text-sm font-black">{tablesCount} Tables</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="50"
                  step="1"
                  value={tablesCount}
                  onChange={(e) => setTablesCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Slider 2: Average Bill */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300">
                    {lang === "hi" ? "औसत बिल राशि (Average Bill Value):" : "Average Bill Value:"}
                  </span>
                  <span className="text-emerald-400 text-sm font-black">₹{avgBill}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={avgBill}
                  onChange={(e) => setAvgBill(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Slider 3: Table Turns per Day */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300">
                    {lang === "hi" ? "प्रति टेबल दैनिक ग्राहक फेरे (Daily Turns):" : "Daily Turns per Table:"}
                  </span>
                  <span className="text-sky-400 text-sm font-black">{dailyTurnover} Seatings / Day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="1"
                  value={dailyTurnover}
                  onChange={(e) => setDailyTurnover(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            </div>

            {/* Results Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-orange-950/40 via-slate-950 to-slate-950 border border-orange-500/40 rounded-2xl p-6 text-center space-y-4 shadow-lg shadow-orange-500/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                {lang === "hi" ? "अनुमानित अतिरिक्त मासिक मुनाफा" : "Estimated Extra Monthly Revenue"}
              </span>

              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                +₹{extraMonthlyRevenue.toLocaleString("en-IN")}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{lang === "hi" ? "मासिक वेटर समय की बचत:" : "Monthly Staff Hours Saved:"}</span>
                  <span className="font-bold text-white">{savedWaiterHours} hrs / mo</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{lang === "hi" ? "सॉफ्टवेयर लागत रिकवरी:" : "ROI Payback Speed:"}</span>
                  <span className="font-bold text-emerald-400">
                    {lang === "hi" ? "पहले 2 दिनों में" : "Within First 48 Hours"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/register"
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 block text-center"
                >
                  {lang === "hi" ? "14-दिन का फ्री ट्रायल शुरू करें" : "Claim 14-Day Free Setup"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">
              {lang === "hi" ? "पारदर्शी SaaS प्लान्स" : "SaaS Pricing"}
            </h2>
            <p className="text-3xl font-extrabold text-white">
              {lang === "hi"
                ? "हर रेस्टोरेंट और कैफे के लिए किफायती व स्पष्ट प्लान"
                : "Simple, Affordable Plans For Every Food Business"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">
                  {lang === "hi" ? "स्टार्टर कैफे" : "Starter Cafe"}
                </span>
                <div className="text-3xl font-black text-white mt-2">
                  ₹499 <span className="text-xs font-normal text-slate-400">/{lang === "hi" ? "माह" : "month"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {lang === "hi" 
                    ? "छोटे कैफे, जूस बार और फास्ट फूड जोड़ों के लिए बेहतरीन।"
                    : "Ideal for small cafes, juice bars, and fast food joints."}
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === "hi" ? "10 टेबल तक के क्यूआर कोड" : "Up to 10 Table QRs"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === "hi" ? "फोटो डिजिटल मेन्यू" : "Digital Menu with photos"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === "hi" ? "किचन के लिए सेल्फ-ऑर्डरिंग" : "Self-Ordering to Kitchen"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === "hi" ? "पानी व वेटर कॉलिंग बटन" : "Waiter Calling button"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs text-center transition block"
              >
                {lang === "hi" ? "14-दिन फ्री ट्रायल शुरू करें" : "Start 14-Day Free Trial"}
              </Link>
            </div>

            {/* Plan 2: Popular */}
            <div className="bg-gradient-to-b from-orange-950/40 to-slate-900 border-2 border-orange-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-orange-500/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                {lang === "hi" ? "सर्वाधिक लोकप्रिय" : "Most Popular"}
              </span>

              <div>
                <span className="text-xs font-bold uppercase text-orange-400">
                  {lang === "hi" ? "प्रो रेस्टोरेंट" : "Pro Restaurant"}
                </span>
                <div className="text-3xl font-black text-white mt-2">
                  ₹1,199 <span className="text-xs font-normal text-slate-400">/{lang === "hi" ? "माह" : "month"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {lang === "hi"
                    ? "फैमिली डाइन-इन रेस्टोरेंट, रेस्टोबार और रूफटॉप डाइनिंग के लिए।"
                    : "For dine-in family restaurants, restobars, and breweries."}
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{lang === "hi" ? "असीमित (Unlimited) टेबल क्यूआर" : "Unlimited Table QR codes"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{lang === "hi" ? "लाइव किचन डिस्प्ले (KDS)" : "Live Kitchen Display (KDS)"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{lang === "hi" ? "ग्रुप ऑर्डरिंग व 3-मोड बिल स्प्लिट" : "Group Ordering & Smart Split Bill"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{lang === "hi" ? "मोबाइल वेटर मोड व हैप्टिक अलर्ट" : "Mobile Waiter Mode with Haptics"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{lang === "hi" ? "लाइव टेबल फ्लोर ग्रिड प्लान" : "Live Floor Grid Plan"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{lang === "hi" ? "0% कमीशन सीधा UPI भुगतान" : "Direct UPI Table Payments (0% cut)"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl text-xs text-center transition shadow-lg shadow-orange-500/25 block"
              >
                {lang === "hi" ? "प्रो प्लान से शुरुआत करें" : "Get Started with Pro"}
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">
                  {lang === "hi" ? "होटल व मल्टी-ब्रांच" : "Hotel & Chains"}
                </span>
                <div className="text-3xl font-black text-white mt-2">
                  ₹2,499 <span className="text-xs font-normal text-slate-400">/{lang === "hi" ? "माह" : "month"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {lang === "hi"
                    ? "लक्जरी डाइनिंग, कई आउटलेट्स और होटल रूम डाइनिंग के लिए।"
                    : "For luxury dining, multi-outlets, and resort room dining."}
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === "hi" ? "मल्टी-ब्रांच व मल्टी-रूम आर्डरिंग" : "Multi-branch & Multi-room ordering"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === "hi" ? "थर्मल KOT प्रिंटर इंटीग्रेशन" : "Thermal KOT printer integration"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === "hi" ? "कस्टम ब्रांडिंग व लोगो" : "Custom branding & domain"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === "hi" ? "समर्पित अकाउंट मैनेजर" : "Dedicated Account Manager"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs text-center transition block"
              >
                {lang === "hi" ? "एंटरप्राइज ट्रायल शुरू करें" : "Start Free Enterprise Trial"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section id="faq" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-400 text-xs font-bold mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{lang === "hi" ? "अक्सर पूछे जाने वाले सवाल" : "Frequently Asked Questions"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {lang === "hi" ? "आपके सवालों के स्पष्ट जवाब" : "Everything You Need to Know"}
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q_en: "Do my customers need to download any app from Google Play or App Store?",
                q_hi: "क्या ग्राहकों को कोई ऐप डाउनलोड करने की जरूरत होती है?",
                a_en: "No! ScanBite runs as an instant mobile web app (PWA). Customers simply point their phone camera at the QR tent card, and the high-speed digital menu opens immediately in their default browser.",
                a_hi: "बिल्कुल नहीं! ScanBite बिना किसी डाउनलोड के सेकंड्स में खुलता है। ग्राहक सिर्फ अपने मोबाइल कैमरे से टेबल क्यूआर स्कैन करते हैं और सीधे उनके ब्राउज़र में मेन्यू खुल जाता है।"
              },
              {
                q_en: "Does ScanBite charge any commission on our food sales or UPI payments?",
                q_hi: "क्या ScanBite हमारी बिक्री या UPI पेमेंट पर कोई कमीशन काटता है?",
                a_en: "Zero commission! 100% of the customer's payment goes directly into your restaurant's bank account via your own UPI VPA (PhonePe, GPay, Paytm). We only charge a flat monthly software subscription.",
                a_hi: "शून्य (0%) कमीशन! ग्राहक का 100% पेमेंट सीधे आपके रेस्टोरेंट के UPI आईडी (PhonePe/GPay) में जाता है। हम केवल एक निश्चित मासिक सॉफ्टवेयर शुल्क लेते हैं।"
              },
              {
                q_en: "Do I need to purchase expensive POS machines or special tablets?",
                q_hi: "क्या हमें महंगे POS हार्डवेयर या नए टैबलेट खरीदने होंगे?",
                a_en: "No expensive hardware needed. ScanBite runs on any device you already own — Android phones, iPads, tablets, laptops, or desktop computers.",
                a_hi: "किसी भी महंगे हार्डवेयर की आवश्यकता नहीं है। ScanBite किसी भी सामान्य स्मार्टफोन, टैबलेट, लैपटॉप या पुराने कंप्यूटर पर आराम से चलता है।"
              },
              {
                q_en: "Can we print thermal KOT tickets for the kitchen?",
                q_hi: "क्या हम किचन के लिए थर्मल KOT पर्ची प्रिंट कर सकते हैं?",
                a_en: "Yes! ScanBite includes a 1-click thermal KOT slip generator compatible with standard 58mm and 80mm thermal receipt printers over USB, Bluetooth, or Wi-Fi.",
                a_hi: "हाँ! ScanBite में 1-क्लिक थर्मल KOT प्रिंटिंग उपलब्ध है जो सभी 58mm और 80mm थर्मल प्रिंटर्स के साथ आसानी से काम करती है।"
              },
              {
                q_en: "Can my staff and cooks use it in Hindi?",
                q_hi: "क्या हमारे वेटर और रसोइए इसे हिंदी में उपयोग कर सकते हैं?",
                a_en: "Yes! ScanBite is built from the ground up for Indian dining. Both the customer menu and the staff portals offer instant 1-tap English and Hindi translation, plus Devanagari dish search.",
                a_hi: "हाँ! ScanBite में पूरा मेन्यू और स्टाफ पोर्टल 1-टैप में हिंदी में बदल जाता है, और ग्राहक हिंदी (देवनागरी) में भी डिश सर्च कर सकते हैं।"
              },
              {
                q_en: "How quickly can our restaurant go live?",
                q_hi: "हमारा रेस्टोरेंट कितनी जल्दी लाइव शुरू हो सकता है?",
                a_en: "Under 10 minutes! Sign up on our partner page, enter your restaurant name, upload your menu items (or send us a photo of your existing menu on WhatsApp), and print your table QR cards instantly.",
                a_hi: "सिर्फ 10 मिनट में! पार्टनर पेज पर रजिस्टर करें, अपना मेन्यू जोड़ें (या व्हाट्सएप पर पुराने मेन्यू की फोटो भेजें), और तुरंत अपनी टेबल के क्यूआर स्टैंडी प्रिंट करें।"
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 hover:text-orange-400 transition"
                >
                  <span className="text-sm font-bold text-white">
                    {lang === "hi" ? faq.q_hi : faq.q_en}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {lang === "hi" ? faq.a_hi : faq.a_en}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to Modernize CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
            {lang === "hi" 
              ? "क्या आप अपने रेस्टोरेंट को स्मार्ट और ऑटोमैटिक बनाने के लिए तैयार हैं?"
              : "Ready to Supercharge Your Restaurant Operations?"}
          </h2>
          <p className="text-xs sm:text-base text-orange-100 max-w-xl mx-auto mb-8 leading-relaxed">
            {lang === "hi"
              ? "आज ही 14-दिन का निःशुल्क ट्रायल शुरू करें। कोई क्रेडिट कार्ड आवश्यक नहीं।"
              : "Start your 14-day free trial today. No credit card required. Go live in 10 minutes."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{lang === "hi" ? "🚀 फ्री सेटअप शुरू करें" : "🚀 Start Free Setup"}</span>
              <ArrowRight className="w-4 h-4 text-orange-400" />
            </Link>

            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{lang === "hi" ? "व्हाट्सएप पर बात करें" : "Chat on WhatsApp"}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Comprehensive SaaS Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 pt-16 pb-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-orange-600/30">
                  ⚡
                </div>
                <div>
                  <span className="font-extrabold text-base text-white tracking-tight">ScanBite</span>
                  <span className="text-[10px] ml-1.5 font-bold uppercase tracking-widest text-orange-400 bg-orange-950/60 border border-orange-800/60 px-1.5 py-0.5 rounded">
                    SaaS
                  </span>
                </div>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                {lang === "hi"
                  ? "ScanBite आधुनिक रेस्टोरेंट, कैफे और बार के लिए भारत का अग्रणी डिजिटल क्यूआर मेन्यू, लाइव KDS और स्मार्ट ऑर्डरिंग प्लेटफॉर्म है।"
                  : "ScanBite is the next-generation digital QR menu, live KDS, and table management platform engineered for modern food & hospitality businesses."}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Data Privacy</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span>99.9% Uptime</span>
                </span>
              </div>
            </div>

            {/* Col 2: Live Demos */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {lang === "hi" ? "लाइव डेमो" : "Live Product Demos"}
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/r/grand-spice/t/tbl-4" target="_blank" className="hover:text-orange-400 transition">
                    📱 Customer QR Menu Demo
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard?demo=true" target="_blank" className="hover:text-orange-400 transition">
                    🍳 Kitchen &amp; Owner Console Demo
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-orange-400 transition">
                    🚀 Free 14-Day Trial Setup
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Features */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {lang === "hi" ? "मुख्य क्षमताएं" : "Core Features"}
              </div>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-orange-400 transition">Group Table Cart</a></li>
                <li><a href="#features" className="hover:text-orange-400 transition">Smart Split Bill (UPI)</a></li>
                <li><a href="#features" className="hover:text-orange-400 transition">Live Table Floor Grid</a></li>
                <li><a href="#features" className="hover:text-orange-400 transition">Thermal KOT Slips</a></li>
                <li><a href="#features" className="hover:text-orange-400 transition">Bilingual English / हिंदी</a></li>
              </ul>
            </div>

            {/* Col 4: Support & Legal */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {lang === "hi" ? "सहायता व संपर्क" : "Support & Help"}
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/register" className="hover:text-orange-400 transition">
                    {lang === "hi" ? "नया रेस्टोरेंट जोड़ें" : "Register Restaurant"}
                  </Link>
                </li>
                <li>
                  <a href={whatsappSupportUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp: +91 98765 43210</span>
                  </a>
                </li>
                <li><a href="#pricing" className="hover:text-orange-400 transition">{lang === "hi" ? "प्लान्स व दाम" : "Pricing Plans"}</a></li>
                <li><a href="#faq" className="hover:text-orange-400 transition">{lang === "hi" ? "सवाल-जवाब" : "FAQ Support"}</a></li>
                <li>
                  <Link href="/dashboard" className="hover:text-slate-300 transition text-[11px] text-slate-600 block mt-2">
                    Restaurant Partner Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              © 2026 ScanBite SaaS Platform. Built with ❤️ for modern Indian food & hospitality businesses.
            </div>
            <div className="flex items-center gap-4">
              <span>0% Commission</span>
              <span>•</span>
              <span>Made in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
