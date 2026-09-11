-- Head room was folded into base_construction_cost, which broke the quotation's
-- own arithmetic: the line reads "N sq.ft @ Rs.R/sq.ft" but the amount beside it
-- also carried head room, so area x rate did not equal the printed total.
-- base_construction_cost now means exactly area x rate; head room is held here.
--
-- Every existing row already satisfies base_construction_cost = area x rate
-- (head room has never been charged), so backfilling 0.00 is exact, not a guess.
ALTER TABLE "estimates" ADD COLUMN IF NOT EXISTS "head_room_area_sqft" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN IF NOT EXISTS "head_room_cost" numeric(12, 2) DEFAULT '0.00' NOT NULL;
