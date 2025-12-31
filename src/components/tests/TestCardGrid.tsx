"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TestMetadata } from "./types";

interface TestCardProps {
  id: string;
  type: "cli_test" | "compile_test";
  metadata: TestMetadata;
  passed: boolean;
  errorCode?: string | null;
  domain?: string | null;
  onClick?: () => void;
  isSelected?: boolean;
  isFocused?: boolean;
}

export function TestCard({
  type,
  metadata,
  passed,
  errorCode,
  domain,
  onClick,
  isSelected,
  isFocused,
}: TestCardProps) {
  return (
    <button
      type="button"
      data-test-card
      className={cn(
        "w-full text-left px-3 py-2 rounded-md border transition-colors",
        "hover:bg-accent/50 cursor-pointer",
        isSelected && "ring-2 ring-primary bg-accent/30",
        isFocused && !isSelected && "ring-2 ring-primary/50 bg-accent/20",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {errorCode && (
            <code className="text-xs font-mono text-foreground/70 dark:text-foreground/80 shrink-0">
              {errorCode}
            </code>
          )}
          <span className="text-sm font-medium truncate">{metadata.name}</span>
          <span className="text-xs text-foreground/60 dark:text-foreground/70 truncate hidden sm:inline">
            {metadata.purpose}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1 py-0 h-4",
              metadata.expect_pass
                ? "border-green-600 text-green-700 dark:border-green-400 dark:text-green-300"
                : "border-orange-600 text-orange-700 dark:border-orange-400 dark:text-orange-300",
            )}
          >
            {metadata.expect_pass ? "Pass Case" : "Fail Case"}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
            {type === "cli_test" ? "CLI" : "Compile"}
          </Badge>
          {domain && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1 py-0 h-4 hidden md:inline-flex"
            >
              {domain}
            </Badge>
          )}
          <Badge
            variant={passed ? "default" : "destructive"}
            className="text-[10px] px-1 py-0 h-4"
          >
            {passed ? "Pass" : "Fail"}
          </Badge>
        </div>
      </div>
    </button>
  );
}

interface TestCardGridProps {
  tests: Array<{
    id: string;
    type: "cli_test" | "compile_test";
    metadata: TestMetadata;
    passed: boolean;
    errorCode?: string | null;
    domain?: string | null;
  }>;
  onTestClick?: (id: string) => void;
  selectedId?: string | null;
  focusedIndex?: number;
}

export function TestCardGrid({
  tests,
  onTestClick,
  selectedId,
  focusedIndex,
}: TestCardGridProps) {
  return (
    <div className="flex flex-col gap-1">
      {tests.map((test, index) => (
        <TestCard
          key={test.id}
          {...test}
          onClick={() => onTestClick?.(test.id)}
          isSelected={selectedId === test.id}
          isFocused={focusedIndex === index}
        />
      ))}
    </div>
  );
}

export default TestCardGrid;
