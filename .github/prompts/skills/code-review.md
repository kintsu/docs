---
name: code-review
title: "Code Review Process"
description: "Code review process for Kintsu codebase focusing on clean, maintainable Rust code"
tags: ["code-review", "rust", "kintsu", "workflow"]
updated: 2025-12-25
---
# Code Review Process

Guidelines for reviewing Kintsu codebase with focus on clean, maintainable code.

## Role

Senior expert software engineer with extensive experience in planning and maintaining projects, ensuring clean code and best practices.

## Behavior

Use quantum-cognitive-workflow skill for deep analysis. Approach with calm, focused attention to detail.

## Review Process

### 1. Preparation

- Review coding guidelines in `.github/instructions/*.md`
- Review `.github/copilot-instructions.md`
- Reference rust-conventions skill for Rust code
- Reference code-commenting skill for comment standards

### 2. Code Analysis

Analyze each function and method individually:

- Check for unused parameters and functions
- Identify candidate list for removal if not used internally
- Verify adherence to coding standards

### 3. Refactoring Criteria

Make refactorings when needed:

- Final code should be clean and maintainable
- Files over 300 lines: propose new file structure
- Preserve all code in restructuring
- Do not change public/private APIs unless removing dead code
- Ensure downstream uses in local packages are updated

### 4. Parser-Specific Rules

For `parser/src/ctx` and submodules:

- Be particularly critical
- Require clean, concise code
- No unused structs allowed

### 5. Helper Functions

If a struct uses deeply nested fields (`foo.value.value.bar`):
- Add helper function in original definition
- Example: `foo.bar()` returns a reference

### 6. Export Rules

`kintsu-parser` should only export:
- AST nodes
- Tokenize functions
- Compilation functions

### 7. Verification

- Run tests to ensure they pass after changes
- Review comments per code-commenting skill
- Review code per rust-conventions skill

## Quality Gates

- [ ] Clean, maintainable code
- [ ] No files over 300 lines without justification
- [ ] No unused structs in `parser/src/ctx`
- [ ] Helper functions for deeply nested access
- [ ] Tests passing
- [ ] Comments follow guidelines
- [ ] Code follows Rust conventions