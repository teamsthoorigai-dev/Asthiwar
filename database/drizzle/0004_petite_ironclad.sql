-- Originally this migration DROPPED effective_from/effective_to from
-- package_prices, option_prices and addon_prices. That made the migration chain
-- unrunnable: 0000 creates those columns, this dropped them, nothing put them
-- back, and 0010 then tries to build partial unique indexes
-- (... WHERE "effective_to" IS NULL) on columns that no longer exist. A fresh
-- database could not be provisioned at all, and every environment that appeared
-- to work had the columns restored by hand — which is how the live schema came
-- to disagree with both this folder and database/src/schema.
--
-- The columns are load-bearing: they are the price history the calculator reads
-- through backend/src/services/pricing-window.ts, and the only thing that
-- distinguishes a live rate from a retired one.
--
-- The DROPs are therefore replaced by their inverse, written idempotently: a
-- database that already has the columns is untouched, and one missing them is
-- repaired. The file is kept in place so the journal and migration order stay
-- intact for databases that already recorded it as applied.
ALTER TABLE "package_prices" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "package_prices" ADD COLUMN IF NOT EXISTS "effective_to" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "option_prices" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "option_prices" ADD COLUMN IF NOT EXISTS "effective_to" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "addon_prices" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "addon_prices" ADD COLUMN IF NOT EXISTS "effective_to" timestamp with time zone;
