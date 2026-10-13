-- Search building blocks (docs/data-model.md → Search):
--   pg_trgm  : fuzzy / typo-tolerant matching on product and brand names
--   unaccent : accent-insensitive search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
