"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "draft"
  | "proposed"
  | "accepted"
  | "rejected"
  | "unstable"
  | "stable"
  | "deprecated";

interface SpecStatusBadgeProps {
  status?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
  proposed: {
    label: "Proposed",
    className:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  },
  accepted: {
    label: "Accepted",
    className:
      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  },
  unstable: {
    label: "Unstable",
    className:
      "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
  },
  stable: {
    label: "Stable",
    className:
      "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25",
  },
  deprecated: {
    label: "Deprecated",
    className:
      "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
  },
};

export function SpecStatusBadge({
  status = "draft",
  className,
}: SpecStatusBadgeProps) {
  const normalizedStatus = (status || "").toLowerCase() as StatusType;
  const config = statusConfig[normalizedStatus] || {
    label: status || "Unknown",
    className:
      "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
  };

  return (
    <Badge
      variant="outline"
      size="lg"
      className={cn(
        "rounded-full font-semibold border",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}

export default SpecStatusBadge;
