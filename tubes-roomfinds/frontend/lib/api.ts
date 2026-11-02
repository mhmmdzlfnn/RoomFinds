const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (useMock) throw new Error('Mode mock aktif. Data ditampilkan dari contoh lokal.');
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) body = options.body;
  else if (options.body !== undefined) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(options.body); }
  const response = await fetch(path.startsWith('/api/') ? path : `/api/${path}`, { ...options, headers, body, credentials: 'include' });
  if (!response.ok) {
    let message = 'Terjadi kesalahan. Coba lagi.';
    try { const data = await response.json(); message = data.message ?? data.error ?? message; } catch { /* response without json */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const get = <T>(path: string) => request<T>(path);
export const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body });
export const put = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body });
export const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body });
export const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });
export const upload = <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body });
