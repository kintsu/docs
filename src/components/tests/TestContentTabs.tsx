"use client";

import { Maximize2Icon, XIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/ui/preview-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClickableAnsiOutput } from "./ClickableAnsiOutput";
import { CodePreview } from "./CodePreview";
import { FileTreeSelector } from "./FileTreeSelector";
import type { ErrorMetadata, RenderedAnsi, RenderedOutputs } from "./types";
import { getErrorDomainSpecPath } from "./types";

export type { RenderedAnsi, RenderedOutputs };

const SPEC_KINDS = [
  "AD",
  "RFC",
  "SPEC",
  "TSY",
  "CG",
  "PERF",
  "INTEG",
  "UNIT",
  "E2E",
  "ERR",
];
const SPEC_REGEX = new RegExp(`\\b(${SPEC_KINDS.join("|")})-(\\d{4})\\b`, "g");

/** Normalise paths by removing ./tmp/xxx/ prefix */
function normalizePath(path: string): string {
  return path.replace(/\.\/tmp\/[^/]+\//g, "./");
}

/** Parse a source location object, applying path normalization */
function formatSourceLocation(source: {
  file: string;
  line: number;
  column: number;
}): {
  file: string;
  line: number;
  column: number;
  originalFile: string;
} {
  return {
    file: normalizePath(source.file),
    line: source.line,
    column: source.column,
    originalFile: source.file,
  };
}

/** Detect and linkify spec references in text */
function linkifySpecs(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  SPEC_REGEX.lastIndex = 0;
  let match = SPEC_REGEX.exec(text);
  while (match !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add linked spec reference
    const specId = match[0];
    const specKind = match[1].toLowerCase();
    parts.push(
      <a
        key={`${specId}-${match.index}`}
        href={`/specs/${specKind}/${specId.toLowerCase()}`}
        className="text-primary hover:underline font-mono"
      >
        {specId}
      </a>,
    );
    lastIndex = match.index + match[0].length;
    match = SPEC_REGEX.exec(text);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export interface TestContentTabsProps {
  /** File system contents */
  fs: Record<string, string>;
  /** Whether this is a CLI test (has output tab) */
  isCliTest: boolean;
  /** Pre-rendered ANSI outputs from build time */
  renderedOutputs: RenderedOutputs;
  /** Error metadata for CLI tests */
  errorMetadata?: ErrorMetadata | null;
  /** Current active tab */
  activeTab: string;
  /** Callback when active tab changes */
  onActiveTabChange: (tab: string) => void;
  /** Currently selected file */
  selectedFile: string | null;
  /** Callback when selected file changes */
  onSelectedFileChange: (file: string | null) => void;
  /** Highlighted location in code */
  highlightedLocation: { line: number; column: number } | null;
  /** Callback when highlighted location changes */
  onHighlightedLocationChange: (
    location: { line: number; column: number } | null,
  ) => void;
  /** Focused file index for keyboard navigation */
  focusedFileIndex?: number;
  /** Ref for the file list container */
  fileListRef?: React.RefObject<HTMLDivElement | null>;
  /** List of navigable files */
  navigableFiles: Array<{ path: string; content: string }>;
  /** Whether we're in fullscreen mode */
  isFullscreen?: boolean;
  /** Test name for fullscreen dialog title */
  testName?: string;
}

export function TestContentTabs({
  fs,
  isCliTest,
  renderedOutputs,
  errorMetadata,
  activeTab,
  onActiveTabChange,
  selectedFile,
  onSelectedFileChange,
  highlightedLocation,
  onHighlightedLocationChange,
  focusedFileIndex = -1,
  fileListRef,
  navigableFiles,
  isFullscreen = false,
  testName: _testName,
}: TestContentTabsProps) {
  const isMobile = useIsMobile();
  const localFileListRef = useRef<HTMLDivElement>(null);
  const actualFileListRef = fileListRef ?? localFileListRef;

  // List of file paths for clickable ANSI output detection
  const fsFilePaths = useMemo(() => Object.keys(fs), [fs]);

  const selectedContent = selectedFile ? fs[selectedFile] : null;

  // Normalise source location path, keep original for tooltip
  const sourceLocation =
    isCliTest && errorMetadata?.source_location
      ? formatSourceLocation(errorMetadata.source_location)
      : undefined;

  // Navigate to source location in code tab
  const goToSourceLocation = useCallback(() => {
    if (!sourceLocation) return;

    // Find the file in fs that matches the normalized path
    const normalizedFile = sourceLocation.file.replace(/^\.\//, "");
    const matchingFile = Object.keys(fs).find((path) => {
      const normalizedPath = path.replace(/^\.\//, "");
      return (
        normalizedPath === normalizedFile ||
        path.endsWith(normalizedFile) ||
        normalizedFile.endsWith(path)
      );
    });

    if (matchingFile) {
      onSelectedFileChange(matchingFile);
      onHighlightedLocationChange({
        line: sourceLocation.line,
        column: sourceLocation.column,
      });
      onActiveTabChange("code");
    }
  }, [
    sourceLocation,
    fs,
    onSelectedFileChange,
    onHighlightedLocationChange,
    onActiveTabChange,
  ]);

  // Determine if the currently selected file matches the error source file
  // and compute the error highlight line + stderr content to show
  const errorHighlight = useMemo(() => {
    if (!sourceLocation || !selectedFile) return null;

    const normalizedSelected = selectedFile.replace(/^\.\//, "");
    const normalizedSource = sourceLocation.file.replace(/^\.\//, "");

    const matches =
      normalizedSelected === normalizedSource ||
      selectedFile.endsWith(normalizedSource) ||
      normalizedSource.endsWith(normalizedSelected);

    if (matches) {
      // Prefer error_severity (from parsed error code) over severity (detected)
      // error_severity comes from the actual error category level in ERR-0001
      const actualSeverity =
        errorMetadata?.error_severity ?? errorMetadata?.severity ?? "error";

      // Prefer error_domain (2-letter code like "FS") over domain (3-letter like "KFS")
      const errorDomain = errorMetadata?.error_domain ?? errorMetadata?.domain;
      return {
        line: sourceLocation.line,
        column: sourceLocation.column,
        stderrHtml: renderedOutputs.stderr?.html ?? null,
        stderrText: renderedOutputs.stderr?.plaintext ?? null,
        severity: actualSeverity,
        // Include domain reference info for UI
        domainCode: errorDomain,
        errorCode: errorMetadata?.code,
        domainSpecPath: getErrorDomainSpecPath(errorDomain),
      };
    }
    return null;
  }, [
    sourceLocation,
    selectedFile,
    renderedOutputs.stderr,
    errorMetadata?.severity,
    errorMetadata?.error_severity,
    errorMetadata?.error_domain,
    errorMetadata?.domain,
    errorMetadata?.code,
  ]);

  // Handle file path clicks from ANSI output
  const handleOutputFileClick = useCallback(
    (filePath: string, line?: number, column?: number) => {
      if (fs[filePath]) {
        onSelectedFileChange(filePath);
        if (line !== undefined) {
          onHighlightedLocationChange({
            line,
            column: column ?? 1,
          });
        } else {
          onHighlightedLocationChange(null);
        }
        onActiveTabChange("code");
      }
    },
    [fs, onSelectedFileChange, onHighlightedLocationChange, onActiveTabChange],
  );

  // Handle manual file selection from file tree - clears highlight
  const handleFileSelect = useCallback(
    (file: string | null) => {
      onSelectedFileChange(file);
      // Clear highlighted location when user manually selects a different file
      onHighlightedLocationChange(null);
    },
    [onSelectedFileChange, onHighlightedLocationChange],
  );

  // Height classes differ between fullscreen and embedded mode
  const containerHeight = isFullscreen ? "h-[calc(100vh-8rem)]" : "h-full";
  const panelHeight = isFullscreen ? "h-[calc(100vh-12rem)]" : "h-full";

  return (
    <Tabs
      value={activeTab}
      onValueChange={onActiveTabChange}
      className={`flex-1 flex flex-col min-h-0 ${isFullscreen ? "" : "mt-4"}`}
    >
      <TabsList className="shrink-0">
        <TabsTab value="code">Source Files</TabsTab>
        {isCliTest && <TabsTab value="output">Output</TabsTab>}
        {!isCliTest && fs["declarations.json"] && (
          <TabsTab value="declarations">Declarations</TabsTab>
        )}
      </TabsList>

      <TabsPanel
        value="code"
        className={`flex-1 mt-4 min-h-0 ${isFullscreen ? panelHeight : ""}`}
      >
        <div
          className={
            isMobile
              ? "flex flex-col gap-4 h-full"
              : `flex gap-4 ${containerHeight}`
          }
        >
          <div
            ref={actualFileListRef}
            className={
              isMobile ? "w-full shrink-0" : "w-48 shrink-0 overflow-hidden"
            }
          >
            <ScrollArea className="h-full">
              <FileTreeSelector
                files={navigableFiles}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                focusedFile={
                  focusedFileIndex >= 0
                    ? navigableFiles[focusedFileIndex]?.path
                    : null
                }
                errorFile={sourceLocation?.file}
                errorSeverity={
                  errorMetadata?.error_severity ?? errorMetadata?.severity
                }
              />
            </ScrollArea>
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <ScrollArea className="h-full rounded-md border">
              {selectedContent && selectedFile ? (
                <CodePreview
                  code={selectedContent}
                  filename={selectedFile}
                  highlightLine={
                    highlightedLocation?.line ?? errorHighlight?.line
                  }
                  highlightColumn={
                    highlightedLocation?.column ?? errorHighlight?.column
                  }
                  errorTooltipHtml={errorHighlight?.stderrHtml ?? undefined}
                  onErrorLineClick={
                    errorHighlight
                      ? () => onActiveTabChange("output")
                      : undefined
                  }
                  isFullscreen={isFullscreen}
                  errorSeverity={errorHighlight?.severity}
                  errorCode={errorHighlight?.errorCode ?? undefined}
                  errorDomainSpecPath={
                    errorHighlight?.domainSpecPath ?? undefined
                  }
                />
              ) : (
                <div className="p-4 text-foreground/65 dark:text-foreground/75">
                  Select a file to view
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </TabsPanel>

      {isCliTest && (
        <TabsPanel
          value="output"
          className={`flex-1 mt-4 min-h-0 overflow-auto ${isFullscreen ? panelHeight : ""}`}
        >
          {/* Show stdout if present */}
          {renderedOutputs.stdout && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-foreground/70 dark:text-foreground/80">
                stdout
              </h4>
              <div className="rounded-md border overflow-auto ansi-output-container">
                <ClickableAnsiOutput
                  rendered={renderedOutputs.stdout}
                  fsFiles={fsFilePaths}
                  onFileClick={handleOutputFileClick}
                />
              </div>
            </div>
          )}

          {/* Show stderr */}
          {renderedOutputs.stderr && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground/70 dark:text-foreground/80">
                stderr
              </h4>
              <div className="rounded-md border overflow-auto ansi-output-container">
                <ClickableAnsiOutput
                  rendered={renderedOutputs.stderr}
                  fsFiles={fsFilePaths}
                  onFileClick={handleOutputFileClick}
                />
              </div>
            </div>
          )}

          {errorMetadata && (
            <div className="mt-4 rounded-md border p-4">
              <h3 className="font-medium mb-2">Error Details</h3>
              <dl className="grid gap-2 text-sm">
                {errorMetadata.code && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/65 dark:text-foreground/75">
                      Code:
                    </dt>
                    <dd className="font-mono">
                      {(() => {
                        const errorDomain =
                          errorMetadata.error_domain ?? errorMetadata.domain;
                        const specPath = getErrorDomainSpecPath(errorDomain);
                        return specPath ? (
                          <a
                            href={specPath}
                            className="text-primary hover:underline"
                            title={`View ${errorMetadata.code} specification`}
                          >
                            {errorMetadata.code}
                          </a>
                        ) : (
                          <span>{errorMetadata.code}</span>
                        );
                      })()}
                    </dd>
                  </div>
                )}
                {errorMetadata.error_domain && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/65 dark:text-foreground/75">
                      Domain:
                    </dt>
                    <dd>
                      {(() => {
                        const specPath = getErrorDomainSpecPath(
                          errorMetadata.error_domain,
                        );
                        return specPath ? (
                          <a
                            href={specPath}
                            className="text-primary hover:underline"
                          >
                            {errorMetadata.error_domain}
                          </a>
                        ) : (
                          <span>{errorMetadata.error_domain}</span>
                        );
                      })()}
                    </dd>
                  </div>
                )}
                {(errorMetadata.error_severity ?? errorMetadata.severity) && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/65 dark:text-foreground/75">
                      Severity:
                    </dt>
                    <dd className="capitalize">
                      {errorMetadata.error_severity ?? errorMetadata.severity}
                    </dd>
                  </div>
                )}
                {errorMetadata.error_category && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/65 dark:text-foreground/75">
                      Category:
                    </dt>
                    <dd>{errorMetadata.error_category}</dd>
                  </div>
                )}
                {errorMetadata.error_sequence !== undefined &&
                  errorMetadata.error_sequence !== null && (
                    <div className="flex gap-2">
                      <dt className="text-foreground/65 dark:text-foreground/75">
                        Sequence:
                      </dt>
                      <dd className="font-mono">
                        {errorMetadata.error_sequence}
                      </dd>
                    </div>
                  )}
                {errorMetadata.message && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/65 dark:text-foreground/75">
                      Message:
                    </dt>
                    <dd>{linkifySpecs(errorMetadata.message)}</dd>
                  </div>
                )}
                {sourceLocation && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/65 dark:text-foreground/75">
                      Location:
                    </dt>
                    <dd>
                      <PreviewCard>
                        <PreviewCardTrigger>
                          <button
                            type="button"
                            onClick={goToSourceLocation}
                            className="font-mono cursor-pointer border-b border-dashed border-primary/50 hover:border-primary hover:text-primary transition-colors text-left"
                          >
                            {sourceLocation.file}:{sourceLocation.line}:
                            {sourceLocation.column}
                          </button>
                        </PreviewCardTrigger>
                        <PreviewCardPopup sideOffset={8}>
                          <div className="text-xs">
                            <div className="font-medium mb-1">
                              Click to view in Source Files
                            </div>
                            <div className="font-mono text-foreground/65 dark:text-foreground/75 break-all">
                              {sourceLocation.originalFile}
                            </div>
                          </div>
                        </PreviewCardPopup>
                      </PreviewCard>
                    </dd>
                  </div>
                )}
                {errorMetadata.help && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/65 dark:text-foreground/75">
                      Help:
                    </dt>
                    <dd>{errorMetadata.help}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </TabsPanel>
      )}

      {!isCliTest && fs["declarations.json"] && (
        <TabsPanel
          value="declarations"
          className={`flex-1 mt-4 min-h-0 ${isFullscreen ? panelHeight : ""}`}
        >
          <ScrollArea className="h-full rounded-md border">
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
              <code>
                {JSON.stringify(JSON.parse(fs["declarations.json"]), null, 2)}
              </code>
            </pre>
          </ScrollArea>
        </TabsPanel>
      )}
    </Tabs>
  );
}

/** Props for the fullscreen dialog wrapper */
export interface TestContentFullscreenProps
  extends Omit<TestContentTabsProps, "isFullscreen"> {
  /** Optional trigger element, defaults to an expand button */
  trigger?: React.ReactNode;
}

/** Fullscreen dialog wrapper for TestContentTabs */
export function TestContentFullscreen({
  trigger,
  testName,
  ...tabsProps
}: TestContentFullscreenProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Open fullscreen"
            >
              <Maximize2Icon className="h-4 w-4" />
            </Button>
          )
        }
      />
      <DialogPopup
        className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] sm:rounded-2xl flex flex-col"
        showCloseButton={false}
        bottomStickOnMobile={false}
      >
        <DialogHeader className="shrink-0 flex-row items-center justify-between border-b pb-4">
          <DialogTitle>{testName ?? "Test Details"}</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon" />}>
            <XIcon className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>
        <div className="flex-1 min-h-0 p-4 overflow-auto">
          <TestContentTabs
            {...tabsProps}
            testName={testName}
            isFullscreen={true}
          />
        </div>
      </DialogPopup>
    </Dialog>
  );
}

export default TestContentTabs;
