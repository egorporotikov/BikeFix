const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bikefix-production.up.railway.app';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Всегда возвращает string | undefined
 * чтобы не ломать типы в request()
 */
async function getTokenFromStorage(): Promise<string | undefined> {
  if (authToken) return authToken || undefined;

  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const { getBrowserSupabaseClient } = await import('@/lib/supabase-browser');
    const supabase = getBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    authToken = data.session?.access_token ?? null;
    return authToken || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Главная функция запросов
 * token теперь строго string | undefined
 */
async function request(
  method: string,
  path: string,
  data?: any,
  token?: string | undefined
) {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (data && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    body = data;
  }

  // Автоматическая подстановка токена
  if (!token) {
    token = await getTokenFromStorage();
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body,
  });

  if (res.status === 401) {
    throw new Error('Unauthorized');
  }

  const text = await res.text();

  if (!res.ok) {
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = json.detail || json.message || JSON.stringify(json);
    } catch {}
    throw new Error(detail || res.statusText);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function get(path: string, token?: string) {
  return request('GET', path, undefined, token);
}

export function post(path: string, data?: any, token?: string) {
  return request('POST', path, data, token);
}

export function put(path: string, data?: any, token?: string) {
  return request('PUT', path, data, token);
}

export function patch(path: string, data?: any, token?: string) {
  return request('PATCH', path, data, token);
}

export function del(path: string, token?: string) {
  return request('DELETE', path, undefined, token);
}

export default { get, post, put, patch, del };
