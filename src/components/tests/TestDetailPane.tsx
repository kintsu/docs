"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/hooks/use-keyboard-shortcuts";
import { useIsMobile } from "@/hooks/use-mobile";
import { TestContentFullscreen, TestContentTabs } from "./TestContentTabs";
import type { RenderedAnsi, RenderedOutputs, TestData } from "./types";
import { getErrorDomainSpecPath } from "./types";

export type { RenderedAnsi, RenderedOutputs };

interface TestDetailPaneProps {
  data: TestData;
  renderedOutputs: RenderedOutputs;
  onCycleTab?: (cycleTab: () => void) => void;
  onSelectFile?: (selectFile: (index: number) => void) => void;
  /** Callback to receive navigable files count */
  onNavigateFile?: (fileCount: number) => void;
  /** Current focused file index from parent */
  focusedFileIndex?: number;
  /** Callback to update focused file index */
  onFocusedFileIndexChange?: (index: number) => void;
}

export function TestDetailPane({
  data,
  renderedOutputs,
  onNavigateFile,
  onSelectFile,
  onCycleTab,
  focusedFileIndex = -1,
  onFocusedFileIndexChange,
}: TestDetailPaneProps) {
  const isMobile = useIsMobile();
  const { test, type } = data;
  const { metadata, fs } = test;
  const fileListRef = useRef<HTMLDivElement>(null);

  const files = useMemo(
    () =>
      Object.entries(fs).map(([path, content]) => ({
        path,
        content,
      })),
    [fs],
  );

  // Smart default file selection: prefer lib.ks, fallback to schema.toml (shortest path)
  const defaultFile = useMemo(() => {
    if (files.length === 0) return null;

    // Find all lib.ks files, prefer shortest path (root)
    const libKsFiles = files.filter((f) => f.path.endsWith("lib.ks"));
    if (libKsFiles.length > 0) {
      return libKsFiles.sort((a, b) => a.path.length - b.path.length)[0].path;
    }

    // Find schema.toml files, prefer shortest path (root workspace)
    const schemaTomlFiles = files.filter((f) => f.path.endsWith("schema.toml"));
    if (schemaTomlFiles.length > 0) {
      return schemaTomlFiles.sort((a, b) => a.path.length - b.path.length)[0]
        .path;
    }

    // Fallback to first non-declarations file
    const nonDecl = files.find((f) => f.path !== "declarations.json");
    return nonDecl?.path ?? files[0].path;
  }, [files]);

  const [selectedFile, setSelectedFile] = useState<string | null>(defaultFile);
  const [activeTab, setActiveTab] = useState<string>("code");

  // Track highlighted line/column from error location
  const [highlightedLocation, setHighlightedLocation] = useState<{
    line: number;
    column: number;
  } | null>(null);

  const isCliTest = type === "cli_test";
  const passed = isCliTest ? test.passed : test.matches_expectation;

  const errorCode = isCliTest ? test.error_metadata?.code : undefined;
  // Prefer error_domain (2-letter code like "FS") over domain (3-letter like "KFS")
  const errorDomain = isCliTest
    ? (test.error_metadata?.error_domain ?? test.error_metadata?.domain)
    : undefined;
  const errorMetadata = isCliTest ? test.error_metadata : undefined;

  // Get list of non-declaration files for keyboard navigation
  const navigableFiles = useMemo(
    () => files.filter((f) => f.path !== "declarations.json"),
    [files],
  );

  // Available tabs for this test
  const availableTabs = useMemo(() => {
    const tabs = ["code"];
    if (isCliTest) tabs.push("output");
    if (!isCliTest && fs["declarations.json"]) tabs.push("declarations");
    return tabs;
  }, [isCliTest, fs]);

  // Cycle to next tab
  const cycleTab = useCallback(() => {
    const currentIdx = availableTabs.indexOf(activeTab);
    const nextIdx = (currentIdx + 1) % availableTabs.length;
    setActiveTab(availableTabs[nextIdx]);
  }, [activeTab, availableTabs]);

  // Get navigable files count for parent
  const navigableFilesCount = navigableFiles.length;

  // Select file by index (called when parent wants to select focused file)
  const selectFileByIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < navigableFiles.length) {
        setSelectedFile(navigableFiles[index].path);
        // Clear highlighted location when user navigates to a different file
        setHighlightedLocation(null);
      }
    },
    [navigableFiles],
  );

  // Scroll focused file into view
  useEffect(() => {
    if (focusedFileIndex >= 0 && fileListRef.current) {
      const buttons = fileListRef.current.querySelectorAll(
        "button[data-file-path]",
      );
      const focusedButton = buttons[focusedFileIndex];
      if (focusedButton) {
        focusedButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [focusedFileIndex]);

  // Reset focused file when tab changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset on tab change
  useEffect(() => {
    onFocusedFileIndexChange?.(-1);
  }, [activeTab]);

  // Expose methods to parent via callbacks when they change
  useEffect(() => {
    onCycleTab?.(cycleTab);
  }, [cycleTab, onCycleTab]);

  useEffect(() => {
    onSelectFile?.(selectFileByIndex);
  }, [selectFileByIndex, onSelectFile]);

  useEffect(() => {
    onNavigateFile?.(navigableFilesCount);
  }, [navigableFilesCount, onNavigateFile]);

  // Shared props for the tabs component
  const tabsProps = {
    fs,
    isCliTest,
    renderedOutputs,
    errorMetadata,
    activeTab,
    onActiveTabChange: setActiveTab,
    selectedFile,
    onSelectedFileChange: setSelectedFile,
    highlightedLocation,
    onHighlightedLocationChange: setHighlightedLocation,
    focusedFileIndex,
    fileListRef,
    navigableFiles,
    testName: metadata.name,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-semibold">{metadata.name}</h2>
          <div className="flex items-center gap-2">
            {/* Fullscreen button */}
            <TestContentFullscreen {...tabsProps} />
            <Badge
              variant="outline"
              className={
                metadata.expect_pass
                  ? "border-green-600 text-green-700 dark:border-green-400 dark:text-green-300"
                  : "border-orange-600 text-orange-700 dark:border-orange-400 dark:text-orange-300"
              }
            >
              {metadata.expect_pass ? "Pass Case" : "Fail Case"}
            </Badge>
            <Badge variant={passed ? "default" : "destructive"}>
              {passed ? "Pass" : "Fail"}
            </Badge>
          </div>
        </div>
        <p className="text-foreground/70 dark:text-foreground/75">
          {metadata.purpose}
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">
            {isCliTest ? "CLI Test" : "Compile Test"}
          </Badge>
          {errorCode &&
            (() => {
              const specPath = getErrorDomainSpecPath(errorDomain);
              return specPath ? (
                <a href={specPath} className="inline-flex">
                  <Badge
                    variant="secondary"
                    className="hover:bg-secondary/80 cursor-pointer"
                  >
                    {errorCode}
                  </Badge>
                </a>
              ) : (
                <Badge variant="secondary">{errorCode}</Badge>
              );
            })()}
          {errorDomain &&
            (() => {
              const specPath = getErrorDomainSpecPath(errorDomain);
              return specPath ? (
                <a href={specPath} className="inline-flex">
                  <Badge
                    variant="outline"
                    className="hover:bg-accent cursor-pointer"
                  >
                    {errorDomain}
                  </Badge>
                </a>
              ) : (
                <Badge variant="outline">{errorDomain}</Badge>
              );
            })()}
          {metadata.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <TestContentTabs {...tabsProps} />

      {/* Keyboard hints for detail pane */}
      {!isMobile && (
        <div className="shrink-0 pt-2 border-t mt-2 flex items-center justify-center gap-4 text-foreground/65 dark:text-foreground/75 text-xs">
          <span className="flex items-center gap-1">
            <Kbd>Tab</Kbd> switch tab
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <span className="leading-none">/</span>
            <Kbd>↓</Kbd> files
          </span>
          <span className="flex items-center gap-1">
            <Kbd>j</Kbd>
            <span className="leading-none">/</span>
            <Kbd>k</Kbd> tests
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> back
          </span>
        </div>
      )}
    </div>
  );
}

export default TestDetailPane;
