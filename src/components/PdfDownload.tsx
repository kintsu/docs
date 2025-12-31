"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@/components/ui/menu";
import { trackPDFDownload } from "../lib/analytics";

interface PdfOption {
  label: string;
  href: string;
  description: string;
}

const PDF_OPTIONS: PdfOption[] = [
  {
    label: "Complete Documentation",
    href: "/kintsu-complete.pdf",
    description: "All docs, types, and specifications",
  },
  {
    label: "Specifications Only",
    href: "/kintsu-specifications.pdf",
    description: "RFCs, SPECs, TSYs, and ADs",
  },
];

export function PdfDownload() {
  const handleDownload = (href: string, docType: string) => {
    // Track the download event
    const fileName = href.split("/").pop() || "unknown.pdf";

    trackPDFDownload(fileName, docType);

    // Open the PDF
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Download PDF documentation"
          >
            <FileDown className="h-5 w-5" />
          </Button>
        }
      />
      <MenuPopup side="bottom" align="end" className="w-64">
        <div className="px-2 py-1.5 text-xs font-medium text-foreground/60 dark:text-foreground/70">
          Download PDF
        </div>
        {PDF_OPTIONS.map((option) => (
          <MenuItem
            key={option.href}
            onClick={() =>
              handleDownload(
                option.href,
                option.label.includes("Complete")
                  ? "complete"
                  : "specifications",
              )
            }
            className="flex flex-col items-start gap-0.5 cursor-pointer"
          >
            <span className="font-medium">{option.label}</span>
            <span className="text-xs text-foreground/60 dark:text-foreground/70">
              {option.description}
            </span>
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}

export default PdfDownload;
