ALTER TABLE `product_images` ADD `thumbhash` varchar(64);--> statement-breakpoint
ALTER TABLE `product_images` ADD `thumbhash_failed_at` datetime(3);