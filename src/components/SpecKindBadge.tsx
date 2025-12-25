"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SpecKind = "rfc" | "tsy" | "spec" | "ad" | "err";

interface SpecKindBadgeProps {
  kind: string;
  number?: number;
  className?: string;
}

const kindConfig: Record<SpecKind, { label: string; className: string }> = {
  rfc: {
    label: "RFC",
    className:
      "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-400/30",
  },
  tsy: {
    label: "TSY",
    className:
      "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 dark:border-teal-400/30",
  },
  spec: {
    label: "SPEC",
    className:
      "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-400/30",
  },
  ad: {
    label: "AD",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-400/30",
  },
  err: {
    label: "ERR",
    className:
      "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 dark:border-red-400/30",
  },
};

export function SpecKindBadge({ kind, number, className }: SpecKindBadgeProps) {
  const normalizedKind = (kind || "").toLowerCase() as SpecKind;
  const config = kindConfig[normalizedKind] || {
    label: kind?.toUpperCase() || "UNKNOWN",
    className:
      "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30 dark:border-gray-400/30",
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
