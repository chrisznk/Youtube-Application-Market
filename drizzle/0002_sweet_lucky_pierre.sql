ALTER TABLE `videos` ADD `transcript` text;--> statement-breakpoint
ALTER TABLE `videos` ADD `watchTimeMinutes` bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `videos` ADD `averageViewDuration` int DEFAULT 0;