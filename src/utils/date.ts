const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** YYYY-MM-DD of `date` in KST — used to compare "same calendar day" regardless of server timezone. */
export function toKstDateString(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toKstDateString(a) === toKstDateString(b);
}

export function isYesterday(prev: Date, now: Date): boolean {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return toKstDateString(prev) === toKstDateString(yesterday);
}

export function todayKstDateString(): string {
  return toKstDateString(new Date());
}
