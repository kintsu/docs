/**
 * Astro Integration: llms.txt and AGENTS.txt Generator
 *
 * Generates AI-agent-friendly documentation files following the llms.txt
 * specification (https://llmstxt.org).
 *
 * Output files:
 * - /llms.txt - Site overview and documentation links for LLMs
 * - /AGENTS.txt - Same content, alternative filename for agent discovery
 */

import type { AstroIntegration } from "astro";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface LlmsTxtOptions {
  /** Site title */
  title?: string;
  /** Site description */
  description?: string;
  /** Base URL for the site */
  siteUrl?: string;
}

interface DocEntry {
  path: string;
  title: string;
}

interface SpecSummary {
  id: string;
  kind: string;
  number: number;
  title: string;
  status: string;
  created: string;
  updated: string | null;
}

interface KintsuSpec {
  spec_kinds: Array<{ id: string; name: string; description: string }>;
  spec_summaries: SpecSummary[] | null;
}

/**
 * Load spec summaries from kintsu.json
 */
function loadKintsuSpec(): KintsuSpec | null {
  try {
    const content = readFileSync("./src/assets/kintsu.json", "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Recursively collect all documentation pages
 */
function collectDocs(dir: string, basePath: string, entries: DocEntry[]): void {
  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        collectDocs(fullPath, `${basePath}/${item}`, entries);
      } else if (item.endsWith(".md") || item.endsWith(".mdx")) {
        // Skip index files for cleaner URLs
        const pageName = item.replace(/\.(md|mdx)$/, "");
        const urlPath =
          pageName === "index" ? basePath || "/" : `${basePath}/${pageName}/`;

        // Create a readable title from the filename
        const title = pageName
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        entries.push({
          path: urlPath,
          title:
            title === "Index" ? basePath.split("/").pop() || "Home" : title,
        });
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
}

/**
 * Group entries by their top-level section
 */
function groupBySection(entries: DocEntry[]): Map<string, DocEntry[]> {
  const groups = new Map<string, DocEntry[]>();

  for (const entry of entries) {
    const parts = entry.path.split("/").filter(Boolean);
    const section = parts[0] || "root";

    if (!groups.has(section)) {
      groups.set(section, []);
    }
    groups.get(section)!.push(entry);
  }

  return groups;
}

/**
 * Generate the llms.txt content
 */
function generateLlmsTxt(
  options: LlmsTxtOptions,
  entries: DocEntry[],
  kintsuSpec: KintsuSpec | null,
): string {
  const { title, description, siteUrl } = options;
  const groups = groupBySection(entries);

  const lines: string[] = [];

  // Header
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`> ${description}`);
  lines.push("");

  // Project overview
  lines.push(
    "Kintsu is a schema language for defining strongly-typed data structures with:",
  );
  lines.push("");
  lines.push("- Static type checking and validation");
  lines.push("- Multi-language code generation (Rust, TypeScript, Python, Go)");
  lines.push("- Rich metadata and form annotations");
  lines.push("- Workspace and manifest management");
  lines.push("");
  lines.push("Source code: https://github.com/kintsu");
  lines.push("");

  // Section ordering for logical reading
  const sectionOrder = ["syntax", "schemas", "reference", "types", "legal"];

  // Section titles
  const sectionTitles: Record<string, string> = {
    root: "Overview",
    syntax: "Syntax Reference",
    schemas: "Schema Guides",
    reference: "CLI & Configuration",
    types: "Type System",
    legal: "Legal",
  };

  // Output sections in order
  for (const section of sectionOrder) {
    const sectionEntries = groups.get(section);
    if (!sectionEntries || sectionEntries.length === 0) continue;

    const sectionTitle = sectionTitles[section] || section;
    lines.push(`## ${sectionTitle}`);
    lines.push("");

    for (const entry of sectionEntries) {
      const url = `${siteUrl}${entry.path}`;
      lines.push(`- [${entry.title}](${url})`);
    }
    lines.push("");
  }

  // Handle root entries
  const rootEntries = groups.get("root");
  if (rootEntries && rootEntries.length > 0) {
    lines.push("## Overview");
    lines.push("");
    for (const entry of rootEntries) {
      const url = `${siteUrl}${entry.path}`;
      lines.push(`- [${entry.title}](${url})`);
    }
    lines.push("");
  }

  // Specifications section - use kintsu.json data if available
  const specSummaries = kintsuSpec?.spec_summaries;
  if (specSummaries && specSummaries.length > 0) {
    // Group specs by kind
    const specsByKind = new Map<string, SpecSummary[]>();
    for (const spec of specSummaries) {
      if (!specsByKind.has(spec.kind)) {
        specsByKind.set(spec.kind, []);
      }
      specsByKind.get(spec.kind)!.push(spec);
    }

    // Get kind descriptions from kintsu.json
    const kindDescriptions: Record<string, string> = {};
    if (kintsuSpec?.spec_kinds) {
      for (const kind of kintsuSpec.spec_kinds) {
        kindDescriptions[kind.id] = kind.name;
      }
    }
    // Fallback descriptions
    const fallbackDescriptions: Record<string, string> = {
      AD: "Architecture Decisions",
      RFC: "Request for Comments",
      SPEC: "Technical Specifications",
      TSY: "Type System Specifications",
      ERR: "Error Specifications",
    };

    // Order spec kinds logically
    const kindOrder = ["AD", "RFC", "SPEC", "TSY", "ERR"];

    lines.push("## Specifications");
    lines.push("");
    lines.push(`- [Specifications Overview](${siteUrl}/specs/)`);
    lines.push("");

    for (const kind of kindOrder) {
      const kindSpecs = specsByKind.get(kind);
      if (!kindSpecs || kindSpecs.length === 0) continue;

      const kindDesc =
        kindDescriptions[kind] || fallbackDescriptions[kind] || kind;
      lines.push(`### ${kindDesc} (${kind})`);
      lines.push("");

      // Sort specs by number
      kindSpecs.sort((a, b) => a.number - b.number);

      for (const spec of kindSpecs) {
        const url = `${siteUrl}/specs/${kind.toLowerCase()}/${spec.id}/`;
        // Include title and optionally last updated
        let entry = `- [${spec.id}: ${spec.title}](${url})`;
        if (spec.updated) {
          entry += ` (updated: ${spec.updated})`;
        }
        lines.push(entry);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Astro integration for generating llms.txt
 */
export function llmsTxt(options: LlmsTxtOptions = {}): AstroIntegration {
  const {
    title = "Kintsu Documentation",
    description = "Documentation for Kintsu, a schema language for defining strongly-typed data structures with multi-language code generation.",
    siteUrl = "https://docs.kintsu.dev",
  } = options;

  return {
    name: "llms-txt",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const docsDir = "./src/content/docs";
        const entries: DocEntry[] = [];

        // Collect all documentation pages
        collectDocs(docsDir, "", entries);

        // Load kintsu.json for spec data
        const kintsuSpec = loadKintsuSpec();
        const specCount = kintsuSpec?.spec_summaries?.length ?? 0;

        // Generate content
        const content = generateLlmsTxt(
          { title, description, siteUrl },
          entries,
          kintsuSpec,
        );

        // Write to output directory
        const outDir = dir.pathname;
        writeFileSync(join(outDir, "llms.txt"), content);
        writeFileSync(join(outDir, "AGENTS.txt"), content);

        console.log(
          `✓ Generated llms.txt and AGENTS.txt (${entries.length} docs, ${specCount} specs)`,
        );
      },
    },
  };
}

export default llmsTxt;
