"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ChefHat, 
  QrCode, 
  Smartphone,
  Phone,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Check,
  Zap,
  Users
} from "lucide-react";

export default function RequestRestaurantSetupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [tablesCount, setTablesCount] = useState("6-15 Tables (Standard Dine-In)");
  const [notes, setNotes] = useState("");

  const supportPhone = "+91 98765 43210";
  const cleanPhone = "919876543210";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim() || !phone.trim()) return;

    setLoading(true);
    try {
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          ownerName: ownerName.trim() || "Owner",
          phone: phone.trim(),
          city: city.trim() || "India",
          tablesCount,
          notes: notes.trim(),
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppLink = (customText?: string) => {
    const text = customText || `Hi ScanBite Team! I want to set up QR Digital Menu for my restaurant "${restaurantName || "My Restaurant"}" in ${city || "my city"}. Please contact me.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur py-4 px-6 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-orange-600/30">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight">ScanBite</span>
              <span className="text-[10px] ml-1.5 font-bold uppercase tracking-widest text-orange-400 bg-orange-950/60 border border-orange-800/60 px-1.5 py-0.5 rounded">
                Partner Setup
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl"
          >
            <span>Existing Restaurant Login</span>
            <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 my-auto">
        {!submitted ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Value Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Hardware Needed • 24hr Setup</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Launch QR Ordering at your Restaurant.
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed">
                Empower diners to browse photos, place orders, and pay directly from their phones. Cut wait-times by 40% and increase table turnover.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>High-resolution digital menu with veg/non-veg tags</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Instant live Kitchen KDS screen for chefs &amp; waiters</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Table Call buttons (Water, Bill, Waiter call in 1 tap)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Print-ready high-res QR standees generated for all tables</span>
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                <div className="font-bold text-xs text-emerald-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Want to talk to our founder immediately?</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Get pricing details, live demo on your phone, and complete onboarding within 15 minutes.
                </p>
                <a
                  href={getWhatsAppLink("Hi ScanBite Team! I want to set up QR digital menu for my restaurant. Please share live demo and pricing.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 px-4 rounded-xl transition shadow-md shadow-emerald-600/30"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp Directly →</span>
                </a>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-white">Request Free Restaurant Onboarding</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Fill in your restaurant details below. Our team will verify and activate your dashboard.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-orange-400" />
                      <span>Restaurant / Cafe Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Biryani &amp; Cafe"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2.5 rounded-xl text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-400" />
                        <span>Owner / Manager Name *</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2.5 rounded-xl text-white font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-orange-400" />
                        <span>WhatsApp / Phone Number *</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2.5 rounded-xl text-white font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-400" />
                        <span>City / Location *</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mumbai, Delhi NCR, Jaipur"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2.5 rounded-xl text-white font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-orange-400" />
                        <span>Estimated Dining Tables</span>
                      </label>
                      <select
                        value={tablesCount}
                        onChange={(e) => setTablesCount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2.5 rounded-xl text-white font-medium focus:outline-none"
                      >
                        <option value="1-5 Tables (Small Cafe / QSR)">1-5 Tables (Small Cafe / QSR)</option>
                        <option value="6-15 Tables (Standard Dine-In)">6-15 Tables (Standard Dine-In)</option>
                        <option value="16-30 Tables (Large Restaurant)">16-30 Tables (Large Restaurant)</option>
                        <option value="30+ Tables (Hotel / Multi-floor / Resort)">30+ Tables (Hotel / Resort)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Any specific requirements? (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Need Hindi menu, UPI QR payments, or multi-kitchen KDS..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 px-3.5 py-2 rounded-xl text-white font-medium focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition active:scale-95 disabled:opacity-50"
                  >
                    {loading ? "Submitting Inquiry..." : "Submit Inquiry & Request Demo Call →"}
                  </button>

                  <p className="text-[10px] text-slate-500 text-center">
                    🔒 Your details are safe with us. Our founder team will connect via phone or WhatsApp.
                  </p>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Submission Success State */
          <div className="max-w-lg mx-auto bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                Inquiry Received Successfully ✓
              </span>
              <h2 className="text-2xl font-black text-white mt-3">
                Thank you, {ownerName || "Partner"}!
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                We have received your setup request for <strong className="text-white">&ldquo;{restaurantName}&rdquo;</strong> in <strong className="text-white">{city}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Restaurant Name:</span>
                <span className="font-bold text-white">{restaurantName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>WhatsApp Contact:</span>
                <span className="font-bold text-white">{phone}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Tables:</span>
                <span className="font-bold text-white">{tablesCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Response Time:</span>
                <span className="font-bold text-emerald-400">Within 15 minutes</span>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={getWhatsAppLink(`Hi ScanBite Team! I just submitted an onboarding inquiry for "${restaurantName}" in ${city} (Phone: ${phone}). Please activate our digital menu!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-600/30 transition active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp to Connect Immediately →</span>
              </a>

              <Link
                href="/"
                className="block text-xs font-bold text-slate-400 hover:text-white transition py-2"
              >
                ← Return to ScanBite Homepage
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-slate-600 border-t border-slate-900">
        ScanBite Restaurant Operations &amp; QR Ordering SaaS • Direct Inquiries &amp; Dedicated Onboarding
      </footer>
    </div>
  );
}
