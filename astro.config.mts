import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

import starlightHeadingBadges from "starlight-heading-badges";
import starlightGitHubAlerts from "starlight-github-alerts";
import remarkGithubAlerts from "remark-github-blockquote-alert";
import kintsuSpec from "./src/assets/kintsu.json" with { type: "json" };
import tailwindcss from "@tailwindcss/vite";

import starlightLinksValidator from "starlight-links-validator";
import react from "@astrojs/react";
import { kintsuPdf, type DocOrderEntry } from "./pdf.mts";

// Production site URL for PDF link generation
const SITE_URL = "https://docs.kintsu.dev";

// Spec kinds ordered for logical reading (Architecture → Design → Implementation → Type System)
const SPEC_KIND_ORDER = [
  "ad",
  "rfc",
  "spec",
  "tsy",
  "cg",
  "perf",
  "integ",
  "unit",
  "e2e",
  "err",
];

// Documentation sections in logical reading order with titles for TOC
const DOCS_ORDER: DocOrderEntry[] = [
  // Getting Started / Introduction
  { path: "/", title: "Kintsu Documentation", section: "Introduction" },
  { path: "/syntax/builtin/", title: "Builtin Types", section: "Syntax" },
  { path: "/syntax/tokens/", title: "Tokens" },
  { path: "/syntax/keywords/", title: "Keywords" },
  { path: "/syntax/spanned/", title: "Spanned Statements" },
  { path: "/syntax/naming/", title: "Naming" },
  // Schemas
  { path: "/schemas/intro/", title: "Schemas", section: "Getting Started" },
  { path: "/schemas/manifest/", title: "Schema Manifest" },
  { path: "/schemas/workspace/", title: "Schema Workspace" },
  { path: "/schemas/structure/", title: "Schema Structure" },
  // Reference
  { path: "/reference/cli/", title: "Kintsu CLI", section: "Reference" },
  { path: "/reference/config/", title: "Kintsu Config" },
  // Type System
  { path: "/types/enum/", title: "enum", section: "Type System" },
  { path: "/types/struct/", title: "struct" },
  { path: "/types/array/", title: "array" },
  { path: "/types/errors/", title: "error" },
  { path: "/types/oneof/", title: "oneof" },
  { path: "/types/union/", title: "union" },
  { path: "/types/type/", title: "type" },
  { path: "/types/operation/", title: "operation" },
];

// Generate nested sidebar items for specs
function generateSpecSidebarItems() {
  const specsBasePath = "./src/content/specs";
  const items = [{ label: "Overview", link: "/specs" }];

  for (const kind of kintsuSpec.spec_kinds) {
    const kindId = kind.id.toLowerCase();
    const kindPath = join(specsBasePath, kindId);

    try {
      // Read all spec files in this kind directory
      const files = readdirSync(kindPath)
        .filter((f) => f.endsWith(".md"))
        .sort();

      // Extract spec numbers, titles, and create links
      const specItems = files
        .map((file) => {
          const match = file.match(/^([A-Z]+)-(\d+)\.md$/);
          if (match) {
            const [, kindCode, number] = match;
            const qid = `${kindCode}-${number.padStart(4, "0")}`;
            const filePath = join(kindPath, file);
            const content = readFileSync(filePath, "utf-8");
            const { data } = matter(content);
            const title = data.title || qid;
            return {
              label: `${number.padStart(4, "0")} - ${title}`,
              link: `/specs/${kindId}/${qid}`,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Add the kind group with nested spec items
      items.push({
        label: kind.name,
        items: [
          { label: `${kind.name} Overview`, link: `/specs/${kindId}` },
          ...specItems,
        ],
      });
    } catch {
      // If directory doesn't exist or can't be read, skip
    }
  }

  return items;
}

export default defineConfig({
  site: "https://docs.kintsu.dev",
  server: {
    port: 3000,
  },
  markdown: {
    remarkPlugins: [remarkGithubAlerts],
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  // langs: [
  //   kintsu,
  // ],
  integrations: [
    starlight({
      title: "Kintsu Docs",
      customCss: ["./src/styles/custom.css", "./src/styles/global.css"],
      expressiveCode: {
        styleOverrides: { codeFontFamily: "'Fira Code', monospace" },
      },
      components: {
        SiteTitle: "./src/components/SiteTitle.astro",
        SocialIcons: "./src/components/SocialIcons.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
        MobileMenuToggle: "./src/components/MobileMenuToggle.astro",
        Pagination: "./src/components/Pagination.astro",
        EditLink: "./src/components/EditLink.astro",
        Search: "./src/components/Search.astro",
        Sidebar: "./src/components/Sidebar.astro",
        Header: "./src/components/Header.astro",
      },
      social: [],
      plugins: [
        // starlightVersions({
        //   versions: [{ slug: "0.1.0", label: "wip" }],
        // }),
        starlightHeadingBadges(),
        starlightGitHubAlerts(),
        starlightLinksValidator({
          exclude: ["/specs/**"],
        }),
      ],
      sidebar: [
        {
          label: "Syntax",
          items: [
            { label: "Builtin Types", slug: "syntax/builtin" },
            { label: "Tokens", slug: "syntax/tokens" },
            { label: "Keywords", slug: "syntax/keywords" },
            { label: "Spanned Statements", slug: "syntax/spanned" },
            { label: "Naming", slug: "syntax/naming" },
          ],
        },
        {
          label: "Getting Started",
          items: [
            { label: "Schemas", slug: "schemas/intro" },
            { label: "Schema Structure", slug: "schemas/structure" },
            { label: "Schema Manifest", slug: "schemas/manifest" },
            { label: "Schema Workspaces", slug: "schemas/workspace" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Kintsu CLI", slug: "reference/cli" },
            { label: "Kintsu Config", slug: "reference/config" },
          ],
        },
        {
          label: "Type System",
          items: [
            { label: "enum", slug: "types/enum" },
            { label: "struct", slug: "types/struct" },
            { label: "array", slug: "types/array" },
            { label: "error", slug: "types/errors" },
            { label: "oneof", slug: "types/oneof" },
            { label: "union", slug: "types/union" },
            { label: "type", slug: "types/type" },
            { label: "operation", slug: "types/operation" },
          ],
        },
        {
          label: "Specifications",
          items: generateSpecSidebarItems(),
        },
      ],
    }),
    react(),
    kintsuPdf({
      siteUrl: SITE_URL,
      specKinds: kintsuSpec.spec_kinds,
      specKindOrder: SPEC_KIND_ORDER,
      docsOrder: DOCS_ORDER,
    }),
  ],
});
