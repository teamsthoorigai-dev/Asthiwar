# ASTHIWAR DESIGN & BUILD — Complete End-to-End Calculator Flow Specification

**Document Version:** 1.0.0  
**Target Environment:** React 18, TypeScript, TailwindCSS, Express.js Backend, Neon Serverless PostgreSQL  
**Repository:** `asthiwar-v1`

---

## 1. Executive Summary & Flow Diagram

The ASTHIWAR Construction Cost Estimator is a **5-step wizard** engineered to guide homeowners through an intuitive, transparent estimation process while guaranteeing **100% authoritative pricing calculations** performed exclusively on the backend.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     THE 5-STEP ESTIMATION JOURNEY                                      │
├───────────────────┬───────────────────┬───────────────────┬───────────────────┬────────────────────────┤
│      STEP 0       │      STEP 1       │      STEP 2       │      STEP 3       │         STEP 4         │
│   Lead Capture    │  Plot Dimensions  │  Floor Selection  │   Package Tier    │ Customizations/Add-Ons │
│                   │                   │                   │                   │                        │
│ • Full Name       │ • Plot Area       │ • Ground (1x)     │ • Basic (₹2,099)  │ • 10 Brand Categories  │
│ • Phone Number    │ • Unit Converter  │ • G+1 (2x)        │ • Standard (₹2,468│ • Upgrade Deltas (Δ)   │
│ • Email Address   │ • Floor Footprint │ • G+2 (3x)        │ • Premium (₹2,899)│ • 15 Add-On Catalog    │
│ • Plot Location   │ • Car Parking     │ • G+3 (4x)        │ • Luxury (₹3,250) │ • Custom Sizing        │
└─────────┬─────────┴─────────┬─────────┴─────────┬─────────┴─────────┬─────────┴───────────┬────────────┘
          │                   │                   │                   │                     │
          └───────────────────┴───────────────────┴───────────────────┴─────────────────────┘
                                                      │
                                                      ▼
                                       [STEP 5: AUTHORITATIVE ENGINE]
                                        POST /api/v1/calculator/estimate
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [Live Neon PostgreSQL Storage]                               [Interactive Executive Report]
         • Immutable EST-2026-XXXXXX ID                               • Total Commercial Budget
         • Complete JSON Calculation Snapshot                         • 10-Stage Milestone Payment Plan
         • estimate_items & estimate_addons                           • Instant 2-Page Vector PDF Download
         • Real-time CRM Lead Association                             • 1-Click Site Consultation Booking
```

---

## 2. Detailed Step-by-Step Lifecycle

### 🏁 Step 0: Consultation Initiation & Lead Capture

* **Purpose:** Collect client contact identity and project location before unlocking estimation parameters.
* **Component:** `frontend/src/components/calculator/Step0LeadCapture.tsx`
* **Input Fields:**
  1. **Full Name:** Minimum 2 characters.
  2. **Phone Number:** 10-digit Indian mobile format (`^[6-9]\d{9}$`).
  3. **Email Address:** Standard RFC email validation for automated PDF quote dispatch.
  4. **Plot Location:** City selector pulling from active database locations (Chennai, Coimbatore, Madurai, Tiruppur, Erode, Pollachi, Salem).
  5. **Project Notes / Requirements:** Optional free-text notes for civil engineers.
* **Validation & UX:**
  - Real-time inline helper error text under invalid fields.
  - "Begin Project Estimation" button unlocks dynamically once all required fields validate.

---

### 📐 Step 1: Plot Area, Floor Footprint & Parking Dimensions

* **Purpose:** Determine land boundaries, single-floor ground footprint, and parking capacity.
* **Component:** `frontend/src/components/calculator/Step1Dimensions.tsx`
* **Input Fields:**
  1. **Total Plot Area & Unit:**
     - Supports **Sq.Ft**, **Cents** ($1\text{ Cent} = 435.6\text{ Sq.Ft}$), and **Sq.Yards** ($1\text{ Sq.Yard} = 9\text{ Sq.Ft}$).
     - Automatically displays real-time equivalent square footage in gold badge (e.g., `3 Cents ≈ 1,307 Sq.Ft`).
  2. **Built-Up Area Per Floor (Ground Footprint):**
     - Interactive range slider dynamically bounded by the entered **Total Plot Area** (a single floor's footprint cannot exceed the land size).
     - Preset buttons (`800`, `1000`, `1200`, `1500`, `1800`, `2000`, `2400 sqft`) filtered to those fitting inside the plot.
     - Explanatory footnote: *Footprint represents single-floor coverage; total building area multiplies in Step 2.*
  3. **Covered Car Parking Area:**
     - `None` (0 sq.ft)
     - `1 Car` (200 sq.ft)
     - `2 Cars` (400 sq.ft)

---

### 🏢 Step 2: Structural Elevation & Floor Count

* **Purpose:** Select the vertical building height and compute the cumulative built-up area.
* **Component:** `frontend/src/components/calculator/Step2Floors.tsx`
* **Options:**
  - **Ground Floor Only:** $1\times$ floor footprint multiplier.
  - **G+1 (Ground + 1st Floor):** $2\times$ floor footprint multiplier (Most Popular residential villa format).
  - **G+2 (Ground + 2 Floors):** $3\times$ floor footprint multiplier.
  - **G+3 (Ground + 3 Floors):** $4\times$ floor footprint multiplier.
* **Cumulative Area Mathematical Formula:**
  $$\text{Total Built-Up Area (Sq.Ft)} = (\text{Built-Up Area Per Floor} \times \text{Number of Floors}) + \text{Car Parking Area}$$
* **Interactive UI:**
  - Real-time 3D building visualizer that stacks architectural floor slabs dynamically as the user changes floor height.
  - Live summary card displaying Total Built-Up Area and Floor Space Index (FSI).

---

### 📦 Step 3: Package Tier & Volume Discount Matrix

* **Purpose:** Select the construction quality tier and automatically evaluate volume discount qualifications.
* **Component:** `frontend/src/components/calculator/Step3Packages.tsx`
* **Package Tiers & Live Database Rates:**

| Package Tier | Standard Rate ($\le 3,500\text{ sq.ft}$) | Volume Rate ($> 3,500\text{ sq.ft}$) | Structural Highlights | Target Segment |
|---|---|---|---|---|
| **Basic** | **₹ 2,099 / sq.ft** | **₹ 2,000 / sq.ft** | ISI Steel, Fly ash blocks, M20 mix, 9.5 ft ceiling | Economical / Starter Home |
| **Standard** | **₹ 2,468 / sq.ft** | **₹ 2,357 / sq.ft** | Vizag Steel, JSW Cement, 10 ft ceiling, Dr.Fixit waterproofing | Mid-range family residence |
| **Premium** | **₹ 2,899 / sq.ft** | **₹ 2,799 / sq.ft** | ARS/Suryadev Steel, Ramco Cement, Teak doors, Somany tiles | High-spec luxury modern home |
| **Luxury** | **₹ 3,250 / sq.ft** | **₹ 3,200 / sq.ft** | TATA/JSW Steel, Ultratech Cement, Red bricks, Kohler sanitary | Top-tier architectural villa |

* **Volume Discount Automation:**
  - If $\text{Total Built-Up Area} > 3,500\text{ sq.ft}$, the UI and backend automatically activate the discounted **Volume Rate** with a highlighted *"Volume Savings Applied"* banner.
* **Location Factor Integration:**
  - Base rates automatically multiply by the selected city index (e.g., Chennai = 1.05x, Pollachi = 0.96x).

---

### 🛠️ Step 4: Brand Specification Upgrades & 15 Add-Ons

* **Purpose:** Fine-tune brand specifications and select infrastructure add-ons.
* **Component:** `frontend/src/components/calculator/Step4Customizations.tsx`
* **Part A: 10 Brand Specification Upgrades:**
  - Allows upgrading specific materials above the package default:
    1. **Structural Steel:** Fe 550D (JSW, TATA, ARS, Vizag).
    2. **Cement:** Ultratech, Ramco, Dalmia, JSW.
    3. **Masonry:** Red Bricks vs. Solid Concrete / AAC blocks ($\Delta +₹100\text{ to } +₹120/\text{sq.ft}$).
    4. **Flooring:** Italian Marble / Large Vitrified Tiles vs. Standard Ceramic.
    5. **Doors & Windows:** First-quality Teak Wood / UPVC 3-Track vs. Standard Flush Doors.
    6. **Sanitary & CP Fittings:** Kohler / Jaquar / Toto vs. Standard Parryware.
    7. **Electrical Wiring:** Havells / Finolex / Legrand modular switches.
    8. **Interior & Exterior Painting:** Asian Paints Royale / Apex Ultima.
    9. **Waterproofing:** 3-layer chemical injection waterproofing.
    10. **Architectural & Structural Drawings:** 3D VR Walkthrough, Structural Engineering vetting.
* **Part B: 15 Selectable Infrastructure Add-Ons:**
  - **Water & Drainage:** Underground RCC/Flyash Sump ($₹26/\text{L}$), Septic Tank ($₹30/\text{L}$), Rainwater Harvesting ($₹35,000$).
  - **Boundary & Security:** Red Brick Compound Wall ($₹2,900/\text{Rft}$), CCTV Surveillance 8-Cam Setup ($₹45,000$), Video Door Phone ($₹22,000$).
  - **Power & Sustainability:** Rooftop Solar Power 3kW/5kW ($₹1,80,000$), EV Car Charging Station ($₹35,000$).
  - **Vertical Mobility & Interior:** 4-Passenger Automatic Lift ($₹12,50,000$), Modular Acrylic/Marine Kitchen ($₹2,50,000$), POP False Ceiling ($₹110/\text{sq.ft}$).

---

### 📊 Step 5: Authoritative Backend Calculation, Report & Quote Dispatch

* **Purpose:** Transmit the collected payload to `POST /api/v1/calculator/estimate`, generate the authoritative estimate snapshot, display the interactive cost breakdown, and provide quotation actions.
* **Component:** `frontend/src/components/calculator/Step5EstimateReport.tsx`
* **Delivered Features:**
  1. **Official Estimate Header:** Displays permanent identifier `EST-YYYY-XXXXXX`.
  2. **Commercial Budget Breakdown:**
     - Base Civil & Structural Construction Cost
     - Specification & Brand Upgrades Subtotal
     - Infrastructure Add-Ons Subtotal
     - **Grand Total Project Investment**
  3. **10-Stage Milestone Payment Schedule:**
     - Displays the exact stage-by-stage financial breakdown strictly summing to **100.0%**:
       1. *Design, Approvals & Architectural Plan (3%)*
       2. *Earthwork Excavation & Anti-Termite Foundation Treatment (4%)*
       3. *Foundation Footing, Plinth Beams & Basement Filling (15%)*
       4. *RCC Columns, Roof Slab Casting & Shuttering (22%)*
       5. *Brickwork, AAC Blocks, Lintels & Parapet Walls (14%)*
       6. *Concealed Electrical Conduits & Plumbing Lines (8%)*
       7. *Internal Wall Leveling & External Weather Plastering (10%)*
       8. *Flooring, Bathroom Wall Tiling & Kitchen Countertops (11%)*
       9. *Primer, Emulsion Painting, Doors & Windows Installation (8%)*
       10. *Sanitary Ware, Electrical Switchboards, Deep Clean & Handover (5%)*
  4. **Actions:**
     - **Download Official PDF Quotation:** Streams the generated 2-page publication-grade PDF directly from `GET /api/v1/calculator/estimate/:estimateNumber/pdf`.
     - **Book Free Site Consultation:** Submits lead to `POST /api/v1/enquiries` and triggers instant sales team alerts.

---

## 3. Mathematical Formula Reference

The backend calculation engine (`calculator.service.ts`) executes the following sequential formulas:

$$\begin{aligned}
\text{1. Normalized Plot Sq.Ft} &= \begin{cases} 
\text{plotArea} \times 435.6 & \text{if unit = cents} \\
\text{plotArea} \times 9.0 & \text{if unit = sqyards} \\
\text{plotArea} & \text{if unit = sqft}
\end{cases} \\
\text{2. Total Built-Up Sq.Ft} &= (\text{Built-Up Area Per Floor} \times \text{Floor Multiplier}) + \text{Car Parking Sq.Ft} \\
\text{3. Active Package Rate} &= \begin{cases} 
\text{volumePricePerSqft} & \text{if Total Built-Up} > 3,500\text{ sq.ft} \\
\text{standardPricePerSqft} & \text{otherwise}
\end{cases} \\
\text{4. Effective Base Rate} &= \text{Active Package Rate} \times \text{Location Multiplier} \\
\text{5. Base Construction Cost} &= \text{Total Built-Up Sq.Ft} \times \text{Effective Base Rate} \\
\text{6. Upgrades Cost} &= \sum (\text{Option Delta/Sq.Ft} \times \text{Total Built-Up Sq.Ft}) \\
\text{7. Add-Ons Cost} &= \sum (\text{Variant Price} \times \text{Quantity}) \\
\text{8. Total Project Cost} &= \text{Base Construction Cost} + \text{Upgrades Cost} + \text{Add-Ons Cost} \\
\text{9. Stage } i \text{ Milestone Amount} &= \text{Math.round}\left(\text{Total Project Cost} \times \frac{\text{Stage } i \text{ Percentage}}{100}\right)
\end{aligned}$$

---

## 4. API & Data Payload Contracts

### Inbound Calculation Request: `POST /api/v1/calculator/estimate`
```json
{
  "customerName": "Aswin Kumar",
  "customerPhone": "9876543210",
  "customerEmail": "aswin@example.com",
  "plotLocation": "Coimbatore",
  "plotArea": 2400,
  "plotAreaUnit": "sqft",
  "builtupAreaPerFloor": 1500,
  "builtupAreaUnit": "sqft",
  "carParkingAreaSqft": 200,
  "carCount": 1,
  "floorCount": "G+1",
  "packageSlug": "standard",
  "customizations": [
    { "itemSlug": "masonry", "optionSlug": "red_bricks" }
  ],
  "addons": [
    { "addonSlug": "septic_tank", "variantSlug": "brick_concrete_2000l", "quantity": 2000 },
    { "addonSlug": "compound_wall", "variantSlug": "red_brick_5ft", "quantity": 50 }
  ]
}
```

### Outbound Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "estimateNumber": "EST-2026-172166",
    "customer": {
      "name": "Aswin Kumar",
      "phone": "9876543210",
      "email": "aswin@example.com",
      "location": "Coimbatore"
    },
    "dimensions": {
      "plotAreaSqft": 2400,
      "plotAreaUnit": "sqft",
      "builtupAreaPerFloorSqft": 1500,
      "floorCount": "G+1",
      "numberOfFloors": 2,
      "carParkingAreaSqft": 200,
      "totalBuiltupAreaSqft": 3200
    },
    "package": {
      "slug": "standard",
      "name": "Standard Package",
      "baseRatePerSqft": 2468,
      "effectiveRatePerSqft": 2468,
      "isVolumeRateApplied": false
    },
    "breakdown": {
      "baseConstructionCost": 7897600,
      "upgradesCost": 320000,
      "addonsCost": 205000,
      "totalProjectCost": 8422600
    },
    "milestones": [
      { "stageNumber": 1, "stageName": "Design & Approvals", "percentage": 3, "amount": 252678 },
      { "stageNumber": 2, "stageName": "Earthwork & Excavation", "percentage": 4, "amount": 336904 },
      { "stageNumber": 3, "stageName": "Foundation & Plinth", "percentage": 15, "amount": 1263390 },
      { "stageNumber": 4, "stageName": "RCC Structure", "percentage": 22, "amount": 1852972 },
      { "stageNumber": 5, "stageName": "Brickwork & Masonry", "percentage": 14, "amount": 1179164 },
      { "stageNumber": 6, "stageName": "Concealed Electrical & Plumbing", "percentage": 8, "amount": 673808 },
      { "stageNumber": 7, "stageName": "Plastering", "percentage": 10, "amount": 842260 },
      { "stageNumber": 8, "stageName": "Flooring & Tiling", "percentage": 11, "amount": 926486 },
      { "stageNumber": 9, "stageName": "Painting & Woodwork", "percentage": 8, "amount": 673808 },
      { "stageNumber": 10, "stageName": "Fixtures & Handover", "percentage": 5, "amount": 421130 }
    ]
  }
}
```

---

## 3. 11 Standard Exclusions & Contract Transparency

Step 5 and the generated official PDF estimate strictly display the 11 Standard Out-of-Scope Items for clear civil contract boundaries:
1. **Elevation Work:** Custom architectural facade & exterior stone/HPL claddings beyond standard design.
2. **Outer Area Development:** Setbacks, perimeter pavers, compound pathways & landscaping.
3. **Interior Works & Carpentry:** Wardrobes, kitchen cabinets, modular woodwork & loose furniture.
4. **Building Plan Sanction:** DTCP / Local body building plan approval & government liaison fees.
5. **Electricity Board (EB):** Permanent line connection charges, meter deposit & statutory tariffs.
6. **Gas Connection:** Piped gas line connection & municipal pipeline installation charges.
7. **Water & Drainage (UGD):** Municipal drinking water & underground drainage connection fees.
8. **Borewell Drilling:** Borewell drilling, PVC casing pipes & submersible pump depth piping.
9. **Water Motors & Pumps:** Supply & installation of motors (unless chosen in Add-Ons).
10. **Electrical Appliances:** TV, Refrigerator, Air Conditioners, Chimney, Hob & Geysers.
11. **Taxes & Levies:** Vacant Land Tax (VLT), property assessment taxes & municipal duties.
