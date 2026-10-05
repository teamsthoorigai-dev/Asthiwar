-- Soil Testing and MEP Drawings each have four options, one per package tier,
-- named "Soil Testing (Not Included)", "Soil Testing (Not Included - Std)",
-- "Soil Testing Included", "Soil Testing Included (Lux)" and so on. The
-- calculator printed those names on its cards. Every card now carries the plain
-- name; prices and the option each package includes are unchanged.
--
-- Whether a tier includes it moves to the specification note. The public
-- comparison matrix prints "name (specification)" and shows a dash for
-- "not included" and a badge for "included", so it reads as it did before.
-- Matched by slug, so options renamed or removed by hand are left alone.
UPDATE "options" SET "brand_name" = 'Soil Testing', "specification" = 'Not Included'
 WHERE "slug" IN ('soil_testing_not_included_basic', 'soil_testing_not_included_std');
--> statement-breakpoint
UPDATE "options" SET "brand_name" = 'Soil Testing', "specification" = 'Included'
 WHERE "slug" IN ('soil_testing_included_prem', 'soil_testing_included_lux');
--> statement-breakpoint
UPDATE "options" SET "brand_name" = 'MEP Drawings', "specification" = 'Not Included'
 WHERE "slug" IN ('mep_drawings_basic', 'mep_drawings_std');
--> statement-breakpoint
UPDATE "options" SET "brand_name" = 'MEP Drawings', "specification" = 'Included'
 WHERE "slug" IN ('mep_drawings_included_prem', 'mep_drawings_included_lux');
