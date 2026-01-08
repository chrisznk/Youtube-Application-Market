CREATE TABLE `abTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` int NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`userId` int NOT NULL,
	`variantType` enum('title','thumbnail','both') NOT NULL,
	`title` text,
	`thumbnailUrl` text,
	`isControl` boolean NOT NULL DEFAULT false,
	`impressions` bigint DEFAULT 0,
	`clicks` bigint DEFAULT 0,
	`ctr` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` int NOT NULL,
	`date` timestamp NOT NULL,
	`viewCount` bigint DEFAULT 0,
	`likeCount` bigint DEFAULT 0,
	`commentCount` bigint DEFAULT 0,
	`watchTimeMinutes` bigint DEFAULT 0,
	`averageViewDuration` int DEFAULT 0,
	`subscribersGained` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`youtubeId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`channelId` varchar(64),
	`channelTitle` text,
	`publishedAt` timestamp,
	`viewCount` bigint DEFAULT 0,
	`likeCount` bigint DEFAULT 0,
	`commentCount` bigint DEFAULT 0,
	`duration` varchar(32),
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
