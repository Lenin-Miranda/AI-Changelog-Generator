export function validateConfig(env: Record<string, unknown>) {
  for (const key of [
    "OPENAI_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "FRONTEND_URL",
  ]) {
    if (typeof env[key] !== "string" || !(env[key] as string).trim())
      throw new Error(`${key} is required`);
  }
  for (const key of ["SUPABASE_URL", "FRONTEND_URL"]) {
    const url = new URL(env[key] as string);
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error(`${key} must be an HTTP(S) URL`);
    if (env.NODE_ENV === "production" && url.protocol !== "https:")
      throw new Error(`${key} must use HTTPS in production`);
  }
  for (const [key, fallback, max] of [
    ["GENERATION_USER_DAILY_LIMIT", 10, 100],
    ["GENERATION_GLOBAL_DAILY_LIMIT", 100, 10000],
    ["TRUST_PROXY_HOPS", 0, 5],
  ] as const) {
    const value = env[key] === undefined ? fallback : Number(env[key]);
    if (
      !Number.isInteger(value) ||
      value < (key === "TRUST_PROXY_HOPS" ? 0 : 1) ||
      value > max
    )
      throw new Error(`Invalid ${key}`);
    env[key] = value;
  }
  return env;
}
