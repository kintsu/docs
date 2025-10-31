import { z } from "astro:content";

// Minimal update schema saved in frontmatter
export const specUpdate = z.object({
  author: z.string(),
  date: z.date(),
  description: z.string(),
});

export const specStatus = z.enum([
  "draft",
  "proposed",
  "accepted",
  "rejected",
  "unstable",
  "stable",
  "deprecated",
]);

// Main frontmatter schema for specs
export const specSchema = z.object({
  author: z.string(),
  components: z.array(z.string()),
  created: z.date(),
  kind: z.string(),
  number: z.number(),
  status: specStatus,
  title: z.string(),
  updates: z.array(specUpdate),
  version_after: z.string(),
  version_before: z.string().optional().nullable(),
});

export type SpecSchema = z.infer<typeof specSchema>;

/** Normalize a kind to the canonical collection key (lowercase). */
export function normalizeKind(kind: string) {
  return String(kind).toLowerCase();
}

/**
 * Produce the qualified identifier for a spec.
 * Example: qualifiedId('TSY', 1) -> 'TSY-0001'
 */
export function qualifiedId(kind: string, number: number) {
  return `${String(kind).toUpperCase()}-${String(number).padStart(4, "0")}`;
}

/**
 * Produce a slug for routing. Example: 'tsy/TSY-0001'
 */
export function makeSlug(kind: string, number: number) {
  return `${normalizeKind(kind)}/${qualifiedId(kind, number)}`;
}

/**
 * Parse a qualified id like 'TSY-0001' and return { kind:'tsy', number: 1 }
 * Returns undefined for invalid input.
 */
export function parseQualifiedId(qid: string) {
  const m = String(qid)
    .toUpperCase()
    .match(/^([A-Z]+)-0*([0-9]+)$/);
  if (!m) return undefined;
  return { kind: normalizeKind(m[1]), number: Number(m[2]) };
}

export default { normalizeKind, qualifiedId, makeSlug, parseQualifiedId };
