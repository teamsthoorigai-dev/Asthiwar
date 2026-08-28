CREATE TABLE IF NOT EXISTS "milestone_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_number" integer NOT NULL,
	"stage_name" text NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"key_deliverables" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "milestone_stages_stage_number_unique" UNIQUE("stage_number")
);
--> statement-breakpoint

INSERT INTO "milestone_stages" ("stage_number", "stage_name", "percentage", "key_deliverables", "is_active") VALUES
(1, 'Design & Approvals', 3.00, 'Soil test, floor plan, structural drawing, DTCP approval assistance', true),
(2, 'Earthwork & Excavation', 4.00, 'Foundation trenching, site leveling, anti-termite treatment', true),
(3, 'Foundation & Plinth', 15.00, 'Footing concrete, plinth beam, basement filling, PCC/RCC basement', true),
(4, 'RCC Structure (Columns & Slabs)', 22.00, 'Column casting, roof slab shuttering, beam reinforcement & curing', true),
(5, 'Brickwork & Masonry', 14.00, 'External & internal walls, lintels, parapet wall construction', true),
(6, 'Electrical & Plumbing Concealing', 8.00, 'Conduits, plumbing lines, switch boxes, drainage routing', true),
(7, 'Plastering (Internal & External)', 10.00, 'Ceiling plastering, wall leveling, exterior weather-coat plaster', true),
(8, 'Flooring & Wall Tiling', 11.00, 'Main vitrified tiles, bathroom tiling, kitchen granite countertop', true),
(9, 'Painting & Woodwork', 8.00, 'Putty, primer, emulsion coats, main door & internal door fixing', true),
(10, 'Fixtures, Finishing & Handover', 5.00, 'CP & sanitary fittings, switches, lights, glass railings, deep clean', true)
ON CONFLICT ("stage_number") DO NOTHING;
