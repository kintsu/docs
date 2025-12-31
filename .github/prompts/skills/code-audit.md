---
name: code-audit
title: "Architectural Code Audit (TypeScript/Python)"
description: "A strict, systematic framework for conducting untrusting code reviews focused on architectural soundness, DRY compliance, and adherence to prescribed formats in TypeScript/Astro and Python codebases."
tags:
  [
    "kintsu",
    "code-review",
    "static-analysis",
    "typescript",
    "python",
    "architecture",
  ]
updated: 2025-12-30
---

# Architectural Code Audit (TypeScript/Python)

A systematic review protocol for enforcing strict architectural patterns, eliminating code smells, and validating code against specifications in TypeScript/Astro and Python projects.

## Phase 1: Prerequisite Analysis

### 1. Audit Constitution

- **Constraint Validation**: Verify all provided specifications (SPEC, RFC, PERF) and coding guidelines are loaded and understood.
- **Toolchain Setup**: Confirm access to `bun` runtime, `biome check` for linting, `tsc` for TypeScript compilation, and `pytest` for Python testing. Reject analysis if core tools are unavailable.
- **Scope Definition**: Define explicit review boundaries—specific modules, scripts, or architectural layers across TypeScript (`.ts`, `.tsx`, `.mts`) and Python (`.py`) files.

### 2. Specification & Pattern Inventory

- **Kintsu Spec Mapping**: Extract all specification IDs (`SPEC-\d{4}`, `RFC-\d{4}`, etc.) from the target codebase using the defined regex pattern.
- **Link Validation**: For each `Occurrences(ID)`, verify it is a canonical markdown link `[ID](https://docs.kintsu.dev/specs/{lower(K)}/{ID})`. Flag bare text occurrences as "un-referenced" violations.
- **DRY Pattern Baseline**: Identify repeated logic, utility patterns, and shared interfaces that should be abstracted but are absent across both language domains.

## Phase 2: Structural Investigation

### 3. Architectural Decomposition

- **Dependency Graph Analysis**: Map `package.json` (Bun/Node) and `requirements.txt` (Python) dependencies. Flag cyclical dependencies, overly large modules, and inappropriate couplings between systems.
- **State & Mutability Audit**: Review use of global state, mutable module exports, and side effects. In TypeScript, challenge every non-constant `let` and mutable external variable. In Python, scrutinize global variables and mutable default arguments.
- **Interface Inspection**: Examine all `export` declarations (TypeScript) and public definitions in `__init__.py` (Python). Verify encapsulation.

### 4. Code Smell Detection

- **TypeScript/Astro Anti-Patterns**:
  - Use of `any` type without absolute necessity.
  - Functions or components exceeding reasonable length or complexity.
  - Deeply nested callbacks or promise chains.
  - Generic primitive parameters where union types or enums are better.
  - Ignored promise rejections or improper error handling in async code.
- **Python Script Anti-Patterns**:
  - Lack of type hints in `auto/` and `gen_diagrams/` scripts.
  - Repeated diagram generation or documentation logic.
  - Scripts without proper `if __name__ == "__main__"` guards.
  - Hardcoded paths instead of configurable parameters.
- **Violation Logging**: Catalog each smell with file path, line number, and specific guideline violated.

## Phase 3: Strict Review

### 5. Rule Enforcement

- **Style Compliance**: Enforce line length (~100 chars). For TypeScript/JavaScript, use `biome format` and `biome lint`. For YAML, use `yamlfmt`. For Python, enforce PEP 8. No decorative comments.
- **Type Safety Audit**: Enforce strict TypeScript compilation (`strict: true`). Reject unsafe type assertions (`as any`) and implicit `any` types. For Python, require type hints in all `auto/` and `gen_diagrams/` scripts.
- **Error Handling Audit**: Verify errors are typed and handled gracefully. Reject empty `catch` blocks (TypeScript) and bare `except:` clauses (Python).

### 6. DRY Principle Enforcement

- **Utility Identification**: Identify repeated logic patterns across multiple locations within the same language and cross-language (e.g., similar data transformations in TypeScript and Python).
- **Extraction Mandate**: Mandate refactoring into:
  - Shared utility modules (e.g., `src/lib/utils.ts` for Astro, `auto/utils.py` for Python scripts).
  - Shared React components or Astro components for UI patterns.
  - Shared Python functions in `auto/` for documentation automation.
- **Rejection Criteria**: Reject changes that introduce logic duplicating an existing, accessible utility.

## Phase 4: Validation & Enforcement

### 7. Test and Specification Validation

- **Test Untrusting Review**: Examine test cases in `tests/` (Python) and any TypeScript tests. Reject tests that only validate happy paths. Ensure tests validate error conditions and edge cases.
- **Specification Compliance Check**: For every Kintsu spec ID found, ensure the implemented code correctly fulfills the spec's requirements. Treat "un-referenced" spec IDs as a documentation defect.
- **Automation Script Review**: Critically review Python scripts in `auto/` and `gen_diagrams/`. Verify they are robust, well-documented, and handle failures gracefully.

### 8. Final Audit Synthesis

- **Defect Report**: Produce a concise list of violations grouped by severity and language.
- **Mandatory Corrections**: Specify which defects must be fixed prior to approval (e.g., spec link violations, critical type safety issues in automation scripts).
- **Knowledge Capture**: Submit facts for recurring anti-patterns. Log successful audit command sequences.

## Audit Checklist

Before approving any code, validate from these perspectives:

- **Specification**: Does every feature correctly implement and link to its governing spec?
- **Type Safety**: Does the TypeScript code maximize compiler checks? Do Python scripts have type hints?
- **Architecture**: Is the code modular, loosely coupled, and free of needless duplication across languages?
- **Maintainability**: Is the code readable, well-documented for public APIs, and free of unnecessary complexity?
- **Validation**: Are tests and automation scripts robust and reliable?

## Todo List Format

```markdown
## Audit Target: [Module, Script, or Service description]

### Phase 1: Setup

- [ ] Load and parse all relevant SPEC/RFC documents
- [ ] Run initial `biome check` and `tsc --noEmit` for TypeScript; `python -m py_compile` for Python
- [ ] Map specification IDs in codebase

### Phase 2: Deep Review

- [ ] Conduct dependency and module structure audit
- [ ] Detect and catalog TypeScript and Python anti-patterns
- [ ] Identify DRY violations and repeated patterns

### Phase 3: Validation

- [ ] Review and validate all test cases
- [ ] Verify specification compliance and link correctness
- [ ] Critically review automation scripts in `auto/`

### Phase 4: Reporting

- [ ] Generate defect report with mandatory fixes
- [ ] Document approved patterns for future reference
- [ ] Submit facts on codebase health
```

## References

| Resource                    | URL                                           |
| --------------------------- | --------------------------------------------- |
| TypeScript Documentation    | https://www.typescriptlang.org/docs/          |
| Biome Documentation         | https://biomejs.dev/                          |
| Bun Documentation           | https://bun.sh/docs                           |
| Python Typing Documentation | https://docs.python.org/3/library/typing.html |
| Astro Documentation         | https://docs.astro.build/                     |
