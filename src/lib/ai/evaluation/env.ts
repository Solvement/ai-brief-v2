declare const process: { env?: Record<string, string | undefined> } | undefined;

export function getEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const value = process.env?.[name];
  return value && value.trim() ? value : undefined;
}

export function getEnvNumber(name: string, fallback: number): number {
  const value = getEnv(name);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
