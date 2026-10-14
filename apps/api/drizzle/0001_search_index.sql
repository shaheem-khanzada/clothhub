-- Full-text search over product names and the search text the ingest job
-- builds (brand, type, tags, SKU, fabric, colours). Drizzle's MySQL builder
-- cannot declare FULLTEXT indexes, so this one is hand-written.
CREATE FULLTEXT INDEX `ft_products_search` ON `products` (`name`, `title`, `search_text`);
