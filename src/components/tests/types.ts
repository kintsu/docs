export interface TestMetadata {
  id: string;
  name: string;
  purpose: string;
  expect_pass: boolean;
  tags: string[];
}

export interface ErrorMetadata {
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
  error_domain?: string | null;
  error_category?: string | null;
  error_sequence?: number | null;
  error_severity?: string | null;
}

export interface CliTestData {
  type: "cli_test";
  test: {
    fs: Record<string, string>;
    metadata: TestMetadata;
    exit_code: number;
    passed: boolean;
    stdout?: string;
    stdout_coloured?: string;
    stderr: string;
    stderr_coloured?: string;
    error_metadata?: ErrorMetadata | null;
  };
}

export interface CompileTestData {
  type: "compile_test";
  test: {
    fs: Record<string, string>;
    metadata: TestMetadata;
    actual_pass: boolean;
    matches_expectation: boolean;
    error_message?: string | null;
  };
}

export type TestData = CliTestData | CompileTestData;

export interface RenderedAnsi {
  html: string;
  plaintext: string;
  detectedPaths: Array<{
    match: string;
    path: string;
    line?: number;
    column?: number;
  }>;
}

export interface RenderedOutputs {
  stdout: RenderedAnsi | null;
  stderr: RenderedAnsi | null;
}

export const ERROR_DOMAIN_SPECS: Record<string, string> = {
  LX: "ERR-0002",
  PR: "ERR-0003",
  NS: "ERR-0004",
  TY: "ERR-0005",
  TR: "ERR-0006",
  UN: "ERR-0007",
  MT: "ERR-0008",
  TG: "ERR-0009",
  TE: "ERR-0010",
  PK: "ERR-0011",
  RG: "ERR-0012",
  FS: "ERR-0013",
  IN: "ERR-0014",
  WS: "ERR-0015",
  CL: "ERR-0016",
  CP: "ERR-0017",
  FM: "ERR-0018",
};

export function getErrorDomainSpecPath(
  domainCode: string | null | undefined,
): string | null {
  if (!domainCode) return null;
  const twoLetterCode =
    domainCode.length === 2
      ? domainCode
      : domainCode.startsWith("K")
        ? domainCode.slice(1, 3)
        : domainCode.slice(0, 2);
  const spec = ERROR_DOMAIN_SPECS[twoLetterCode];
  return spec ? `/specs/err/${spec.toLowerCase()}` : null;
}
