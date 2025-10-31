import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import starlightHeadingBadges from "starlight-heading-badges";
import starlightGitHubAlerts from "starlight-github-alerts";
import kintsuSpec from "./src/assets/kintsu.json" with { type: "json" };

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
      // If directory doesn't exist or can't be read, just add the kind link
      items.push({
        label: kind.name,
        link: `/specs/${kindId}`,
      });
    }
  }

  return items;
}

export default defineConfig({
  site: "https://docs.kintsu.dev",
  server: {
    port: 3000,
  },
  // langs: [
  //   kintsu,
  // ],
  integrations: [
    starlight({
      title: "Kintsu Docs",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/kintsu/kintsu",
        },
      ],
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
  ],
});
