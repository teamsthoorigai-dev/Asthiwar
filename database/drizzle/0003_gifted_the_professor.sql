ALTER TABLE "estimates" ALTER COLUMN "customer_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "package_prices" ADD COLUMN "head_room_price_per_sqft" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "floor_breakdown_json" jsonb;