---
name: kintsu-docs-overview
title: "Kintsu-Docs Project Overview"
description: "High-level overview of the kintsu-docs documentation project architecture and tech stack"
tags: ["project", "kintsu-docs", "overview", "getting-started"]
updated: 2025-12-25
---
# Kintsu-Docs Project Overview

kintsu-docs is the official documentation website for the Kintsu type system and compiler, built with Astro and Starlight.

## Purpose

Provide comprehensive documentation including:
- User guides and tutorials
- Formal specifications (RFC, TSY, SPEC, AD)
- API reference
- Schema syntax documentation

## Architecture

```
kintsu-docs/
  src/content/docs/     # Documentation pages (MDX/Markdown)
  src/content/specs/    # Formal specifications
  auto/                 # Python documentation automation
  gen_diagrams/         # Python diagram generators
  kintsu/               # Compiler submodule (Rust)
  factsets/             # Factsets MCP server submodule
```

## Tech Stack

- **Astro 5.x** - Static site generator
- **Starlight** - Documentation theme
- **Bun** - Package manager and runtime
- **Biome** - Linter/formatter
- **Python** - Diagram generation and automation

## Getting Started

### Before Working

1. Validate context: `search_facts` with tags `["project", "kintsu-docs"]`
2. Check existing skills: `search_skills` for relevant procedures

### Development

```bash
# Install dependencies
bun install

# Start dev server (port 3000)
bun dev

# Build production
bun build

# Preview build
bun preview
```

### After Changes

1. Log successful commands: `submit_execution_logs`
2. Submit any new facts learned: `submit_facts`
3. Update skills if workflows changed

## Key Entry Points

- [astro.config.mts](astro.config.mts) - Astro/Starlight configuration
- [package.json](package.json) - Dependencies and scripts
- [instructions.md](instructions.md) - Documentation generation plan
- [auto/kintsu.yaml](auto/kintsu.yaml) - Spec generation config
