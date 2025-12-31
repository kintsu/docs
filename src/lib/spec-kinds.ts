export type SpecKind = "rfc" | "tsy" | "spec" | "ad" | "err";

export interface SpecKindStyle {
  label: string;
  className: string;
  tagClassName: string;
}

export const SPEC_KIND_CONFIG: Record<SpecKind, SpecKindStyle> = {
  rfc: {
    label: "RFC",
    className:
      "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-400/30",
    tagClassName:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25 dark:border-blue-400/25 hover:bg-blue-500/20",
  },
  tsy: {
    label: "TSY",
    className:
      "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 dark:border-teal-400/30",
    tagClassName:
      "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25 dark:border-teal-400/25 hover:bg-teal-500/20",
  },
  spec: {
    label: "SPEC",
    className:
      "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-400/30",
    tagClassName:
      "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/25 dark:border-green-400/25 hover:bg-green-500/20",
  },
  ad: {
    label: "AD",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-400/30",
    tagClassName:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 dark:border-amber-400/25 hover:bg-amber-500/20",
  },
  err: {
    label: "ERR",
    className:
      "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 dark:border-red-400/30",
    tagClassName:
      "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25 dark:border-red-400/25 hover:bg-red-500/20",
  },
};

export const DEFAULT_SPEC_KIND_STYLE: SpecKindStyle = {
  label: "UNKNOWN",
  className:
    "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30 dark:border-gray-400/30",
  tagClassName: "bg-accent/10 text-accent-foreground border-accent/20",
};

export function getSpecKindConfig(kind: string): SpecKindStyle {
  const normalizedKind = (kind || "").toLowerCase() as SpecKind;
  return (
    SPEC_KIND_CONFIG[normalizedKind] || {
      ...DEFAULT_SPEC_KIND_STYLE,
      label: kind?.toUpperCase() || "UNKNOWN",
    }
  );
}
