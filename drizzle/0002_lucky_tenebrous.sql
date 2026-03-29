CREATE TABLE `results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`score` double NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `searches` ADD `imagePath` text NOT NULL;--> statement-breakpoint
ALTER TABLE `searches` ADD `query` text;--> statement-breakpoint
ALTER TABLE `searchHistory` DROP COLUMN `visualMatches`;--> statement-breakpoint
ALTER TABLE `searches` DROP COLUMN `imageUrl`;--> statement-breakpoint
ALTER TABLE `searches` DROP COLUMN `imageDescription`;--> statement-breakpoint
ALTER TABLE `searches` DROP COLUMN `searchQuery`;--> statement-breakpoint
ALTER TABLE `searches` DROP COLUMN `visualMatches`;--> statement-breakpoint
ALTER TABLE `searches` DROP COLUMN `refinementCount`;