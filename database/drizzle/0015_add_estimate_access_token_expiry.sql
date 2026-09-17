-- A quotation link is a bearer credential: whoever holds it reads the customer's
-- name, phone, email, site and project value. Links were valid forever and could
-- not be withdrawn, so one forwarded WhatsApp message exposed that record for good.
--
-- Links now carry an expiry. Existing quotations get 90 days from when this
-- migration runs, rather than from when they were issued, so no customer's link
-- stops working the moment this is deployed.
ALTER TABLE "estimates" ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "estimates"
   SET "access_token_expires_at" = now() + interval '90 days'
 WHERE "access_token_expires_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "access_token_expires_at" SET NOT NULL;
