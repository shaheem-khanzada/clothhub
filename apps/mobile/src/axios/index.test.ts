import { AxiosError, AxiosHeaders } from 'axios';

import { ApiError, toApiError } from './index';

function axiosError(code: string | undefined, response?: { status: number; data: unknown }) {
  const config = { headers: new AxiosHeaders() };

  return new AxiosError(
    'Request failed',
    code,
    config,
    {},
    response && { ...response, statusText: '', headers: {}, config },
  );
}

describe('toApiError', () => {
  it("uses the API's own error code and message", () => {
    const error = toApiError(
      axiosError('ERR_BAD_REQUEST', {
        status: 400,
        data: { error: { code: 'invalid_request', message: 'The request is not valid' } },
      }),
    );

    expect(error).toMatchObject({ code: 'invalid_request', message: 'The request is not valid', status: 400 });
  });

  it('recognises timeouts and lost connections', () => {
    expect(toApiError(axiosError(AxiosError.ECONNABORTED)).code).toBe('timeout');
    expect(toApiError(axiosError(AxiosError.ERR_NETWORK))).toMatchObject({ code: 'network_error', status: null });
  });

  it('keeps the status of an error page that is not from the API', () => {
    expect(toApiError(axiosError('ERR_BAD_RESPONSE', { status: 502, data: '<html>Bad gateway</html>' }))).toMatchObject({
      code: 'http_error',
      status: 502,
    });
  });

  it('wraps anything else and passes ApiErrors through', () => {
    const existing = new ApiError('not_found', 'Gone', 404);

    expect(toApiError(existing)).toBe(existing);
    expect(toApiError(new Error('boom'))).toMatchObject({ code: 'unknown_error', message: 'boom' });
  });
});
