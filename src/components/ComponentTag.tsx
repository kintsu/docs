"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SpecKind = "rfc" | "tsy" | "spec" | "ad" | "err";

interface ComponentTagProps {
  component: string;
  kind?: string;
  className?: string;
}

const kindConfig: Record<SpecKind, string> = {
  rfc: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25 dark:border-blue-400/25 hover:bg-blue-500/20",
  tsy: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25 dark:border-teal-400/25 hover:bg-teal-500/20",
  spec: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/25 dark:border-green-400/25 hover:bg-green-500/20",
  ad: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 dark:border-amber-400/25 hover:bg-amber-500/20",
  err: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25 dark:border-red-400/25 hover:bg-red-500/20",
};

export function ComponentTag({
  component,
  kind,
  className,
}: ComponentTagProps) {
  const normalizedKind = (kind || "").toLowerCase() as SpecKind;
  const kindClass =
    kindConfig[normalizedKind] ||
    "bg-accent/10 text-accent-foreground border-accent/20";

  return (
    <Badge
      variant="outline"
      size="sm"
      className={cn(
        "rounded-full font-medium border transition-colors",
        kindClass,
        className,
      )}
    >
      {component}
    </Badge>
  );
}

interface ComponentTagListProps {
  components: string[];
  kind?: string;
  className?: string;
}

export function ComponentTagList({
  components,
  kind,
  className,
}: ComponentTagListProps) {
  if (!components.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {components.map((comp) => (
        <ComponentTag key={comp} component={comp} kind={kind} />
      ))}
    </div>
  );
}

export default ComponentTag;
