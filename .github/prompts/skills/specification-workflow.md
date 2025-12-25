---
name: specification-workflow
title: "Specification Workflow"
description: "Standard workflow for creating RFC, TSY, AD, and SPEC documents for Kintsu"
tags: ["specs", "documentation", "workflow", "kintsu"]
updated: 2025-12-25
---

# Specification Workflow

This skill documents the process for creating and managing Kintsu specifications.

## Specification Types

| Kind | Name                    | Purpose                            |
| ---- | ----------------------- | ---------------------------------- |
| RFC  | Request for Comments    | Design proposals and rationale     |
| TSY  | Type System             | Type system rules and semantics    |
| AD   | Architecture Decision   | High-level architectural decisions |
| SPEC | Technical Specification | Detailed implementation specs      |

## Workflow Order

Specifications are created in this order:

1. **RFC** - Anyone can submit; describes the "why"
2. **TSY** - If type system changes needed
3. **AD** - If architectural decisions needed
4. **SPEC** - Technical details and behavior

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

## After Creating Specs

1. Log the generation command: `submit_execution_logs`
2. Populate the generated template
3. Update `instructions.md` checklist
4. Submit facts about new spec: `submit_facts`

## Writing Guidelines

- Write factually, no emojis
- Describe behavior, not internal code
- Use proper heading hierarchy
- Include GitHub-style admonitions
- Cross-reference related specs

## Admonition Syntax

```markdown
> [!NOTE]
> Supplementary information

> [!IMPORTANT]
> Critical implementation requirements

> [!WARNING]
> Edge cases and potential pitfalls
```

## Key Resources

- [instructions.md](instructions.md) - Documentation plan
- [auto/kintsu.yaml](auto/kintsu.yaml) - Spec kinds config
- [src/content/specs/](src/content/specs/) - Generated specs
