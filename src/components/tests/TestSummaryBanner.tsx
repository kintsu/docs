"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TestSummaryBannerProps {
  total: number;
  passing: number;
  cliCount: number;
  compileCount: number;
  passCase: number;
  failCase: number;
  domains: string[];
}

/** Get progress bar colour class based on percentage */
function getProgressColour(percentage: number): string {
  if (percentage >= 95) return "bg-green-500";
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 60) return "bg-yellow-500";
  if (percentage >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export function TestSummaryBanner({
  total,
  passing,
  cliCount,
  compileCount,
  domains,
  passCase,
  failCase,
}: TestSummaryBannerProps) {
  const percentage = total > 0 ? (passing / total) * 100 : 0;
  const allPassing = passing === total;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold tabular-nums">
            {passing}/{total}
          </span>
          <Badge
            variant={allPassing ? "outline" : "destructive"}
            className={cn(
              allPassing &&
                "border-green-500 bg-green-500/10 text-green-700 dark:border-green-400 dark:text-green-300",
            )}
          >
            {allPassing ? "PASSING" : `${total - passing} FAILING`}
          </Badge>
        </div>
        <Progress
          value={percentage}
          className="h-2"
          aria-label={`Test pass rate: ${passing} of ${total} tests passing (${Math.round(percentage)}%)`}
          indicatorClassName={getProgressColour(percentage)}
        />
        <div className="flex flex-wrap gap-2 text-sm text-foreground/65 dark:text-foreground/75">
          <span>{cliCount} CLI Tests</span>
          <span className="text-border">|</span>
          <span>{compileCount} Compile Tests</span>
          <span className="text-border">|</span>
          <span>{domains.length} Domains</span>
          <span className="text-border">|</span>
          <span>{passCase} Pass Cases</span>
          <span className="text-border">|</span>
          <span>{failCase} Fail Cases</span>
        </div>
      </div>
    </div>
  );
}

export default TestSummaryBanner;
