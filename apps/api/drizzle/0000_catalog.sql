CREATE TABLE `brands` (
	`id` char(36) NOT NULL,
	`source_ref` int unsigned,
	`slug` varchar(80) NOT NULL,
	`name` varchar(150) NOT NULL,
	`website` varchar(512) NOT NULL,
	`logo_url` varchar(1024),
	`status` enum('active','hidden') NOT NULL DEFAULT 'active',
	`audience` enum('women','mixed','men','kids') NOT NULL DEFAULT 'mixed',
	`currency` char(3) NOT NULL DEFAULT 'PKR',
	`product_count` int unsigned NOT NULL DEFAULT 0,
	`in_stock_count` int unsigned NOT NULL DEFAULT 0,
	`cover_image_url` varchar(1024),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_brands_slug` UNIQUE(`slug`),
	CONSTRAINT `uq_brands_source_ref` UNIQUE(`source_ref`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`product_id` char(36) NOT NULL,
	`position` smallint unsigned NOT NULL,
	`url` varchar(1024) NOT NULL,
	`width` smallint unsigned,
	`height` smallint unsigned,
	CONSTRAINT `pk_product_images` PRIMARY KEY(`product_id`,`position`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`product_id` char(36) NOT NULL,
	`position` smallint unsigned NOT NULL,
	`source_variant_id` varchar(64) NOT NULL,
	`sku` varchar(120),
	`size` varchar(40),
	`size_label` varchar(120),
	`color` varchar(80),
	`color_family` varchar(20),
	`price_minor` bigint unsigned NOT NULL,
	`compare_at_minor` bigint unsigned,
	`available` boolean NOT NULL,
	CONSTRAINT `pk_product_variants` PRIMARY KEY(`product_id`,`position`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` char(36) NOT NULL,
	`brand_id` char(36) NOT NULL,
	`source_product_id` varchar(80) NOT NULL,
	`sku` varchar(120),
	`name` varchar(255) NOT NULL,
	`short_name` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`components` json NOT NULL,
	`highlights` json NOT NULL,
	`audience` enum('women','men','kids','unisex','unknown') NOT NULL,
	`category` enum('clothing','unstitched','accessories','jewelry','bags','footwear','home','beauty','fragrance') NOT NULL,
	`piece_type` enum('threePiece','twoPiece','single') NOT NULL,
	`piece_count` tinyint unsigned,
	`stitching` enum('stitched','unstitched'),
	`fabric` varchar(40),
	`color` varchar(80),
	`color_families` json NOT NULL,
	`price_minor` bigint unsigned NOT NULL,
	`price_max_minor` bigint unsigned NOT NULL,
	`compare_at_minor` bigint unsigned,
	`currency` char(3) NOT NULL,
	`discount_percent` tinyint unsigned GENERATED ALWAYS AS ((case when compare_at_minor > price_minor then least(99, greatest(1, round((compare_at_minor - price_minor) * 100 / compare_at_minor))) end)) STORED,
	`in_stock` boolean NOT NULL,
	`source_url` varchar(1024) NOT NULL,
	`source_type` varchar(100),
	`source_tags` json NOT NULL,
	`search_text` text NOT NULL,
	`source_published_at` datetime(0),
	`source_created_at` datetime(0),
	`first_seen_at` datetime(3) NOT NULL,
	`last_seen_at` datetime(3) NOT NULL,
	`retired_at` datetime(3),
	`content_hash` char(64) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_products_source` UNIQUE(`brand_id`,`source_product_id`)
);
--> statement-breakpoint
CREATE TABLE `ingest_runs` (
	`id` char(36) NOT NULL,
	`source` varchar(40) NOT NULL,
	`mode` enum('full','incremental') NOT NULL,
	`status` enum('running','succeeded','failed') NOT NULL,
	`started_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`finished_at` datetime(3),
	`source_cursor` datetime(3),
	`stats` json,
	`error` text,
	CONSTRAINT `ingest_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ix_products_brand_list` ON `products` (`brand_id`,`retired_at`,`category`,`in_stock`,`first_seen_at`);--> statement-breakpoint
CREATE INDEX `ix_products_brand_price` ON `products` (`brand_id`,`price_minor`);--> statement-breakpoint
CREATE INDEX `ix_products_feed` ON `products` (`category`,`retired_at`,`in_stock`,`first_seen_at`);--> statement-breakpoint
CREATE INDEX `ix_products_sale` ON `products` (`retired_at`,`in_stock`,`discount_percent`);--> statement-breakpoint
CREATE INDEX `ix_ingest_runs_source` ON `ingest_runs` (`source`,`status`,`started_at`);