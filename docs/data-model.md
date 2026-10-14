# ClothHub — Data model (MySQL)

ClothHub starts as a catalogue browser and grows into **Instagram for women's
fashion**: people follow each other, post outfits, tag products, ask "help me
choose", and the community's taste surfaces what is worth buying ("most
loved", "best on sale", "trending this week").

This document fixes the shape of the database so each later feature is new
tables in the right place, not a rework. Tables marked *(later)* are designed
here but are not created until their phase. Tables marked ✅ exist
(`apps/api/src/db/schema/`).

---

## Principles

1. **ClothHub owns its own databases** — `clothhub_dev` and `clothhub_prod` on
   the scraper's MySQL 8.4 server. The scraper's database is read, never
   written. Domains are kept apart by table-name groups and schema files, so
   a busy one (signals) can move to its own database later:

   | Domain | Owns | Written by |
   | --- | --- | --- |
   | catalog ✅ | brands, products, images, variants | ingest job |
   | ingest ✅ | `ingest_runs` (history + cursor) | ingest job |
   | auth *(phase 6)* | users, sessions, linked Apple/Google accounts | Better Auth |
   | social *(later)* | profiles, follows, saves, collections, posts, votes, comments | API |
   | signals *(later)* | raw interaction events, daily rollups, scores | API + jobs |

2. **IDs are UUIDv7** (`CHAR(36)`), generated in the API (`src/lib/ids.ts`).
   Time-ordered, so new rows land at the end of the index (unlike UUIDv4), and
   safe in URLs. Source systems' IDs are stored separately
   (`source_product_id`), never used as our keys.

3. **Every table has `created_at` / `updated_at`** (`DATETIME(3)`, UTC).
   Things people may have saved or shared are **retired** (`retired_at`),
   never deleted, so saved lists and share links keep working.

4. **Money is an integer in the smallest unit** (`price_minor`, paisa, as
   `BIGINT` — bridal couture passes INT's 42.9M rupees) plus `currency`. No
   floats. The API returns whole rupees.

5. **Typed columns for what we filter, sort or show; `JSON` for the long
   tail.** Piece count, fabric and stitching are columns; source tags,
   description parts and colour families are JSON.

6. **Counts are cached, not computed per request.** Brand product counts
   today; likes, saves and followers later, in small `*_stats` tables updated
   asynchronously. The hot row a list reads is never locked by every tap.

7. **High-volume events are append-only and partitioned by month.** They are
   rolled up into daily aggregates, and scores are recomputed by jobs.
   Screens read the scores, never the raw events.

8. **Constraints in the database:** foreign keys, unique keys for natural
   identities, enums for closed vocabularies. The ingest job and the API can
   both be wrong; the database cannot.

---

## `catalog` — what we show ✅

Shaped by the real scraper data (`docs/scraper-data.md`): about 290k
products, 1.2M variants and 1.3M images across 99 brands.

```
brands ─┬─< products ─┬─< product_images
        │             ├─< product_variants      (size / colour / price / availability)
        │             └─< product_prices        (history, append-only) (later)
        └─< brand_sources                       (where each brand's data comes from) (later)
```

- **brands**
  - `id`, `source_ref` (scraper brand id, unique), `slug` (unique, stable), `name` (curated in `modules/ingest/brands.ts`, not the scraper's domain-derived name), `website`, `logo_url`
  - `status` (`active` / `hidden`): USD-priced brands are hidden until the app shows other currencies.
  - `audience` (`women` / `mixed` / `men` / `kids`): curated, or measured from the brand's products (≥ 90% of labelled products). The fallback for products with no audience signal.
  - `currency` (`PKR` / `USD`): the shop's Shopify base currency; the scraper does not record it.
  - `product_count`, `in_stock_count`, `cover_image_url`: cached by ingest from listed products.
  - `claimed_by_org_id` *(later: brand self-service)*
- **products**
  - **Identity:** `id`, `brand_id`, `source_product_id` (unique with the brand; scraper id `"{brandId}_{shopifyId}"`), `sku` (the brand's article code — titles repeat across designs).
  - **Text:** `name` (display), `short_name` (no piece count), `title` (brand's original), `description`, `components` (JSON: Shirt / Dupatta / Trouser parts), `highlights` (JSON: short facts).
  - **Classification:** `audience` (`women` / `men` / `kids` / `unisex` / `unknown` — the product's own signal), `category` (`clothing`, `unstitched`, `accessories`, `jewelry`, `bags`, `footwear`, `home`, `beauty`, `fragrance`). Derived by ingest from `source_type` + `source_tags` + title + URL; the raw values are kept, so products can be re-classified without re-syncing.
  - **Price:** `price_minor`, `price_max_minor`, `compare_at_minor` (null unless greater than the price), `currency`, `discount_percent` (**generated column**, 1–99).
  - **Attributes:** `piece_type`, `piece_count`, `stitching`, `fabric`, `color`, `color_families` (JSON).
  - **State:** `in_stock`, `retired_at`, `first_seen_at` (drives "newest"; source dates are unreliable when a brand migrates its store), `last_seen_at`, `source_published_at`, `source_created_at`, `content_hash` (scraper hash + ingest version).
  - **Scope:** `listed` — whether the app shows it today (`modules/catalog/scope.ts`), recomputed by every ingest run.
  - **Source:** `source_url` (the "Visit brand" link), `source_type`, `source_tags`, `search_text`.
- **product_images**: `product_id`, `position`, `url`, `width`, `height`. *(later: `dominant_color` for placeholders)*
- **product_variants**: `product_id`, `position`, `source_variant_id`, `sku`, `size` (normalised: `S`, `M`, `5-6Y`…), `size_label` (raw), `color`, `color_family`, `price_minor`, `compare_at_minor`, `available`.
- **product_prices** *(later)*: `product_id`, `price_minor`, `compare_at_minor`, `observed_at` — "price dropped" alerts.
- **categories** *(later)*: a tree (`parent_id`, `path` like `women/unstitched/3-piece`) once categories need more than today's enum.

### Indexes for V1 queries

| Query | Index |
| --- | --- |
| Featured (in stock first, newest), across brands / for a brand | `(listed, in_stock, first_seen_at)` / `(listed, brand_id, in_stock, first_seen_at)` |
| Newest / oldest | `(listed, first_seen_at)` / `(listed, brand_id, first_seen_at)` |
| Price sorts and price facets | `(listed, price_minor)` / `(listed, brand_id, price_minor)` |
| Piece-type facet | `(listed, piece_type)` / `(listed, brand_id, piece_type)` |
| Best on sale *(feed later)* | `(listed, discount_percent)` |
| Search | `FULLTEXT (name, title, search_text)` |
| Ingest upsert | unique `(brand_id, source_product_id)` |

List queries pick the page's ids from these indexes, then load only those
rows, so a page costs 15–130 ms on the full catalogue.

## `ingest` — how data arrives ✅

- **ingest_runs**: `id`, `source` (`scraper`), `mode` (`full` / `incremental`), `status`, `started_at`, `finished_at`, `source_cursor` (the scraper `updatedAt` reached — where the next run starts), `stats` (JSON: read / created / updated / unchanged / retired / restored), `error`.
- **sources** *(later)*: `id`, `brand_id`, `kind` (`scraper` / `api` / `csv` / `manual`), `config` — new data sources are new kinds here; the catalogue tables do not change.

## `auth` — accounts *(phase 6)*

Better Auth's tables: `users`, `sessions`, `accounts` (Apple / Google / email
links per user), `verifications` (email codes). App data references
`users.id`; nothing else from Better Auth is read by the app.

## `social` — people *(later)*

- **profiles**
  - `user_id` (PK), `handle` (unique, case-insensitive), `display_name`, `avatar_url`, `bio`, `visibility`
- **follows**
  - `follower_id`, `followee_id`, `created_at` — PK on the pair, plus an index on `(followee_id, created_at)`
- **saves**
  - `user_id`, `product_id`, `created_at` — the heart
- **collections**
  - `id`, `owner_id`, `name`, `visibility` (`private` / `unlisted` / `public`), `cover_product_id`
- **collection_items**
  - `collection_id`, `product_id`, `position`, `added_at`
- **posts**
  - `id`, `author_id`, `kind` (`outfit` / `look` / `help_me_choose`), `caption`, `visibility`, `created_at`
- **post_media**
  - `post_id`, `position`, `url`, `width`, `height`
- **post_tags**
  - `post_id`, `media_position`, `product_id`, `x`, `y` — products tagged on a photo
- **post_options** + **votes**
  - Help Me Choose: the options, and one vote per user per post
- **comments**, **reactions**
- **\*_stats**
  - `profile_stats` (followers, following, posts)
  - `post_stats` (votes, comments, reactions)
  - `product_stats` (saves, shares)

**Feeds** start as *fan-out on read*: query the posts of people you follow,
sorted by time and indexed on `(author_id, created_at desc)`. A precomputed
`feed_items` table is added only if reading gets slow.

## `signals` — taste of the community *(later)*

- **events**
  - Columns:
    - `id`, `occurred_at`
    - `actor_id` (nullable), `device_id`
    - `kind`: `view`, `save`, `unsave`, `share`, `click_out`, `vote`
    - `product_id`, `post_id`, `context` (JSON)
  - **Range-partitioned by month.** Old months are detached and archived cheaply.
- **product_daily**
  - `product_id`, `day`, `views`, `saves`, `shares`, `click_outs` — rolled up by a scheduled job
- **product_scores**
  - `product_id`, `trending`, `loved`, `deal_score`, `computed_at`
  - Recomputed by a job from `product_daily`, with time decay for "trending this week".

These power **"most loved"**, **"trending"**, and **"best on sale"**, the last
being discount combined with community interest, so not just the biggest
percentage. If event volume outgrows MySQL, `events` and the rollups move
to ClickHouse; the `product_scores` table the app reads stays the same.

---

## Migrations

- Drizzle schema files live in `apps/api/src/db/schema/`, one per domain. Generated SQL goes in `apps/api/drizzle/` (hand-written SQL, like the FULLTEXT index, via `drizzle-kit generate --custom`).
- Migrations are forward-only and run by `node dist/migrate.js` before each deploy.
- Changes are additive and backwards-compatible (add the column, deploy, backfill, then tighten), so a deploy never breaks the running version.
