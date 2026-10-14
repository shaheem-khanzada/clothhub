import { ApiError } from '@/axios';

import { shouldRetry } from './queryClient';

describe('shouldRetry', () => {
  it('retries lost connections, timeouts and server errors, twice at most', () => {
    expect(shouldRetry(0, new ApiError('network_error', '', null))).toBe(true);
    expect(shouldRetry(1, new ApiError('timeout', '', null))).toBe(true);
    expect(shouldRetry(0, new ApiError('internal_error', '', 500))).toBe(true);
    expect(shouldRetry(2, new ApiError('internal_error', '', 503))).toBe(false);
  });

  it('never retries requests that will fail the same way again', () => {
    expect(shouldRetry(0, new ApiError('not_found', '', 404))).toBe(false);
    expect(shouldRetry(0, new ApiError('invalid_request', '', 400))).toBe(false);
    expect(shouldRetry(0, new Error('response does not match the contract'))).toBe(false);
  });
});
