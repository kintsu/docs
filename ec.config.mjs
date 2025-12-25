import { defineEcConfig } from "astro-expressive-code";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the Kintsu language grammar
const kintsuGrammar = JSON.parse(
  fs.readFileSync(join(__dirname, "./src/lib/kintsu.tmLanguage.json"), "utf-8"),
);

export default defineEcConfig({
  styleOverrides: {
    codeFontFamily: "'Fira Code', monospace",
  },
  shiki: {
    langs: [
      {
        ...kintsuGrammar,
        name: "kintsu",
        scopeName: "source.kintsu",
        aliases: ["ks", "ktsu"],
      },
    ],
  },
});
