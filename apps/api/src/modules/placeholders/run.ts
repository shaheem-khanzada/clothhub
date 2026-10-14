import { sizedImageUrl } from '@clothhub/shared';
import { and, desc, eq, isNull, lt, or } from 'drizzle-orm';
import type { Pool } from 'mysql2/promise';

import type { Database } from '../../db/client.js';
import { productImages, products } from '../../db/schema/index.js';
import { withAdvisoryLock } from '../../lib/advisoryLock.js';
import type { Logger } from '../../lib/logger.js';
import { isListed } from '../catalog/scope.js';
import { THUMBHASH_MAX_SIZE, thumbHashOf } from './thumbhash.js';

/*
 * Placeholders: a ThumbHash for every listed product's cover photo.
 *
 * Runs after the ingest job. Each run hashes the covers that do not have one
 * yet — in-stock and newest first, as the app shows them — by asking the CDN
 * for a 100px copy and encoding it. Hashes survive re-imports as long as the
 * photo's URL is unchanged (see `Ingest.upsertBatch`).
 *
 * A photo that cannot be fetched or decoded is marked and retried a week
 * later, so a dead link never blocks the queue.
 */

export type FetchImage = (url: string) => Promise<Uint8Array>;

export type PlaceholderOptions = {
  /** Stop after this many photos; the rest wait for the next run. */
  limit?: number;
  /** Photos fetched at the same time. Modest: these are a brand's CDN. */
  concurrency?: number;
  batchSize?: number;
  fetchImage?: FetchImage;
  now?: () => Date;
  logger?: Logger;
};

export type PlaceholderStats = {
  hashed: number;
  failed: number;
};

type Target = {
  db: Database;
  pool: Pool;
};

type Cover = {
  productId: string;
  url: string;
};

const FETCH_TIMEOUT_MS = 10_000;
const RETRY_FAILED_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** Downloads a photo over HTTP. Errors on anything but a 2xx answer. */
export const fetchImageOverHttp: FetchImage = async (url) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'image/webp,image/jpeg,image/png;q=0.9,image/*;q=0.8' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
};

export class Placeholders {
  private readonly limit: number;
  private readonly concurrency: number;
  private readonly batchSize: number;
  private readonly fetchImage: FetchImage;
  private readonly now: () => Date;
  private readonly logger: Logger | undefined;

  constructor(
    private readonly target: Target,
    options: PlaceholderOptions = {},
  ) {
    this.limit = options.limit ?? Number.POSITIVE_INFINITY;
    this.concurrency = options.concurrency ?? 8;
    this.batchSize = options.batchSize ?? 400;
    this.fetchImage = options.fetchImage ?? fetchImageOverHttp;
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger;
  }

  run(): Promise<PlaceholderStats> {
    return withAdvisoryLock(this.target.pool, 'placeholders', () => this.runLocked());
  }

  private async runLocked(): Promise<PlaceholderStats> {
    const stats: PlaceholderStats = { hashed: 0, failed: 0 };
    const done = () => stats.hashed + stats.failed;

    // Every photo handled gets a hash or a failure mark, so the next query
    // moves on by itself — no cursor to keep.
    while (done() < this.limit) {
      const covers = await this.nextCovers(Math.min(this.batchSize, this.limit - done()));
      if (covers.length === 0) break;

      await forEachConcurrently(covers, this.concurrency, (cover) => this.hash(cover, stats));
      this.logger?.info({ ...stats }, 'Placeholders progress');
    }

    return stats;
  }

  /** Listed products' covers still without a hash, in the order the app shows them. */
  private nextCovers(count: number): Promise<Cover[]> {
    const retryBefore = new Date(this.now().getTime() - RETRY_FAILED_AFTER_MS);

    return this.target.db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(products)
      .innerJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.position, 0)))
      .where(
        and(
          isListed,
          isNull(productImages.thumbhash),
          or(isNull(productImages.thumbhashFailedAt), lt(productImages.thumbhashFailedAt, retryBefore)),
        ),
      )
      .orderBy(desc(products.inStock), desc(products.firstSeenAt))
      .limit(count);
  }

  private async hash(cover: Cover, stats: PlaceholderStats) {
    // Only write back if the import has not replaced the photo meanwhile.
    const samePhoto = and(
      eq(productImages.productId, cover.productId),
      eq(productImages.position, 0),
      eq(productImages.url, cover.url),
    );

    try {
      const image = await this.fetchImage(sizedImageUrl(cover.url, THUMBHASH_MAX_SIZE));
      const thumbhash = await thumbHashOf(image);

      await this.target.db
        .update(productImages)
        .set({ thumbhash, thumbhashFailedAt: null })
        .where(samePhoto);
      stats.hashed += 1;
    } catch (error) {
      await this.target.db
        .update(productImages)
        .set({ thumbhashFailedAt: this.now() })
        .where(samePhoto);
      stats.failed += 1;
      this.logger?.debug({ url: cover.url, err: error }, 'No placeholder for photo');
    }
  }
}

/** Runs `work` over `items` with at most `concurrency` in flight. */
async function forEachConcurrently<T>(items: T[], concurrency: number, work: (item: T) => Promise<void>) {
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await work(item as T);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}
