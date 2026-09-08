CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"action" text NOT NULL,
	"severity" text DEFAULT 'INFO' NOT NULL,
	"actor_type" text DEFAULT 'ANONYMOUS_USER' NOT NULL,
	"actor_id" text,
	"endpoint" text,
	"http_method" text,
	"status_code" integer,
	"error_message" text,
	"error_stack" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
