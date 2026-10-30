# ScanBite — Global AI Workspace Memory Rule

Before writing code or executing tasks in this workspace, all AI agents and chats MUST follow these rules:

1. **Read `PROJECT_MEMORY.md` First:**
   Always inspect `PROJECT_MEMORY.md` in the project root to understand the current architecture, completed features, live URLs, and past bug fixes.

2. **Never Overwrite or Revert Existing Features:**
   Do not remove or break existing features such as:
   - Group Ordering & Live Table Cart (`/api/cart`)
   - Smart Split Bill with Dynamic UPI QR & WhatsApp share
   - Portion Variants & Addons Drawer
   - Super Admin at `/founder-hq` (Strict 404 at `/admin`)
   - Sound Alerts & Web Audio Synthesizer in Dashboard
   - Neon PostgreSQL database connection

3. **Verify with Build Before Concluding:**
   Always run `cmd /c "npm run build"` to guarantee 0 TypeScript and Next.js build errors before reporting completion.

4. **Update `PROJECT_MEMORY.md`:**
   Whenever a new feature is added or a bug is resolved, document it in `PROJECT_MEMORY.md` so subsequent chats and agents stay in sync.
