"use client";

import { ChevronLeft, Search, Tag, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Kbd } from "@/hooks/use-keyboard-shortcuts";
import { useIsMobile } from "@/hooks/use-mobile";
import { TestCardGrid } from "./TestCardGrid";
import { TestDetailPane } from "./TestDetailPane";
import { TestSummaryBanner } from "./TestSummaryBanner";
import type {
  CliTestData,
  CompileTestData,
  RenderedOutputs,
  TestData,
  TestMetadata,
} from "./types";

export type { TestMetadata, TestData, CliTestData, CompileTestData };

interface TestExplorerProps {
  tests: TestData[];
  renderedOutputsMap: Record<string, RenderedOutputs>;
  initialTestId?: string;
}

export function TestExplorer({
  tests,
  renderedOutputsMap,
  initialTestId,
}: TestExplorerProps) {
  const isMobile = useIsMobile();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(
    initialTestId ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [passFilter, setPassFilter] = useState<string>("all");
  const [expectFilter, setExpectFilter] = useState<string>("all");
  const [tagFilters, setTagFilters] = useState<Set<string>>(new Set()); // Multi-select tags
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [detailFocusedFileIndex, setDetailFocusedFileIndex] =
    useState<number>(-1);

  const searchRef = useRef<HTMLInputElement>(null);
  const testListRef = useRef<HTMLDivElement>(null);

  const domains = useMemo(() => {
    const domainSet = new Set<string>();
    for (const test of tests) {
      if (test.type === "cli_test" && test.test.error_metadata?.domain) {
        domainSet.add(test.test.error_metadata.domain);
      }
    }
    return Array.from(domainSet).sort();
  }, [tests]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const test of tests) {
      for (const tag of test.test.metadata.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [tests]);

  const stats = useMemo(() => {
    let cliCount = 0;
    let compileCount = 0;
    let passing = 0;
    let passCase = 0;
    let failCase = 0;

    for (const test of tests) {
      if (test.type === "cli_test") {
        cliCount++;
        if (test.test.passed) passing++;
      } else {
        compileCount++;
        if (test.test.matches_expectation) passing++;
      }

      if (test.test.metadata.expect_pass) {
        passCase++;
      } else if (test.test.metadata.expect_pass === false) {
        failCase++;
      }
    }

    return {
      total: tests.length,
      passing,
      cliCount,
      compileCount,
      passCase,
      failCase,
    };
  }, [tests]);

  const filteredTests = useMemo(() => {
    return tests
      .filter((test) => {
        const metadata = test.test.metadata;
        const passed =
          test.type === "cli_test"
            ? test.test.passed
            : test.test.matches_expectation;
        const domain =
          test.type === "cli_test"
            ? test.test.error_metadata?.domain
            : undefined;

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            metadata.name.toLowerCase().includes(query) ||
            metadata.id.toLowerCase().includes(query) ||
            metadata.purpose.toLowerCase().includes(query) ||
            metadata.tags.some((tag) => tag.toLowerCase().includes(query));
          if (!matchesSearch) return false;
        }

        if (domainFilter !== "all" && domain !== domainFilter) return false;
        if (typeFilter !== "all" && test.type !== typeFilter) return false;
        if (passFilter === "pass" && !passed) return false;
        if (passFilter === "fail" && passed) return false;

        if (expectFilter === "expect_pass" && !metadata.expect_pass)
          return false;
        if (expectFilter === "expect_fail" && metadata.expect_pass)
          return false;

        if (tagFilters.size > 0) {
          const hasAllTags = Array.from(tagFilters).every((tag) =>
            metadata.tags.includes(tag),
          );
          if (!hasAllTags) return false;
        }

        return true;
      })
      .sort((a, b) => a.test.metadata.name.localeCompare(b.test.metadata.name));
  }, [
    tests,
    searchQuery,
    domainFilter,
    typeFilter,
    passFilter,
    expectFilter,
    tagFilters,
  ]);

  const selectedTest = useMemo(() => {
    if (!selectedTestId) return null;
    return tests.find((t) => t.test.metadata.id === selectedTestId) ?? null;
  }, [tests, selectedTestId]);

  const testCardData = useMemo(() => {
    return filteredTests.map((test) => ({
      id: test.test.metadata.id,
      type: test.type,
      metadata: test.test.metadata,
      passed:
        test.type === "cli_test"
          ? test.test.passed
          : test.test.matches_expectation,
      errorCode:
        test.type === "cli_test" ? test.test.error_metadata?.code : undefined,
      domain:
        test.type === "cli_test" ? test.test.error_metadata?.domain : undefined,
    }));
  }, [filteredTests]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDomainFilter("all");
    setTypeFilter("all");
    setPassFilter("all");
    setExpectFilter("all");
    setTagFilters(new Set());
  }, []);

  const handleTestSelect = useCallback((id: string) => {
    setSelectedTestId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("test", id);
      window.history.pushState({ testId: id }, "", url.toString());
    }
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedTestId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("test");
      window.history.pushState({ testId: null }, "", url.pathname);
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const testId = event.state?.testId ?? null;
      setSelectedTestId(testId);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const testId = url.searchParams.get("test");
    if (testId && !selectedTestId) {
      const testExists = tests.some((t) => t.test.metadata.id === testId);
      if (testExists) {
        setSelectedTestId(testId);
        window.history.replaceState({ testId }, "", url.toString());
      }
    }
  }, [tests, selectedTestId]);

  const navigateTest = useCallback(
    (direction: "next" | "prev" | "first" | "last") => {
      if (filteredTests.length === 0) return;

      if (selectedTestId) {
        const currentIndex = filteredTests.findIndex(
          (t) => t.test.metadata.id === selectedTestId,
        );
        if (currentIndex === -1) return;

        let newIndex: number;
        if (direction === "first") {
          newIndex = 0;
        } else if (direction === "last") {
          newIndex = filteredTests.length - 1;
        } else {
          newIndex =
            direction === "next"
              ? (currentIndex + 1) % filteredTests.length
              : (currentIndex - 1 + filteredTests.length) %
                filteredTests.length;
        }

        const newTestId = filteredTests[newIndex].test.metadata.id;
        handleTestSelect(newTestId);
      } else {
        setFocusedIndex((prev) => {
          let newIndex: number;
          if (direction === "first") {
            newIndex = 0;
          } else if (direction === "last") {
            newIndex = filteredTests.length - 1;
          } else {
            newIndex =
              prev === -1
                ? direction === "next"
                  ? 0
                  : filteredTests.length - 1
                : direction === "next"
                  ? (prev + 1) % filteredTests.length
                  : (prev - 1 + filteredTests.length) % filteredTests.length;
          }

          requestAnimationFrame(() => {
            if (testListRef.current) {
              const cards =
                testListRef.current.querySelectorAll("[data-test-card]");
              const card = cards[newIndex];
              if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            }
          });

          return newIndex;
        });
      }
    },
    [selectedTestId, filteredTests, handleTestSelect],
  );

  const selectFocusedTest = useCallback(() => {
    if (
      !selectedTestId &&
      focusedIndex >= 0 &&
      focusedIndex < filteredTests.length
    ) {
      handleTestSelect(filteredTests[focusedIndex].test.metadata.id);
    }
  }, [selectedTestId, focusedIndex, filteredTests, handleTestSelect]);

  const focusNextFilter = useCallback(() => {
    const filterIds = ["search", "domain", "type", "status"];
    const activeEl = document.activeElement;

    let currentIdx = -1;
    for (let i = 0; i < filterIds.length; i++) {
      const el = document.querySelector(`[data-filter-id="${filterIds[i]}"]`);
      if (el === activeEl || el?.contains(activeEl as Node)) {
        currentIdx = i;
        break;
      }
    }

    const nextIdx = (currentIdx + 1) % filterIds.length;
    const nextEl = document.querySelector<HTMLElement>(
      `[data-filter-id="${filterIds[nextIdx]}"]`,
    );
    nextEl?.focus();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset on filter changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, domainFilter, typeFilter, passFilter, expectFilter]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        searchRef.current?.blur();
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        searchRef.current?.blur();
        if (focusedIndex === -1 && filteredTests.length > 0) {
          setFocusedIndex(0);
        } else {
          navigateTest("next");
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        searchRef.current?.blur();
        if (focusedIndex === -1 && filteredTests.length > 0) {
          setFocusedIndex(filteredTests.length - 1);
        } else {
          navigateTest("prev");
        }
        return;
      }

      if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        selectFocusedTest();
        return;
      }
    },
    [focusedIndex, filteredTests.length, navigateTest, selectFocusedTest],
  );

  const detailCycleTabRef = useRef<(() => void) | null>(null);
  const detailSelectFileRef = useRef<((index: number) => void) | null>(null);
  const detailFileCountRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (selectedTestId) {
          e.preventDefault();
          handleBackToList();
        }
        return;
      }

      if (e.key === "/" && !selectedTestId) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !selectedTestId) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          navigateTest("first");
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          navigateTest("last");
          return;
        }
      }

      if (e.key === "j") {
        e.preventDefault();
        navigateTest("next");
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        navigateTest("prev");
        return;
      }

      if (selectedTestId) {
        if (
          e.key === "Tab" &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          !e.shiftKey
        ) {
          e.preventDefault();
          detailCycleTabRef.current?.();
          return;
        }

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setDetailFocusedFileIndex((prev) => {
            const maxIndex = detailFileCountRef.current - 1;
            return Math.min(maxIndex, prev + 1);
          });
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setDetailFocusedFileIndex((prev) => Math.max(-1, prev - 1));
          return;
        }

        if (e.key === "Enter" && detailFocusedFileIndex >= 0) {
          e.preventDefault();
          detailSelectFileRef.current?.(detailFocusedFileIndex);
          return;
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateTest("next");
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateTest("prev");
        return;
      }

      if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        selectFocusedTest();
        return;
      }

      if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        focusNextFilter();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTestId,
    focusedIndex,
    detailFocusedFileIndex,
    handleBackToList,
    navigateTest,
    selectFocusedTest,
    focusNextFilter,
  ]);

  const hasActiveFilters =
    searchQuery ||
    domainFilter !== "all" ||
    typeFilter !== "all" ||
    passFilter !== "all" ||
    expectFilter !== "all" ||
    tagFilters.size > 0;

  if (isMobile) {
    if (selectedTest) {
      return (
        <div className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="w-fit shrink-0 mb-2"
            onClick={handleBackToList}
            title="Back to list"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 overflow-auto">
            <TestDetailPane
              data={selectedTest}
              renderedOutputs={
                renderedOutputsMap[selectedTest.test.metadata.id] ?? {
                  stdout: null,
                  stderr: null,
                }
              }
              focusedFileIndex={detailFocusedFileIndex}
              onFocusedFileIndexChange={setDetailFocusedFileIndex}
              onCycleTab={(fn) => {
                detailCycleTabRef.current = fn;
              }}
              onSelectFile={(fn) => {
                detailSelectFileRef.current = fn;
              }}
              onNavigateFile={(count) => {
                detailFileCountRef.current = count;
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
        <div className="shrink-0 space-y-4 pb-4">
          <TestSummaryBanner {...stats} domains={domains} />

          {/* Search bar - full width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50 dark:text-foreground/60" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 h-9"
            />
          </div>

          {/* Filters - wrap on mobile */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={domainFilter}
              onValueChange={(value) => value && setDomainFilter(value)}
            >
              <SelectTrigger className="w-24 h-8" aria-label="Filter by domain">
                <SelectValue>
                  {(value: string | null) =>
                    value === "all" ? "Domain" : (value ?? "Domain")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => value && setTypeFilter(value)}
            >
              <SelectTrigger
                className="w-24 h-8"
                aria-label="Filter by test type"
              >
                <SelectValue>
                  {(value: string | null) => {
                    if (value === "cli_test") return "CLI";
                    if (value === "compile_test") return "Compile";
                    return "Type";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cli_test">CLI</SelectItem>
                <SelectItem value="compile_test">Compile</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={passFilter}
              onValueChange={(value) => value && setPassFilter(value)}
            >
              <SelectTrigger
                className="w-24 h-8"
                aria-label="Filter by pass/fail status"
              >
                <SelectValue>
                  {(value: string | null) => {
                    if (value === "pass") return "Pass";
                    if (value === "fail") return "Fail";
                    return "Status";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pass">Passing</SelectItem>
                <SelectItem value="fail">Failing</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={expectFilter}
              onValueChange={(value) => value && setExpectFilter(value)}
            >
              <SelectTrigger
                className="w-24 h-8"
                aria-label="Filter by expected outcome"
              >
                <SelectValue>
                  {(value: string | null) => {
                    if (value === "expect_pass") return "Pass Case";
                    if (value === "expect_fail") return "Fail Case";
                    return "Expects";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="expect_pass">Pass Case</SelectItem>
                <SelectItem value="expect_fail">Fail Case</SelectItem>
              </SelectContent>
            </Select>
            {/* Tags multi-select filter (mobile) */}
            {allTags.length > 0 && (
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 min-w-11 gap-1.5"
                    aria-label="Filter by tags"
                  >
                    <Tag className="h-3 w-3" />
                    <span>Tags</span>
                    {tagFilters.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[10px]"
                      >
                        {tagFilters.size}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverPopup align="end" className="w-48">
                  <div className="flex flex-col gap-1">
                    <div className="px-1 pb-2 text-xs font-medium text-foreground/65 dark:text-foreground/75 border-b mb-1">
                      Filter by tags
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {allTags.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          className="flex w-full items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer text-sm text-left"
                          onClick={() => {
                            setTagFilters((prev) => {
                              const next = new Set(prev);
                              if (next.has(tag)) {
                                next.delete(tag);
                              } else {
                                next.add(tag);
                              }
                              return next;
                            });
                          }}
                        >
                          <Checkbox checked={tagFilters.has(tag)} />
                          <span className="truncate">{tag}</span>
                        </button>
                      ))}
                    </div>
                    {tagFilters.size > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 text-xs"
                        onClick={() => setTagFilters(new Set())}
                      >
                        Clear tags
                      </Button>
                    )}
                  </div>
                </PopoverPopup>
              </Popover>
            )}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={clearFilters}
              >
                <X className="h-3 w-3" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="text-xs text-foreground/65 dark:text-foreground/75">
              {filteredTests.length} of {tests.length} tests
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto -mx-1 px-1">
          {filteredTests.length > 0 ? (
            <TestCardGrid tests={testCardData} onTestClick={handleTestSelect} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-foreground/65 dark:text-foreground/75">
                No tests match your filters
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
      {/* Only show summary and filters when no test selected */}
      {!selectedTest ? (
        <>
          <div className="shrink-0 space-y-4 pb-4">
            <TestSummaryBanner {...stats} domains={domains} />

            {/* Search bar - full width */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50 dark:text-foreground/60" />
              <Input
                ref={searchRef}
                data-filter-id="search"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 h-9"
              />
            </div>

            {/* Filters - wrap dynamically */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={domainFilter}
                onValueChange={(value) => value && setDomainFilter(value)}
              >
                <SelectTrigger
                  data-filter-id="domain"
                  className="w-24 h-8"
                  aria-label="Filter by domain"
                >
                  <SelectValue>
                    {(value: string | null) =>
                      value === "all" ? "Domain" : (value ?? "Domain")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(value) => value && setTypeFilter(value)}
              >
                <SelectTrigger
                  data-filter-id="type"
                  className="w-24 h-8"
                  aria-label="Filter by test type"
                >
                  <SelectValue>
                    {(value: string | null) => {
                      if (value === "cli_test") return "CLI";
                      if (value === "compile_test") return "Compile";
                      return "Type";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cli_test">CLI</SelectItem>
                  <SelectItem value="compile_test">Compile</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={passFilter}
                onValueChange={(value) => value && setPassFilter(value)}
              >
                <SelectTrigger
                  data-filter-id="status"
                  className="w-24 h-8"
                  aria-label="Filter by pass/fail status"
                >
                  <SelectValue>
                    {(value: string | null) => {
                      if (value === "pass") return "Pass";
                      if (value === "fail") return "Fail";
                      return "Status";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pass">Passing</SelectItem>
                  <SelectItem value="fail">Failing</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={expectFilter}
                onValueChange={(value) => value && setExpectFilter(value)}
              >
                <SelectTrigger
                  data-filter-id="expect"
                  className="w-24 h-8"
                  aria-label="Filter by expected outcome"
                >
                  <SelectValue>
                    {(value: string | null) => {
                      if (value === "expect_pass") return "Pass Case";
                      if (value === "expect_fail") return "Fail Case";
                      return "Expects";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="expect_pass">Pass Case</SelectItem>
                  <SelectItem value="expect_fail">Fail Case</SelectItem>
                </SelectContent>
              </Select>
              {/* Tags multi-select filter */}
              {allTags.length > 0 && (
                <Popover>
                  <PopoverTrigger>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 min-w-11 gap-1.5"
                      data-filter-id="tags"
                      aria-label="Filter by tags"
                    >
                      <Tag className="h-3 w-3" />
                      <span>Tags</span>
                      {tagFilters.size > 0 && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1 text-[10px]"
                        >
                          {tagFilters.size}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverPopup align="start" className="w-56">
                    <div className="flex flex-col gap-1">
                      <div className="px-1 pb-2 text-xs font-medium text-foreground/65 dark:text-foreground/75 border-b mb-1">
                        Filter by tags
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {allTags.map((tag) => (
                          <button
                            type="button"
                            key={tag}
                            className="flex w-full items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer text-sm text-left"
                            onClick={() => {
                              setTagFilters((prev) => {
                                const next = new Set(prev);
                                if (next.has(tag)) {
                                  next.delete(tag);
                                } else {
                                  next.add(tag);
                                }
                                return next;
                              });
                            }}
                          >
                            <Checkbox checked={tagFilters.has(tag)} />
                            <span className="truncate">{tag}</span>
                          </button>
                        ))}
                      </div>
                      {tagFilters.size > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 text-xs"
                          onClick={() => setTagFilters(new Set())}
                        >
                          Clear tags
                        </Button>
                      )}
                    </div>
                  </PopoverPopup>
                </Popover>
              )}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={clearFilters}
                >
                  <X className="h-3 w-3" />
                  <span>Clear</span>
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="text-xs text-foreground/65 dark:text-foreground/75">
                {filteredTests.length} of {tests.length} tests
              </div>
            )}
          </div>

          {/* Test Cards - scrollable within viewport */}
          <div ref={testListRef} className="flex-1 overflow-auto -mx-1 px-1">
            {filteredTests.length > 0 ? (
              <TestCardGrid
                tests={testCardData}
                onTestClick={handleTestSelect}
                selectedId={selectedTestId}
                focusedIndex={focusedIndex}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <p className="text-foreground/65 dark:text-foreground/75">
                  No tests match your filters
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="shrink-0 pt-3 border-t mt-2 hidden md:flex items-center justify-center gap-4 text-foreground/65 dark:text-foreground/75 text-xs">
            <span className="flex items-center gap-1">
              <Kbd>/</Kbd> search
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Tab</Kbd> filters
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <span className="leading-none">/</span>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Enter</Kbd> open
            </span>
          </div>
        </>
      ) : (
        /* Detail Panel - full screen when test selected */
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="shrink-0 mb-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                title="Back to list (Esc)"
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
                <Kbd className="hidden sm:inline-flex ml-1">Esc</Kbd>
              </Button>
              <div className="hidden md:flex items-center gap-3 text-xs text-foreground/65 dark:text-foreground/75">
                <span className="flex items-center gap-1">
                  <Kbd>j</Kbd>
                  <span className="leading-none">/</span>
                  <Kbd>k</Kbd> prev/next
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <TestDetailPane
                data={selectedTest}
                renderedOutputs={
                  renderedOutputsMap[selectedTest.test.metadata.id] ?? {
                    stdout: null,
                    stderr: null,
                  }
                }
                focusedFileIndex={detailFocusedFileIndex}
                onFocusedFileIndexChange={setDetailFocusedFileIndex}
                onCycleTab={(fn) => {
                  detailCycleTabRef.current = fn;
                }}
                onSelectFile={(fn) => {
                  detailSelectFileRef.current = fn;
                }}
                onNavigateFile={(count) => {
                  detailFileCountRef.current = count;
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestExplorer;
