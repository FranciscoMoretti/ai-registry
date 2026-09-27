const releaseDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatReleaseDate(released?: number): string {
  return released
    ? releaseDateFormatter.format(new Date(released * 1000))
    : "Unknown";
}

export function compareReleaseDates(
  a: { released?: number; name: string },
  b: { released?: number; name: string },
): number {
  return (b.released ?? 0) - (a.released ?? 0) || a.name.localeCompare(b.name);
}

export function isRecentlyReleased(
  released: number | undefined,
  days: number,
  now = Date.now(),
): boolean {
  if (!days) return true;
  if (!released) return false;
  const age = now - released * 1000;
  return age >= 0 && age <= days * 86_400_000;
}
