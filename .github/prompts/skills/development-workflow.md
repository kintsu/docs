---
name: development-workflow
title: "Development Workflow"
description: "Standard development process for the kintsu-docs project"
tags: ["project", "development", "workflow", "kintsu-docs"]
updated: 2025-12-25
---
# Development Workflow

Standard development process for the kintsu-docs project.

## Before Starting

1. Check Factsets context: `search_facts`, `search_skills` with relevant tags
2. Review recent execution logs for similar work
3. Ensure you understand the task scope

## Development Commands

### Start Development Server

```bash
bun dev
```

Server runs at http://localhost:3000

### Build Production

```bash
bun build
```

Output to `./dist/`

### Preview Build

```bash
bun preview
```

### Type Check

```bash
bun astro check
```

## Documentation Changes

### Adding Content

1. Create `.md` or `.mdx` files in `src/content/docs/`
2. Files map directly to routes
3. Use frontmatter for metadata

### Adding Specifications

Follow the [specification-workflow](specification-workflow) skill.

### Adding Diagrams

Follow the [diagram-generation](diagram-generation) skill.

## After Changes

1. Run type check: `bun astro check`
2. Verify dev server: `bun dev`
3. Log successful commands: `submit_execution_logs`
4. Update facts if architecture changed: `submit_facts`
5. Update skills if procedures changed

## Working with Submodules

### kintsu/ (Compiler)

- Has its own AGENTS.md
- Build with: `cd kintsu && cargo build`
- Follow Rust conventions in `.github/prompts/rust.md`

### factsets/ (Ignore)

- Factsets MCP server implementation
- Not part of normal documentation work
- Documented as existing submodule

## Code Style

- **TypeScript**: Use Biome formatter
- **Markdown**: Follow Starlight conventions
- **Python**: Standard Python style for automation
- **Rust**: Follow `.github/prompts/rust.md`

## Factsets Integration

On every task:

- Search before work: `search_facts`, `search_skills`
- Log commands: `submit_execution_logs`
- Capture learnings: `submit_facts`
- Register URLs: `add_resources`
