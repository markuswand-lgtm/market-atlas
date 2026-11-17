CREATE TABLE `import_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`series_id` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`status` text NOT NULL,
	`row_count` integer DEFAULT 0 NOT NULL,
	`source_url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `observations` (
	`series_id` text NOT NULL,
	`date` text NOT NULL,
	`value` real NOT NULL,
	PRIMARY KEY(`series_id`, `date`),
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` text PRIMARY KEY NOT NULL,
	`source_url` text NOT NULL,
	`retrieved_at` text NOT NULL,
	`status` text DEFAULT 'loading' NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`first_date` text,
	`last_date` text,
	`job_id` text NOT NULL
);
