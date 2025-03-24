CREATE TABLE "anomalies" (
	"id" serial PRIMARY KEY NOT NULL,
	"component" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"detected_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"status" varchar(20) DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"is_secret" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "configs_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "repair_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_id" integer,
	"action_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"result" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "system_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"source" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"cpu_usage" double precision NOT NULL,
	"cpu_temperature" double precision NOT NULL,
	"memory_total" bigint NOT NULL,
	"memory_used" bigint NOT NULL,
	"memory_free" bigint NOT NULL,
	"disk_total" bigint NOT NULL,
	"disk_used" bigint NOT NULL,
	"disk_free" bigint NOT NULL,
	"network_bytes_in" bigint NOT NULL,
	"network_bytes_out" bigint NOT NULL,
	"created_at" timestamp DEFAULT now()
);
