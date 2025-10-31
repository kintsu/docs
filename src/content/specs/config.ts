import { defineCollection, type z } from "astro:content";
// Import the canonical manifest (optimistic: schema is guaranteed correct)
import kintsuSpec from "../../assets/kintsu.json" with { type: "json" };

import { specSchema } from "../../lib/specs";
import { glob } from "astro/loaders";

// Register one collection per spec kind, using bare names since files live in src/content/specs/<kind>
export const collections = Object.fromEntries(
  kintsuSpec.spec_kinds.map((k: any) => [
    k.id.toLowerCase(),
    defineCollection({
      loader: glob({
        pattern: "**/*.md",
        base: `src/content/specs/${k.id.toLowerCase()}`,
      }),
      schema: specSchema,
    }),
  ]),
) as Record<string, ReturnType<typeof defineCollection>>;

export type SpecFrontmatter = z.infer<typeof specSchema>;
