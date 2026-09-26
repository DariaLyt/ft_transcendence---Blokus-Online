-- ALTER TABLE "game_players" ALTER COLUMN "game_id" SET DATA TYPE varchar(255);--> statement-breakpoint
-- ALTER TABLE "games" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
-- ALTER TABLE "games" DROP COLUMN "status";--> statement-breakpoint
-- ALTER TABLE "games" DROP COLUMN "created_at";

ALTER TABLE "game_players"
DROP CONSTRAINT "game_players_game_id_games_id_fk";
--> statement-breakpoint

ALTER TABLE "games"
ALTER COLUMN "id" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "games"
ALTER COLUMN "id" TYPE varchar(255)
USING "id"::varchar(255);
--> statement-breakpoint

ALTER TABLE "game_players"
ALTER COLUMN "game_id" TYPE varchar(255)
USING "game_id"::varchar(255);
--> statement-breakpoint

ALTER TABLE "game_players"
ADD CONSTRAINT "game_players_game_id_games_id_fk"
FOREIGN KEY ("game_id")
REFERENCES "public"."games"("id")
ON DELETE NO ACTION
ON UPDATE NO ACTION;
--> statement-breakpoint

ALTER TABLE "games" DROP COLUMN "status";
--> statement-breakpoint

ALTER TABLE "games" DROP COLUMN "created_at";