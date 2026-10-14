-- Runs once, when the local MySQL volume is first created.

-- The app user owns every `clothhub_*` database, so the API's integration
-- tests can create and drop `clothhub_test` and `clothhub_test_scraper`.
GRANT ALL PRIVILEGES ON `clothhub\_%`.* TO 'clothhub'@'%';

-- Read-only access to a locally loaded scraper dump (scripts/load-scraper-dump.sh),
-- the same shape as production's `clothhub_reader`.
CREATE USER IF NOT EXISTS 'clothhub_reader'@'%' IDENTIFIED BY 'reader';
GRANT SELECT ON `scraper`.* TO 'clothhub_reader'@'%';

FLUSH PRIVILEGES;
