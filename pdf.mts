import pdf from "astro-pdf";
import PDFMerger from "pdf-merger-js";
import { PDFDocument, PDFHexString, type PDFRef } from "pdf-lib";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// --- PDF Outline Types ---

type PDFOutlineTo =
  | number
  | [pageIndex: number, xPercentage: number, yPercentage: number];

interface PDFOutlineItem {
  title: string;
  to: PDFOutlineTo;
  italic?: boolean;
  bold?: boolean;
}

interface PDFOutlineItemWithChildren extends Omit<PDFOutlineItem, "to"> {
  to?: PDFOutlineTo;
  children: PDFOutline[];
  open: boolean;
}

type PDFOutline = PDFOutlineItem | PDFOutlineItemWithChildren;

// --- PDF Outline Helpers ---

const walkOutlines = (
  outlines: readonly PDFOutline[],
  callback: (outline: PDFOutline) => boolean | undefined,
) => {
  for (const outline of outlines) {
    const ret = callback(outline);
    if ("children" in outline && ret !== false)
      walkOutlines(outline.children, callback);
  }
};

const flattenOutlines = (outlines: readonly PDFOutline[]) => {
  const result: PDFOutline[] = [];
  walkOutlines(outlines, (outline) => {
    result.push(outline);
    return undefined;
  });
  return result;
};

const getOpeningCount = (outlines: readonly PDFOutline[]) => {
  let count = 0;
  walkOutlines(outlines, (outline) => {
    count += 1;
    return !("open" in outline && !outline.open);
  });
  return count;
};

/**
 * Set PDF document outline (bookmarks/table of contents)
 * Adds navigable bookmarks to the PDF sidebar
 */
const setOutline = async (
  doc: PDFDocument,
  outlines: readonly PDFOutline[],
) => {
  if (outlines.length === 0) return;

  const rootRef = doc.context.nextRef();
  const refMap = new Map<PDFOutline, PDFRef>();

  for (const outline of flattenOutlines(outlines)) {
    refMap.set(outline, doc.context.nextRef());
  }

  const pageRefs = (() => {
    const refs: PDFRef[] = [];
    doc.catalog.Pages().traverse((kid, ref) => {
      if (kid.get(kid.context.obj("Type"))?.toString() === "/Page") {
        refs.push(ref);
      }
    });
    return refs;
  })();

  const getRef = (outline: PDFOutline): PDFRef => {
    const ref = refMap.get(outline);
    if (!ref) throw new Error("Missing outline ref");
    return ref;
  };

  const createOutlineEntries = (
    outlines: readonly PDFOutline[],
    parent: PDFRef,
  ) => {
    const { length } = outlines;

    for (let i = 0; i < length; i += 1) {
      const outline = outlines[i];
      const outlineRef = getRef(outline);

      const destOrAction = (() => {
        if (typeof outline.to === "number") {
          return { Dest: [pageRefs[outline.to], "Fit"] };
        }
        if (Array.isArray(outline.to)) {
          const page = doc.getPage(outline.to[0]);
          const width = page.getWidth();
          const height = page.getHeight();
          return {
            Dest: [
              pageRefs[outline.to[0]],
              "XYZ",
              width * outline.to[1],
              height * outline.to[2],
              null,
            ],
          };
        }
        return {};
      })();

      const childrenDict = (() => {
        if ("children" in outline && outline.children.length > 0) {
          createOutlineEntries(outline.children, outlineRef);
          return {
            First: getRef(outline.children[0]),
            Last: getRef(outline.children[outline.children.length - 1]),
            Count: getOpeningCount(outline.children) * (outline.open ? 1 : -1),
          };
        }
        return {};
      })();

      doc.context.assign(
        outlineRef,
        doc.context.obj({
          Title: PDFHexString.fromText(outline.title),
          Parent: parent,
          ...(i > 0 ? { Prev: getRef(outlines[i - 1]) } : {}),
          ...(i < length - 1 ? { Next: getRef(outlines[i + 1]) } : {}),
          ...childrenDict,
          ...destOrAction,
          F: (outline.italic ? 1 : 0) | (outline.bold ? 2 : 0),
        }),
      );
    }
  };

  createOutlineEntries(outlines, rootRef);

  const rootCount = getOpeningCount(outlines);
  doc.context.assign(
    rootRef,
    doc.context.obj({
      Type: "Outlines",
      ...(rootCount > 0
        ? {
            First: getRef(outlines[0]),
            Last: getRef(outlines[outlines.length - 1]),
          }
        : {}),
      Count: rootCount,
    }),
  );

  doc.catalog.set(doc.context.obj("Outlines"), rootRef);
};

// --- Configuration Types ---

export interface DocOrderEntry {
  path: string;
  title: string;
  section?: string;
}

export interface SpecInfo {
  path: string;
  title: string;
  kind: string;
  qid: string;
}

export interface SpecKind {
  id: string;
  name: string;
}

export interface KintsuPdfOptions {
  /** Production site URL for link rewriting */
  siteUrl: string;
  /** Spec kinds from kintsu.json */
  specKinds: SpecKind[];
  /** Ordered spec kind IDs */
  specKindOrder: string[];
  /** Documentation pages in reading order */
  docsOrder: DocOrderEntry[];
  /** Path to specs content directory */
  specsBasePath?: string;
}

// --- Helper Functions ---

function normalisePathname(pathname: string): string {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function collectSpecInfo(
  specsBasePath: string,
  specKinds: SpecKind[],
  specKindOrder: string[],
): SpecInfo[] {
  const specs: SpecInfo[] = [];

  const kindNames: Record<string, string> = {};
  for (const k of specKinds) {
    kindNames[k.id.toLowerCase()] = k.name;
  }

  for (const kindId of specKindOrder) {
    const kindPath = join(specsBasePath, kindId);
    try {
      const files = readdirSync(kindPath)
        .filter((f) => f.endsWith(".md"))
        .sort();

      for (const file of files) {
        const match = file.match(/^([A-Z]+)-(\d+)\.md$/);
        if (match) {
          const [, kindCode, number] = match;
          const qid = `${kindCode}-${number.padStart(4, "0")}`;
          specs.push({
            path: `/specs/${kindId}/${qid}/`,
            title: qid,
            kind: kindNames[kindId] || kindId.toUpperCase(),
            qid,
          });
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  return specs;
}

function isSpecPage(pathname: string): boolean {
  return /^\/specs\/[a-z]+\/[A-Z]+-\d{4}\/?$/.test(pathname);
}

// --- Main Plugin Export ---

/**
 * Creates the Kintsu PDF generation integration for Astro
 */
export function kintsuPdf(options: KintsuPdfOptions) {
  const {
    siteUrl,
    specKinds,
    specKindOrder,
    docsOrder,
    specsBasePath = "./src/content/specs",
  } = options;

  // Collect spec info at config load time
  const specInfo = collectSpecInfo(specsBasePath, specKinds, specKindOrder);
  const specPathnames = specInfo.map((s) => s.path);
  const docsOrderPaths = docsOrder.map((d) => d.path);
  const completePdfOrder = [...docsOrderPaths, ...specPathnames];

  // Track page info for TOC generation
  const pageInfoMap = new Map<string, { title: string; pageNumber: number }>();

  function getCompleteOrderIndex(pathname: string): number {
    const normalised = normalisePathname(pathname);
    const idx = completePdfOrder.findIndex(
      (p) => normalisePathname(p) === normalised,
    );
    return idx >= 0 ? idx : 9999;
  }

  function getSpecOrderIndex(pathname: string): number {
    const normalised = normalisePathname(pathname);
    const idx = specPathnames.findIndex(
      (p) => normalisePathname(p) === normalised,
    );
    return idx >= 0 ? idx : 9999;
  }

  function isIncludedInComplete(pathname: string): boolean {
    const normalised = normalisePathname(pathname);
    if (docsOrderPaths.some((p) => normalisePathname(p) === normalised)) {
      return true;
    }
    return isSpecPage(pathname);
  }

  return pdf({
    baseOptions: {
      path: "/pdf[pathname].pdf",
      waitUntil: "networkidle0",
      pdf: {
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          bottom: "20mm",
          left: "15mm",
          right: "15mm",
        },
      },
      callback: async (page) => {
        const url = page.url();
        const title = await page.title();
        const pathname = new URL(url).pathname;
        pageInfoMap.set(pathname, { title, pageNumber: 0 });

        await page.waitForNetworkIdle();

        // Rewrite all internal links to point to production site
        await page.evaluate((siteUrlArg: string) => {
          const links = document.querySelectorAll("a[href]");
          for (const link of links) {
            const href = link.getAttribute("href");
            if (href?.startsWith("/")) {
              link.setAttribute("href", `${siteUrlArg}${href}`);
            }
          }
        }, siteUrl);

        // Hide navigation elements for cleaner PDF output
        await page.evaluate(() => {
          const selectors = [
            ".sidebar",
            "nav.sidebar",
            "[data-pagefind-ignore]",
            ".pagination",
            ".edit-link",
            "header.header",
            ".mobile-menu-toggle",
            ".search",
            ".social-icons",
          ];
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              (el as HTMLElement).style.display = "none";
            }
          }
          const main = document.querySelector("main");
          if (main) {
            (main as HTMLElement).style.marginLeft = "0";
            (main as HTMLElement).style.maxWidth = "100%";
          }
        });
      },
    },
    pages: (pathname) => {
      if (
        pathname.startsWith("/404") ||
        pathname.startsWith("/pdf/") ||
        pathname.includes("/_")
      ) {
        return false;
      }

      if (isIncludedInComplete(pathname)) {
        const orderIdx = getCompleteOrderIndex(pathname);
        const paddedIdx = String(orderIdx).padStart(4, "0");
        const safeName =
          pathname.replace(/^\//, "").replace(/\/$/, "").replace(/\//g, "-") ||
          "index";

        const pdfPath = `/pdf/complete/${paddedIdx}-${safeName}.pdf`;

        if (isSpecPage(pathname)) {
          const specIdx = getSpecOrderIndex(pathname);
          const paddedSpecIdx = String(specIdx).padStart(4, "0");
          const specPdfPath = `/pdf/specs/${paddedSpecIdx}-${safeName}.pdf`;

          return [{ path: pdfPath }, { path: specPdfPath }];
        }

        return { path: pdfPath };
      }

      return false;
    },
    runAfter: async (dir) => {
      console.log("Merging PDFs...");

      const completePdfDir = new URL("pdf/complete/", dir);
      const specsPdfDir = new URL("pdf/specs/", dir);

      const countPdfPages = async (pdfPath: string): Promise<number> => {
        const bytes = new Uint8Array(readFileSync(pdfPath));
        const doc = await PDFDocument.load(bytes);
        return doc.getPageCount();
      };

      try {
        // Merge complete documentation PDF
        const completeMerger = new PDFMerger();
        const completeFiles = readdirSync(fileURLToPath(completePdfDir))
          .filter((f) => f.endsWith(".pdf"))
          .sort();

        if (completeFiles.length > 0) {
          const pageOffsets: {
            file: string;
            startPage: number;
            pageCount: number;
          }[] = [];
          let currentPage = 0;

          for (const file of completeFiles) {
            const filePath = fileURLToPath(new URL(file, completePdfDir));
            const pageCount = await countPdfPages(filePath);
            pageOffsets.push({ file, startPage: currentPage, pageCount });
            currentPage += pageCount;
            await completeMerger.add(filePath);
          }

          await completeMerger.setMetadata({
            title: "Kintsu Documentation - Complete",
            author: "Kintsu Project",
          });
          await completeMerger.save(
            fileURLToPath(new URL("kintsu-complete.pdf", dir)),
          );
          console.log(
            `Generated kintsu-complete.pdf (${currentPage} pages from ${completeFiles.length} files)`,
          );

          console.log("Adding outline and metadata to complete PDF...");
          const completePdfPath = fileURLToPath(
            new URL("kintsu-complete.pdf", dir),
          );
          const completePdfBytes = new Uint8Array(
            readFileSync(completePdfPath),
          );
          const completePdf = await PDFDocument.load(completePdfBytes);

          // Build outline structure
          const completeOutlines: PDFOutline[] = [];
          let currentSection: PDFOutlineItemWithChildren | null = null;

          for (const { file, startPage } of pageOffsets) {
            const match = file.match(/^\d{4}-(.+)\.pdf$/);
            if (!match) continue;
            const pathPart = match[1];

            const docsEntry = docsOrder.find((d) => {
              const safePath =
                d.path
                  .replace(/^\//, "")
                  .replace(/\/$/, "")
                  .replace(/\//g, "-") || "index";
              return safePath === pathPart;
            });

            if (docsEntry) {
              if (docsEntry.section) {
                if (currentSection && currentSection.children.length > 0) {
                  completeOutlines.push(currentSection);
                }
                currentSection = {
                  title: docsEntry.section,
                  to: startPage,
                  children: [],
                  open: true,
                };
              }

              const item: PDFOutlineItem = {
                title: docsEntry.title,
                to: startPage,
              };

              if (currentSection) {
                currentSection.children.push(item);
              } else {
                completeOutlines.push(item);
              }
            } else {
              const specEntry = specInfo.find((s) => {
                const safePath = s.path
                  .replace(/^\//, "")
                  .replace(/\/$/, "")
                  .replace(/\//g, "-");
                return safePath === pathPart;
              });

              if (specEntry) {
                if (currentSection && currentSection.children.length > 0) {
                  completeOutlines.push(currentSection);
                  currentSection = null;
                }

                const lastOutline =
                  completeOutlines[completeOutlines.length - 1];
                if (
                  lastOutline &&
                  "children" in lastOutline &&
                  lastOutline.title === specEntry.kind
                ) {
                  lastOutline.children.push({
                    title: specEntry.qid,
                    to: startPage,
                  });
                } else {
                  completeOutlines.push({
                    title: specEntry.kind,
                    to: startPage,
                    children: [
                      {
                        title: specEntry.qid,
                        to: startPage,
                      },
                    ],
                    open: false,
                  });
                }
              }
            }
          }

          if (currentSection && currentSection.children.length > 0) {
            completeOutlines.push(currentSection);
          }

          completePdf.setTitle("Kintsu Documentation - Complete");
          completePdf.setAuthor("Kintsu Project");
          completePdf.setSubject(
            "Complete Kintsu documentation including syntax, types, and specifications",
          );
          completePdf.setKeywords([
            "kintsu",
            "documentation",
            "type system",
            "schema",
            "specifications",
          ]);
          completePdf.setProducer("Kintsu Docs (astro-pdf + pdf-lib)");
          completePdf.setCreator("Kintsu Docs Build System");

          await setOutline(completePdf, completeOutlines);
          console.log(
            `Added ${completeOutlines.length} top-level outline entries`,
          );

          const updatedPdfBytes = await completePdf.save();
          writeFileSync(completePdfPath, updatedPdfBytes);
        }

        // Merge specifications-only PDF
        const specsMerger = new PDFMerger();
        const specsFiles = readdirSync(fileURLToPath(specsPdfDir))
          .filter((f) => f.endsWith(".pdf"))
          .sort();

        if (specsFiles.length > 0) {
          const specPageOffsets: {
            file: string;
            startPage: number;
            pageCount: number;
          }[] = [];
          let specCurrentPage = 0;

          for (const file of specsFiles) {
            const filePath = fileURLToPath(new URL(file, specsPdfDir));
            const pageCount = await countPdfPages(filePath);
            specPageOffsets.push({
              file,
              startPage: specCurrentPage,
              pageCount,
            });
            specCurrentPage += pageCount;
            await specsMerger.add(filePath);
          }

          await specsMerger.setMetadata({
            title: "Kintsu Specifications",
            author: "Kintsu Project",
          });
          await specsMerger.save(
            fileURLToPath(new URL("kintsu-specifications.pdf", dir)),
          );
          console.log(
            `Generated kintsu-specifications.pdf (${specCurrentPage} pages from ${specsFiles.length} specs)`,
          );

          console.log("Adding outline and metadata to specifications PDF...");
          const specsPdfPath = fileURLToPath(
            new URL("kintsu-specifications.pdf", dir),
          );
          const specsPdfBytes = new Uint8Array(readFileSync(specsPdfPath));
          const specsPdf = await PDFDocument.load(specsPdfBytes);

          const specsOutlines: PDFOutline[] = [];

          for (const { file, startPage } of specPageOffsets) {
            const match = file.match(
              /^\d{4}-specs-([a-z]+)-([A-Z]+-\d{4})\.pdf$/,
            );
            if (!match) continue;
            const [, kindId, qid] = match;

            const kindInfo = specKinds.find(
              (k) => k.id.toLowerCase() === kindId,
            );
            const kindName = kindInfo?.name || kindId.toUpperCase();

            const lastOutline = specsOutlines[specsOutlines.length - 1];
            if (
              lastOutline &&
              "children" in lastOutline &&
              lastOutline.title === kindName
            ) {
              lastOutline.children.push({
                title: qid,
                to: startPage,
              });
            } else {
              specsOutlines.push({
                title: kindName,
                to: startPage,
                children: [
                  {
                    title: qid,
                    to: startPage,
                  },
                ],
                open: true,
              });
            }
          }

          specsPdf.setTitle("Kintsu Specifications");
          specsPdf.setAuthor("Kintsu Project");
          specsPdf.setSubject(
            "Formal specifications for the Kintsu type system and compiler",
          );
          specsPdf.setKeywords([
            "kintsu",
            "specifications",
            "RFC",
            "SPEC",
            "TSY",
            "AD",
          ]);
          specsPdf.setProducer("Kintsu Docs (astro-pdf + pdf-lib)");
          specsPdf.setCreator("Kintsu Docs Build System");

          await setOutline(specsPdf, specsOutlines);
          console.log(
            `Added ${specsOutlines.length} spec kind outline entries`,
          );

          const updatedSpecsPdfBytes = await specsPdf.save();
          writeFileSync(specsPdfPath, updatedSpecsPdfBytes);
        }

        // Clean up individual PDFs
        console.log("🧹 Cleaning up individual PDFs...");
        for (const file of completeFiles) {
          await rm(fileURLToPath(new URL(file, completePdfDir)));
        }
        for (const file of specsFiles) {
          await rm(fileURLToPath(new URL(file, specsPdfDir)));
        }
        await rm(fileURLToPath(completePdfDir), { recursive: true });
        await rm(fileURLToPath(specsPdfDir), { recursive: true });
        await rm(fileURLToPath(new URL("pdf/", dir)), { recursive: true });

        console.log("PDF generation complete!");
      } catch (error) {
        console.error("Error merging PDFs:", error);
        throw error;
      }
    },
  });
}

// Re-export types for convenience
export type { PDFOutline, PDFOutlineItem, PDFOutlineItemWithChildren };
