# ScanBite — Autonomous Workspace Rules & Memory Protocol

> **CRITICAL DIRECTIVE FOR ALL AI AGENTS WORKING IN THIS PROJECT:**
> This repository is a multi-module production SaaS (`ScanBite`). You are operating as an expert pair programmer. Follow these rules automatically without requiring the user to prompt you.

---

## 1. Automatic Pre-Task Memory Check (Do This First)
Before writing or modifying any code for ANY request:
- **Silently inspect `PROJECT_MEMORY.md`:** Check the architecture, active database setup (Neon PostgreSQL), completed features, and past bug fixes.
- **Check Git History:** Run `git log -n 5 --oneline` and `git status` to see what another agent or thread recently committed.
- **Preserve Documentation Integrity:** Do not undo or wipe out previous modules (Super Admin `/founder-hq`, Owner Dashboard `/dashboard`, Customer QR Menu `/r/[slug]/t/[table]`, Group Ordering `/api/cart`, Split Bill dynamic QR, Portion Variants & Addons).

---

## 2. Safe Execution & Zero-Regression Rule
- Before touching core API routes (`/api/orders`, `/api/cart`, `/api/restaurants`, `/api/menu`), verify that changes do not break existing frontend dependencies.
- Never hardcode mock data if live database queries are expected, but maintain robust fallbacks for demo restaurant (`grand-spice`).
- Never delete or bypass access controls (e.g. `/admin` must remain a strict 404, Super Admin is only at `/founder-hq`).

---

## 3. Automatic Post-Task Protocol (Run Every Time)
When you finish implementing, fixing, or modifying any code:
1. **Build Verification:** Always run `cmd /c "npm run build"` to verify that 100% of pages compile with 0 TypeScript/Next.js errors.
2. **Update `PROJECT_MEMORY.md`:** If you added a new feature or fixed a bug, add it to `PROJECT_MEMORY.md` so subsequent agents know it is done.
3. **Commit & Deploy:** Stage modified files, create a concise descriptive commit, and run `git push origin main` so changes deploy to Vercel (`scanbite-plum.vercel.app`).
4. **Report Concisely:** Give the user a clear, friendly confirmation of what was changed and verified.
