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
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-400/30",
  },
  proposed: {
    label: "Proposed",
    className:
      "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-400/30",
  },
  accepted: {
    label: "Accepted",
    className:
      "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-400/30",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 dark:border-red-400/30",
  },
  unstable: {
    label: "Unstable",
    className:
      "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-400/30",
  },
  stable: {
    label: "Stable",
    className:
      "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 dark:border-teal-400/30",
  },
  deprecated: {
    label: "Deprecated",
    className:
      "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30 dark:border-gray-400/30",
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
