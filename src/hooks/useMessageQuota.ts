export const FREE_MESSAGE_LIMIT = 3;
export const FREE_DOC_LIMIT = 1;
export const FREE_CASE_LIMIT = 1;

function getKey(type: string, email: string): string {
  return `sidqo_${type}_count_${email}`;
}

export function getCount(type: string, email: string): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(getKey(type, email));
  return val ? parseInt(val, 10) : 0;
}

export function incrementCount(type: string, email: string): number {
  const current = getCount(type, email);
  const next = current + 1;
  localStorage.setItem(getKey(type, email), String(next));
  return next;
}

export function hasReachedLimit(
  type: string,
  email: string,
  limit: number
): boolean {
  return getCount(type, email) >= limit;
}
