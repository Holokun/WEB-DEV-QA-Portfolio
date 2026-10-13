export class ApiRequestError extends Error {
  constructor(public readonly status: number, public readonly code?: string) {
    super(`Request failed (${status})`);
    this.name = 'ApiRequestError';
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let code: string | undefined;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'error' in body) {
        const error = body.error;
        if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') code = error.code;
      }
    } catch { /* HTTP status remains useful when the body is not JSON. */ }
    throw new ApiRequestError(response.status, code);
  }
  return await response.json() as T;
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  return readJson<T>(await fetch(url, { signal }));
}

export async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return readJson<T>(await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
  }));
}
