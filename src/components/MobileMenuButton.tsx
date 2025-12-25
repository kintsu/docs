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
    document.body.toggleAttribute("data-mobile-menu-expanded", newState);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleExpanded}
      aria-expanded={expanded}
      aria-controls="starlight__sidebar"
      className="md:hidden fixed top-[calc((var(--sl-nav-height,3.5rem)-2.5rem)/2)] right-[var(--sl-nav-pad-x,1rem)] z-[var(--sl-z-index-navbar,10)] rounded-full shadow-md"
    >
      {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
}

export default MobileMenuButton;
