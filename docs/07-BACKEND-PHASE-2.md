# 07 — Backend (Phase 2)

**Do not start this until the frontend is complete and signed off.** That was the
explicit decision: build the frontend first, then move or rebuild the backend.

---

## 1. What already exists

`C:\Users\sunda\Desktop\Asthivar\asthiwar-v1-main` is an npm-workspaces monorepo:

```
database/   Drizzle ORM schema + migrations + seed, targeting Neon serverless Postgres
backend/    Express + TypeScript, module-per-domain
web/        the old Next.js frontend (being replaced)
```

**Backend modules** (`backend/src/modules/`):
`admin` · `auth` · `calculator` · `enquiries` · `health` · `notifications` · `pdf`

**Routes** (`backend/src/routes/`):
`admin.routes` · `admin-config.routes` · `auth.routes` · `calculator.routes` ·
`enquiries.routes` (plus health)

**Schema** (`database/src/schema/`): `addons` · `admin` · `auditLogs` · `calculator`
(and more — read the directory before planning migrations).

**Environment** (`.env.example`):
```
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://…neon.tech/neondb?sslmode=require
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
SESSION_SECRET=…min 32 chars
```

The backend is genuinely built, not a stub. Rewriting it from scratch would be waste.

---

## 2. Recommended approach — move, don't rewrite

Convert this repo into the same workspace shape and copy `backend/` and `database/`
across wholesale.

```
Rework-asthivar…/
├─ package.json          workspaces: ["database", "backend", "web"]
├─ tsconfig.base.json    copy from the old repo
├─ database/             copy as-is
├─ backend/              copy as-is (delete dist/, rebuild)
└─ web/                  the new frontend, moved from the repo root into web/
```

Copy `package.json` scripts from the old root — `dev:backend`, `dev:web`, `build`,
`db:generate`, `db:migrate`, `db:seed`, `check-types`, `test` are all already written.

**Alternative** — keep the frontend standalone and expose the backend at a separate
origin (`api.asthiwar.com`). Simpler deploy story, but you lose the single `npm run dev`.
Choose the monorepo unless there is a hosting reason not to.

### Migration order

1. Copy `database/` and `backend/`, delete both `dist/` folders, `npm install` at the root.
2. Move the new frontend into `web/`, fix the import alias.
3. Copy `.env.example` to `.env`, point `DATABASE_URL` at Neon.
4. `npm run db:migrate && npm run db:seed`.
5. `npm run dev:backend` — hit `/health` and confirm it responds.
6. Only then start swapping the frontend stubs.

---

## 3. The swap — three functions, one file

The entire Phase 1 frontend talks to the outside world through `src/lib/api.ts`.
Phase 2 replaces the bodies and nothing else.

```ts
export async function createEstimate(input: EstimateInput): Promise<EstimateResult> {
  const res = await fetch(`${API_BASE}/api/v1/calculator/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPayload(input)),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return fromApiResult(await res.json());
}

export async function submitEnquiry(payload: EnquiryPayload) {
  const res = await fetch(`${API_BASE}/api/v1/enquiries`, { … });
  …
}

export async function downloadEstimatePdf(estimateNumber: string) {
  // GET /api/v1/calculator/estimate/:estimateNumber/pdf  -> streams a 2-page PDF
}
```

### The one thing that will bite you

The frontend engine and the backend engine must produce **identical** numbers.
The backend is authoritative; the frontend engine exists for instant feedback.

- Round only at the milestone step, in both.
- Use the same location multipliers, in both — read them from the API at build time
  rather than duplicating the table, or you will get drift the first time someone
  edits a rate in the admin panel.
- Write a parity test: run 50 random inputs through both engines and assert equality.
  Do this on day one of Phase 2, not after launch.

Once the API is live, `createEstimate` should call the backend and use the local engine
only as an optimistic preview while the request is in flight.

---

## 4. What unlocks when the backend lands

| Frontend feature | Currently | After Phase 2 |
|---|---|---|
| Estimate ID | Generated client-side, labelled "preview" | Real immutable `EST-2026-XXXXXX`, persisted |
| PDF | `window.print()` | Streamed 2-page vector PDF from `/pdf` |
| Enquiry form | Logs and resolves | Written to Postgres, sales alert fired |
| "Email me this estimate" | Stubbed | Real dispatch |
| Admin — Enquiries | Mock table | Live data |
| Admin — Estimates | Mock table | Live, with full calculation snapshots |
| Admin — Pricing config | Local state, "not persisted" banner | Real writes, feeding the calculator |
| Admin — Audit logs | Mock | Real event stream |
| Admin — auth | None | Session auth via `auth.routes` |

**Remove the "preview / not persisted" banners as each one becomes real.** They are
honesty markers, not decoration — leaving them up once the data is live is its own bug.

---

## 5. Security checklist before going live

- [ ] `SESSION_SECRET` regenerated — never ship the value in `.env.example`
- [ ] `CORS_ORIGIN` set to the real production domain only
- [ ] `DATABASE_URL` in the host's secret store, never committed
- [ ] `/admin` behind real authentication, and `noindex`
- [ ] Rate limiting on `POST /api/v1/enquiries` and `POST /api/v1/calculator/estimate`
- [ ] Server-side validation of every calculator input — never trust the client's maths
- [ ] Estimates and enquiries hold personal data: confirm retention policy and a deletion path
- [ ] `npm audit` clean; the old repo's `node_modules` is months old
- [ ] Check `docs/Audit/ASTHIWAR_CODE_AUDIT_REPORT.md` and
      `ASTHIWAR_LOGIC_AND_PROBLEMS_AUDIT.md` in the old repo — someone already wrote
      down the known problems. Read them before trusting the backend.

---

## 6. Reference docs in the old repo

Worth reading before Phase 2 begins:

| File | Why |
|---|---|
| `docs/COMPLETE_CALCULATOR_FLOW.md` | The authoritative calculator spec — formulas, payloads, milestone table |
| `docs/BACKEND_ARCHITECTURE_AND_FLOW.md` | How the Express modules fit together |
| `docs/DATABASE_ARCHITECTURE_AND_SCHEMA.md` | Table structure and relationships |
| `docs/PHASE_WALKTHROUGHS.md` | How the previous build was sequenced |
| `docs/Audit/` | Known bugs and logic problems — read this first |
