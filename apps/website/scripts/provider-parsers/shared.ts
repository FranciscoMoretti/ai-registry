import type { ParsedProviderModel, ProviderLifecycle, ReasoningMode } from "./types";

const basicEntityMap = new Map<string, string>([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
  ["nbsp", " "],
  ["mdash", "-"],
  ["ndash", "-"],
]);

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const named = basicEntityMap.get(entity.toLowerCase());
    if (named) return named;

    if (entity.startsWith("#x")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return match;
  });
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function stripHtml(value: string): string {
  return normalizeWhitespace(
    decodeHtmlEntities(
      value
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

export function parseTableRows(html: string): string[][] {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];

  return rows
    .map((row) => {
      return [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map((cell) => stripHtml(cell[1]))
        .filter(Boolean);
    })
    .filter((cells) => cells.length > 0);
}

export function uniqueBy<T>(values: T[], getKey: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

export function uniqueStrings(values: string[]): string[] {
  return uniqueBy(
    values.map((value) => normalizeWhitespace(value)).filter(Boolean),
    (value) => value
  );
}

export function slugToDisplayName(slug: string): string {
  return slug
    .split(/[-_/]+/g)
    .filter(Boolean)
    .map((part) => {
      if (/^[0-9.]+$/.test(part)) return part;
      if (/^[a-z]{1,3}$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function extractSnapshotDate(value: string): string | null {
  const fullDate = value.match(/(?:@|-)(20\d{6})(?:\b|$)/);
  if (fullDate) {
    const date = fullDate[1];
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }

  const previewMonth = value.match(/preview-(\d{2})-(20\d{2})(?:\b|$)/);
  if (previewMonth) {
    return `${previewMonth[2]}-${previewMonth[1]}`;
  }

  const yymm = value.match(/-(\d{2})(\d{2})(?:\b|$)/);
  if (yymm) {
    const year = Number.parseInt(yymm[1], 10);
    const month = Number.parseInt(yymm[2], 10);
    if (month >= 1 && month <= 12) {
      return `20${String(year).padStart(2, "0")}-${String(month).padStart(2, "0")}`;
    }
  }

  return null;
}

export function compareModels(
  a: Pick<ParsedProviderModel, "canonicalModelId" | "sourceModelId">,
  b: Pick<ParsedProviderModel, "canonicalModelId" | "sourceModelId">
): number {
  return (
    a.canonicalModelId.localeCompare(b.canonicalModelId) ||
    a.sourceModelId.localeCompare(b.sourceModelId)
  );
}

export function sanitizeModelId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9@._:-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function inferReasoningMode(value: string): ReasoningMode {
  const normalized = value.toLowerCase();
  if (normalized.includes("non-thinking")) return "non-thinking";
  if (normalized.includes("thinking")) return "thinking";
  return "unknown";
}

export function mergeLifecycles(
  current: ProviderLifecycle,
  next: ProviderLifecycle
): ProviderLifecycle {
  const priority: ProviderLifecycle[] = [
    "shut_down",
    "deprecated",
    "experimental",
    "preview",
    "latest",
    "stable",
    "unknown",
  ];

  return priority.indexOf(next) < priority.indexOf(current) ? next : current;
}
