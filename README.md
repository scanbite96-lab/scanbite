# ScanBite — Multi-Tenant QR Menu & Digital Table Ordering SaaS

A modern, fast, full-stack B2B SaaS platform for restaurants, cafes, and hotels. Diners can scan table-specific QR codes, browse rich menus with photos and dietary filters, place orders directly to the kitchen, and call waiters without downloading any mobile app.

---

## 🌟 Key Features

### 1. 📱 Customer Web Experience (Zero-Install PWA)
- **Table-specific URL**: e.g., `/r/grand-spice/t/tbl-4` (Table 4)
- **Veg / Non-Veg filter toggle** & Real-time search
- **Spice level meter (🌶️) & Custom cooking notes** (e.g. "Less spicy", "No onion")
- **Live Order Progress Tracker**: Received $\rightarrow$ Cooking $\rightarrow$ Ready $\rightarrow$ Served
- **1-Tap Waiter Pings**:
  - 💧 *Request Drinking Water*
  - 🛎️ *Call Waiter to Table*
  - 🧾 *Request Final Bill*
- **Payment Options**: UPI / QR payment or Cash at Counter

### 2. 👨‍🍳 Restaurant Kitchen & Staff Operations (`/dashboard`)
- **Live Kitchen Display System (KDS)**:
  - Real-time ticket feed with table number, time elapsed, item checklist, and cooking notes.
  - One-click workflow: `Start Cooking` $\rightarrow$ `Mark Ready` $\rightarrow$ `Mark Served`.
- **Instant Out-of-Stock Toggle**:
  - Disable any finished dish in 1-second from the dashboard to prevent diner orders.
- **Table QR Code Generator & Standee Printer**:
  - Live QR code generator for Table 1 to 20+.
  - Print-ready acrylic tent card templates formatted for printing.
- **Real-Time Waiter Alert Banner**:
  - High-priority feed showing table requests ("Table 3 needs water") with one-click clear button.

### 3. 🏢 Free Self-Serve Restaurant Onboarding (`/register`)
- Any new restaurant owner can register their cafe in under 2 minutes.
- Auto-generates table QR codes and a starter menu ready to customize.

### 4. 🗄️ 100% Free Database Backend (Prisma + SQLite / PostgreSQL)
- **Zero Hosting & Database Cost**: Runs on SQLite locally (`file:./dev.db`), and can instantly connect to free PostgreSQL on Supabase/Neon for production deployment.
- **Multi-Tenant Architecture**: Each restaurant's data is isolated and safely separated.

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Seed the SQLite database with initial demo restaurant
node prisma/seed.js

# Build production bundle
npm run build

# Start production server
npm run start
```

Access the application in your browser:
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Register New Restaurant**: [http://localhost:3000/register](http://localhost:3000/register)
- **Restaurant Kitchen Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Customer Menu Demo (Table 4)**: [http://localhost:3000/r/grand-spice/t/tbl-4](http://localhost:3000/r/grand-spice/t/tbl-4)
