CREATE TABLE `competitionAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`videoId` varchar(20) NOT NULL,
	`videoTitle` text NOT NULL,
	`channelTitle` varchar(255),
	`viewCount` bigint DEFAULT 0,
	`publishedAt` timestamp,
	`thumbnailUrl` text,
	`duration` varchar(20),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitionAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedIdeas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ideaType` enum('video_idea','title','thumbnail','tags','description') NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`source` enum('brainstorm_preprod','brainstorm_postprod','competition_analysis') NOT NULL,
	`model` varchar(50),
	`status` enum('saved','in_progress','completed','archived') NOT NULL DEFAULT 'saved',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedIdeas_id` PRIMARY KEY(`id`)
);
