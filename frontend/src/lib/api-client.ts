import { loadSession } from '@/features/auth/auth-storage';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestBody = FormData | object | undefined;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: RequestBody;
  signal?: AbortSignal;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const headers = new Headers({ Accept: 'application/json' });
  const token = loadSession()?.token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }

  const response = await fetch(`/api${path}`, { method, headers, body: payload, signal });

  if (response.status === 401) {
    unauthorizedHandler?.();
  }
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string };
    if (data.message) {
      return data.message;
    }
  } catch {
    // Not JSON: fall back to the status text.
  }
  return response.statusText || `Request failed with status ${response.status}`;
}
