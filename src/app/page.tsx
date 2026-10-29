"use client";

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
  Users
} from "lucide-react";

export default function SaaSPlatformHome() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-600/30">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">ScanBite</span>
              <span className="text-[10px] ml-1.5 font-bold uppercase tracking-widest text-orange-400 bg-orange-950/60 border border-orange-800/60 px-1.5 py-0.5 rounded">
                SaaS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-orange-400 border border-orange-500/30 transition active:scale-95"
            >
              <span>Get ScanBite (Free Demo)</span>
            </Link>
            <Link
              href="/dashboard?demo=true"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-orange-600/25 transition active:scale-95 flex items-center gap-2"
            >
              <span>Explore Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-600/20 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-950/50 border border-orange-500/30 text-orange-400 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Restaurant Digital Ordering System
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-tight">
            Turn Every Table Into A <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
              Self-Ordering Machine
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Diners scan the table QR code, browse high-res photos, and place orders directly from their phones.
            Zero waiter bottlenecks, zero printed menu reprints, and 30% faster table turnover.
          </p>

          {/* Interactive Live Demo Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/r/grand-spice/t/tbl-4"
              target="_blank"
              className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              <span>📱 Customer QR Menu (Table 4 Demo)</span>
            </Link>

            <Link
              href="/dashboard?demo=true"
              target="_blank"
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl border border-slate-700/80 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <ChefHat className="w-5 h-5 text-orange-400" />
              <span>🍳 Live Kitchen &amp; Owner Console (Instant Demo)</span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">0 sec</div>
              <div className="text-xs text-slate-400 mt-1">App Install Friction (PWA)</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-orange-400">+25%</div>
              <div className="text-xs text-slate-400 mt-1">Higher Avg Order Value</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">80%</div>
              <div className="text-xs text-slate-400 mt-1">Waiter Load Reduction</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">1-Tap</div>
              <div className="text-xs text-slate-400 mt-1">Instant Kitchen KOT Push</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section id="features" className="py-20 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Powerful Features</h2>
            <p className="text-3xl font-extrabold text-white">Engineered For Busy Restaurants & Cafes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Table-Specific Dynamic QR Codes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate high-resolution printable tent cards for each table. The system automatically tags orders with the table number (e.g. Table 4).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Kitchen Display System (KDS)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chefs receive incoming orders on a tablet with table numbers, timestamps, and custom cooking instructions (e.g. &ldquo;less spicy&rdquo;).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1-Tap Service Alerts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Diners can request drinking water, summon a waiter, or ask for the bill with one tap, triggering an instant notification on the staff console.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant &ldquo;Sold Out&rdquo; Stock Toggle</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Finished the special Biryani? Toggle it off from the dashboard in 1-second so customers never place orders for unavailable food.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Direct UPI & Cash Options</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Allow customers to pay via UPI (PhonePe, GPay, Paytm) directly to your restaurant VPA, or settle in cash at the counter.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-orange-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Order Status Tracker</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers stay updated as the kitchen accepts their order, starts cooking, and marks it ready for service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Effortless Flow</h2>
            <p className="text-3xl font-extrabold text-white">How ScanBite Works In 3 Simple Steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative hover:border-orange-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-black flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Guest Scans Table QR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers sit at their table and scan the stylish tent card with their smartphone camera. No app download or sign-up needed.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Browse & Customize Order</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Diners view mouthwatering dish photos, filter veg/non-veg, choose spice levels, add custom cooking notes, and apply coupons.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Live Kitchen Push & Pay</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Orders instantly appear on the chef&apos;s tablet with sound chimes. Diners track cooking in real time and pay via UPI or cash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">SaaS Pricing</h2>
            <p className="text-3xl font-extrabold text-white">Simple, Affordable Plans For Every Food Business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Starter Cafe</span>
                <div className="text-3xl font-black text-white mt-2">₹499 <span className="text-xs font-normal text-slate-400">/month</span></div>
                <p className="text-xs text-slate-400 mt-2">Ideal for small cafes, juice bars, and fast food joints.</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Up to 10 Table QRs</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Digital Menu with photos</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Self-Ordering to Kitchen</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Waiter Calling button</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs text-center transition block"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Plan 2: Popular */}
            <div className="bg-gradient-to-b from-orange-950/40 to-slate-900 border-2 border-orange-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-orange-500/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                Most Popular
              </span>

              <div>
                <span className="text-xs font-bold uppercase text-orange-400">Pro Restaurant</span>
                <div className="text-3xl font-black text-white mt-2">₹1,199 <span className="text-xs font-normal text-slate-400">/month</span></div>
                <p className="text-xs text-slate-400 mt-2">For dine-in family restaurants, restobars, and breweries.</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-400" /> Unlimited Table QR codes</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-400" /> Live Kitchen Display (KDS)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-400" /> Audio Beep alerts for new orders</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-400" /> 1-Click Out-of-Stock Disabling</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-400" /> Direct UPI Table Payments</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl text-xs text-center transition shadow-lg shadow-orange-500/25 block"
              >
                Get Started with Pro
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Hotel & Chains</span>
                <div className="text-3xl font-black text-white mt-2">₹2,499 <span className="text-xs font-normal text-slate-400">/month</span></div>
                <p className="text-xs text-slate-400 mt-2">For luxury dining, multi-outlets, and resort room dining.</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Multi-branch / Multi-room ordering</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Thermal KOT printer integration</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Custom branding & domain</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Dedicated Account Manager</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs text-center transition block"
              >
                Start Free Enterprise Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© 2026 ScanBite SaaS Platform. Built for modern food & hospitality businesses.</p>
      </footer>
    </div>
  );
}
