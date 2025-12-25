"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SpecKind = "rfc" | "tsy" | "spec" | "ad";

interface ComponentTagProps {
  component: string;
  kind?: string;
  className?: string;
}

const kindConfig: Record<SpecKind, string> = {
  rfc: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15",
  tsy: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 hover:bg-teal-500/15",
  spec: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/15",
  ad: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15",
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
