ALTER TABLE "estimates" RENAME COLUMN "floor_multiplier" TO "number_of_floors";--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "number_of_floors" TYPE integer USING ROUND("number_of_floors"::numeric)::integer;--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "number_of_floors" SET DEFAULT 1;
