"use client";

import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_SPEC_KIND_STYLE,
  SPEC_KIND_CONFIG,
  type SpecKind,
} from "@/lib/spec-kinds";
import { cn } from "@/lib/utils";

interface ComponentTagProps {
  component: string;
  kind?: string;
  className?: string;
}

export function ComponentTag({
  component,
  kind,
  className,
}: ComponentTagProps) {
  const normalizedKind = (kind || "").toLowerCase() as SpecKind;
  const kindClass =
    SPEC_KIND_CONFIG[normalizedKind]?.tagClassName ||
    DEFAULT_SPEC_KIND_STYLE.tagClassName;

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
