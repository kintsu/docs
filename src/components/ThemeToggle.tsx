"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Theme = "auto" | "dark" | "light";

const storageKey = "starlight-theme";

const parseTheme = (theme: unknown): Theme =>
  theme === "auto" || theme === "dark" || theme === "light" ? theme : "auto";

const loadTheme = (): Theme =>
  parseTheme(
    typeof localStorage !== "undefined" && localStorage.getItem(storageKey),
  );

const getPreferredColorScheme = (): Theme =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(loadTheme());
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const effectiveTheme = theme === "auto" ? getPreferredColorScheme() : theme;
    document.documentElement.dataset.theme = effectiveTheme;

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        storageKey,
        theme === "light" || theme === "dark" ? theme : "",
      );
    }

    // Update Starlight's pickers if available
    if (typeof window !== "undefined" && "StarlightThemeProvider" in window) {
      (window as any).StarlightThemeProvider.updatePickers(theme);
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      if (loadTheme() === "auto") {
        document.documentElement.dataset.theme = getPreferredColorScheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === "auto") return "dark";
      if (prev === "dark") return "light";
      return "auto";
    });
  };

  // Render placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label="Toggle theme"
      >
        <Monitor className="h-5 w-5" />
      </Button>
    );
  }

  const effectiveTheme = theme === "auto" ? getPreferredColorScheme() : theme;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="shrink-0"
      aria-label={`Current theme: ${theme}. Click to switch.`}
    >
      {theme === "auto" ? (
        <Monitor className="h-5 w-5" />
      ) : effectiveTheme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}

export default ThemeToggle;
