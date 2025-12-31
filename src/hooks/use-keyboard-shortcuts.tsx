"use client";

import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  /** Override default preventDefault behavior */
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!shortcut.shift === event.shiftKey;
        const altMatch = !!shortcut.alt === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className = "" }: KbdProps) {
  return (
    <kbd
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-border/60 bg-muted/80 text-foreground/80 dark:border-border dark:bg-muted dark:text-foreground/90 ${className}`}
    >
      {children}
    </kbd>
  );
}

interface ShortcutHintProps {
  keys: string[];
  description?: string;
  className?: string;
}

export function ShortcutHint({
  keys,
  description,
  className = "",
}: ShortcutHintProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((key, i) => (
        <span key={key} className="inline-flex items-center gap-0.5">
          <Kbd>{key}</Kbd>
          {i < keys.length - 1 && (
            <span className="text-foreground/50 dark:text-foreground/60 text-xs">
              +
            </span>
          )}
        </span>
      ))}
      {description && (
        <span className="text-xs text-foreground/60 dark:text-foreground/70 ml-1">
          {description}
        </span>
      )}
    </span>
  );
}

// Platform detection for showing correct modifier key
export function useModifierKey() {
  if (typeof window === "undefined") return "Ctrl";
  return navigator.platform.includes("Mac") ? "⌘" : "Ctrl";
}

export default useKeyboardShortcuts;
