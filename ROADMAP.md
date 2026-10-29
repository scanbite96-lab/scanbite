# ScanBite — Product Roadmap & Pending Tasks

This document tracks all completed features and pending backlog items for the ScanBite SaaS platform.

## ⏳ Pending Tasks Backlog (Saved for Later)

### 🔐 Security & Access Control
1. **[P-08] Staff & Waiter Mobile PIN Mode:** Fast 4-digit PIN access for floor waiters with vibrating buzzer notifications on table pings and simplified order status controls.
2. **[P-21] Role-Based Access Control (RBAC):** Tiered permissions for Owner (Full Access), Manager (Menu/Coupons/Settings), Kitchen Chef (KDS only), and Captain/Waiter (Floor alerts only).

### 🍔 Menu & Diner Experience
4. **[P-06] Item Modifiers & Variants:** Support for portion sizes (Half / Full, Regular / Large), add-ons (Extra Cheese +₹40, Extra Dip), and customization groups.
5. **[P-10] Group Ordering & Split Bill:** Multi-user shared table cart via table QR, allowing diners at the same table to add items simultaneously and split the bill (Equal or Item-wise).
6. **[P-11] 1-Tap Quick Re-order:** Quick add button on active order tracking screen for instant repeat items (e.g. extra Naan, Cold Drinks, Water) without browsing the entire menu.
7. **[P-12] Dietary & Allergen Badges:** Badges and filtering for Jain, Vegan, Gluten-Free, Halal, and Nut-Allergy safety indicators.
8. **[P-13] AI Food Recommendation Assistant ("Smart Waiter"):** In-app conversational AI recommendation widget (e.g. "Suggest dinner under ₹400", "Best non-spicy starters").

### 👨‍🍳 Kitchen & Floor Operations
9. **[P-04] Direct Thermal KOT Printer Integration:** Automatic ESC/POS printing on 2-inch or 3-inch thermal receipt printers immediately when an order is placed.
10. **[P-07] Table Floor Plan & Visual Grid:** Interactive visual floor plan showing live status: 🟢 Vacant, 🔴 Occupied (Running Bill & time seated), 🟡 Needs Cleaning.
11. **[P-09] Daily Portion Inventory & Auto Sold-Out:** Set daily quantity limits per item (e.g. 25 Biryanis); auto-decrements on order and auto-marks "Sold Out" at 0.

### 📲 Engagement & Retention
12. **[P-05] WhatsApp Bill & Order Updates:** Automated order confirmation, live order tracking link, and digital e-bill PDF sent to customer's WhatsApp number.
13. **[P-15] Customer Loyalty & Cashback Points:** Phone-number-based loyalty wallet rewarding repeat visits (e.g. 5% cashback or free dessert on 5th order).

### 💳 Payments & Finance
14. **[P-16] Payment Gateway Webhook Auto-Verification:** Instant automatic reconciliation and order verification via Razorpay / Cashfree webhooks without manual counter checks.
15. **[P-17] Audio Soundbox Voice Announcement:** Browser Web Speech API announcement for payments (e.g. "Table 4 se ₹650 prapt hue").
16. **[P-19] Excel & GST Tally Report Export:** 1-click download of itemized sales, tax collections, and payment breakdown in Excel (.xlsx) / CSV format.

### 🏢 Cloud & SaaS Infrastructure
17. **[P-03] Permanent 24/7 Hosting (Vercel + Neon/Supabase PostgreSQL):** Full production cloud deployment with permanent domain.
18. **[P-14] SaaS Multi-Tier Subscriptions & Billing:** Automated subscription paywall with Free Trial (14 days), Starter (₹999/mo), and Pro (₹2,499/mo) plans.
19. **[P-18] Peak Hours Heatmap & Table Turnaround Time (TAT) Analytics:** Deep operational analytics on rush hours, average prep time, and table occupancy duration.
20. **[P-20] Custom Domain / Subdomain Support:** Enable restaurants to use custom domains (e.g. `order.thegrandspice.com`).

---

## ✅ Completed Features (Active & Ready)
- **[P-02] Dashboard Owner Password Login & Staff 4-Digit PIN Authentication:**
  - Secure partner login page protecting `/dashboard` with session cookies (`scanbite_auth_token`).
  - Owner login with Email / Slug + Password (`admin123`).
  - Staff / Waiter quick access with 4-Digit PIN (`1234`).
  - 1-Tap fast demo login buttons for instant testing.
  - Sign Out button in top header bar.
  - Database-backed Security & Credentials update in Settings tab (Change Owner Password, Staff PIN, Owner Email/Name).
  - New restaurant registration (`/register`) automatically creates credentials and auto-logs in.
- Table-wise QR digital ordering with zero app install
- Bilingual Multi-Language Support (English / हिंदी toggle with 1-tap translation)
- Smart Upselling / Cross-Selling carousel in cart ("Frequently Ordered Together")
- Discount Promo Codes System (`WELCOME10`, `FLAT50`, `TASTE20`)
- Post-Meal 5-Star Ratings & Google Review Growth Booster
- Kitchen Order Ticket (KOT) Thermal Slip Preview & 1-Click Print
- Live Business Analytics & Sales Dashboard (Revenue, Orders, AOV, Top Dishes)
- Kitchen Loud Audio Chime (Web Audio Synthesizer Beep) on incoming orders for kitchen staff
- Multi-Tenant Restaurant Switcher & Real Database Settings persistence
- Dynamic Per-Order UPI QR Codes & Instant Payment Verification Stepper
- 1-Click Menu Item Deletion & Table Addition/Deletion management
- Veg/Non-Veg filter, search, category pills, spice meters
- Item-wise custom cooking notes & cart calculation with GST
- 1-Tap Waiter/Water/Bill pings
- Live order timeline tracking for diners
- Kitchen Display System (KDS) with audio chime alert & 1-click status stepper
- 1-Click "In Stock" / "Sold Out" dish toggle
- Table QR tent cards generator & 1-click printing
- Relational database backend (Prisma ORM + SQLite)
- Self-serve restaurant registration (`/register`)
