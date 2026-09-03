-- 0011_addon_rate_card_2026_09.sql
--
-- Aligns the add-on catalogue with Sundar's rate card
-- (Google Sheet 1qQ_xv_PMzgZXkWCJx1GQI-xIeEEXzyZnk3f2f1jpW4Y, "ADD ONS" block),
-- supplied as corrections on 2026-09-01.
--
-- Safety (Rules #7 / #8):
--   * No price row is ever deleted. Superseded rows are RETIRED via effective_to.
--   * `estimate_addons` denormalises addon_slug / addon_name / selected_variant /
--     unit_price / total_price, so historical estimates keep their own figures.
--   * `addon_prices_active_unique` (0009) allows one active row per
--     (addon_id, variant_slug), so every change is retire-then-insert.
--   * Re-runnable: the diff below only versions rows that actually differ.
--
-- Not touched here, deliberately:
--   * Package rates. The sheet's package tab lists 2099/2468/2899/3250 standard and
--     1999/2357/2799/3200 volume; the DB holds slightly different figures. That was
--     not part of the correction list — flagged for Sundar rather than guessed (Rule #3).
--   * `waste_water_recycling`. It exists in the DB but not on the rate card. Left
--     active and unpriced (Custom Quote) pending confirmation (Rule #24).

-- ---------------------------------------------------------------------------
-- 1. Add-ons that accept more than one variant at once
-- ---------------------------------------------------------------------------
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "allows_multiple" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

-- Motor automation can be fitted to the bore-water and corporation-water tanks
-- independently, so both variants may be selected together.
UPDATE "addons" SET "allows_multiple" = true WHERE "slug" = 'motor_automation';
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 2. New add-on from the rate card
-- ---------------------------------------------------------------------------
INSERT INTO "addons" ("slug", "name", "description", "pricing_unit", "sort_order", "is_active")
VALUES (
  'water_softener',
  'Water Softener',
  'Whole-house water softener. Brand: AO Smith. Suitable for TDS below 1000.',
  'fixed',
  16,
  true
)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 3. Names and customer-facing notes
-- ---------------------------------------------------------------------------
UPDATE "addons" SET
  "description" = 'Custom capacity overhead water storage tank. Capacity selected in Litres. A family of 4 opt for 2,500 Litres.',
  "default_quantity" = '2500', "min_quantity" = '500', "max_quantity" = '20000',
  "updated_at" = now()
WHERE "slug" = 'overhead_concrete_tank';
--> statement-breakpoint

UPDATE "addons" SET
  "description" = 'Volume-based septic tank. Capacity selected in Litres. A family of 4 opt for 5,000 Litres.',
  "default_quantity" = '5000', "min_quantity" = '1000', "max_quantity" = '20000',
  "updated_at" = now()
WHERE "slug" = 'conventional_septic_tank';
--> statement-breakpoint

UPDATE "addons" SET
  "description" = 'Underground water sump. Capacity selected in Litres. A family of 4 opt for 6,000 Litres.',
  "default_quantity" = '6000', "min_quantity" = '1000', "max_quantity" = '30000',
  "updated_at" = now()
WHERE "slug" = 'underground_sump';
--> statement-breakpoint

UPDATE "addons" SET
  "name" = 'Compound Wall (upto 5''6" Height)',
  "description" = 'Perimeter compound wall up to 5''6" height. Running feet entered by customer.',
  "updated_at" = now()
WHERE "slug" = 'compound_wall';
--> statement-breakpoint

UPDATE "addons" SET
  "description" = 'Grid-tied rooftop solar system. Pricing before subsidy reduction (subsidy approx. ₹78,000). 3 kW per day required for a 1 to 3 BHK home.',
  "updated_at" = now()
WHERE "slug" = 'rooftop_solar';
--> statement-breakpoint

-- The rate card gives gate-area guidance for a 1-car gate and a wicket gate. The
-- 2-car figure was left blank on the sheet, so it is not stated here (Rule #3).
UPDATE "addons" SET
  "description" = 'Main entrance gate. Price per sq.ft of gate area. Guide: 1 car gate 10'' x 6'' = 60 sq.ft; wicket gate 3.5'' x 6'' = 21 sq.ft.',
  "updated_at" = now()
WHERE "slug" = 'main_gate';
--> statement-breakpoint

UPDATE "addons" SET
  "description" = 'Smart switches, lights, fans and main door lock with mobile app control.',
  "updated_at" = now()
WHERE "slug" = 'smart_home';
--> statement-breakpoint

UPDATE "addons" SET
  "description" = 'Choke pits and rings. Two pits keep toilet and other water separate.',
  "updated_at" = now()
WHERE "slug" = 'choke_pit';
--> statement-breakpoint

-- Renamed on the rate card from "Solar Water Heater" to "Water Heat Pump" — it now
-- carries an electric heat-pump option alongside the two solar sizes. The SLUG is
-- deliberately left as solar_water_heater so existing estimate rows keep resolving.
UPDATE "addons" SET
  "name" = 'Water Heat Pump',
  "description" = 'Solar or electric water heating. 200 to 250 Litres per day required for a family of 5.',
  "updated_at" = now()
WHERE "slug" = 'solar_water_heater';
--> statement-breakpoint

UPDATE "addons" SET
  "description" = 'High-pressure plumbing pump. Brand: Grundfos.',
  "updated_at" = now()
WHERE "slug" = 'pressure_pump';
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 4. The rate card itself
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE new_addon_rates (
  addon_slug   text,
  variant_slug text,
  variant_name text,
  package_tier text,
  price        numeric(12,2)
) ON COMMIT DROP;
--> statement-breakpoint

INSERT INTO new_addon_rates (addon_slug, variant_slug, variant_name, package_tier, price) VALUES
  -- 1. Overhead Concrete Tank — ₹35/L Basic & Standard, ₹45/L Premium & Luxury.
  --    Both rows are shown to every customer now; the tier only names the rate.
  ('overhead_concrete_tank', 'basic_std',      'Basic/Standard Package Rate',            'basic_standard',  35.00),
  ('overhead_concrete_tank', 'prem_lux',       'Premium/Luxury Package Rate',            'premium_luxury',  45.00),

  -- 2. Conventional Septic Tank — unchanged, restated for completeness.
  ('conventional_septic_tank', 'flyash',         'Fly Ash Brick',                        'all',             26.00),
  ('conventional_septic_tank', 'brick_concrete', '4.5" Brick + 4.5" Concrete',           'all',             30.00),
  ('conventional_septic_tank', '9in_concrete',   '9" Concrete',                          'all',             33.00),

  -- 3. Underground Sump — unchanged.
  ('underground_sump', 'flyash',         'Fly Ash Brick',                                'all',             26.00),
  ('underground_sump', 'brick_concrete', '4.5" Brick + 4.5" Concrete',                   'all',             30.00),
  ('underground_sump', '9in_concrete',   '9" Concrete',                                  'all',             33.00),

  -- 4. Compound Wall — unchanged.
  ('compound_wall', 'solid_flyash', 'Solid Block / Fly Ash',                             'all',           2300.00),
  ('compound_wall', 'red_brick',    'Red Brick',                                         'all',           2900.00),

  -- 5. Rooftop Solar — CORRECTED. Was 1,80,000 / 3,60,000; card says before-subsidy
  --    1,85,000 for 3 kW and 2,95,000 for 5 kW.
  ('rooftop_solar', '3kw', '3 kW System', 'all', 185000.00),
  ('rooftop_solar', '5kw', '5 kW System', 'all', 295000.00),

  -- 6. Main Gate — CORRECTED. Was 150 / 300 per sq.ft; card says 620 MS, 1250 SS,
  --    plus two automated variants that did not exist before.
  ('main_gate', 'ms_gate',      'MS Gate',                             'all',  620.00),
  ('main_gate', 'ss_gate',      'Stainless Steel Gate',                'all', 1250.00),
  ('main_gate', 'ms_gate_auto', 'MS Gate with Automation',             'all', 1300.00),
  ('main_gate', 'ss_gate_auto', 'Stainless Steel Gate with Automation','all', 2000.00),

  -- 7. CCTV — unchanged.
  ('cctv_security', '4cam_2mp', '4 Camera 2MP Color AHD', 'all', 37000.00),
  ('cctv_security', '4cam_5mp', '4 Camera 5MP Color AHD', 'all', 45000.00),

  -- 8. Smart Home — CORRECTED. Was 50,000; card says 2,80,000.
  ('smart_home', 'standard', 'Switches, Lights, Fans & Main Door Lock', 'all', 280000.00),

  -- 9. Passenger Lift — unchanged.
  ('passenger_lift', '4pax', '4-Passenger Lift', 'all', 1250000.00),

  -- 10. Choke Pit — card lists a 1-pit and a 2-pit option at the SAME ₹15,000.
  --     Transcribed as written; flagged for Sundar to confirm the 2-pit figure.
  ('choke_pit', '1pit',  '1 Choke Pit',                                  'all', 15000.00),
  ('choke_pit', '2pits', '2 Choke Pits (toilet & other water separate)', 'all', 15000.00),

  -- 11. Water Heat Pump — CORRECTED. Was 30,000 / 60,000 for solar 125 L / 250 L;
  --     card says 50,000 / 1,00,000, plus an electric heat-pump option.
  ('solar_water_heater', '125l',        'Solar — 125 L Capacity',                 'all',  50000.00),
  ('solar_water_heater', '250l',        'Solar — 250 L Capacity',                 'all', 100000.00),
  ('solar_water_heater', 'electric_hp', 'Electric AO Smith HPI 40 — 24 hr Supply','all', 176000.00),

  -- 12. Cool Roof Tiles — unchanged.
  ('cool_roof_tiles', 'white_epoxy', '1''x1'' White with Epoxy', 'all', 170.00),

  -- 13. Motor Automation — unchanged; both variants selectable together.
  ('motor_automation', 'bore',        'Bore Water OHT',        'all', 12000.00),
  ('motor_automation', 'corporation', 'Corporation Water OHT', 'all', 12000.00),

  -- 14. Pressure Pump — CORRECTED. Was a single 50,000 "Standard Pump"; the card
  --     lists four Grundfos configurations.
  ('pressure_pump', 'g_3bath',       '3 Bathrooms, No Body Shower',                     'all',  57500.00),
  ('pressure_pump', 'g_4bath',       '4+ Bathrooms, No Body Shower',                    'all',  71000.00),
  ('pressure_pump', 'g_1bath_shower','1 Bathroom with Body Shower + 2 Without',         'all',  82800.00),
  ('pressure_pump', 'g_3bath_shower','3 Bathrooms with Body Shower',                    'all', 107000.00),

  -- 15. Water Softener — NEW.
  ('water_softener', 'tds_below_1000', 'Suitable for TDS below 1000', 'all', 105000.00);
--> statement-breakpoint

-- Retire the active row wherever the card disagrees with it.
UPDATE "addon_prices" ap
SET "effective_to" = now()
FROM new_addon_rates n
JOIN "addons" a ON a."slug" = n.addon_slug
WHERE ap."addon_id" = a."id"
  AND ap."variant_slug" = n.variant_slug
  AND ap."effective_to" IS NULL
  AND (ap."price" <> n.price OR ap."variant_name" <> n.variant_name OR ap."package_tier" <> n.package_tier);
--> statement-breakpoint

-- "Standard Pump" is not on the card — its four replacements are inserted below.
UPDATE "addon_prices"
SET "effective_to" = now()
WHERE "effective_to" IS NULL
  AND "variant_slug" = 'standard'
  AND "addon_id" = (SELECT "id" FROM "addons" WHERE "slug" = 'pressure_pump');
--> statement-breakpoint

-- Insert the current rate wherever no active row remains.
INSERT INTO "addon_prices" ("addon_id", "variant_name", "variant_slug", "package_tier", "price")
SELECT a."id", n.variant_name, n.variant_slug, n.package_tier, n.price
FROM new_addon_rates n
JOIN "addons" a ON a."slug" = n.addon_slug
WHERE NOT EXISTS (
  SELECT 1 FROM "addon_prices" ap
  WHERE ap."addon_id" = a."id"
    AND ap."variant_slug" = n.variant_slug
    AND ap."effective_to" IS NULL
);
