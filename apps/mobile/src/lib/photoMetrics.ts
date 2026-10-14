import type { ImageLoadEventData, ImageProgressEventData } from 'expo-image';
import { useRef } from 'react';

/*
 * How photos actually load, in development builds only: every
 * `REPORT_EVERY` photos the Metro log prints one line —
 *
 *   [photos] 50 loaded · 62% from cache · network: median 310 ms, p90 840 ms · avg 38 KB · image/webp 100%
 *
 * — enough to see what a change does to the numbers, on a real phone and a
 * real network. Release builds record nothing.
 */

const REPORT_EVERY = 50;

export type PhotoSample = {
  /** From the request to the decoded photo. */
  ms: number;
  cache: ImageLoadEventData['cacheType'];
  /** Bytes downloaded; null when the photo came from a cache. */
  bytes: number | null;
  mediaType: string | null;
};

export type PhotoReport = {
  count: number;
  cachedShare: number;
  medianMs: number | null;
  p90Ms: number | null;
  averageKb: number | null;
  mediaTypes: Record<string, number>;
};

let samples: PhotoSample[] = [];

function percentile(sorted: number[], share: number): number | null {
  if (sorted.length === 0) {
    return null;
  }

  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))] ?? null;
}

/** Sums up a set of loads. Network timings ignore cached photos, which say nothing about the network. */
export function summarize(batch: PhotoSample[]): PhotoReport {
  const network = batch.filter((sample) => sample.cache === 'none');
  const times = network.map((sample) => sample.ms).sort((a, b) => a - b);
  const sizes = network.flatMap((sample) => (sample.bytes === null ? [] : [sample.bytes]));

  const mediaTypes: Record<string, number> = {};
  for (const sample of network) {
    const type = sample.mediaType ?? 'unknown';
    mediaTypes[type] = (mediaTypes[type] ?? 0) + 1;
  }

  return {
    count: batch.length,
    cachedShare: batch.length === 0 ? 0 : (batch.length - network.length) / batch.length,
    medianMs: percentile(times, 0.5),
    p90Ms: percentile(times, 0.9),
    averageKb: sizes.length === 0 ? null : sizes.reduce((sum, bytes) => sum + bytes, 0) / sizes.length / 1024,
    mediaTypes,
  };
}

export function formatReport(report: PhotoReport): string {
  const percent = (share: number) => `${Math.round(share * 100)}%`;
  const network =
    report.medianMs === null ? 'network: —' : `network: median ${report.medianMs} ms, p90 ${report.p90Ms} ms`;
  const size = report.averageKb === null ? 'avg —' : `avg ${Math.round(report.averageKb)} KB`;
  const total = Object.values(report.mediaTypes).reduce((sum, count) => sum + count, 0);
  const formats = Object.entries(report.mediaTypes)
    .map(([type, count]) => `${type} ${percent(count / total)}`)
    .join(', ');

  return `[photos] ${report.count} loaded · ${percent(report.cachedShare)} from cache · ${network} · ${size}${formats ? ` · ${formats}` : ''}`;
}

export function recordPhotoLoad(sample: PhotoSample): void {
  samples.push(sample);

  if (samples.length >= REPORT_EVERY) {
    console.info(formatReport(summarize(samples)));
    samples = [];
  }
}

type PhotoMetricsHandlers = {
  onLoadStart?: () => void;
  onProgress?: (event: ImageProgressEventData) => void;
  onLoad?: (event: ImageLoadEventData) => void;
};

/**
 * expo-image event handlers that time one photo. Returns no handlers in
 * release builds, so production images carry no extra work.
 */
export function usePhotoMetrics(): PhotoMetricsHandlers {
  const startedAt = useRef(0);
  const bytes = useRef<number | null>(null);

  if (!__DEV__) {
    return {};
  }

  return {
    onLoadStart: () => {
      startedAt.current = performance.now();
      bytes.current = null;
    },
    onProgress: (event) => {
      bytes.current = event.total > 0 ? event.total : event.loaded;
    },
    onLoad: (event) => {
      recordPhotoLoad({
        ms: Math.round(performance.now() - startedAt.current),
        cache: event.cacheType,
        bytes: event.cacheType === 'none' ? bytes.current : null,
        mediaType: event.source.mediaType,
      });
    },
  };
}
