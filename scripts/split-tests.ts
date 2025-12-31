import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const INPUT = join(ROOT, "test-suite.jsonl");
const OUTPUT_DIR = join(ROOT, "src", "content", "tests");

interface TestMetadata {
  id: string;
  name: string;
  purpose: string;
  expect_pass: boolean;
  tags: string[];
}

interface BaseTest {
  fs: Record<string, string>;
  metadata: TestMetadata;
}

interface CliTest extends BaseTest {
  exit_code: number;
  passed: boolean;
  expected_error_code?: string | null;
  actual_error_code?: string | null;
  expected_span?: boolean;
  has_source_span?: boolean;
  span_matches_expectation?: boolean;
  stdout?: string;
  stdout_coloured?: number[];
  stderr: string;
  stderr_coloured?: number[];
  error_message?: string | null;
  error_metadata?: {
    code?: string | null;
    domain?: string | null;
    severity: string;
    message?: string | null;
    help?: string | null;
    source_location?: {
      file: string;
      line: number;
      column: number;
    } | null;
    labeled_spans: Array<{ label: string; primary: boolean }>;
    notes: string[];
    // New fields from ERR-0001 error code structure
    error_domain?: string | null; // Full domain name (e.g., "TypeResolution")
    error_category?: string | null; // Category name (e.g., "Resolution")
    error_sequence?: number | null; // Sequence number (e.g., 2 from KTR1002)
    error_severity?: string | null; // Severity from category level
  } | null;
  pre_compiled?: boolean;
}

interface CompileTest extends BaseTest {
  actual_pass: boolean;
  matches_expectation: boolean;
  error_message?: string | null;
}

type TestRecord =
  | { type: "cli_test"; test: CliTest }
  | { type: "compile_test"; test: CompileTest };

function main(): void {
  if (!existsSync(INPUT)) {
    console.error(`Input file not found: ${INPUT}`);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const jsonl = readFileSync(INPUT, "utf-8");
  const lines = jsonl.split("\n").filter((line) => line.trim());

  let cliCount = 0;
  let compileCount = 0;
  let errorCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let record: TestRecord;

    try {
      record = JSON.parse(line);
    } catch (e) {
      console.warn(`Skipping malformed line ${i + 1}`);
      errorCount++;
      continue;
    }

    const id = record.test.metadata.id;
    const outputPath = join(OUTPUT_DIR, `${id}.json`);

    writeFileSync(outputPath, JSON.stringify(record, null, 2));

    if (record.type === "cli_test") {
      cliCount++;
    } else {
      compileCount++;
    }
  }

  const total = cliCount + compileCount;
  console.log(`Split ${total} tests to ${OUTPUT_DIR}`);
  console.log(`  CLI tests: ${cliCount}`);
  console.log(`  Compile tests: ${compileCount}`);
  if (errorCount > 0) {
    console.log(`  Skipped: ${errorCount} malformed lines`);
  }
}

main();
