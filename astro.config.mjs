import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import starlightHeadingBadges from "starlight-heading-badges";
import starlightGitHubAlerts from "starlight-github-alerts";

// import * as kintsu from './src/assets/kintsu.tmLanguage.json' with { type: 'json' };
// import starlightVersions from "starlight-versions";

// const kintsu = await import("./src/lib/syntax/kintsu.js");

// const highlighter = await createHighlighter({
//   langs: [

//   ],
//   themes: []
// })

// highlighter.loadLanguageSync(kintsu)

export default defineConfig({
  site: 'https://docs.kintsu.dev',
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
        // {
        // 	label: 'Introduction',
        // 	items: []
        // },
        // {
        // 	label: 'Guides',
        // 	items: [
        // 		// Each item here is one entry in the navigation menu.
        // 		{ label: 'Example Guide', slug: 'guides/example' },
        // 	],
        // },
        // {
        // 	label: 'Reference',
        // 	autogenerate: { directory: 'reference' },
        // },
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
          label: "Proposals (RFCs)",
          autogenerate: { directory: "rfc" },
        },
        {
          label: "Architecture Decisions (ADs)",
          autogenerate: { directory: "ad" },
        },
        {
          label: "Technical Specifications (SPECs)",
          autogenerate: { directory: "spec" },
        },
        {
          label: "Type System Specifications (TSYs)",
          autogenerate: { directory: "tsy" },
        },
      ],
    }),
  ],
});
