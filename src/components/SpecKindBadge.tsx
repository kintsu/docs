"use client";

import { Badge } from "@/components/ui/badge";
import { getSpecKindConfig } from "@/lib/spec-kinds";
import { cn } from "@/lib/utils";

interface SpecKindBadgeProps {
  kind: string;
  number?: number;
  className?: string;
}

export function SpecKindBadge({ kind, number, className }: SpecKindBadgeProps) {
  const config = getSpecKindConfig(kind);

  const identifier =
    number !== undefined
      ? `${config.label}-${String(number).padStart(4, "0")}`
      : config.label;

  return (
    <Badge
      variant="outline"
      size="default"
      className={cn(
        "font-mono font-bold tracking-wide border",
        config.className,
        className,
      )}
    >
      {identifier}
    </Badge>
  );
}

export default SpecKindBadge;
