"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@/components/ui/menu";

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
  const handleDownload = (href: string) => {
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
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Download PDF
        </div>
        {PDF_OPTIONS.map((option) => (
          <MenuItem
            key={option.href}
            onClick={() => handleDownload(option.href)}
            className="flex flex-col items-start gap-0.5 cursor-pointer"
          >
            <span className="font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground">
              {option.description}
            </span>
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}

export default PdfDownload;
