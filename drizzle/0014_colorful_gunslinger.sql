CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` varchar(20) DEFAULT 'system',
	`backupFrequency` varchar(20) DEFAULT 'weekly',
	`abTestCtrThreshold` varchar(10) DEFAULT '5.00',
	`abTestViewsThreshold` int DEFAULT 1000,
	`notifyNewVideos` boolean DEFAULT true,
	`notifyABTestThreshold` boolean DEFAULT true,
	`notifyBackupComplete` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `videoTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`titleTemplate` text,
	`descriptionTemplate` text,
	`tagsTemplate` json,
	`category` varchar(100),
	`isDefault` boolean DEFAULT false,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoTemplates_id` PRIMARY KEY(`id`)
);
