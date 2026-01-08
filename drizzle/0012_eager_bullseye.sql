CREATE TABLE `scriptProfileBranches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`metaPrompt` text NOT NULL,
	`parentVersionId` int,
	`status` enum('active','merged','abandoned') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`mergedAt` timestamp,
	CONSTRAINT `scriptProfileBranches_id` PRIMARY KEY(`id`)
);
