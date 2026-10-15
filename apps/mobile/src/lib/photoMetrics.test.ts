import { formatReport, summarize, type PhotoSample } from './photoMetrics';

const network = (ms: number, bytes: number, mediaType = 'image/webp'): PhotoSample => ({
  ms,
  cache: 'none',
  bytes,
  mediaType,
});

const cached = (ms: number): PhotoSample => ({ ms, cache: 'disk', bytes: null, mediaType: 'image/webp' });

describe('summarize', () => {
  it('times only photos that came over the network', () => {
    const report = summarize([network(100, 20_480), network(300, 40_960), network(900, 61_440), cached(4)]);

    expect(report).toEqual({
      count: 4,
      cachedShare: 0.25,
      medianMs: 300,
      p90Ms: 900,
      averageKb: 40,
      mediaTypes: { 'image/webp': 3 },
    });
  });

  it('copes with everything coming from the cache', () => {
    expect(summarize([cached(3), cached(5)])).toMatchObject({
      cachedShare: 1,
      medianMs: null,
      averageKb: null,
    });
  });
});

describe('formatReport', () => {
  it('prints one line for the Metro log', () => {
    const report = summarize([network(200, 30_720, 'image/webp'), network(400, 51_200, 'image/jpeg'), cached(2)]);

    expect(formatReport(report)).toBe(
      '[photos] 3 loaded · 33% from cache · network: median 400 ms, p90 400 ms · avg 40 KB · image/webp 50%, image/jpeg 50%',
    );
  });
});
