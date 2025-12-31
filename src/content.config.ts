import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { collections as specCollections } from "./content/specs/config";
import { glob } from "astro/loaders";

const testMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.string(),
  expect_pass: z.boolean(),
  tags: z.array(z.string()),
});

const sourceLocationSchema = z
  .object({
    file: z.string(),
    line: z.number(),
    column: z.number(),
  })
  .nullable()
  .optional();

const errorMetadataSchema = z
  .object({
    code: z.string().nullable().optional(),
    domain: z.string().nullable().optional(),
    severity: z.string(),
    message: z.string().nullable().optional(),
    help: z.string().nullable().optional(),
    source_location: sourceLocationSchema,
    labeled_spans: z.array(
      z.object({
        label: z.string(),
        primary: z.boolean(),
      }),
    ),
    notes: z.array(z.string()),
    // New fields from ERR-0001 error code structure
    error_domain: z.string().nullable().optional(), // Full domain name (e.g., "TypeResolution")
    error_category: z.string().nullable().optional(), // Category name (e.g., "Resolution")
    error_sequence: z.number().nullable().optional(), // Sequence number (e.g., 2 from KTR1002)
    error_severity: z.string().nullable().optional(), // Severity from category level
  })
  .nullable()
  .optional();

const cliTestSchema = z.object({
  type: z.literal("cli_test"),
  test: z.object({
    fs: z.record(z.string()),
    metadata: testMetadataSchema,
    exit_code: z.number(),
    passed: z.boolean(),
    expected_error_code: z.string().nullable().optional(),
    actual_error_code: z.string().nullable().optional(),
    expected_span: z.boolean().optional(),
    has_source_span: z.boolean().optional(),
    span_matches_expectation: z.boolean().optional(),
    stdout: z.string().optional(),
    stdout_coloured: z.string().optional(),
    stderr: z.string(),
    stderr_coloured: z.string().optional(),
    error_message: z.string().nullable().optional(),
    error_metadata: errorMetadataSchema,
    pre_compiled: z.boolean().optional(),
  }),
});

const compileTestSchema = z.object({
  type: z.literal("compile_test"),
  test: z.object({
    fs: z.record(z.string()),
    metadata: testMetadataSchema,
    actual_pass: z.boolean(),
    matches_expectation: z.boolean(),
    error_message: z.string().nullable().optional(),
  }),
});

const testsCollection = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/tests" }),
  schema: z.discriminatedUnion("type", [cliTestSchema, compileTestSchema]),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  tests: testsCollection,
  ...specCollections,
};
