# ASTHIWAR DESIGN & BUILD — Comprehensive Backend Architecture, Request Lifecycle & Feature Specification

**Document Version:** 1.0.0  
**Target Environment:** Node.js (ESM), Express.js, TypeScript, Neon Serverless PostgreSQL, Drizzle ORM  
**Repository:** `asthiwar-v1` (Monorepo Backend Service)

---

## 1. System Architecture Overview

The ASTHIWAR backend is a high-performance, modular TypeScript service designed to deliver **100% authoritative construction estimation**, live pricing configuration, multi-channel customer quotation delivery, administrative CRM, and audit logging.

```
                                  ┌──────────────────────────────────────────────────────────┐
                                  │                      CLIENT LAYERS                       │
                                  │   (Public 5-Step React Wizard & Admin Management Portal) │
                                  └────────────────────────────┬─────────────────────────────┘
                                                               │ HTTP / JSON / Cookies / PDF Stream
                                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                 EXPRESS APPLICATION                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Security & Pre-Processing Middlewares]                                                                               │
│  ├── Helmet (HTTP Security Headers)                                                                                    │
│  ├── CORS (Configured origin whitelisting)                                                                             │
│  ├── Morgan (Structured HTTP access logging)                                                                           │
│  ├── Cookie-Parser (HttpOnly session token extraction)                                                                 │
│  ├── Express Rate Limiters (Global API & Strict Auth limiters)                                                         │
│  └── Express JSON Body Parser (Strict 2MB payload cap)                                                                 │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Routing & Request Validation Layer]                                                                                  │
│  ├── /api/v1/health                  ──> HealthController (Uptime, Environment, Node version)                          │
│  ├── /api/v1/calculator/*            ──> CalculatorController (Packages, Locations, Preview, Estimate, PDF)            │
│  ├── /api/v1/enquiries               ──> EnquiriesController (Lead Capture, Consultation Booking)                       │
│  ├── /api/v1/admin/auth/*            ──> AuthController (Login, Logout, Session Verification)                          │
│  ├── /api/v1/admin/config/*          ──> AdminConfigController (Packages, Milestones, Brand CRUD, Cities, Add-Ons)      │
│  └── /api/v1/admin/*                 ──> AdminController (CRM Enquiries, Estimates Explorer, Analytics, Audit Logs)   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Business Service Layer]                                                                                              │
│  ├── CalculatorService (Area normalization, volume discount rules, city multipliers, 10-stage milestones)             │
│  ├── AuthService (Bcrypt 12-round hashing, 7-day token issuance, session store management)                             │
│  ├── AdminService (CRM lead processing, estimate queries, aggregate revenue analytics)                                │
│  ├── AdminConfigService (Package rates, per-package brand options, milestones, city factors)                                   │
│  ├── PdfService (PDFKit multi-page vector quotation rendering & streaming)                                             │
│  ├── NotificationService (Omnichannel Email & WhatsApp delivery, sales lead alerts, retry workers)                    │
│  └── AuditService (Asynchronous PostgreSQL event logging, recursive sensitive-field redaction)                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Data Access & Persistence Layer (Drizzle ORM & Neon Serverless PostgreSQL)]                                         │
│  ├── admin_users, admin_sessions, locations, packages, package_prices, categories, items, options, option_prices       │
│  └── package_items, addons, addon_prices, estimates, estimate_items, estimate_addons, enquiries, notifications, audit_logs│
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Global Error & Interception Middleware]                                                                              │
│  └── ErrorHandler (Zod validation formatting, 4xx/5xx normalization, asynchronous PostgreSQL audit persistence)       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Request Lifecycle & Flow

Every inbound HTTP request progresses through a standardized pipeline:

```
[Inbound Request]
       │
       ▼
1. Helmet & CORS Protection
       │
       ▼
2. Rate Limiting Check (429 Too Many Requests if rate exceeded)
       │
       ▼
3. Cookie & JSON Body Parser
       │
       ▼
4. Route Dispatcher (/api/v1/*)
       │
       ▼
5. Zod Schema Validation (validateRequest middleware)
       ├── Failed ──> 400 Bad Request with path-level error array & automatic Audit Log
       └── Passed ──┐
                    ▼
6. Authentication & Role Guard (requireAdminAuth middleware for /admin/*)
       ├── Missing/Expired Session ──> 401 Unauthorized / 403 Forbidden & automatic Audit Log
       └── Valid Session ───────────┐
                                    ▼
7. Module Controller Invocation (Try-Catch Protected)
       │
       ▼
8. Authoritative Service Execution (Calculations, Database Queries, PDF Streaming)
       │
       ▼
9. Asynchronous Audit Logging & Notification Dispatch (Non-blocking background tasks)
       │
       ▼
10. HTTP Response Delivered (200 OK / 201 Created / PDF Stream)
       │
       ▼ (If Uncaught Exception Occurs)
11. Global Error Handler Intercepts ──> Redacts stack ──> Inserts into audit_logs ──> 500 JSON Response
```

---

## 3. Detailed Features by Module

### 🧮 Module 1: Authoritative Calculation Engine (`/api/v1/calculator`)

The calculation engine (`calculator.service.ts`) is the central authority for all construction pricing. **No frontend pricing math is ever trusted.**

1. **Area Unit Normalization:**
   - **`sqft`:** Direct 1.0 multiplier.
   - **`cents`:** Multiplied by `435.6` (1 Cent = 435.6 Sq.Ft in Tamil Nadu land measurement).
   - **`sqyards`:** Multiplied by `9.0` (1 Sq.Yard = 9 Sq.Ft).
2. **Total Built-Up Area Formula:**
   $$\text{Total Built-Up Sq.Ft} = (\text{Built-Up Area Per Floor} \times \text{Number of Floors}) + \text{Car Parking Area Sq.Ft}$$
   - Floor multipliers: `Ground` = 1, `G+1` = 2, `G+2` = 3, `G+3` = 4.
3. **Volume Discount Engine:**
   - Evaluates whether $\text{Total Built-Up Sq.Ft} > 3,500\text{ sq.ft}$.
   - If triggered, pulls `volumePricePerSqft` from active package pricing instead of `standardPricePerSqft`.
4. **City Material & Labor Multipliers:**
   - Fetches active location multiplier from `locations` table (e.g., Chennai = 1.05, Coimbatore = 1.00, Madurai = 0.98, Pollachi = 0.96).
   - Calculated as:
     $$\text{Effective Base Rate/Sq.Ft} = \text{Package Rate} \times \text{Location Multiplier}$$
     $$\text{Base Construction Cost} = \text{Total Built-Up Sq.Ft} \times \text{Effective Base Rate/Sq.Ft}$$
5. **Brand Customizations & Upgrades:**
   - Evaluates chosen options against default package specs.
   - Computes upgrade deltas ($\Delta \text{ per sq.ft} \times \text{Total Built-Up Sq.Ft}$ or flat item additions).
6. **15 Infrastructure Add-Ons Engine:**
   - Calculates dynamic add-on totals across 15 distinct construction items (Underground sumps, septic tanks, overhead tanks, compound walls, passenger lifts, solar power systems, modular kitchens, CCTV surveillance, EV charging, landscape development, rainwater harvesting, teak entrance doors, false ceiling, UPVC window mesh, exterior elevation stone claddings).
7. **10-Stage Civil Milestone Payment Schedule:**
   - Generates a strictly balanced payment milestone schedule summing to **exactly 100.0%**:
     1. **Stage 1 (3%):** Design & Approvals (Soil testing, DTCP architectural floor plans).
     2. **Stage 2 (4%):** Earthwork & Excavation (Anti-termite foundation treatment).
     3. **Stage 3 (15%):** Foundation & Plinth (Footing concrete, plinth beams, basement filling).
     4. **Stage 4 (22%):** RCC Structure (Columns, roof slab shuttering, beam reinforcement & curing).
     5. **Stage 5 (14%):** Brickwork & Masonry (Red brick / solid block walls, lintels, parapet).
     6. **Stage 6 (8%):** Electrical & Plumbing Concealing (Conduits, wiring boxes, drainage routing).
     7. **Stage 7 (10%):** Plastering (Internal wall leveling, exterior weather-coat plaster).
     8. **Stage 8 (11%):** Flooring & Wall Tiling (Vitrified tiles, bathroom tiles, granite countertops).
     9. **Stage 9 (8%):** Painting & Woodwork (Putty, primer, emulsion coats, door installations).
     10. **Stage 10 (5%):** Fixtures, Finishing & Handover (Sanitary fittings, switchboards, deep clean).
8. **Live Persistence & Estimate Snapshot:**
   - Generates formatted estimate identifier `EST-YYYY-XXXXXX` (e.g., `EST-2026-876644`).
   - Persists immutable JSON snapshot (`fullSnapshotJson`) into `estimates` table along with itemized relational records in `estimate_items` and `estimate_addons`.

---

### 📋 Module 2: Enquiries & Lead Capture (`/api/v1/enquiries`)

Manages public customer consultations and consultation booking requests:

1. **Lead Recording:** Captures customer contact information, site city location, preferred consultation time slot, and customized architectural notes.
2. **Quotation Association:** Automatically links the enquiry to an active `estimateNumber` if generated via the cost calculator.
3. **CRM Status Workflow:** Tracks lead lifecycle (`NEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `CLOSED` or `ARCHIVED`).
4. **Automated Alert Dispatch:** Automatically sends an instant sales notification to administrators upon submission.

---

### 🔐 Module 3: Security & Admin Authentication (`/api/v1/admin/auth`)

Provides enterprise-grade security for the administrative control center:

1. **Password Hashing:** 12-round salted Bcrypt hashing via `bcrypt.hash()` and `bcrypt.compare()`.
2. **Session Token Management:**
   - Generates cryptographic random session tokens (64-byte hex).
   - Records session lifecycle in `admin_sessions` with 7-day expiration (`expires_at = NOW() + 7 days`).
3. **HttpOnly Cookie Security:**
   - Issues `admin_session_token` via `res.cookie()` with `httpOnly: true`, `sameSite: 'lax'`, and `secure` in production.
4. **Session Revocation:** Logout immediately updates `admin_sessions.revokedAt = NOW()`.
5. **Rate Limiting:** Protects `/api/v1/admin/auth/login` with strict brute-force limits (5 attempts per 15 minutes).

---

### 📊 Module 4: Admin Management & Analytics (`/api/v1/admin`)

Empowers administrators to manage operations and track business performance:

1. **Executive Dashboard Analytics (`/analytics/dashboard`):**
   - **Total Pipeline Value:** Cumulative sum of all created estimates.
   - **Total Estimates & Average Estimate Value:** Track lead size and trend.
   - **Total Enquiries & New Leads Count:** Operational CRM indicators.
   - **Lead Conversion Rate:** $\frac{\text{Total Enquiries}}{\text{Total Estimates}} \times 100\%$.
   - **Package Popularity Breakdown:** Distribution volume and total value across Basic, Standard, Premium, and Luxury tiers.
2. **Leads CRM Manager (`/enquiries`):**
   - Paginated querying, text searching (name, phone, email), and status filtering.
   - Internal notes updating and priority adjustment (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
   - Direct lead alert trigger (`POST /enquiries/:id/notify`).
3. **Estimates Explorer (`/estimates`):**
   - Filter by package tier, search by customer details or estimate number.
   - Deep inspection of raw calculation snapshots.
   - On-demand quotation re-dispatch via Email / WhatsApp.

---

### ⚙️ Module 5: Versioned Pricing Matrix Engine (`/api/v1/admin/config`)

Strictly adheres to **Mandatory Architecture Rules 7 & 8** for audit integrity:

> [!IMPORTANT]
> **Pricing Immutability Principle:** When an admin adjusts pricing, existing database rows are **NEVER overwritten or deleted**. The current active row's `effectiveTo` timestamp is set to `NOW()`, and a brand-new row is inserted with `effectiveFrom = NOW()` and `effectiveTo = NULL`. Past estimates remain 100% reproducible and verifiable against historical rates.

1. **Package Rates:** Updates `pricePerSqft` and `volumePricePerSqft` with versioned tracking.
2. **City Multipliers:** Modifies location cost index or activates/deactivates specific Tamil Nadu regions.
3. **15 Add-Ons Catalog:** Updates unit prices across tier variations (`basic_standard`, `premium_luxury`).
4. **Brand Specification Matrix:** Modifies price deltas ($\Delta \text{ / sq.ft}$) for individual brand options (e.g., UPVC vs Teak, Ultratech vs JSW).

---

### 📄 Module 6: Vector Quotation PDF Generator (`/api/v1/calculator/estimate/:estimateNumber/pdf`)

Generates branded, multi-page, publication-grade engineering estimates using `PDFKit`:

1. **Vector Document Structure:**
   - **Page 1:** Asthiwar Golden Seal Header, Customer Metadata, Verified Estimate Badge, Commercial Investment Breakdown, 4-Metric Quick Specs Grid, and 10-Stage Milestone Payment Schedule Table.
   - **Page 2:** Itemized Brand Specifications Table (Structural Steel, Cement, Masonry, Sanitary, Flooring, Doors/Windows, Waterproofing, Paint), Selected Infrastructure Add-Ons Table, 11 Standard Civil Exclusions List, and Authorized Signatory Seal.
2. **Dual-Mode Streaming:**
   - Inline preview mode (`Content-Disposition: inline`) for browser tab rendering.
   - Attachment download mode (`Content-Disposition: attachment; filename="..."`) for instant file saving.

---

### 📨 Module 7: Notification Engine & Alert Dispatcher (`/api/v1/admin/notifications`)

Omnichannel communication service for automated quotation delivery:

1. **Customer Quotation Delivery:** Formats and dispatches detailed estimate summaries with direct PDF download links via Email (HTML template) and WhatsApp (pre-formatted rich message).
2. **Admin Lead Alerts:** Dispatches instant notifications to sales engineers when a new site consultation is booked.
3. **Delivery Auditing:** Every dispatch attempt is recorded in `notifications` (`status: SENT / FAILED`, retry counts, provider message IDs).
4. **Resend Endpoints:** Administrators can trigger retries for failed dispatches (`POST /notifications/:id/resend`).

---

### 🛡️ Module 8: Asynchronous System Audit Logging (`/api/v1/admin/audit-logs`)

Enterprise observability and accountability service:

1. **PostgreSQL Event Storage:** Records events directly into the `audit_logs` table.
2. **Event Classifications:**
   - `CALCULATOR_SUBMISSION`: Tracks estimate previews and authoritative calculations.
   - `ADMIN_MUTATION`: Records pricing updates, lead status transitions, and config adjustments.
   - `ERROR` / `WARN`: Captures all 4xx/5xx exceptions intercepted by the Express error handler.
   - `INFO`: Records logins, logouts, and background task executions.
3. **Automated Sensitive Field Redaction:**
   - Recursively scrubs keys: `password`, `token`, `sessionToken`, `authorization`, `cookie`, `secret`, `apiKey`.
4. **Protected Inspection API:** `GET /api/v1/admin/audit-logs` supports query filtering by severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), action, date range, and pagination.

---

## 4. Complete REST API Catalog

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | ❌ Public | Backend service health, uptime, and environment check |
| `GET` | `/api/v1/calculator/locations` | ❌ Public | List all active Tamil Nadu locations and city price multipliers |
| `GET` | `/api/v1/calculator/packages` | ❌ Public | List all 4 packages (`basic`, `standard`, `premium`, `luxury`) with active rates |
| `GET` | `/api/v1/calculator/config/:packageSlug` | ❌ Public | Get complete category specifications & 15 add-ons catalog for a tier |
| `POST` | `/api/v1/calculator/preview` | ❌ Public | Compute ephemeral price calculation breakdown without saving to DB |
| `POST` | `/api/v1/calculator/estimate` | ❌ Public | Generate authoritative estimate, create `EST-YYYY-XXXXXX`, and save snapshot |
| `GET` | `/api/v1/calculator/estimate/:estimateNumber` | ❌ Public | Fetch saved estimate JSON snapshot by estimate number |
| `GET` | `/api/v1/calculator/estimate/:estimateNumber/pdf` | ❌ Public | Stream multi-page branded quotation PDF document |
| `POST` | `/api/v1/enquiries` | ❌ Public | Submit consultation booking / lead inquiry linked to an estimate |
| `POST` | `/api/v1/admin/auth/login` | ❌ Public (Rate Limited) | Authenticate admin, issue 7-day HttpOnly cookie session |
| `GET` | `/api/v1/admin/auth/me` | 🔒 Admin | Verify current session and return admin profile |
| `POST` | `/api/v1/admin/auth/logout` | 🔒 Admin | Revoke active session in database and clear session cookie |
| `GET` | `/api/v1/admin/analytics/dashboard` | 🔒 Admin | Fetch executive KPI cards, package volume share, and pipeline metrics |
| `GET` | `/api/v1/admin/enquiries` | 🔒 Admin | Search and list paginated customer enquiries with status filters |
| `GET` | `/api/v1/admin/enquiries/:id` | 🔒 Admin | Inspect full details of a specific customer inquiry |
| `PATCH` | `/api/v1/admin/enquiries/:id` | 🔒 Admin | Update enquiry status (`NEW`, `CONTACTED`, `IN_PROGRESS`, `CLOSED`, etc.) and internal notes |
| `POST` | `/api/v1/admin/enquiries/:id/notify` | 🔒 Admin | Trigger manual sales alert notification for an enquiry |
| `GET` | `/api/v1/admin/estimates` | 🔒 Admin | Search and list paginated customer estimates with package filters |
| `GET` | `/api/v1/admin/estimates/:id` | 🔒 Admin | Inspect estimate snapshot and customer details |
| `GET` | `/api/v1/admin/estimates/:id/pdf` | 🔒 Admin | Stream quotation PDF for an estimate from admin panel |
| `POST` | `/api/v1/admin/estimates/:id/notify` | 🔒 Admin | Trigger multi-channel quotation delivery (Email / WhatsApp) |
| `PATCH` | `/api/v1/admin/estimates/:id` | 🔒 Admin | Update estimate internal status and administrative notes |
| `GET` | `/api/v1/admin/notifications` | 🔒 Admin | List notification delivery logs and channel statuses |
| `POST` | `/api/v1/admin/notifications/:id/resend` | 🔒 Admin | Retry failed notification dispatch |
| `GET` | `/api/v1/admin/config/packages` | 🔒 Admin | Fetch package configuration matrix |
| `PUT` | `/api/v1/admin/config/packages/:id/price` | 🔒 Admin | Update package rates with immutable price history versioning |
| `PATCH` | `/api/v1/admin/config/packages/:id` | 🔒 Admin | Update package metadata (tagline, description, color theme) |
| `GET` | `/api/v1/admin/config/locations` | 🔒 Admin | Fetch all location price multipliers |
| `POST` | `/api/v1/admin/config/locations` | 🔒 Admin | Add new city location with custom price multiplier |
| `PATCH` | `/api/v1/admin/config/locations/:id` | 🔒 Admin | Update location multiplier or toggle active state |
| `GET` | `/api/v1/admin/config/addons` | 🔒 Admin | Fetch 15 add-on infrastructure catalog with variant pricing |
| `PUT` | `/api/v1/admin/config/addons/:id/price` | 🔒 Admin | Update add-on variant price with versioned history |
| `PATCH` | `/api/v1/admin/config/addons/:id` | 🔒 Admin | Update add-on metadata and descriptions |
| `GET` | `/api/v1/admin/config/specifications` | 🔒 Admin | Fetch full 10-category brand specification matrix |
| `PUT` | `/api/v1/admin/config/options/:id/price` | 🔒 Admin | Update brand option price delta with history versioning |
| `PATCH` | `/api/v1/admin/config/package-items/:id` | 🔒 Admin | Update default brand selection or inclusion rules for package items |
| `GET` | `/api/v1/admin/audit-logs` | 🔒 Admin | Query system audit records, exception logs, and administrative actions |

---

## 5. Database Schema & Entities

The PostgreSQL schema (`@asthiwar/database`) contains 10 core tables:

1. **`admin_users`**: Admin credentials (Bcrypt hashed), roles (`super_admin`, `admin`), active flags.
2. **`admin_sessions`**: 7-day HttpOnly session tokens, user references, IP, user-agent, `expires_at`, `revoked_at`.
3. **`locations`**: Tamil Nadu cities, slugs, `price_multiplier` (numeric e.g. 1.05), active status, sort order.
4. **`packages` & `package_prices`**: Construction tiers (`basic`, `standard`, `premium`, `luxury`), color themes, standard rate per sqft, volume rate per sqft (>3500 sqft), versioned with `effective_from` and `effective_to`.
5. **`categories` & `items` & `options` & `option_prices`**: 10 construction specification categories, individual items (Cement, Steel, Tiles, Sanitary), brand options (JSW, Ultratech, Jaquar, Toto), and price deltas ($\Delta \text{ / sq.ft}$).
6. **`package_items`**: Binding rules linking packages to items with default option selections and inclusion flags.
7. **`addons` & `addon_prices`**: 15 infrastructure add-on items, pricing units (`per_litre`, `per_rft`, `flat_fee`, `per_sqft`), and tier prices.
8. **`estimates` & `estimate_items` & `estimate_addons`**: Authoritative calculation snapshots, `estimate_number`, customer metadata, built-up dimensions, breakdown metrics, and 10-stage payment milestone JSON.
9. **`enquiries`**: Lead records, consultation time preferences, requirement notes, CRM statuses, and link to estimate number.
10. **`notifications` & `audit_logs`**: Multi-channel delivery audit trails and system activity logs with sanitized metadata.
