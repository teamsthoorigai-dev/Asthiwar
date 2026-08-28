ALTER TABLE "package_prices" DROP CONSTRAINT IF EXISTS "package_prices_package_id_unique";
--> statement-breakpoint
ALTER TABLE "package_prices" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "package_prices" ADD COLUMN IF NOT EXISTS "effective_to" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "option_prices" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "option_prices" ADD COLUMN IF NOT EXISTS "effective_to" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "addon_prices" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "addon_prices" ADD COLUMN IF NOT EXISTS "effective_to" timestamp with time zone;
