---
name: docs-audit-workflow
title: "Kintsu Documentation Audit Workflow"
description: "Step-by-step procedure for auditing kintsu documentation against parser source code to identify accuracy gaps"
tags: ["documentation", "parser", "kintsu-docs", "automation"]
updated: 2025-12-25
---
# Documentation Audit Workflow

## Purpose
Audit kintsu-docs against parser source for accuracy.

## Source of Truth
- Tokens: `kintsu/parser/src/tokens/toks.rs`
- AST: `kintsu/parser/src/ast/*.rs`
- Samples: `kintsu/parser/samples/*.ks`
- Tests: `kintsu/test-suite/fragments/*.ks`

## Steps

1. **Search existing facts**
   ```
   search_facts tags: [parser, syntax, documentation]
   ```

2. **Check tokens against builtin.md**
   - Grep for `Kw[A-Z]` patterns in toks.rs
   - Compare against documented builtins/keywords

3. **Check AST types against type docs**
   - Each `src/content/docs/types/*.md` maps to `kintsu/parser/src/ast/*.rs`

4. **Validate examples against samples**
   - Parser samples are tested - use as authoritative examples

5. **Update remediation doc**
   - File: `kintsu-docs-remediation.md`
   - Maintains checklist of gaps

6. **Submit findings as facts**
   - Tag with: parser, syntax, documentation, kintsu-docs
