-- 0012_brand_upgrade_deltas.sql
--
-- Prices the brand upgrades on step 3 of the calculator. Until now every option
-- carried a ₹0 delta, so switching Steel Rebar from "Any ISI Brand" to "JSW / TATA"
-- cost the customer nothing.
--
-- Source: Google Sheet 1qQ_xv_PMzgZXkWCJx1GQI-xIeEEXzyZnk3f2f1jpW4Y, tab 1821959866,
-- which gives the per-sq.ft cost of each specification AT EACH TIER.
--
-- Rule confirmed by Sundar on 2026-09-01:
--     upgrade delta = (cost at the option's tier) − (cost at the customer's package tier)
--
-- Cross-checked against the main tab before applying — the rule reproduces its stated
-- figures exactly: waterproofing 10−0 = ₹10 for Basic, fans 50−0 = ₹50, false ceiling
-- 12−0 = ₹12, soil testing 40−0 = ₹40, Basement PCC→RCC 40−0 = ₹40.
--
-- ASSUMPTION, flagged rather than hidden: the result is clamped at zero, so choosing a
-- cheaper brand than your tier includes is free but earns no credit. The rate card is
-- written entirely as "Additional cost - ₹X/sq.ft" and holds no negative anywhere, and
-- under-charging a signed quote is the more expensive way to be wrong. One word from
-- Sundar and the GREATEST(0, …) clamp comes out.
--
-- NOT touched here:
--   * masonry_work — the main tab states the red-brick add-on outright (₹120 Basic,
--     ₹100 Standard/Premium) and those rows are already in the DB. The derived rule
--     would give ₹130/₹110; an explicitly quoted price beats a derived one (Rule #3).
--   * basement_pcc — already correct at ₹40 for Basic/Standard/Premium.
--   * interior_painting / exterior_painting — the cost tab gives ONE combined PAINTING
--     figure (100/125/150/180) spanning putty, primer and paint across BOTH items.
--     Splitting one number over two items needs a ratio nobody has stated, so both stay
--     at ₹0 pending Sundar's answer (Rule #24).
--   * binding_wire — marked NO CUSTOMISATION on the cost tab.
--
-- Safety: additive only. No existing row is modified or deleted; every insert is
-- skipped where an active row already exists (Rules #7 / #8).

CREATE TEMP TABLE brand_deltas (
  item_slug   text,
  option_slug text,
  pkg_slug    text,
  price_delta numeric(10,2)
) ON COMMIT DROP;
--> statement-breakpoint

INSERT INTO brand_deltas (item_slug, option_slug, pkg_slug, price_delta) VALUES
  -- Steel Rebar Fe 550D — tier cost 305 / 320 / 350 / 400
  ('steel_rebar', 'spa_vizag_steel',    'basic',    15.00),
  ('steel_rebar', 'ars_suryadev_steel', 'basic',    45.00),
  ('steel_rebar', 'ars_suryadev_steel', 'standard', 30.00),
  ('steel_rebar', 'jsw_tata_steel',     'basic',    95.00),
  ('steel_rebar', 'jsw_tata_steel',     'standard', 80.00),
  ('steel_rebar', 'jsw_tata_steel',     'premium',  50.00),

  -- Cement — tier cost 210 / 215 / 225 / 245
  ('cement', 'jsw_cement',          'basic',     5.00),
  ('cement', 'ramco_dalmia_cement', 'basic',    15.00),
  ('cement', 'ramco_dalmia_cement', 'standard', 10.00),
  ('cement', 'ultratech_chettinad', 'basic',    35.00),
  ('cement', 'ultratech_chettinad', 'standard', 30.00),
  ('cement', 'ultratech_chettinad', 'premium',  20.00),

  -- PVC & CPVC Pipes — tier cost 100 / 125 / 145 / 160
  ('pvc_cpvc_pipes', 'watertec',        'basic',    25.00),
  ('pvc_cpvc_pipes', 'kavery_ashirwad', 'basic',    45.00),
  ('pvc_cpvc_pipes', 'kavery_ashirwad', 'standard', 20.00),
  ('pvc_cpvc_pipes', 'finolex_supreme', 'basic',    60.00),
  ('pvc_cpvc_pipes', 'finolex_supreme', 'standard', 35.00),
  ('pvc_cpvc_pipes', 'finolex_supreme', 'premium',  15.00),

  -- Sanitary & CP Fittings — tier cost 40 / 60 / 90 / 135
  ('sanitary_fittings', 'parryware',   'basic',    20.00),
  ('sanitary_fittings', 'jaquar',      'basic',    50.00),
  ('sanitary_fittings', 'jaquar',      'standard', 30.00),
  ('sanitary_fittings', 'toto_kohler', 'basic',    95.00),
  ('sanitary_fittings', 'toto_kohler', 'standard', 75.00),
  ('sanitary_fittings', 'toto_kohler', 'premium',  45.00),

  -- Wires & Switches — the DB folds two cost-tab rows into one item:
  -- wires 60/75/90/90 + switches 17/22/28/28 = 77 / 97 / 118 / 118.
  -- "Finolex & Legrand/GM" covers both Premium and Luxury, which share a cost.
  ('wires_switches', 'rr_anchor_roma',  'basic',    20.00),
  ('wires_switches', 'finolex_legrand', 'basic',    41.00),
  ('wires_switches', 'finolex_legrand', 'standard', 21.00),

  -- Lights — tier cost 17 / 22 / 28 / 28; "Philips" covers Premium and Luxury.
  ('lights', 'luker_lights',   'basic',     5.00),
  ('lights', 'philips_lights', 'basic',    11.00),
  ('lights', 'philips_lights', 'standard',  6.00),

  -- Waterproofing — tier cost 0 / 10 / 10 / 10. All three brands are equivalent
  -- ("Dr.Fixit/Fosroc/Bostik/Equivalent"), so Basic pays ₹10 for any of them.
  -- package_items already carries this as an additional cost; stating it per option
  -- means the calculator DISPLAYS the ₹10 instead of showing a misleading "Included".
  ('waterproofing', 'dr_fixit', 'basic', 10.00),
  ('waterproofing', 'fosroc',   'basic', 10.00),
  ('waterproofing', 'bostik',   'basic', 10.00);
--> statement-breakpoint

-- Insert only where no active price already exists for that (option, package).
INSERT INTO "option_prices" ("option_id", "package_id", "price_delta", "price_type")
SELECT o."id", p."id", d.price_delta, 'per_sqft'
FROM brand_deltas d
JOIN "items"    i ON i."slug" = d.item_slug
JOIN "options"  o ON o."item_id" = i."id" AND o."slug" = d.option_slug
JOIN "packages" p ON p."slug" = d.pkg_slug
WHERE NOT EXISTS (
  SELECT 1 FROM "option_prices" op
  WHERE op."option_id" = o."id"
    AND op."package_id" = p."id"
    AND op."effective_to" IS NULL
);
