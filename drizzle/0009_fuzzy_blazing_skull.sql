CREATE TABLE `scriptCorrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`problem` text NOT NULL,
	`correction` text NOT NULL,
	`category` enum('structure','tone','length','transitions','examples','engagement','cta','other') NOT NULL DEFAULT 'other',
	`isActive` boolean NOT NULL DEFAULT true,
	`appliedCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scriptCorrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scriptHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int,
	`topic` text NOT NULL,
	`customInstructions` text,
	`generatedScript` text NOT NULL,
	`wordCount` int DEFAULT 0,
	`model` varchar(50) NOT NULL,
	`rating` int,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scriptHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scriptProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`metaPrompt` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`usageCount` int DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scriptProfiles_id` PRIMARY KEY(`id`)
);
