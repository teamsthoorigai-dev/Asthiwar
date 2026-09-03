# ASTHIWAR Requirements Interview: Questions, Options & Decisions

This document records all architectural questions, multiple-choice options, recommended solutions, and confirmed user decisions established during the `/grill-me` alignment session and requirements reviews.

---

## Question 1: Conditional & Complimentary Items (Roof Weathering)

### Question
**How should conditional items (like Roof Weathering: complimentary above 2,000 sq.ft terrace) and optional in-package additions (Fans, Lofts, False Ceiling for Basic/Standard tiers) be processed in the Calculator Wizard?**

### Options Presented
* **Option 1 (Recommended):** Dynamically auto-calculate conditional rules (e.g., Roof Weathering is complimentary when terrace area > 2,000 sq.ft, otherwise priced at ₹80 or ₹70/sq.ft) and render in-package extras (Fans, Lofts, False Ceiling) as optional toggles for Basic/Standard tiers in Step 4.
* **Option 2:** Treat all optional/conditional items as separate line-items in the Add-Ons Step (Step 4), where users explicitly opt-in with custom quantities.
* **Option 3:** Include all conditional items as standard 100% complimentary inclusions across all package tiers without charging any extra rate.

### Confirmed User Decision
* **Selected:** **Option 1**
* **User Clarification Note:** *"and complimentary for other two packages. check packages clearly"*
* **Business Rule Implemented:**
  * **Basic Package:** If terrace area $> 2,000\text{ sq.ft} \implies ₹0\text{ (Complimentary)}$; otherwise $\text{Terrace Area} \times ₹80/\text{sq.ft}$.
  * **Standard Package:** If terrace area $> 2,000\text{ sq.ft} \implies ₹0\text{ (Complimentary)}$; otherwise $\text{Terrace Area} \times ₹70/\text{sq.ft}$.
  * **Premium & Luxury Packages:** **100% Complimentary / Included ($\checkmark$)** regardless of terrace area.

---

## Question 2: Tier-Based In-Package Inclusions vs. Add-Ons

### Question
**For items with tier-based inclusions (e.g. Fans, Lofts, False Ceiling, Soil Testing, Architect Visits), how should the Calculator Wizard display them across packages?**

### Options Presented
* **Option 1 (Recommended):** Show them as optional toggles for Basic & Standard with clear per-sq.ft pricing, while automatically displaying them as "Included (Complimentary)" for Premium & Luxury tiers.
* **Option 2:** Always include them as optional selectable add-ons for all tiers, but apply a ₹0 rate for Premium/Luxury tiers.
* **Option 3:** Include them in the Base package cost directly and remove the optional per-sq.ft additions for Basic & Standard tiers.

### Confirmed User Decision
* **Selected:** **Option 1**
* **Business Rule Implemented:**
  * **Basic & Standard Tiers:** Display checkboxes/toggles in Step 4:
    * *Ceiling Fans:* $+₹50/\text{sq.ft}$
    * *Lofts (1 loft/room):* $+₹12/\text{sq.ft}$
    * *False Ceiling:* $+₹12/\text{sq.ft}$
    * *Soil Testing:* $+₹40/\text{sq.ft}$
    * *Architect Concrete Visits:* $+₹40/\text{sq.ft}$
  * **Premium & Luxury Tiers:** Automatically marked as **"Included in Tier (Complimentary)"** ($\checkmark$) at ₹0 extra cost.

---

## Question 3: Standard Exclusions & Contract Transparency

### Question
**How should the 11 Standard Exclusions (DTCP approval, EB charges, Interior carpentry, Borewell, Electrical appliances, etc.) be presented to the customer?**

### Options Presented
* **Option 1 (Recommended):** Render an explicit "Standard Exclusions & Client Scope" section on both the Step 5 Review screen and the generated PDF Quotation for complete contract transparency.
* **Option 2:** Display exclusions only as small terms & conditions fine print at the bottom of the PDF Quotation.
* **Option 3:** Provide an optional "Enquire about Excluded Services" button in the summary to capture leads for Interior/EB/Borewell work.

### Confirmed User Decision
* **Selected:** **Option 1**
* **Business Rule Implemented:**
  * Render an explicit **"Standard Exclusions & Scope of Work"** 2-column checklist on:
    1. The **Step 5 Review Screen** in the calculator wizard.
    2. The **Official PDF Quotation** document.
  * The 11 standard exclusions:
    1. Elevation Work (Custom architectural facade beyond standard elevation)
    2. Outer Area Development (Setbacks, compound paving & landscaping)
    3. Interior Works & Custom Carpentry (Wardrobes, kitchen cabinets, modular woodwork)
    4. DTCP & Local Body Building Approval / Plan Sanction Charges
    5. Electricity Board (EB) Connection & Meter Deposit Charges
    6. Gas Line Connection & Charges
    7. Municipal Water & Drainage Connection Charges
    8. Borewell Drilling, Casing & Submersible Piping
    9. Water Pumps & Motors (unless chosen as Add-On)
    10. Electrical Appliances (TV, Refrigerator, ACs, Chimney, Dishwasher)
    11. Vacant Land Tax (VLT) & Local Property Tax

---

## Question 4: Project Types & Commercial / Consultancy Scope

### Question
**How should the Commercial Packages (Basic, Standard, Premium with >4,500 sq.ft volume discount) and Structural Design Consultancy rates be organized in the Calculator UI?**

### Options Presented
* **Option 1 (Recommended):** Keep the primary Calculator Wizard dedicated to Residential Construction now, with Commercial and Structural Consultancy tabs ready to be enabled as dedicated calculator modes.
* **Option 2:** Add a Project Type selector in Step 1 immediately supporting Residential, Commercial (3 tiers w/ 4500 sq.ft threshold), and Structural Consultancy modes.
* **Option 3:** Include Commercial packages directly alongside Residential tiers in the package selection step.

### Confirmed User Decision
* **Selected:** **Option 1**
* **Business Rule Implemented:**
  * Primary Calculator focuses on **Residential Construction** (Basic ₹2099/₹1999, Standard ₹2468/₹2357, Premium ₹2899/₹2799, Luxury ₹3250/₹3200).
  * Backend and database schema are architected to support future **Commercial Construction** (>4500 sq.ft threshold) and **Structural Design Consultancy** modules.

---

## Additional Key Clarifications & Confirmed Directives

| Requirement / Item | Rule & Confirmed Implementation |
| :--- | :--- |
| **Brand Customization Items** | Consolidated from 48 legacy rows into **24 standardized customizable items**, each with 4 tier options and calculated rate deltas. |
| **Rooftop Solar 3kW Price** | Updated from ₹1,85,000 to **₹1,90,000** (5kW retained at ₹2,95,000). |
| **Motor Automation Options** | **Both options retained:** *Bore Water OHT* (₹12,000) and *Corporation Water OHT* (₹12,000), plus combined option (₹24,000). |
| **Engineering Notes (Add-Ons)** | Displayed prominently in amber callout boxes (`💡 Note: ...`) on UI add-on cards for OHT (2500L), Septic Tank (6000L), Sump (6000L), Main Gate (60/120/24 sq.ft), Solar, and Heat Pump. |
| **Volume Discount Threshold** | Fully dynamic and editable via Admin Pricing Config Manager (`volume_discount_threshold_sqft` defaults to 3,500 sq.ft). |
| **Milestone Payment Schedule** | 10 distinct phases totaling exactly 100%, populated in `milestone_stages` table and rendered on PDF / Step 5 review. |

---

## Question 5: Unified Master Brand Catalog with Top Package Selectors (Session 2 & 3)

### Question
**How should Brand Pricing, Package Inclusions, and Save Operations be handled in the Admin Portal for maximum simplicity and zero math errors?**

### Confirmed User Decision
* **Selected:** **Unified Master Catalog with Top Package Selectors & Atomic Item Save**
* **Business Rule & UI Architecture:**
  1. **Top Package Selectors per Item Card:** Each item card features 4 dropdown selectors:
     - `Basic Default: [Select Brand ▼]`
     - `Standard Default: [Select Brand ▼]`
     - `Premium Default: [Select Brand ▼]`
     - `Luxury Default: [Select Brand ▼]`
     *(Foolproof: A package can never be left without an assigned default).*
  2. **Master Brand Catalog Table:** Admins enter the **Brand / Specification Name** and a single **Benchmark Rate (₹/unit)**.
  3. **Live Computed Status Badges:** Real-time color-coded badges for all 4 packages on every brand row:
     - 🟢 `✓ Included` (when Delta = 0)
     - 🟡 `+₹X Upgrade` (when Delta > 0)
     - 🔵 `−₹X Deduction Credit` (when Delta < 0)
  4. **Atomic Item Save:** A single **"Save Item Configuration"** button saves the 4 package defaults and all brand rates in one atomic transaction.
  5. **Modal Add Option:** Clicking "Add Brand Option" opens a clean dialog modal.
  6. **Customer Calculator & PDF:** Downgrade credits ($-₹X/\text{sq.ft}$) display green/teal credit badges in Step 4 and deduct from total estimate cost on Step 5 and the PDF Quotation.

