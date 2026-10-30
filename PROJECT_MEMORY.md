# ScanBite — Central Project Memory & Single Source of Truth
> **Rule for all AI Agents & Chats:** Read this file before touching any code. Never overwrite or remove completed features or past bug fixes listed here. When completing a task, update this document.

---

## 📌 Project Overview
- **Name:** ScanBite (Multi-Tenant Digital Menu & Restaurant Management SaaS)
- **Tech Stack:** Next.js 14 (App Router), React, Tailwind CSS, Prisma ORM, Neon PostgreSQL Cloud Database, Lucide Icons, Web Audio API, QRCode.
- **Production URL:** `https://scanbite-plum.vercel.app`
- **GitHub Repo:** `https://github.com/scanbite96-lab/scanbite.git` (branch: `main`)
- **Active Database:** Neon PostgreSQL (`ep-lingering-paper-a15wf59v-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`)

---

## 🔑 Key Routes & Portals
1. **Public Marketing & Demo:** `/`
2. **Customer Table QR Ordering:** `/r/[slug]/t/[table]`
   - Live Demo: `https://scanbite-plum.vercel.app/r/grand-spice/t/tbl-4`
3. **Restaurant Owner & Kitchen Dashboard:** `/dashboard`
   - Default Owner Password: `admin123`
   - Default Staff PIN: `1234`
4. **Super Admin Command Center:** `/founder-hq`
   - Secret URL: `/founder-hq` (Note: `/admin` returns a strict 404 for security)
5. **Restaurant Self-Onboarding:** `/register`

---

## ✅ Completed & Verified Features (Do NOT break or rewrite)

### 1. Customer QR Digital Menu (`/r/[slug]/t/[table]`)
- **Zero App Install:** Instant mobile web menu loaded via table QR code.
- **Bilingual:** 1-tap English / हिंदी toggle with real-time translation across the entire app.
- **Portion Sizes & Add-ons:** Portion sizes (Half / Full, Regular / Large) and optional add-ons with dynamic pricing drawer.
- **Group Ordering (Live Table Cart):**
  - Diners on the same table share a live synchronized table cart via `/api/cart`.
  - Diners can set/change their name (`👤 Aakash`, `👤 Rahul`).
  - Items in cart show `👤 Added by {dinerName}`.
  - Table invite button (`+ Invite`) copies direct table link for WhatsApp sharing.
- **Smart Split Bill (3 Modes with Dynamic UPI QR):**
  - **Full Bill:** QR code for total order amount.
  - **Equal Split:** Dynamic calculation (`Total / People`) with stepper (`-` and `+`) and instant QR code + GPay/PhonePe link.
  - **My Share / Item-wise:** Filters dishes by diner name, calculates their exact share + tax, and generates custom UPI QR code.
  - **WhatsApp Share:** 1-tap share with itemized breakdown and UPI pay link.
- **Table Vacate / Reset:** Customer can reset the table session after meal to start fresh.
- **Service Buttons:** Anti-spam 15s cooldown pings for Water 💧, Waiter 🛎️, Bill 🧾.
- **Live Order Timeline:** Real-time status tracker (Placed ⏳ -> Cooking 👨‍🍳 -> Ready 🔔 -> Served ✅).
- **Meal Rating:** 5-Star feedback with automatic Google Review prompt for 4+ stars.

### 2. Kitchen & Owner Dashboard (`/dashboard`)
- **Kitchen Display System (KDS):** Live order cards with item checklist, portion sizes, add-ons, and diner names (`👤 {orderedByName}`).
- **Thermal KOT Slip:** One-click ESC/POS styled thermal print modal including `(Diner: {orderedByName})`.
- **Sound Alert (Beep / Chime):** Web Audio Synthesizer loud double-chime on incoming orders with Sound ON/OFF toggle in navbar.
- **Menu Management:** Add, edit, delete dishes, toggle "In Stock" / "Sold Out", manage portion variants and add-ons.
- **Table Management & QR Tent Cards:** Add/delete tables and 1-click printable QR tent cards with high-res QR codes.
- **Sound & Credentials Settings:** Change Owner Password, Staff PIN, and store info.

### 3. Super Admin Command Center (`/founder-hq`)
- **Global Overview:** Total platform revenue, active restaurants, active orders, and monthly recurring revenue.
- **Tenant Management:** Approve, suspend, or delete restaurants.
- **Global Feature Toggles:** Master switches for platform-wide features.

---

## 🛡️ Past Bugs Fixed & Architectural Rules (CRITICAL)

1. **Phantom Audio Chime:**
   - Sound only plays for *newly placed* or *ready* orders, never in a phantom loop. AudioContext starts only after user interaction.
2. **Super Admin Route Security:**
   - Public route `/admin` returns a strict 404. All super admin controls are at `/founder-hq` with session checks.
3. **Database Fallback:**
   - When loading demo slug `grand-spice`, if database is temporarily unreachable, it seamlessly falls back to `DEMO_RESTAURANT` in `src/lib/demoData.ts`.
4. **Prisma & Windows Node Process:**
   - Never run `npx` directly in restricted PowerShell; use `node node_modules/prisma/build/index.js [cmd]` or `cmd /c`.
5. **Table Cart Auto-Cleanup:**
   - Diners older than 2 hours are automatically cleaned up in `/api/cart`.
   - Table cart items are automatically cleared when master order is submitted to kitchen.

---

## 📋 Next Tasks Backlog (ROADMAP)
- **[P-08] Staff / Waiter Mobile PIN Mode:** Dedicated mobile view for waiters with buzzers.
- **[P-07] Table Floor Plan & Visual Grid:** Interactive colored table grid (🟢 Vacant, 🔴 Occupied, 🟡 Dirty).
- **[P-09] Daily Inventory Stock Count & Auto-Sold-Out:** Set daily batch limits (e.g. 20 plates Biryani).
- **[P-16] Razorpay Webhook Auto-Verification:** Automatic payment reconciliation.
