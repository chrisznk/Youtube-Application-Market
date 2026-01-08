CREATE TABLE `scriptProfileVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`name` varchar(100) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`changeDescription` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scriptProfileVersions_id` PRIMARY KEY(`id`)
);
