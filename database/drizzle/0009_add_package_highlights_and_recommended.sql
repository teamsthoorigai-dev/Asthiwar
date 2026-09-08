ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "highlights" jsonb;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "is_recommended" boolean DEFAULT false NOT NULL;
