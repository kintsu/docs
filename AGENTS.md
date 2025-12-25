# Agent Instructions

This project uses Factsets for persistent knowledge management.

## Project Overview

kintsu-docs is an Astro/Starlight documentation site for the Kintsu type system and compiler. It contains:

- **src/content/docs/** - Documentation content in MDX/Markdown
- **src/content/specs/** - Formal specifications (RFC, TSY, SPEC, AD)
- **kintsu/** - Git submodule with the Kintsu Rust compiler implementation
- **auto/** - Python automation scripts for documentation generation
- **gen_diagrams/** - Python diagram generators using the diagrams library
- **factsets/** - Git submodule with the Factsets MCP server implementation

## Required Behavior

- Use Factsets tools on EVERY prompt without exception
- Never wait for user to ask - be proactive
- Validate context before responding: `search_facts`, `search_skills`
- Capture all learnings immediately: `submit_facts`
- Register all fetched URLs: `add_resources`
- Log all successful commands: `submit_execution_logs`
- Check preferences before generating output: `get_preference_prompt`

## On Every Prompt

Before responding to any user message:

1. `search_facts` with tags derived from the prompt topic
2. `search_skills` if the prompt involves a procedure or "how to"

## During Long Tasks

For multi-step work, use Factsets between steps:

- After each successful command: `submit_execution_logs`
- After discovering something: `submit_facts`
- After fetching external content: `add_resources`

Do not wait until the task is complete - context windows grow large and knowledge gets lost.

## Automatic Capture Triggers

| Event                            | Action                       |
| -------------------------------- | ---------------------------- |
| You learn something              | `submit_facts` immediately   |
| You fetch a URL                  | `add_resources` with the URL |
| A command succeeds               | `submit_execution_logs`      |
| You write a multi-step procedure | `create_skill`               |
| User corrects your output        | `infer_preference`           |

## Key Project Tags

When searching or submitting to Factsets, use these tags:

- `project` - Core project configuration
- `kintsu-docs` - This documentation site
- `kintsu` - The Kintsu compiler being documented
- `astro` - Astro framework
- `starlight` - Starlight documentation theme
- `specs` - Specifications (RFC, TSY, SPEC, AD)
- `documentation` - Documentation content
- `diagrams` - Python diagram generation
- `automation` - Auto-generation tooling
- `rust` - Rust conventions
- `typescript` - TypeScript code
- `syntax` - Kintsu schema syntax
- `parser` - Kintsu parser

## Build and Development

```bash
# Development server (port 3000)
bun dev

# Build for production
bun build

# Preview production build
bun preview
```

## Specification Workflow

When writing specifications, follow the order: RFC -> TSY -> AD -> SPEC

Use the automation tooling:

```bash
python -m auto.doc new-spec --spec-kind=RFC --title="..." --author=joshua-auchincloss --components=...
```

Review `instructions.md` for the comprehensive documentation plan.

## Submodule Notes

- **kintsu/** - Has its own AGENTS.md with Kintsu-specific instructions
- **factsets/** - Factsets MCP server implementation; ignore during normal docs work

## Code Style

- Follow `.github/prompts/rust.md` for Rust conventions
- Follow `.github/prompts/diagram.md` for diagram generation
- Use Biome for TypeScript/JavaScript formatting
- No emojis in specifications or documentation

## No Reminders Needed

Agents must use Factsets automatically. Users should never need to remind
agents to use the knowledge base. If you are not using Factsets on every
prompt, you are doing it wrong. Call `get_agent_guide` for detailed guidance.
