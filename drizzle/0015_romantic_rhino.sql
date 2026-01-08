CREATE TABLE `dailyViewStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` int NOT NULL,
	`youtubeId` varchar(64) NOT NULL,
	`date` timestamp NOT NULL,
	`viewCount` bigint DEFAULT 0,
	`likeCount` bigint DEFAULT 0,
	`commentCount` bigint DEFAULT 0,
	`viewDelta` bigint DEFAULT 0,
	`likeDelta` bigint DEFAULT 0,
	`commentDelta` bigint DEFAULT 0,
	`viewGrowthRate` int DEFAULT 0,
	`likeGrowthRate` int DEFAULT 0,
	`commentGrowthRate` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyViewStats_id` PRIMARY KEY(`id`)
);
