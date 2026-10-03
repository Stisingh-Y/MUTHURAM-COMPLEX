/**
 * Helpers for the JSON-encoded columns in the schema.
 *
 * `featuresJson`, `specsJson`, `tagsJson` and the order address snapshots are
 * stored as `String` so the schema stays portable across SQLite and
 * PostgreSQL. These helpers are the only place that knows about that.
 */

export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/** A `label` / `value` pair used for product specification tables. */
export type SpecPair = { label: string; value: string };

export function parseSpecs(raw: string | null | undefined): SpecPair[] {
  return parseJsonArray<SpecPair>(raw).filter(
    (entry): entry is SpecPair =>
      typeof entry?.label === "string" && typeof entry?.value === "string",
  );
}

export function parseFeatures(raw: string | null | undefined): string[] {
  return parseJsonArray<unknown>(raw).filter((entry): entry is string => typeof entry === "string");
}

export function parseTags(raw: string | null | undefined): string[] {
  return parseJsonArray<unknown>(raw).filter((entry): entry is string => typeof entry === "string");
}
