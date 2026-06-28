export type RuntimeEnv = {
  API_BASE_URL: string;
  AUTH_BASE_URL: string;
  DEPLOY_TARGET: string;
  ENABLE_HUB: boolean;
};

const DEV_FALLBACK: RuntimeEnv = {
  API_BASE_URL: 'http://localhost:8080',
  AUTH_BASE_URL: 'http://localhost:8080/auth',
  DEPLOY_TARGET: 'local',
  ENABLE_HUB: true,
};

export function getEnv(): RuntimeEnv {
  if (typeof window !== 'undefined') {
    const w = (window as any).__ENV__;
    if (w) return { ...w, ENABLE_HUB: String(w.ENABLE_HUB) === 'true' };
    return DEV_FALLBACK;
  }
  if (!process.env.API_BASE_URL) return DEV_FALLBACK;
  return {
    API_BASE_URL: process.env.API_BASE_URL!,
    AUTH_BASE_URL: process.env.AUTH_BASE_URL!,
    DEPLOY_TARGET: process.env.DEPLOY_TARGET ?? 'local',
    ENABLE_HUB: (process.env.ENABLE_HUB ?? 'true') === 'true',
  };
}
