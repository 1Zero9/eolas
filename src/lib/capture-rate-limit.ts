type Entry = { attempts: number; resetAt: number };

const attempts = new Map<string, Entry>();

export function isRateLimited(key: string, limit = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) return false;
  return current.attempts >= limit;
}

export function recordAttempt(key: string, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { attempts: 1, resetAt: now + windowMs });
    return;
  }
  current.attempts += 1;
}

export function clearAttempts(key: string) { attempts.delete(key); }

export function clientAddress(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'local';
}
