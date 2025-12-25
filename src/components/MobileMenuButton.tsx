"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function MobileMenuButton() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Sync with document state
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-mobile-menu-expanded") {
          setExpanded(document.body.hasAttribute("data-mobile-menu-expanded"));
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleExpanded = () => {
    const newState = !expanded;
    setExpanded(newState);

    // Set aria-expanded on parent starlight-menu-button (for Starlight CSS sibling selector)
    const parent = document.querySelector("starlight-menu-button");
    if (
      parent &&
      "setExpanded" in parent &&
      typeof parent.setExpanded === "function"
    ) {
      (parent as any).setExpanded(newState);
    } else {
      // Fallback if custom element not ready
      document.body.toggleAttribute("data-mobile-menu-expanded", newState);
      if (parent) {
        parent.setAttribute("aria-expanded", String(newState));
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleExpanded}
      aria-expanded={expanded}
      aria-controls="starlight__sidebar"
      className="shrink-0 md:sl-hidden"
    >
      {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
}

export default MobileMenuButton;
