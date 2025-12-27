---
name: specification-workflow
title: "Specification Workflow"
description: "Standard workflow for creating RFC, TSY, AD, SPEC, and ERR documents for Kintsu"
tags: ["specs", "documentation", "workflow", "kintsu", "errors"]
updated: 2025-12-27
---

# Specification Workflow

This skill documents the process for creating and managing Kintsu specifications.

## Specification Types

| Kind | Name                    | Purpose                                            |
| ---- | ----------------------- | -------------------------------------------------- |
| RFC  | Request for Comments    | Design proposals and rationale ("why")             |
| TSY  | Type System             | Type system rules and semantics ("what" normative) |
| AD   | Architecture Decision   | High-level architectural decisions                 |
| SPEC | Technical Specification | Detailed implementation specs ("how")              |
| ERR  | Error Handling          | Error codes, diagnostics, and reporting behaviours |

## Workflow Order

Specifications are created in this order:

1. **RFC** - Anyone can submit; describes the "why"
2. **TSY** - If type system changes needed
3. **AD** - If architectural decisions needed
4. **SPEC** - Technical details and behaviour
5. **ERR** - Error domain specifications (references SPEC for validations)

## Domain Separation Principle

**Critical:** Each specification must focus on its own domain and NOT duplicate content from other specifications.

### What Each Spec Kind Should Contain

| Kind | Should Contain                                  | Should NOT Contain                         |
| ---- | ----------------------------------------------- | ------------------------------------------ |
| RFC  | Design rationale, motivation, trade-offs        | Implementation algorithms, error codes     |
| TSY  | Normative type system rules, syntax, semantics  | Compiler internals, rationale explanations |
| SPEC | Compiler algorithms, registration order, phases | Design rationale (belongs in RFC)          |
| ERR  | Error codes, messages, diagnostics, examples    | Type system rules (reference TSY instead)  |
| AD   | High-level architecture, component boundaries   | Detailed implementation (belongs in SPEC)  |

### Cross-Referencing Pattern

Instead of duplicating content, use explicit out-of-scope statements and references:

```markdown
Note: anonymous-struct extraction and union merging are out-of-scope for this SPEC
and documented in SPEC-0003 and SPEC-0007 respectively.
```

Or at the beginning of sections:

```markdown
Anonymous struct promotion and union merging are described in separate TSY specs
(TSY-0003 and TSY-0007 respectively); this document limits itself to the structural
rules for `struct` declarations.
```

### Spec Link Format

Links to specifications must use **lowercase absolute paths**:

```markdown
<!-- Correct -->

[RFC-0002](/specs/rfc/rfc-0002)
[TSY-0005](/specs/tsy/tsy-0005)
[SPEC-0010](/specs/spec/spec-0010)
[ERR-0012](/specs/err/err-0012)

<!-- Wrong - will fail validation -->

[RFC-0002](/specs/rfc/RFC-0002)
./RFC-0002
RFC-0002
```

## Before Creating Specs

1. Search existing knowledge: `search_facts` with tags `["specs", "documentation"]`
2. Check for existing specs: `search_skills` for related procedures
3. Review `instructions.md` for current status

## Creating Specifications

### Generate RFC

```bash
python -m auto.doc new-spec \
  --spec-kind=RFC \
  --title="Feature Name" \
  --author=joshua-auchincloss \
  --components=compiler \
  --components=parser
```

### Generate TSY

```bash
python -m auto.doc new-spec \
  --spec-kind=TSY \
  --title="Feature Type System" \
  --author=joshua-auchincloss \
  --components=compiler
```

### Generate SPEC

```bash
python -m auto.doc new-spec \
  --spec-kind=SPEC \
  --title="Feature - Compilation" \
  --author=joshua-auchincloss \
  --components=compiler
```

### Generate ERR

```bash
python -m auto.doc new-spec \
  --spec-kind=ERR \
  --title="Error Domain Name" \
  --author=joshua-auchincloss \
  --components=parser \
  --components=compiler
```

## After Creating Specs

1. Log the generation command: `submit_execution_logs`
2. Populate the generated template
3. Update `instructions.md` checklist
4. Submit facts about new spec: `submit_facts`

## Frontmatter Updates

When updating existing spec files, add an entry to the `updates` array:

```yaml
updates:
  - author: joshua-auchincloss
    date: 2025-12-27
    description: Added collapsible sections to long code examples
```

## Writing Guidelines

- Write factually, no emojis
- Describe behaviour, not internal code
- Use proper heading hierarchy
- Include GitHub-style admonitions
- Cross-reference related specs (don't duplicate)
- Use Canadian English spelling (behaviour, colour, catalogue)

## Expressive Code

The project uses [Expressive Code](https://expressive-code.com/) with the collapsible sections plugin for enhanced code blocks.

### Frame Titles

Add titles to code blocks using the `title` attribute:

````markdown
```kintsu title="schema/types.ks"
struct User {
    id: i64,
    name: str
};
```
````

For terminal examples:

````markdown
```bash title="Install dependencies"
npm install
```
````

### Text & Line Markers

#### Line Highlighting

Mark lines with `{line}`, ranges with `{start-end}`, or multiple with `{a, b, c}`:

````markdown
```js {1, 4, 7-8}
// Line 1 - highlighted
// Line 2
// Line 3
// Line 4 - highlighted
// Line 5
// Line 6
// Line 7 - highlighted
// Line 8 - highlighted
```
````

#### Inserted/Deleted Lines

Use `ins={lines}` for insertions (green) and `del={lines}` for deletions (red):

````markdown
```kintsu title="schema.ks" del={2} ins={3-4}
struct User {
    name: string,       // deleted - wrong type
    name: str,          // inserted - correct
    email: str,         // inserted
};
```
````

#### Inline Text Markers

Highlight specific text within lines:

````markdown
```js "given text"
// Mark any given text inside lines
```
````

With marker types:

````markdown
```js ins="inserted" del="deleted"
console.log("These are inserted and deleted marker types");
```
````

#### Diff Syntax with Language Highlighting

Combine diff syntax with proper syntax highlighting:

````markdown
```diff lang="kintsu"
  struct User {
-     name: string,
+     name: str,
  };
```
````

### Collapsible Sections

Collapse long boilerplate or setup code with `collapse={start-end}`:

````markdown
```toml title="schema.toml" collapse={1-15, 25-35}
# Configuration that will be collapsed
[package]
name = "my-schema"
version = "1.0.0"
# ... many lines ...

# This section is visible
[dependencies]
common-types = "^1.0"

# More collapsed content
# ...
```
````

Multiple collapsed sections in one block are supported:

````markdown
```js collapse={1-5, 12-14, 21-24}
// All this boilerplate will be collapsed
import { someEngine } from "@example/engine";
// ... setup code ...

// This part is visible
engine.doSomething();

function calcFn() {
  // Another collapsed section
  const a = 1;
  const b = 2;
  // ...

  // This remains visible
  return result;
}

// Collapsed footer
// ...
```
````

### Expressive Code Best Practices

1. **Use titles** for all code blocks that represent files
2. **Use `del`** markers to highlight error-causing lines in error examples
3. **Use `collapse`** for long configuration or boilerplate that isn't the focus
4. **Prefer `title` attribute** over `# filename` comments inside code blocks
5. **Combine features**: `title`, `collapse`, and markers work together

Example combining multiple features:

````markdown
```toml title="schema.toml" collapse={5-15} ins={20-22}
[package]
name = "my-schema"
version = "1.0.0"

# Collapsed dependencies section
[dependencies]
common = "^1.0"
# ... more deps ...

[package.metadata]
description = "Schema package"

# New configuration added
[registry]
default = "kintsu-public"
token = { credentials = true }
```
````

## Admonition Syntax (GitHub Alerts)

Admonitions use **GitHub-style alerts** (supported by starlight-github-alerts plugin).

### Correct format

The alert type must be on its own line, with content on subsequent lines:

```markdown
> [!NOTE]
> Supplementary information that users should know.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Critical implementation requirements users need to know.

> [!WARNING]
> Edge cases and potential pitfalls to avoid problems.

> [!CAUTION]
> Risks or negative outcomes of certain actions.
```

### Common mistakes

**Wrong** - content on same line:

```markdown
> [!NOTE] > This is wrong.
```

**Correct** - content on next line:

```markdown
> [!NOTE]
> This is correct.
```

### Multi-line content

Each line must start with `>`:

```markdown
> [!WARNING]
> First line of warning.
> Second line continues here.
>
> Blank line within the admonition.
```

## Spec Structure Patterns

### RFC Structure

1. **Abstract** - Brief summary
2. **Motivation** - Why this is needed
3. **Specification** - High-level user-facing syntax/behaviour
4. **Rationale** - Design decisions and trade-offs
5. **Acceptance Criteria** - Checkboxes
6. **Backwards Compatibility** - Migration concerns
7. **References** - Related specs

### TSY Structure

1. **Overview** - Brief description
2. **Motivation** - Why type system rules needed
3. **Design Principles** - Guiding principles
4. **Type system rules (normative)** - The actual rules
5. **Diagrams** - Visual aids
6. **References** - RFC and SPEC links

### SPEC Structure

1. **Overview** - Brief description
2. **Diagrams** - Visual aids (often at top)
3. **Motivation** - Why implementation details matter
4. **Deterministic compilation rules (normative)** - Algorithms
5. **Acceptance criteria** - Implementation requirements
6. **Design Principles** - Implementation philosophy
7. **References** - RFC and TSY links

### ERR Structure

1. **Overview** - Domain description
2. **Domain Summary** - Table of error codes
3. **Error Definitions** - Each error with:
   - Severity, Phase
   - Message template
   - Primary/Related spans
   - Help text
   - Example diagnostic output
   - References to relevant specs
4. **References** - Related specs

## Key Resources

- [instructions.md](instructions.md) - Documentation plan
- [auto/kintsu.yaml](auto/kintsu.yaml) - Spec kinds config
- [src/content/specs/](src/content/specs/) - Generated specs
- [ec.config.mjs](ec.config.mjs) - Expressive Code configuration
