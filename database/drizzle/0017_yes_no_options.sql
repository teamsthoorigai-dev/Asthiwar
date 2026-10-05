-- Soil Testing, MEP Drawings and Isometric Views & VR are yes/no choices, but
-- each had one option per package tier (Not Included, Not Included - Std,
-- Included, Included (Lux), ...), so the calculator showed four cards. Each now
-- has two, "Yes" and "No":
--
--   * a tier's default is Yes if it included the component before, else No;
--   * the switch to the other card keeps its price (+₹40 / −₹40 for Soil
--     Testing in the seed), carried by the kept option's existing rate rows.
--
-- Matched by slug, so a database already changed by hand is left alone. Saved
-- quotations that chose a removed option are pointed at its Yes/No equivalent;
-- their stored option name and price are snapshots and do not change.
DO $$
DECLARE
  spec record;
  v_item_id integer;
  v_yes_id integer;
  v_no_id integer;
  v_yes_ids integer[];
  v_no_ids integer[];
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('soil_testing', 'soil_testing',
       ARRAY['soil_testing_included_prem', 'soil_testing_included_lux'],
       ARRAY['soil_testing_not_included_basic', 'soil_testing_not_included_std']),
      ('electrical_plumbing_drawings', 'mep_drawings',
       ARRAY['mep_drawings_included_prem', 'mep_drawings_included_lux'],
       ARRAY['mep_drawings_basic', 'mep_drawings_std']),
      ('isometric_vr', 'iso_vr',
       ARRAY['iso_vr_included_lux'],
       ARRAY['iso_vr_not_included_basic', 'iso_vr_not_included_std', 'iso_vr_not_included_prem'])
    ) AS t(item_slug, prefix, yes_slugs, no_slugs)
  LOOP
    SELECT id INTO v_item_id FROM items WHERE slug = spec.item_slug;
    -- The first slug in each list is the option kept; it carries the rates.
    SELECT id INTO v_yes_id FROM options WHERE item_id = v_item_id AND slug = spec.yes_slugs[1];
    SELECT id INTO v_no_id FROM options WHERE item_id = v_item_id AND slug = spec.no_slugs[1];
    IF v_item_id IS NULL OR v_yes_id IS NULL OR v_no_id IS NULL THEN
      RAISE NOTICE 'Skipping %: already migrated or not seeded', spec.item_slug;
      CONTINUE;
    END IF;

    SELECT coalesce(array_agg(id), '{}') INTO v_yes_ids
      FROM options WHERE item_id = v_item_id AND slug = ANY (spec.yes_slugs);
    SELECT coalesce(array_agg(id), '{}') INTO v_no_ids
      FROM options WHERE item_id = v_item_id AND slug = ANY (spec.no_slugs);

    UPDATE package_items SET default_option_id = v_yes_id
     WHERE item_id = v_item_id AND default_option_id = ANY (v_yes_ids);
    UPDATE package_items SET default_option_id = v_no_id
     WHERE item_id = v_item_id AND default_option_id = ANY (v_no_ids);

    UPDATE estimate_items SET selected_option_id = v_yes_id WHERE selected_option_id = ANY (v_yes_ids);
    UPDATE estimate_items SET selected_option_id = v_no_id WHERE selected_option_id = ANY (v_no_ids);

    -- An option charges nothing in a tier that includes it.
    DELETE FROM option_prices op
     USING package_items pi
     WHERE pi.item_id = v_item_id
       AND pi.default_option_id = op.option_id
       AND pi.package_id = op.package_id
       AND op.option_id IN (v_yes_id, v_no_id);

    DELETE FROM options
     WHERE id = ANY (v_yes_ids || v_no_ids) AND id NOT IN (v_yes_id, v_no_id);

    UPDATE options SET slug = spec.prefix || '_yes', brand_name = 'Yes', specification = NULL, is_default = false
     WHERE id = v_yes_id;
    UPDATE options SET slug = spec.prefix || '_no', brand_name = 'No', specification = NULL, is_default = true
     WHERE id = v_no_id;
  END LOOP;
END $$;
