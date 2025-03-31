CREATE TABLE "logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "level" varchar(20) NOT NULL,
  "message" text NOT NULL,
  "service" varchar(50),
  "metadata" jsonb,
  "timestamp" timestamp DEFAULT now()
);

CREATE TABLE "deployments" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "environment" varchar(50) NOT NULL,
  "version" varchar(50) NOT NULL,
  "status" varchar(20) NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
); 