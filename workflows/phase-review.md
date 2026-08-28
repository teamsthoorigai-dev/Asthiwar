# ASTHIWAR Phase Review & Verification Checklist

This workflow defines the verification protocol required before completing each implementation phase.

---

## 📋 Phase Review Checklist

1. **Architecture & File Placement:**
   - [ ] Backend code placed exclusively under `backend/src/`.
   - [ ] Database schemas & migrations placed under `database/src/` and `database/drizzle/`.
   - [ ] Shared configurations in root `.env` / `tsconfig.base.json`.

2. **Type Safety & Build Cleanliness:**
   - [ ] `npm run check-types` passes across all packages with 0 errors.
   - [ ] `npm run build` compiles with 0 errors.

3. **Database Integrity & Portability:**
   - [ ] Uses standard `node-postgres` pool with Drizzle ORM.
   - [ ] SSL configured properly for Neon PostgreSQL.
   - [ ] No hardcoded passwords or secrets in code.

4. **Security & Input Validation:**
   - [ ] Helmet & CORS configured.
   - [ ] All request payloads validated using Zod schemas.
   - [ ] Centralized error handler protects internal stack traces in production.

5. **Stop Rule:**
   - [ ] Complete only the requested phase and stop for review.
