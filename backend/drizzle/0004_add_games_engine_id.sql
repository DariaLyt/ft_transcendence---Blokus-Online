ALTER TABLE "games" ADD COLUMN "engine_id" varchar(64);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_engine_id_unique" UNIQUE("engine_id");
