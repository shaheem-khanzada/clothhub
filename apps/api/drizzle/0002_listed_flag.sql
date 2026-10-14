DROP INDEX `ix_products_brand_list` ON `products`;--> statement-breakpoint
DROP INDEX `ix_products_brand_price` ON `products`;--> statement-breakpoint
DROP INDEX `ix_products_feed` ON `products`;--> statement-breakpoint
DROP INDEX `ix_products_sale` ON `products`;--> statement-breakpoint
ALTER TABLE `products` ADD `listed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `ix_products_listed_featured` ON `products` (`listed`,`in_stock`,`first_seen_at`);--> statement-breakpoint
CREATE INDEX `ix_products_listed_brand_featured` ON `products` (`listed`,`brand_id`,`in_stock`,`first_seen_at`);--> statement-breakpoint
CREATE INDEX `ix_products_listed_date` ON `products` (`listed`,`first_seen_at`);--> statement-breakpoint
CREATE INDEX `ix_products_listed_brand_date` ON `products` (`listed`,`brand_id`,`first_seen_at`);--> statement-breakpoint
CREATE INDEX `ix_products_listed_price` ON `products` (`listed`,`price_minor`);--> statement-breakpoint
CREATE INDEX `ix_products_listed_brand_price` ON `products` (`listed`,`brand_id`,`price_minor`);--> statement-breakpoint
CREATE INDEX `ix_products_listed_brand_type` ON `products` (`listed`,`brand_id`,`piece_type`);--> statement-breakpoint
CREATE INDEX `ix_products_listed_sale` ON `products` (`listed`,`discount_percent`);