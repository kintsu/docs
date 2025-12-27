# Kintsu Documentation

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

This repository contains the official documentation site for **Kintsu**, a type system and schema language for defining cross-platform data structures with strong typing, serialisation control, and code generation capabilities.

**Live Site:** [docs.kintsu.dev](https://docs.kintsu.dev)

## What is This Repository?

This is the **documentation and specification hub** for Kintsu. It serves two primary purposes:

1. **User Documentation** - Comprehensive guides, tutorials, and reference documentation for using Kintsu
2. **Formal Specifications** - RFCs, technical specifications, type system rules, and design decisions that define Kintsu's behaviour

All Kintsu features are documented through a rigorous specification process that ensures consistency, completeness, and implementability.

## Contributing

We welcome contributions from the community! Whether you want to propose a new feature, improve documentation, or report issues, we have a structured process to ensure high-quality specifications.

### Proposing New Features

To propose a new feature or change to Kintsu:

1. **Open a Feature Request Issue** using the feature request template
   - Provide a light RFC document with enough detail to understand the proposal
   - Describe the problem, motivation, and proposed solution
   - Include examples demonstrating the feature

2. **Maintainers Review and Accept**
   - If accepted into scope, maintainers will assign the appropriate specification type (RFC, ERR, etc.)
   - A draft specification will be created on a dedicated branch
   - You'll be granted permissions to collaboratively edit the specification

3. **Track Specification Progress**
   - A tracking issue will be created to monitor RFC readiness for review
   - Collaborate with maintainers to refine the specification
   - Once approved, additional specifications (TSY, SPEC, ERR) will be generated as needed

4. **Original Issue Tracks All Documents**
   - The initial feature request remains open as a high-level tracking document
   - All related specifications (RFC, TSY, SPEC, ERR) are linked from this issue

### Pull Requests

For documentation improvements or corrections, you can submit a pull request directly. For specification changes, please open an issue first to discuss the proposed changes.

## Specification Types

Kintsu uses a multi-layered specification system to ensure features are well-designed, formally specified, and correctly implemented.

| Type     | Name                    | Purpose                                                                             | Status Flow                                         |
| -------- | ----------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| **RFC**  | Request for Comments    | Design rationale, motivation, and high-level specification for new features         | draft -> proposed -> accepted/rejected              |
| **TSY**  | Type System             | Normative type system rules and semantic validation constraints                     | draft -> proposed -> accepted -> unstable -> stable |
| **SPEC** | Technical Specification | Deterministic compilation rules, implementation algorithms, and acceptance criteria | draft -> proposed -> accepted -> unstable -> stable |
| **AD**   | Architecture Decision   | High-level architectural decisions and design principles                            | draft -> proposed -> accepted                       |
| **ERR**  | Error Handling          | Error codes, diagnostic messages, and reporting behaviour for specific domains      | draft -> proposed -> accepted -> unstable -> stable |

### Specification Relationships

Specifications reference each other to form a complete picture of a feature:

```
RFC (Design & Rationale)
 |----> TSY (Type System Rules) -------.
 |----> SPEC (Implementation) ---------|
 |----> ERR (Error Handling) ----------|
 `----> AD (Architecture) --------------+--> Complete Feature Definition
```

### Minimum Requirements for Development

To begin implementing a feature in the Kintsu compiler, you need **at minimum**:

- **RFC** - Defines what the feature is and why it exists
- **SPEC** - Defines how to implement it deterministically

**Additionally, you should always consider:**

- **ERR** - How errors are reported (error codes, messages, diagnostics)
- **TSY** - Type system constraints (if the feature affects the type system)
- **AD** - Architectural implications (if the feature requires significant design decisions)

### Specification Status Values

Specifications progress through the following statuses:

- **draft** - Initial authoring, not ready for review
- **proposed** - Ready for community review and feedback
- **accepted** - Approved by maintainers, ready for implementation
- **rejected** - Proposal declined (with rationale documented)
- **unstable** - Implemented but subject to breaking changes
- **stable** - Implemented, tested, and API-stable
- **deprecated** - Replaced by a newer approach but still documented
- **superseded** - Replaced by another specification (use that one instead)

## Project Structure

```
kintsu-docs/
|---- src/
|   |---- content/
|   |   |---- docs/           # User-facing documentation
|   |   `---- specs/          # Formal specifications
|   |       |---- rfc/        # Request for Comments
|   |       |---- tsy/        # Type System specifications
|   |       |---- spec/       # Technical Specifications
|   |       |---- ad/         # Architecture Decisions
|   |       `---- err/        # Error Handling specifications
|   |---- components/         # UI components (React/Astro)
|   `---- styles/            # Custom styling
|---- auto/                  # Python automation tools
|   |---- doc.py            # Specification management CLI
|   `---- resource/         # Metadata (spec kinds, components, versions)
|---- gen_diagrams/         # Python diagram generators
|---- kintsu/              # Git submodule: Kintsu compiler implementation
`---- public/              # Static assets
```

## Development Commands

All commands are run from the root of the project:

| Command                              | Action                                          |
| ------------------------------------ | ----------------------------------------------- |
| `bun install`                        | Install dependencies                            |
| `bun dev`                            | Start development server at `localhost:4321`    |
| `bun build`                          | Build production site to `./dist/`              |
| `bun preview`                        | Preview production build locally                |
| `bun format`                         | Format code with Biome                          |
| `python -m auto.doc spec-guide`      | Regenerate specification metadata               |
| `python -m auto.doc collect-refs`    | Collect cross-references between specifications |
| `python -m auto.doc normalize-ascii` | Normalize Unicode to ASCII in markdown files    |
| `python -m auto.doc new-spec`        | Create a new specification                      |
| `mise run regenerate`                | Run all automation tasks in sequence            |

## Specification Automation

This repository includes Python automation tools for managing specifications:

- **spec-guide** - Regenerate `kintsu.yaml` and `kintsu.json` with specification metadata
- **collect-refs** - Scan all specifications for cross-references and update `references.yaml`
- **normalize-ascii** - Convert Unicode box-drawing and special characters to ASCII equivalents
- **new-spec** - Create a new specification with proper frontmatter and structure
- **regenerate** (mise task) - Run all automation tasks in the correct order

Example creating a new RFC:

```bash
python -m auto.doc new-spec \
  --spec-kind=RFC \
  --title="New Feature Design" \
  --author=your-github-username \
  --components=compiler,parser
```

## Documentation Style

- **Canadian English** spelling (behaviour, colour, etc.)
- **No emojis** in specifications or formal documentation
- **Expressive Code** for syntax highlighting with titles, markers, and collapsible sections
- **Lowercase absolute paths** for spec links: `/specs/rfc/rfc-0001`

## Technology Stack

- **Astro** - Static site generator
- **Starlight** - Documentation theme
- **React** - UI components
- **Biome** - Code formatting
- **Python** - Specification automation
- **Bun** - JavaScript runtime and package manager

## License

See [LICENSE](LICENSE) for details.

## Links

- **Documentation:** [docs.kintsu.dev](https://docs.kintsu.dev)
- **Compiler:** [github.com/kintsu/kintsu](https://github.com/kintsu/kintsu)
- **Issues:** [github.com/kintsu/docs/issues](https://github.com/kintsu/docs/issues)
