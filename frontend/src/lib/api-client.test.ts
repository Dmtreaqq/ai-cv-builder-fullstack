import { ApiError, apiRequest, setUnauthorizedHandler } from './api-client';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(null);
  });

  it('calls /api/v1 with the session cookie and a JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await expect(apiRequest('/cvs', { method: 'POST', body: { a: 1 } })).resolves.toEqual({
      ok: true,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/cvs');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin', body: '{"a":1}' });
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);
  });

  it('sends FormData as is', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, {}));
    const form = new FormData();

    await apiRequest('/cvs', { method: 'POST', body: form });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBe(form);
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
  });

  it('throws an ApiError with the string message from the body', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { statusCode: 409, message: 'Only a failed CV can be retried.' }),
    );

    const error = await apiRequest('/cvs/1/retry').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: 'Only a failed CV can be retried.' });
  });

  it('falls back to the status text for a non-JSON error', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 502, statusText: 'Bad Gateway' }));

    await expect(apiRequest('/cvs')).rejects.toMatchObject({ message: 'Bad Gateway' });
  });

  it('calls the unauthorized handler on 401', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Log in to continue.' }));

    await expect(apiRequest('/cvs')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('returns undefined for 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiRequest('/cvs/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
