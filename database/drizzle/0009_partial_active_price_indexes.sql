CREATE UNIQUE INDEX IF NOT EXISTS "package_prices_active_unique" ON "package_prices" ("package_id") WHERE "effective_to" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "option_prices_active_unique" ON "option_prices" ("option_id", COALESCE("package_id", -1)) WHERE "effective_to" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "addon_prices_active_unique" ON "addon_prices" ("addon_id", "variant_slug") WHERE "effective_to" IS NULL;
