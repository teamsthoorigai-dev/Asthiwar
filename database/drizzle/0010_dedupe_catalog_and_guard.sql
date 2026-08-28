-- 0009_dedupe_catalog_and_guard.sql
--
-- Repairs duplicate catalogue rows created by repeated seed runs, then adds the
-- constraints that make the seed idempotent for good.
--
-- Background: FIX-009 made the *price* tables idempotent (partial unique indexes on
-- the active row). The base catalogue tables were not covered, so `options` and
-- `package_items` kept accumulating a fresh copy on every `npm run db:seed` —
-- 160 options where there should be 40, and 768 package_items where there should be 192.
-- The public config endpoint then returned each brand option four times.
--
-- Safety:
--   * `estimate_items` stores denormalised snapshots (item_slug, item_name,
--     selected_option_name, unit_price_delta, calculated_price), so historical
--     estimates keep their own copy of everything they display. Only the FK is
--     repointed, at the canonical row carrying identical data.
--   * No price row is deleted. Superseded option_prices are RETIRED via effective_to,
--     never removed (Rule #8).
--   * Canonical row = lowest id in each duplicate group, i.e. the original seed insert.

-- ---------------------------------------------------------------------------
-- 1. Map every duplicate option to the canonical row that will survive.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE canon_options ON COMMIT DROP AS
SELECT o.id AS dup_id, m.keep_id
FROM options o
JOIN (
  SELECT item_id, slug, MIN(id) AS keep_id
  FROM options
  GROUP BY item_id, slug
) m ON m.item_id = o.item_id AND m.slug = o.slug
WHERE o.id <> m.keep_id;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 2. Repoint historical estimates at the canonical option.
--    Their displayed values are snapshots and are untouched.
-- ---------------------------------------------------------------------------
UPDATE estimate_items ei
SET selected_option_id = c.keep_id
FROM canon_options c
WHERE ei.selected_option_id = c.dup_id;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 3. Retire superseded option prices BEFORE repointing, so the partial unique
--    index option_prices_active_unique (option_id, COALESCE(package_id,-1))
--    WHERE effective_to IS NULL is never violated mid-migration.
--    Keeps the lowest id active per canonical (option, package) pair.
-- ---------------------------------------------------------------------------
UPDATE option_prices op
SET effective_to = NOW()
WHERE op.effective_to IS NULL
  AND op.id NOT IN (
    SELECT MIN(op2.id)
    FROM option_prices op2
    LEFT JOIN canon_options c2 ON c2.dup_id = op2.option_id
    WHERE op2.effective_to IS NULL
    GROUP BY COALESCE(c2.keep_id, op2.option_id), COALESCE(op2.package_id, -1)
  );
--> statement-breakpoint

UPDATE option_prices op
SET option_id = c.keep_id
FROM canon_options c
WHERE op.option_id = c.dup_id;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 4. Remove the duplicate option rows, now unreferenced.
-- ---------------------------------------------------------------------------
DELETE FROM options o
USING canon_options c
WHERE o.id = c.dup_id;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 5. package_items is a pure join table; keep the lowest id per (package, item).
-- ---------------------------------------------------------------------------
DELETE FROM package_items pi
WHERE pi.id NOT IN (
  SELECT MIN(id) FROM package_items GROUP BY package_id, item_id
);
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 6. Make the duplication impossible from here on. These are the conflict
--    targets the seed's ON CONFLICT DO NOTHING needs in order to actually work.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS options_item_slug_unique
  ON options (item_id, slug);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS package_items_package_item_unique
  ON package_items (package_id, item_id);
