"use client";

import { useCallback, useEffect, useRef } from "react";

interface RenderedAnsi {
  html: string;
  plaintext: string;
  detectedPaths: Array<{
    match: string;
    path: string;
    line?: number;
    column?: number;
  }>;
}

interface ClickableAnsiOutputProps {
  /** Pre-rendered ANSI HTML with clickable paths already wrapped */
  rendered: RenderedAnsi;
  /** Files available in the test's filesystem (for validation) */
  fsFiles: string[];
  /** Callback when a file path is clicked */
  onFileClick?: (filePath: string, line?: number, column?: number) => void;
  /** Additional class name */
  className?: string;
}

/**
 * Normalise a path for comparison (remove leading ./)
 */
function normalizePath(path: string): string {
  return path.replace(/^\.\//, "");
}

/**
 * Find matching fs file for a detected path
 */
function findMatchingFsFile(
  detectedPath: string,
  fsFiles: string[],
): string | null {
  const normalized = normalizePath(detectedPath);

  for (const fsFile of fsFiles) {
    const normalizedFs = normalizePath(fsFile);
    if (
      normalizedFs === normalized ||
      fsFile.endsWith(normalized) ||
      normalized.endsWith(normalizedFs)
    ) {
      return fsFile;
    }
  }

  return null;
}

export function ClickableAnsiOutput({
  rendered,
  fsFiles,
  onFileClick,
  className,
}: ClickableAnsiOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle clicks on file paths using event delegation
  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Find the closest element with data-file-click attribute
      const target = e.target as HTMLElement;
      const clickableEl = target.closest(
        "[data-file-click]",
      ) as HTMLElement | null;

      if (!clickableEl) return;

      const dataStr = clickableEl.getAttribute("data-file-click");
      if (!dataStr) return;

      try {
        const data = JSON.parse(dataStr) as {
          path: string;
          line?: number;
          column?: number;
        };

        // Find matching file in fs
        const matchedFile = findMatchingFsFile(data.path, fsFiles);

        if (matchedFile && onFileClick) {
          e.preventDefault();
          e.stopPropagation();
          onFileClick(matchedFile, data.line, data.column);
        }
      } catch {
        // Invalid JSON, ignore
      }
    },
    [fsFiles, onFileClick],
  );

  // Attach click listener with event delegation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [handleClick]);

  return (
    <div
      ref={containerRef}
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Pre-rendered by expressive-code at build time with clickable paths
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}

export default ClickableAnsiOutput;
