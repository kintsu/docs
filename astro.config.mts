import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import starlightHeadingBadges from "starlight-heading-badges";
import starlightGitHubAlerts from "starlight-github-alerts";
import kintsuSpec from "./src/assets/kintsu.json" with { type: "json" };
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

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

      // Extract spec numbers and create links
      const specItems = files
        .map((file) => {
          const match = file.match(/^([A-Z]+)-(\d+)\.md$/);
          if (match) {
            const [, kindCode, number] = match;
            const qid = `${kindCode}-${number.padStart(4, "0")}`;
            return {
              label: qid,
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
    } catch (error) {
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
        starlightGitHubAlerts(),
        starlightHeadingBadges(),
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
          label: "Tooling and Schemas",
          items: [
            { label: "Schemas", slug: "schemas/intro" },
            { label: "Schema Manifest", slug: "schemas/manifest" },
            { label: "Schema Structure", slug: "schemas/structure" },
            { label: "Kintsu CLI", slug: "reference/cli" },
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
  ],
});
