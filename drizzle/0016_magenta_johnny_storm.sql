CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`userId` int NOT NULL,
	`videoId` int NOT NULL,
	`videoTitle` text NOT NULL,
	`alertType` enum('growth','decline','views') NOT NULL,
	`threshold` int NOT NULL,
	`actualValue` int NOT NULL,
	`notificationSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` int,
	`name` varchar(255) NOT NULL,
	`alertType` enum('growth','decline','views') NOT NULL,
	`threshold` int NOT NULL,
	`period` enum('1h','2h','24h','48h','1week') NOT NULL DEFAULT '1h',
	`enabled` boolean NOT NULL DEFAULT true,
	`lastTriggeredAt` timestamp,
	`triggerCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewAlerts_id` PRIMARY KEY(`id`)
);
