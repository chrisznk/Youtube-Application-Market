CREATE TABLE `channelSyncInfo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`channelTitle` text,
	`videoCount` int DEFAULT 0,
	`lastSyncAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channelSyncInfo_id` PRIMARY KEY(`id`),
	CONSTRAINT `channelSyncInfo_userId_unique` UNIQUE(`userId`)
);
