"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function MobileMenuButton() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Sync with document state for both mobile and desktop
    const syncState = () => {
      const isMobile = window.matchMedia("(max-width: 49.99rem)").matches;
      if (isMobile) {
        setExpanded(document.body.hasAttribute("data-mobile-menu-expanded"));
      } else {
        // On desktop, sidebar is visible by default unless collapsed
        setExpanded(
          !document.documentElement.hasAttribute("data-sidebar-collapsed"),
        );
      }
    };

    // Initial sync
    syncState();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === "data-mobile-menu-expanded" ||
          mutation.attributeName === "data-sidebar-collapsed"
        ) {
          syncState();
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    observer.observe(document.documentElement, { attributes: true });

    // Also sync on resize
    window.addEventListener("resize", syncState);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncState);
    };
  }, []);

  const toggleExpanded = () => {
    const newState = !expanded;
    setExpanded(newState);

    const isMobile = window.matchMedia("(max-width: 49.99rem)").matches;

    if (isMobile) {
      // Mobile: use data-mobile-menu-expanded on body
      const parent = document.querySelector("starlight-menu-button");
      if (
        parent &&
        "setExpanded" in parent &&
        typeof parent.setExpanded === "function"
      ) {
        (parent as any).setExpanded(newState);
      } else {
        document.body.toggleAttribute("data-mobile-menu-expanded", newState);
        if (parent) {
          parent.setAttribute("aria-expanded", String(newState));
        }
      }
    } else {
      // Desktop: use data-sidebar-collapsed on root
      document.documentElement.toggleAttribute(
        "data-sidebar-collapsed",
        !newState,
      );
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleExpanded}
      aria-expanded={expanded}
      aria-controls="starlight__sidebar"
      className="shrink-0"
    >
      {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
}

export default MobileMenuButton;
