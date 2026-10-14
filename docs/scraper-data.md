# Scraper data — what we have (snapshot of 8 Oct 2026)

Source: a full dump of the scraper's MySQL database (`clothhub-prod-db`,
MySQL 8.4), loaded into a throwaway database and profiled. Admin accounts
were not loaded. Numbers below are exact counts from that snapshot.

## 1. How the scraper works

The scraper is a **Shopify sync with a review step**, not a raw crawler:

```
brands ──sync (Shopify /products.json)──▶ syncedProducts ──validate──▶ publish ──▶ liveProducts
 144 added, 99 verified              290,208 rows      288,178 valid      one publish run    288,178 rows
```

| Table | What it is | Used by ClothHub? |
| --- | --- | --- |
| `brands` | Store URL, verification state, cached counts | Yes, for brand identity |
| `liveProducts` | **Validated, published products**, editable by scraper admins (`isEdited`) | **Yes, this is the ingest source** |
| `syncedProducts` | Raw last sync, including 2,030 invalid rows (1,434 without images, 647 without price) | No |
| `syncRuns`, `syncRunFailures`, `publishRuns` | Job history | Only to check freshness |
| `admins` | Scraper admin logins | Never |

- **Product id:** `"{brandId}_{shopifyProductId}"`, e.g. `12_10086505480489`. Stable, so it becomes our `source_product_id`.
- **Removed products:** a product that disappears gets `removedAt` set and `isActive = 0`. Nothing is removed yet.
- **Change detection:** `contentHash` changes when a product changes, and `updatedAt` gives an incremental cursor.
- **Freshness:** only **one** sync (8 Oct, about 19 s per brand) and one publish have run. Data is a week old, and there is no schedule yet.

## 2. Size of the catalogue

| | Count |
| --- | --- |
| Brands verified / failed | **99** / 45 |
| Live products | **288,178** |
| In stock | 108,945 (38%) |
| On sale (scraper's `onSale` flag, only set when in stock) | 61,069 |
| Variants | 1,189,692 (about 4 per product) |
| Images | 1,330,653 (median 4 per product, all on `cdn.shopify.com` with width and height) |
| Created in the last 30 / 90 days | 8,506 / 27,777 |

**62% of products are out of stock.** These are mostly old seasons that brands
keep online. A feed that shows everything would be mostly unavailable items.

### Brands that failed verification (not in the data)

There are 45 of them. They fall into three groups:

- **No public product feed:** Khaadi, Sapphire, Mushq, Sifona.
- **Not Shopify:** Bareeze, Farah Talib Aziz.
- **Site unreachable or URL wrong:** Ego, Warda, Maryam Hussain, and others.

Khaadi and Sapphire are among the biggest women's brands, so their absence
will be noticed. Fixing it is scraper work (a different source), not ClothHub
work.

## 3. Women's fashion: how much is actually for women

The scraper has **no audience field**. Brands mix women's, men's and kids'
lines (Junaid Jamshed, Edenrobe and Gul Ahmed all sell all three), and some
brands are menswear only (Charcoal, Uniworth, Engine, Furor) or kids only
(Cocobee, Minnie Minors, Rollover, Alaya Junior).

I ran a keyword classifier over `type`, `tags`, `title` and the product URL:

| Audience | Products |
| --- | --- |
| Women (says so) | 91,422 |
| Women (implicit: lawn, dupatta, kurti, pret, maxi, lehenga …) | 39,769 |
| Men | 47,188 |
| Kids | 41,305 |
| Unisex | 361 |
| Unknown | 68,133 |

Adding a **brand prior** fills most of the gaps. Brands are split as follows:

- 52 brands are at least 90% women's products among their labelled ones. Their unlabelled products count as women's.
- 30 brands are mixed.
- 16 brands are mostly men's or kids'.

| Women's catalogue (estimate) | Products |
| --- | --- |
| All | ~149,500 |
| Apparel only (clothing + unstitched) | ~129,100 |
| **In stock** | **~54,900** |
| **Apparel in stock** | **~45,500** |
| In stock and on sale | ~25,400 |

About 49,800 products stay unknown, almost all in mixed brands. These need
the manual brand setting below, or stay hidden until classified.

`type` is unusable as-is: it has **3,010 distinct values** ("Printed",
"Woman Un Stitched Allure Lawn", "configurable", "Men", "Clearance" …), and
29,036 products have none. Categories have to be derived by the same kind of
classifier.

| Category (keyword estimate) | Products |
| --- | --- |
| Clothing | 190,044 |
| Unstitched | 53,374 |
| Accessories | 21,574 |
| Jewellery | 6,854 |
| Bags | 5,361 |
| Footwear | 3,949 |
| Home | 3,178 |
| Beauty | 2,618 |
| Fragrance | 1,226 |

## 4. Data quality issues and what ingest does about them

| Issue | Evidence | Fix in ingest |
| --- | --- | --- |
| **Prices in USD for some brands** | Median prices around 90–300 for Panache, Rang Rasiya, Suffuse, Sania Maskatiya, Rastah, Zainab Chottani, Nida Azwer, Misha Lakhani, Zaaviay. Their Shopify base currency is USD. The scraper stores no currency. | Add `brands.currency`, set per brand (decision below). |
| Extreme prices | Tena Durrani median PKR 1.29M (bridal), one item at 122.5M | Keep. Flag prices above a per-brand outlier threshold for review. |
| `compareAtPrice` noise | 12,854 rows are `0`, 42,726 equal the price, 217 are below the price | Store `null` unless it is greater than the price. |
| `onSale` only set when in stock | 127,009 out-of-stock items have a real discount but `onSale = 0` | Recompute the discount ourselves from the prices. |
| Generic titles | 106,622 products share brand + title with another one ("Shirt Trouser Dupatta" ×1,011 at Sokamal). They are different designs, not duplicates. | Keep the brand's code from the URL handle (`u4807st-2pc-419`) as `sku`, and build a better display name (brand + line + code). |
| Brand names from domains | "Junaidjamshed", "Gulahmedshop", "Pk" (= Ethnc) | ClothHub `brands.name` is curated; the scraper name is used only to match. |
| `sourceCreatedAt` not reliable for "new" | All 23,414 Junaid Jamshed products show 2026 (store migrated) | "New arrivals" uses our `first_seen_at`, with `sourcePublishedAt` as a fallback. |
| Size labels | `M` / `Medium`, `5-6Y` / `5-6 Y` / `05-06Y`, `UNSTITCHED`; 116,885 variants have no size | Normalise to a size vocabulary and keep the raw label. |
| Colours | 56% of variants have one, 3,409 distinct values | Map to about 15 colour families for filters, and keep the raw value. |
| In stock, no sizes listed | 26,910 (mostly unstitched and accessories) | Normal; "one size". |
| No description | 19,884 | Optional field. |
| Shared primary image | 5,895 products in 2,833 groups | Mostly colourways. Leave it for now; maybe group them later. |

## 5. Mapping to ClothHub's catalogue

| ClothHub (`catalog.*`) | From `liveProducts` / `brands` |
| --- | --- |
| `brands.source_ref` | `brands.id` (scraper) |
| `brands.name`, `slug`, `website` | Curated; `website` from `sourceUrl` |
| `brands.currency`, `audience` | **New, set per brand** (see decisions) |
| `products.source_product_id` | `liveProducts.id` |
| `products.title` / `name` / `sku` | `title` / derived / handle from `productUrl` |
| `products.description` | `description` |
| `products.audience`, `category` | Classifier over `type` + `tags` + `title` + handle, plus the brand prior |
| `products.source_type`, `source_tags` | `type`, `tags` (kept raw for re-classifying) |
| `products.price_minor`, `price_max_minor`, `compare_at_minor` | `price`, `priceMax`, `compareAtPrice` × 100, after currency handling |
| `products.in_stock` | `inStock` |
| `products.source_url` | `productUrl` (the "Visit brand" link) |
| `products.source_published_at`, `first_seen_at`, `retired_at` | `sourcePublishedAt`, first ingest, `removedAt` |
| `product_variants` | `variants[]`: `sourceVariantId`, `sku`, `size`, `label`, `colour`, `price`, `compareAtPrice`, `available` |
| `product_images` | `images[]`: `src`, `width`, `height` (order = position) |
| `ingest` change check | `contentHash`; cursor on `updatedAt` |

**Ingest volume:** about 290k products, 1.2M variants and 1.3M images. A
full run upserts in batches of 500 and takes about 4 minutes; later runs only
touch rows whose `updatedAt` moved and whose `contentHash` changed.

## 6. Decisions (14 Oct 2026)

1. **USD-priced brands** — hidden in V1 (`brands.status = hidden`) until the scraper records each store's
   currency and the app can show it.
2. **Mixed brands** — only their women's products are shown. Products that say nothing about who they are
   for count as women's only in brands whose labelled products are at least 90% women's.
3. **Out of stock** — shown, but after in-stock products in the default sort, and filterable away.
   Retired products stay reachable through saves and shared links.
4. **Scope** — women's clothing and unstitched only. Jewellery, bags, footwear and accessories stay in the
   catalogue (classified) and can be switched on later without a re-import.
5. **Database** — ClothHub's own databases on the scraper's MySQL server (`clothhub_dev`,
   `clothhub_prod`); the scraper's database is only read.
6. **Scraper schedule** — the scraper is being reworked this week; ClothHub's import runs every 6 hours
   and only reads what changed, so it follows whatever schedule the scraper settles on.

After the first import of this snapshot: 123,836 products listed (41,341 in stock) across 78 brands.
