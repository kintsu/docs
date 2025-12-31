"use client";

import { AlertCircle, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CodePreviewProps {
  code: string;
  filename: string;
  className?: string;
  /** Line number to highlight (1-indexed) */
  highlightLine?: number;
  /** Column number to highlight (1-indexed) */
  highlightColumn?: number;
  /** Error tooltip content (HTML) to show on hover of highlighted line */
  errorTooltipHtml?: string;
  /** Callback when clicking on a highlighted error line - navigates to output view */
  onErrorLineClick?: () => void;
  /** Whether the component is displayed in fullscreen mode - affects tooltip sizing */
  isFullscreen?: boolean;
  /** Severity of the error - affects icon colour (error=red, warning=orange) */
  errorSeverity?: "error" | "warning" | string;
  /** Error code (e.g., "KTR1002") for linking to ERR spec */
  errorCode?: string;
  /** Path to the ERR specification for this error domain */
  errorDomainSpecPath?: string;
}

// Map file extensions to language identifiers
function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const langMap: Record<string, string> = {
    ks: "kintsu",
    toml: "toml",
    json: "json",
    md: "markdown",
    LICENSE: "markdown",
    txt: "markdown",
  };
  return langMap[ext] ?? "text";
}

// Escape HTML entities to prevent XSS and rendering issues
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Simple syntax highlighting for common patterns
// This is a fallback - ideally use server-rendered expressive code
function highlightCode(code: string, lang: string): string {
  // First escape HTML to prevent issues
  const escaped = escapeHtml(code);

  if (lang === "kintsu" || lang === "text") {
    // Kintsu-specific highlighting
    return (
      escaped
        // Comments
        .replace(/(\/\/.*$)/gm, '<span class="sl-comment">$1</span>')
        // Strings
        .replace(
          /(&quot;(?:[^&]|&(?!quot;))*?&quot;)/g,
          '<span class="sl-string">$1</span>',
        )
        // Keywords
        .replace(
          /\b(namespace|struct|enum|union|oneof|type|operation|import|from|as|extends|implements|where|fn|let|const|return|if|else|match|for|while|loop|break|continue|true|false|null)\b/g,
          '<span class="sl-keyword">$1</span>',
        )
        // Decorators/Attributes
        .replace(/(#\[[^\]]+\])/g, '<span class="sl-decorator">$1</span>')
        // Types (capitalized words)
        .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="sl-type">$1</span>')
        // Numbers
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="sl-number">$1</span>')
        // Punctuation
        .replace(/([{}[\]();:,])/g, '<span class="sl-punctuation">$1</span>')
    );
  }

  if (lang === "toml") {
    return (
      escaped
        // Comments first
        .replace(/(#.*$)/gm, '<span class="sl-comment">$1</span>')
        // Section headers [section] - must be careful with escaped brackets
        .replace(/^(\[[^\]]+\])/gm, '<span class="sl-section">$1</span>')
        // Strings
        .replace(
          /(&quot;(?:[^&]|&(?!quot;))*?&quot;)/g,
          '<span class="sl-string">$1</span>',
        )
        // Keys (before =)
        .replace(
          /^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)\s*=/gm,
          '$1<span class="sl-key">$2</span> =',
        )
        // Booleans
        .replace(/\b(true|false)\b/g, '<span class="sl-boolean">$1</span>')
    );
  }

  if (lang === "json") {
    return (
      escaped
        // Strings (keys and values)
        .replace(
          /(&quot;(?:[^&]|&(?!quot;))*?&quot;)\s*:/g,
          '<span class="sl-key">$1</span>:',
        )
        .replace(
          /:(\s*)(&quot;(?:[^&]|&(?!quot;))*?&quot;)/g,
          ':$1<span class="sl-string">$2</span>',
        )
        // Booleans and null
        .replace(/\b(true|false|null)\b/g, '<span class="sl-boolean">$1</span>')
        // Numbers
        .replace(
          /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
          ': <span class="sl-number">$1</span>',
        )
    );
  }

  return escaped;
}

export function CodePreview({
  code,
  filename,
  className,
  highlightLine,
  errorTooltipHtml,
  onErrorLineClick,
  isFullscreen = false,
  errorSeverity,
  errorCode,
  errorDomainSpecPath,
}: CodePreviewProps) {
  const lang = useMemo(() => getLanguageFromFilename(filename), [filename]);
  const preRef = useRef<HTMLPreElement>(null);
  const [showErrorTooltip, setShowErrorTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLButtonElement>(null);
  const mouseLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Split code into lines for line-by-line rendering with highlighting
  const lines = useMemo(() => code.split("\n"), [code]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to highlighted line when it changes
  useEffect(() => {
    if (highlightLine && preRef.current) {
      const lineEl = preRef.current.querySelector(
        `[data-line="${highlightLine}"]`,
      );
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightLine]);

  // Cancel any pending close when entering
  const cancelPendingClose = useCallback(() => {
    if (mouseLeaveTimeoutRef.current) {
      clearTimeout(mouseLeaveTimeoutRef.current);
      mouseLeaveTimeoutRef.current = null;
    }
  }, []);

  // Handle mouse enter on highlighted line
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!errorTooltipHtml) return;
      cancelPendingClose();
      const rect = e.currentTarget.getBoundingClientRect();
      const containerRect =
        preRef.current?.parentElement?.getBoundingClientRect();
      if (containerRect) {
        setTooltipPosition({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left,
        });
      }
      setShowErrorTooltip(true);
    },
    [errorTooltipHtml, cancelPendingClose],
  );

  // Debounced mouse leave - gives user time to move to tooltip
  const handleMouseLeave = useCallback(() => {
    cancelPendingClose();
    mouseLeaveTimeoutRef.current = setTimeout(() => {
      setShowErrorTooltip(false);
    }, 150);
  }, [cancelPendingClose]);

  // Handle tooltip mouse enter - cancel pending close
  const handleTooltipMouseEnter = useCallback(() => {
    cancelPendingClose();
    setShowErrorTooltip(true);
  }, [cancelPendingClose]);

  // Handle click on highlighted error line
  const handleErrorLineClick = useCallback(() => {
    if (onErrorLineClick) {
      setShowErrorTooltip(false);
      onErrorLineClick();
    }
  }, [onErrorLineClick]);

  // Handle keyboard activation on highlighted error line
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === "Enter" || e.key === " ") && onErrorLineClick) {
        e.preventDefault();
        setShowErrorTooltip(false);
        onErrorLineClick();
      }
    },
    [onErrorLineClick],
  );

  // Render a single line - extracted for reuse with/without tooltip
  const renderLineContent = (
    line: string,
    lineNum: number,
    isHighlighted: boolean,
  ) => {
    const highlighted = highlightCode(line, lang);
    // Interactive if highlighted AND (has click handler OR has tooltip)
    const isClickable = isHighlighted && onErrorLineClick;
    const hasTooltip = isHighlighted && errorTooltipHtml;
    const isInteractive = isClickable || hasTooltip;
    const isError = errorSeverity === "error";
    const isWarning = errorSeverity === "warning";

    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: conditionally interactive for error lines
      <div
        data-line={lineNum}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        className={cn(
          "flex items-center",
          isHighlighted &&
            isError &&
            "bg-red-500/15 -mx-4 px-4 border-l-2 border-red-500",
          isHighlighted &&
            isWarning &&
            "bg-orange-500/15 -mx-4 px-4 border-l-2 border-orange-500",
          isHighlighted &&
            !isError &&
            !isWarning &&
            "bg-yellow-500/20 -mx-4 px-4 border-l-2 border-yellow-500",
          isInteractive &&
            isError &&
            "cursor-pointer hover:bg-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-500/50",
          isInteractive &&
            isWarning &&
            "cursor-pointer hover:bg-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50",
          isInteractive &&
            !isError &&
            !isWarning &&
            "cursor-pointer hover:bg-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50",
        )}
        onMouseEnter={hasTooltip ? handleMouseEnter : undefined}
        onMouseLeave={hasTooltip ? handleMouseLeave : undefined}
        onClick={isClickable ? handleErrorLineClick : undefined}
        onKeyDown={isClickable ? handleKeyDown : undefined}
      >
        {/* Severity icon for highlighted error lines */}
        {isHighlighted && isError && (
          <AlertCircle
            className="w-4 h-4 text-red-500 shrink-0 mr-1"
            aria-label="Error"
          />
        )}
        {isHighlighted && isWarning && (
          <AlertTriangle
            className="w-4 h-4 text-orange-500 shrink-0 mr-1"
            aria-label="Warning"
          />
        )}
        {/* Error code link to ERR specification */}
        {isHighlighted && errorCode && errorDomainSpecPath && (
          <a
            href={errorDomainSpecPath}
            className={cn(
              "text-xs font-mono shrink-0 mr-2 hover:underline",
              isError && "text-red-600 dark:text-red-400",
              isWarning && "text-orange-600 dark:text-orange-400",
              !isError && !isWarning && "text-yellow-600 dark:text-yellow-400",
            )}
            title={`View ${errorCode} specification`}
            onClick={(e) => e.stopPropagation()}
          >
            [{errorCode}]
          </a>
        )}
        <span
          className={cn(
            "select-none text-foreground/35 dark:text-foreground/40 shrink-0 text-right pr-3 text-xs leading-6",
            isHighlighted && (isError || isWarning) ? "w-6" : "w-8",
          )}
        >
          {lineNum}
        </span>
        <span
          className="leading-6 whitespace-pre"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: syntax highlighting
          dangerouslySetInnerHTML={{ __html: highlighted || "&nbsp;" }}
        />
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-0 right-0 px-2 py-1 text-xs text-foreground/65 dark:text-foreground/75 bg-muted/50 rounded-bl font-mono z-10">
        {filename.split("/").pop()}
      </div>
      <pre ref={preRef} className="p-4 pt-8 text-sm font-mono overflow-x-auto">
        <code className="code-preview">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightLine === lineNum;

            return (
              <div key={lineNum}>
                {renderLineContent(line, lineNum, isHighlighted)}
              </div>
            );
          })}
        </code>
      </pre>

      {/* Error tooltip - full in fullscreen, clipped preview otherwise */}
      {showErrorTooltip && errorTooltipHtml && (
        <button
          type="button"
          ref={tooltipRef}
          className={cn(
            "fixed z-100 w-auto min-w-[20rem] rounded-md border bg-popover text-popover-foreground shadow-xl cursor-pointer text-left",
            isFullscreen
              ? "max-w-[90vw] lg:max-w-[70vw] max-h-[80vh] overflow-auto"
              : "max-w-[min(90vw,32rem)] max-h-48 overflow-hidden",
          )}
          style={{
            top: Math.min(
              tooltipPosition.top +
                (preRef.current?.parentElement?.getBoundingClientRect().top ??
                  0),
              window.innerHeight - 200,
            ),
            left: Math.max(
              8,
              Math.min(
                tooltipPosition.left +
                  (preRef.current?.parentElement?.getBoundingClientRect()
                    .left ?? 0),
                window.innerWidth - 400,
              ),
            ),
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleErrorLineClick}
        >
          <div className="sticky top-0 bg-popover border-b px-3 py-1.5 text-xs text-muted-foreground">
            Click to view full output
          </div>
          <div
            className="font-mono text-xs p-3 ansi-output whitespace-pre"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: pre-rendered at build
            dangerouslySetInnerHTML={{ __html: errorTooltipHtml }}
          />
          {/* Show truncation indicator when not in fullscreen */}
          {!isFullscreen && (
            <div className="sticky bottom-0 bg-linear-to-t from-popover via-popover to-transparent pt-4 pb-2 px-3 text-xs text-muted-foreground text-center">
              <span className="bg-popover px-2">⋯ Click for full output</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

export default CodePreview;
