CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"price" integer NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
