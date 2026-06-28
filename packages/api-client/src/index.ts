import { getEnv } from '@test/shared/runtime-config';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getEnv().API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json() as Promise<T>;
}
