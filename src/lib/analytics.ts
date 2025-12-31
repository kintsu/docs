/**
 * Centralized Analytics Utility for Kintsu Documentation
 *
 * Purpose: Provide a unified, extensible analytics layer focused on documentation
 * quality improvement and user journey understanding (not user surveillance).
 *
 * Design Principles:
 * - Privacy-first: No personal data collection
 * - Quality-focused: Track content effectiveness, not users
 * - Extensible: Easy to add new event types
 * - Reusable: Generic patterns for all tracking needs
 * - Campaign-ready: Structure supports future UTM campaigns
 * - Debounced tracking: Prevents duplicate events from high-frequency actions
 *
 * @module analytics
 */

import { event as trackEvent } from "onedollarstats";

/**
 * Debounce utility for high-frequency events
 * Ensures events are only tracked after a period of inactivity
 *
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait before executing
 * @returns Debounced function
 */
function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Analytics event categories for organizational clarity
 */
export const AnalyticsCategory = {
  CONTENT: "Content",
  NAVIGATION: "Navigation",
  FEEDBACK: "Feedback",
  INTERACTION: "Interaction",
  CONVERSION: "Conversion",
  QUALITY: "Quality",
} as const;

/**
 * Common event types used across the site
 * Focus on high-value, actionable analytics
 */
export const AnalyticsEvent = {
  // Content discovery
  SEARCH_PERFORMED: "Search",
  SEARCH_NO_RESULTS: "Search Empty",

  // Content consumption
  PDF_DOWNLOAD: "PDF Download",
  EXTERNAL_LINK: "External Link",

  // Conversion goals
  GITHUB_CLICK: "GitHub Link",
  DISCORD_CLICK: "Discord Link",
  CONTRIBUTE_CLICK: "Contribute Click",
} as const;

/**
 * Get the current page context for analytics enrichment
 */
function getPageContext() {
  const path = window.location.pathname;
  const pathParts = path.split("/").filter(Boolean);

  // Determine section (types, specs, reference, etc.)
  const section = pathParts[0] || "home";

  // Get current theme (for context, not tracking as event)
  const theme = document.documentElement.getAttribute("data-theme") || "auto";

  // Determine content type
  let contentType = "page";
  if (path.includes("/specs/")) contentType = "spec";
  else if (path.includes("/types/")) contentType = "type";
  else if (path.includes("/reference/")) contentType = "reference";
  else if (path.includes("/schemas/")) contentType = "schema";
  else if (path.includes("/syntax/")) contentType = "syntax";

  // Extract spec info if applicable
  let specKind: string | undefined;
  let specNumber: string | undefined;
  if (contentType === "spec") {
    const specMatch = path.match(/\/specs\/([^/]+)\/([A-Z]+-\d{4})/);
    if (specMatch) {
      specKind = specMatch[1];
      specNumber = specMatch[2];
    }
  }

  return {
    section,
    contentType,
    path,
    theme, // Include theme as context (not an event)
    specKind,
    specNumber,
  };
}

/**
 * Track a custom event with automatic context enrichment
 *
 * @param eventName - The event name (use AnalyticsEvent constants)
 * @param properties - Additional properties specific to this event
 * @param category - Optional category for organization (defaults to INTERACTION)
 *
 * @example
 * ```typescript
 * track(AnalyticsEvent.PAGE_HELPFUL, { reason: "clear-examples" });
 * track(AnalyticsEvent.PDF_DOWNLOAD, { docType: "spec", specId: "RFC-0001" });
 * ```
 */
export function track(
  eventName: string,
  properties: Record<string, string> = {},
  category?: string,
) {
  try {
    const context = getPageContext();

    // Merge context with provided properties
    const enrichedProps = {
      ...properties,
      section: context.section,
      content_type: context.contentType,
      theme: context.theme, // Include theme as context
      ...(category && { category }),
      ...(context.specKind && { spec_kind: context.specKind }),
      ...(context.specNumber && { spec_id: context.specNumber }),
    };

    // Track the event
    trackEvent(eventName, enrichedProps);

    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventName}`, enrichedProps);
    }
  } catch (error) {
    // Fail silently - analytics should never break the site
    if (import.meta.env.DEV) {
      console.error("[Analytics] Error tracking event:", error);
    }
  }
}

/**
 * Track external link clicks with automatic domain extraction
 *
 * @param href - The link URL
 * @param linkText - Optional link text for context
 *
 * @example
 * ```typescript
 * trackExternalLink("https://github.com/kintsu/docs", "View on GitHub");
 * ```
 */
export function trackExternalLink(href: string, linkText?: string) {
  try {
    const url = new URL(href);
    track(AnalyticsEvent.EXTERNAL_LINK, {
      domain: url.hostname,
      destination: href,
      ...(linkText && { link_text: linkText.slice(0, 50) }),
    });
  } catch {
    // Invalid URL, skip tracking
  }
}

/**
 * Track PDF downloads with document metadata
 *
 * @param pdfName - Name of the PDF file
 * @param documentType - Type of document (spec, guide, reference)
 *
 * @example
 * ```typescript
 * trackPDFDownload("kintsu-specs.pdf", "spec");
 * ```
 */
export function trackPDFDownload(
  pdfName: string,
  documentType: string = "document",
) {
  track(
    AnalyticsEvent.PDF_DOWNLOAD,
    {
      file_name: pdfName,
      doc_type: documentType,
    },
    AnalyticsCategory.CONVERSION,
  );
}

/**
 * Track search queries and results (debounced)
 *
 * Debounced to prevent tracking every keystroke. Only tracks after user
 * stops typing for 500ms.
 *
 * @param query - The search query
 * @param resultCount - Number of results returned
 * @param selectedResult - Optional: which result was selected
 *
 * @example
 * ```typescript
 * trackSearch("enum syntax", 5);
 * trackSearch("error handling", 0); // No results
 * ```
 */
const _trackSearchImpl = (
  query: string,
  resultCount: number,
  selectedResult?: number,
) => {
  const hasResults = resultCount > 0;

  track(
    hasResults
      ? AnalyticsEvent.SEARCH_PERFORMED
      : AnalyticsEvent.SEARCH_NO_RESULTS,
    {
      query_length: query.length.toString(),
      result_count: resultCount.toString(),
      ...(selectedResult !== undefined && {
        selected_position: selectedResult.toString(),
      }),
    },
    AnalyticsCategory.NAVIGATION,
  );
};

// Export debounced version with 500ms delay
export const trackSearch = debounce(_trackSearchImpl, 500);

/**
 * Track conversion goals (GitHub stars, Discord joins, etc.)
 *
 * @param goal - The conversion goal identifier
 * @param source - Where the conversion was triggered from
 *
 * @example
 * ```typescript
 * trackConversion("github_star", "header");
 * trackConversion("discord_join", "footer");
 * ```
 */
export function trackConversion(goal: string, source: string) {
  const eventMap: Record<string, string> = {
    github_star: AnalyticsEvent.GITHUB_CLICK,
    github_view: AnalyticsEvent.GITHUB_CLICK,
    discord_join: AnalyticsEvent.DISCORD_CLICK,
    contribute: AnalyticsEvent.CONTRIBUTE_CLICK,
  };

  track(
    eventMap[goal] || "Conversion",
    {
      goal,
      source,
    },
    AnalyticsCategory.CONVERSION,
  );
}

/**
 * Setup automatic event tracking for high-value interactions
 * Call this once on page load to enable automatic tracking
 */
export function setupAutomaticTracking() {
  if (typeof window === "undefined") return;

  // Track external link clicks
  document.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest("a");
    if (!link || !link.href) return;

    const isExternal = !link.href.startsWith(window.location.origin);
    const linkText =
      link.textContent?.trim() || link.getAttribute("aria-label") || "";

    if (isExternal) {
      trackExternalLink(link.href, linkText);
    }
  });

  // Track PDF downloads
  document.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest("a");
    if (!link || !link.href) return;

    if (link.href.endsWith(".pdf")) {
      const fileName = link.href.split("/").pop() || "unknown.pdf";
      const docType = link.dataset.docType || "document";
      trackPDFDownload(fileName, docType);
    }
  });
}

/**
 * Initialize analytics with configuration
 * This is called automatically by AnalyticsHead.astro
 */
export function initializeAnalytics() {
  setupAutomaticTracking();

  if (import.meta.env.DEV) {
    console.log("[Analytics] Automatic tracking initialized");
  }
}
