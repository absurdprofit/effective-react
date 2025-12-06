export function diff(prev: unknown[], next: unknown[]) {
  if (prev.length !== next.length) return true;

  for (let i = 0; i < prev.length; i++) {
    if (!Object.is(prev[i], next[i])) return true;
  }
  return false;
}