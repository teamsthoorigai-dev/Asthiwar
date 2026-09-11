-- Quotations were readable by anyone who could guess their number, and the
-- numbers are a sequence: AW/2026/O/0001, 0002, 0003. A for-loop over
-- GET /api/v1/calculator/estimate/:number returned every customer's name, phone,
-- email and project value, and the /pdf route served the branded document too.
--
-- The number stays the human-readable reference printed on the document; this
-- column is the capability that authorises reading it. A customer's link carries
-- both, an administrator reaches the same estimate through an authenticated
-- route, and neither can be reached by counting.
--
-- 64 hex characters from two gen_random_uuid() calls — built in since PG 13, so
-- no pgcrypto dependency. Backfilled per row (gen_random_uuid() is VOLATILE, so
-- each row gets its own value), then made NOT NULL.
ALTER TABLE "estimates" ADD COLUMN IF NOT EXISTS "access_token" text;
--> statement-breakpoint
UPDATE "estimates"
   SET "access_token" = replace(gen_random_uuid()::text, '-', '')
                     || replace(gen_random_uuid()::text, '-', '')
 WHERE "access_token" IS NULL;
--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "access_token" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "estimates_access_token_unique" ON "estimates" ("access_token");
