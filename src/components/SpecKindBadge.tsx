"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SpecKind = "rfc" | "tsy" | "spec" | "ad";

interface SpecKindBadgeProps {
  kind: string;
  number?: number;
  className?: string;
}

const kindConfig: Record<SpecKind, { label: string; className: string }> = {
  rfc: {
    label: "RFC",
    className:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  },
  tsy: {
    label: "TSY",
    className:
      "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25",
  },
  spec: {
    label: "SPEC",
    className:
      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25",
  },
  ad: {
    label: "AD",
    className:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
};

export function SpecKindBadge({ kind, number, className }: SpecKindBadgeProps) {
  const normalizedKind = (kind || "").toLowerCase() as SpecKind;
  const config = kindConfig[normalizedKind] || {
    label: kind?.toUpperCase() || "UNKNOWN",
    className:
      "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
  };

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
