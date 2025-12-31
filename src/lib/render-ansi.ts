/**
 * Server-side ANSI rendering utility using expressive-code
 * Used at build time to pre-render terminal output
 */
import {
  ExpressiveCodeEngine,
  ExpressiveCodeTheme,
  type ExpressiveCodePlugin,
} from "@expressive-code/core";
import { toHtml } from "hast-util-to-html";
import { pluginShiki } from "@expressive-code/plugin-shiki";
import type { Element, Text } from "hast";
import { visit } from "unist-util-visit";

// Cache the engine instance for reuse across renders
let engineInstance: ExpressiveCodeEngine | null = null;
let cachedStyles: string | null = null;

/**
 * Regex to match file paths with optional line:column suffix
 * Matches patterns like:
 * - ./pkg/schema/types.ks:3:14
 * - pkg/schema/types.ks:10:5
 * - ./lib.ks:42
 */
const FILE_PATH_REGEX =
  /(?:\.\/)?([a-zA-Z0-9_\-./]+\.(?:ks|toml|json))(?::(\d+)(?::(\d+))?)?/g;

/** Decode base64 string to text */
export function decodeBase64ToText(base64: string): string {
  try {
    const buffer = Buffer.from(base64, "base64");
    let text = buffer.toString("utf-8");
    // Normalize ./tmp/xxx/ paths for cleaner display
    text = text.replace(/\.\/tmp\/[^\/]+\//g, "./");
    text = text.replace(/"\.\/tmp\/[^\/]+\//g, '"./');
    return text;
  } catch {
    return base64;
  }
}

/**
 * Custom expressive-code plugin that wraps file paths in clickable spans.
 * This operates on the HAST (HTML AST) after rendering, ensuring paths
 * are properly wrapped regardless of how expressive-code structures them.
 */
function pluginFilePathLinks(): ExpressiveCodePlugin {
  return {
    name: "file-path-links",
    hooks: {
      postprocessRenderedBlock: ({ renderData }) => {
        // Walk the HAST and find text nodes containing file paths
        visit(renderData.blockAst, "text", (node: Text, index, parent) => {
          if (!parent || typeof index !== "number") return;

          const text = node.value;
          FILE_PATH_REGEX.lastIndex = 0;

          // Check if this text node contains any file paths
          const matches: Array<{
            match: string;
            path: string;
            line?: number;
            column?: number;
            start: number;
            end: number;
          }> = [];

          let match: RegExpExecArray | null;
          // biome-ignore lint/suspicious/noAssignInExpressions: acceptable here
          while ((match = FILE_PATH_REGEX.exec(text)) !== null) {
            matches.push({
              match: match[0],
              path: match[1],
              line: match[2] ? Number.parseInt(match[2], 10) : undefined,
              column: match[3] ? Number.parseInt(match[3], 10) : undefined,
              start: match.index,
              end: match.index + match[0].length,
            });
          }

          if (matches.length === 0) return;

          // Build replacement nodes: text + link + text + link + ...
          const newChildren: (Text | Element)[] = [];
          let lastEnd = 0;

          for (const m of matches) {
            // Text before this match
            if (m.start > lastEnd) {
              newChildren.push({
                type: "text",
                value: text.slice(lastEnd, m.start),
              });
            }

            // The wrapped file path link
            const data = JSON.stringify({
              path: m.path,
              line: m.line,
              column: m.column,
            });

            newChildren.push({
              type: "element",
              tagName: "span",
              properties: {
                className: ["ansi-file-link"],
                "data-file-click": data,
              },
              children: [{ type: "text", value: m.match }],
            });

            lastEnd = m.end;
          }

          // Text after the last match
          if (lastEnd < text.length) {
            newChildren.push({
              type: "text",
              value: text.slice(lastEnd),
            });
          }

          // Replace the text node with our new children
          // We need to splice into the parent's children array
          if (
            parent &&
            "children" in parent &&
            Array.isArray(parent.children)
          ) {
            parent.children.splice(index, 1, ...newChildren);
          }
        });
      },
    },
  };
}

/** Get or create the expressive-code engine */
async function getEngine(): Promise<ExpressiveCodeEngine> {
  if (engineInstance) return engineInstance;

  // Load the github-dark theme from shiki bundled themes
  const { bundledThemes } = await import("shiki");
  const githubDarkTheme = await bundledThemes["github-dark"]();

  engineInstance = new ExpressiveCodeEngine({
    themes: [new ExpressiveCodeTheme(githubDarkTheme.default)],
    plugins: [pluginShiki(), pluginFilePathLinks()],
    styleOverrides: {
      codeFontFamily: "'Fira Code', monospace",
      codeFontSize: "13px",
      codeLineHeight: "1.4",
    },
    defaultProps: {
      frame: "none",
    },
  });

  return engineInstance;
}

/** Get cached styles or generate them */
export async function getAnsiStyles(): Promise<string> {
  if (cachedStyles) return cachedStyles;

  const engine = await getEngine();
  const baseStyles = await engine.getBaseStyles();
  const themeStyles = await engine.getThemeStyles();
  cachedStyles = `${baseStyles}\n${themeStyles}`;
  return cachedStyles;
}

export interface RenderedAnsi {
  html: string;
  plaintext: string;
  /** File paths detected in the output (path -> {line, column}) */
  detectedPaths: Array<{
    /** The full match text (e.g., "./pkg/types.ks:3:14") */
    match: string;
    /** Just the file path portion */
    path: string;
    /** Line number if present */
    line?: number;
    /** Column number if present */
    column?: number;
  }>;
}

/** Pre-rendered outputs for a single test */
export interface RenderedOutputs {
  stdout: RenderedAnsi | null;
  stderr: RenderedAnsi | null;
}

/**
 * Detect file paths in plaintext (for metadata purposes)
 */
function detectFilePaths(plaintext: string): RenderedAnsi["detectedPaths"] {
  const paths: RenderedAnsi["detectedPaths"] = [];
  const seen = new Set<string>();

  FILE_PATH_REGEX.lastIndex = 0;
  let match = FILE_PATH_REGEX.exec(plaintext);

  while (match !== null) {
    const [fullMatch, pathPart, linePart, colPart] = match;
    if (!seen.has(fullMatch)) {
      seen.add(fullMatch);
      paths.push({
        match: fullMatch,
        path: pathPart,
        line: linePart ? Number.parseInt(linePart, 10) : undefined,
        column: colPart ? Number.parseInt(colPart, 10) : undefined,
      });
    }
    match = FILE_PATH_REGEX.exec(plaintext);
  }

  return paths;
}

/**
 * Render ANSI-encoded text to HTML at build time.
 * File paths are automatically wrapped with clickable data attributes
 * via the pluginFilePathLinks plugin.
 *
 * @param data - Base64-encoded ANSI text, or plain text if not base64
 * @param fallbackText - Fallback plain text if data is empty
 */
export async function renderAnsi(
  data?: string,
  fallbackText?: string,
): Promise<RenderedAnsi | null> {
  const text = data ? decodeBase64ToText(data) : fallbackText;
  if (!text?.trim()) return null;

  const plaintext = text.trim();
  const detectedPaths = detectFilePaths(plaintext);

  try {
    const engine = await getEngine();

    const result = await engine.render({
      code: plaintext,
      language: "ansi",
      meta: "frame=none",
    });

    // The plugin has already wrapped file paths in the AST
    const html = toHtml(result.renderedGroupAst);

    return { html, plaintext, detectedPaths };
  } catch (err) {
    console.error("Failed to render ANSI:", err);
    // Return plaintext fallback on error
    return {
      html: `<pre style="font-family: 'Fira Code', monospace; white-space: pre-wrap;">${escapeHtml(plaintext)}</pre>`,
      plaintext,
      detectedPaths,
    };
  }
}

/** Escape HTML special characters */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Render multiple ANSI outputs at once (more efficient for batch processing)
 */
export async function renderAnsiOutputs(outputs: {
  stdout?: string;
  stdout_coloured?: string;
  stderr?: string;
  stderr_coloured?: string;
}): Promise<RenderedOutputs> {
  const [stdout, stderr] = await Promise.all([
    renderAnsi(outputs.stdout_coloured, outputs.stdout),
    renderAnsi(outputs.stderr_coloured, outputs.stderr),
  ]);

  return { stdout, stderr };
}
