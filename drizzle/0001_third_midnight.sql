CREATE TABLE `searchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchId` int NOT NULL,
	`refinementQuery` text,
	`visualMatches` text,
	`refinementNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageDescription` text,
	`searchQuery` text,
	`visualMatches` text,
	`refinementCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `searches_id` PRIMARY KEY(`id`)
);
