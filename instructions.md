# Kintsu Compiler Documentation Generation Plan

## Agent Context

You are a senior language design expert who helped design the Rust programming language. With your extensive experience designing and documenting language specifications, apply your expertise to documenting the Kintsu type system and compiler implementation. This documentation represents a contractual set of specifications providing clear contracts between the compiler and developers.

**Critical Guidelines:**

- Write factually and precisely — no emojis, no speculation.
- Specifications describe public contracts and behavior. When authoring RFC/TSY/SPEC documents, prefer describing the messaging/transit protocol and the type-system contracts rather than internal code-layouts. Implementation details (source code snippets, private APIs) must NOT be copied into specs; describe behavior and algorithms only.
- Use `SPEC` documents when you need to describe deterministic compiler/runtime behavior that implementers must follow. RFC/TSY documents are higher-level: RFC = design rationale; TSY = normative type-system rules; SPEC = precise resolution/validation algorithms.
- Always keep this checklist up to date as you progress.
- Every specification must be accurate and verifiable against the codebase (use source files for understanding only — do not paste source into docs).
- Cross-reference related specifications for coherence and make cross-links bidirectional where possible.
- Generate diagrams following `.github/prompts/diagram.md` when specifications require visual representation.
- Review existing documentation in `docs/src/` for context and consistency before making changes.

**Formatting and Structure Best Practices:**

- Use proper heading hierarchy: `##` for major sections, `###` for enumerated specification details (not numbered lists)
- Convert numbered rule lists (1, 2, 3...) to `###` subheadings under normative sections
- Use GitHub-style admonitions for important callouts:
  - `> [!NOTE]` for supplementary information and clarifications
  - `> [!IMPORTANT]` for critical implementation requirements and key algorithms
  - `> [!WARNING]` for edge cases, validation failures, and potential pitfalls
- Use **bold** for examples, key concepts, and section labels within paragraphs
- Ensure code blocks use proper language tags (`kintsu`, `json`, `rust`)
- Maintain consistent spacing: blank lines around code blocks, lists, and admonitions
- Structure normative sections clearly:
  - TSY: "Type system rules (normative)" with `###` subheadings for each rule
  - SPEC: "Deterministic compilation rules (normative)" with `###` subheadings for each rule
  - RFC: Use `###` subheadings under "Specification" and "Rationale" sections
- Ensure examples follow the correct syntax. Statements in `kintsu` **must** end with a semicolon. Syntax is described in `docs/src/syntax`.

## Documentation Order

Specifications are generated in a specific order to reflect the RFC process and ensure proper documentation flow:

1. **RFC (Request for Comments)** - Anyone can submit an RFC. It should be well thought out and descriptive. Upon acceptance by the core team, the following specifications are created:
2. **TSY (Type System)** - If applicable, core team designs the type system implementation
3. **AD (Architecture Decision)** - If applicable, core team designs architecture decisions for the specification
4. **SPEC (Technical Specification)** - Core team designs technical specification outlining behavior and expectations of the implementation

## Core Types & Features to Document

### 1. Builtin Types (STATUS: RFC-0001 / TSY-0001 / SPEC-0001 completed)

**Location:** `parser/src/ast/ty.rs` (for understanding)
**Authoritative builtin list:** `docs/src/syntax/builtin.md` (this is the single source-of-truth for which builtins exist)

Key, agreed canonical transit decisions (record these here so subsequent spec authors follow them):

- datetime: canonical transit representation is ISO-8601 textual strings including timezone information (e.g. 2024-05-01T12:34:56Z). Spec documents MUST state that the canonical transit form is textual ISO-8601; wire/profiles may accept alternate encodings but MUST document those encodings explicitly.
- complex: canonical transit representation is an object with numeric fields `{ "real": <f64>, "imag": <f64> }` unless a wire/profile documents an alternate canonical form. Examples should include both positive and negative parts and zero values.
- binary / bytes: on binary transports, raw bytes are canonical; on textual transports, Base64 (RFC-4648) is canonical. A `base64` textual builtin has been added to the specs to capture textual-first representations; compiler implementation is pending.
- integers: the specs permit multiple wire/profile encodings (fixed-size, varint, compact) — the SPEC and the wire/profile must document the encoding used. For deterministic interchange, recommend fixed-size integer encodings in the wire/profile.
- float special values (NaN, +Inf, -Inf): representation is determined by the transit protocol/wire-format (e.g. JSON's NaN handling or a binary protocol's IEEE 754 bits) and MUST be documented by each wire/profile. The specs require implementers to document how special floating values are transported by their profile.

#### Existing Spec artifacts (created)

- `docs/src/specs/rfc/RFC-0001.md` — motivation, rationale and recommended transit forms (non-normative).
- `docs/src/specs/tsy/TSY-0001.md` — normative type-system rules and validation semantics for builtins.
- `docs/src/specs/spec/SPEC-0001.md` — deterministic resolution and validation rules (normative for compiler behavior).

When authoring future builtin-related specs or examples, reference the canonical rules above and the authoritative builtin list in `docs/src/syntax/builtin.md`.

Diagrams: none required for the builtin docs beyond small example snippets; add example test vectors under `docs/src/specs/examples/` when creating acceptance tests.

### 2. Struct Types

**Location:** `parser/src/ast/strct.rs`
**Description:** Named struct definitions with fields
**Existing Docs:** `docs/src/types/struct.md`

#### Specifications Needed

- [ ] **RFC-0002**: Struct Type Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Struct Type Design" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0002.md`
  - Content: Design decisions for struct syntax, field ordering, naming conventions, rationale for design choices
  - Source References: `parser/src/ast/strct.rs` (for understanding)
  - Existing Docs: `docs/src/types/struct.md`
  - Diagrams Required: None

- [ ] **TSY-0002**: Struct Type System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Struct Types" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0002.md`
  - Content: Struct syntax, field definitions, type annotations, validation rules, constraints
  - Source References: `parser/src/ast/strct.rs` (for understanding)
  - Related Specs: RFC-0002
  - Existing Docs: `docs/src/types/struct.md`
  - Diagrams Required:
    - Struct definition syntax diagram showing components (name, fields, metadata, documentation)

- [ ] **SPEC-0002**: Struct Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Struct Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0002.md`
  - Content: Describe struct registration behavior, field resolution process, circular dependency detection algorithm
  - Source References: `parser/src/ctx/compile/schema_compiler.rs` (for understanding)
  - Related Specs: TSY-0002, RFC-0002
  - Diagrams Required:
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)
    - Struct compilation flow diagram showing registration → field resolution → validation phases

### 3. Anonymous Struct Types

**Location:** `parser/src/ast/anonymous.rs`
**Description:** Inline struct definitions without explicit names
**Existing Docs:** `docs/src/types/struct.md` (includes anonymous structs)

#### Specifications Needed

- [ ] **RFC-0003**: Support Anonymous Structs
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Support Anonymous Structs" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0003.md`
  - Content: Motivation for anonymous structs, use cases, design constraints, comparison with named structs
  - Source References: `parser/src/ast/anonymous.rs` (for understanding)
  - Related Specs: RFC-0002, TSY-0002
  - Existing Docs: `docs/src/types/struct.md`
  - Diagrams Required: None

- [ ] **TSY-0003**: Anonymous Struct Types
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Anonymous Structs" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0003.md`
  - Content: Syntax for anonymous structs, type inference rules, name generation algorithm, scope rules
  - Source References: `parser/src/ast/anonymous.rs` (for understanding)
  - Related Specs: RFC-0003, TSY-0002
  - Existing Docs: `docs/src/types/struct.md`
  - Diagrams Required:
    - Anonymous struct extraction diagram showing inline definition → name generation → registration

- [ ] **SPEC-0003**: Anonymous Struct Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Anonymous Struct Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0003.md`
  - Content: Describe name generation algorithm behavior, extraction phase process, registration steps
  - Source References: `parser/src/ctx/resolve/anonymous.rs` (for understanding)
  - Related Specs: TSY-0003, RFC-0003, SPEC-0002
  - Diagrams Required:
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)

### 4. Enum Types

**Location:** `parser/src/ast/enm.rs`
**Description:** Enumeration types with variants
**Existing Docs:** `docs/src/types/enum.md`

#### Specifications Needed

- [ ] **RFC-0004**: Enum Type Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Enum Type Design" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0004.md`
  - Content: Design rationale for enum variants, discriminant assignment strategy, string vs integer enums justification
  - Source References: `parser/src/ast/enm.rs` (for understanding)
  - Existing Docs: `docs/src/types/enum.md`
  - Diagrams Required: None

- [ ] **TSY-0004**: Enum Type System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Enum Types" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0004.md`
  - Content: Enum syntax, variant definitions, discriminant values, string enums vs integer enums, constraints
  - Source References: `parser/src/ast/enm.rs` (for understanding)
  - Related Specs: RFC-0004
  - Existing Docs: `docs/src/types/enum.md`
  - Diagrams Required:
    - Enum variant types diagram showing different variant styles (unit, typed, string)

- [ ] **SPEC-0004**: Enum Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Enum Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0004.md`
  - Content: Describe enum registration process, discriminant validation behavior, duplicate detection algorithm
  - Source References: `parser/src/ctx/compile/schema_compiler.rs` (for understanding)
  - Related Specs: TSY-0004, RFC-0004
  - Diagrams Required:
    - Enum value determination (int or str, and then which discriminant if int)
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)

### 5. Error Types

**Location:** `parser/src/ast/err.rs`
**Description:** Error definitions with variants
**Existing Docs:** `docs/src/types/errors.md`

#### Specifications Needed

- [ ] **RFC-0005**: Error Type Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Error Type Design" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0005.md`
  - Content: Design motivation for structured errors, relationship to operations, error metadata system justification
  - Source References: `parser/src/ast/err.rs`, `parser/src/ast/meta.rs` (for understanding)
  - Related Specs: RFC-0009 (Operations)
  - Existing Docs: `docs/src/types/errors.md`
  - Diagrams Required: None

- [ ] **TSY-0005**: Error Type System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Error Types" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0005.md`
  - Content: Error syntax, variant structure, field definitions, error metadata attributes
  - Source References: `parser/src/ast/err.rs` (for understanding)
  - Related Specs: RFC-0005, TSY-0012 (Metadata)
  - Existing Docs: `docs/src/types/errors.md`
  - Diagrams Required:
    - Error type structure diagram showing error name, variants, fields, metadata

- [ ] **SPEC-0005**: Error Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Error Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0005.md`
  - Content: Describe error registration process, variant resolution behavior, error metadata resolution algorithm
  - Source References: `parser/src/ctx/resolve/metadata.rs` (for understanding)
  - Related Specs: TSY-0005, RFC-0005, SPEC-0012
  - Diagrams Required:
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)
    - Error resolution flow diagram showing registration → variant validation → metadata resolution

### 6. Type Aliases

**Location:** `parser/src/ast/ty_def.rs`
**Description:** Named type aliases
**Existing Docs:** `docs/src/types/type.md`

#### Specifications Needed

- [ ] **RFC-0006**: Type Alias Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Type Alias Design" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0006.md`
  - Content: Motivation for type aliases, design decisions, comparison with other languages, use cases
  - Source References: `parser/src/ast/ty_def.rs` (for understanding)
  - Existing Docs: `docs/src/types/type.md`
  - Diagrams Required: None

- [ ] **TSY-0006**: Type Alias System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Type Aliases" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0006.md`
  - Content: Type alias syntax, resolution rules, circular dependency prevention, constraints
  - Source References: `parser/src/ast/ty_def.rs` (for understanding)
  - Related Specs: RFC-0006
  - Existing Docs: `docs/src/types/type.md`
  - Diagrams Required:
    - Type alias resolution chain diagram showing alias → resolution → target type

- [ ] **SPEC-0006**: Type Alias Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Type Alias Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0006.md`
  - Content: Describe alias resolution algorithm behavior, cycle detection process, topological ordering
  - Source References: `parser/src/ctx/resolve/aliases.rs` (for understanding)
  - Related Specs: TSY-0006, RFC-0006
  - Diagrams Required:
    - Alias resolution flow diagram showing detection → ordering → resolution
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)

### 7. Union Types

**Location:** `parser/src/ast/union.rs`
**Description:** Union type expressions (A & B)
**Existing Docs:** `docs/src/types/union.md`

#### Specifications Needed

- [ ] **RFC-0007**: Union Type Support
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Union Type Support" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0007.md`
  - Content: Motivation for union types, use cases, design constraints, comparison with oneOf
  - Source References: `parser/src/ast/union.rs` (for understanding)
  - Existing Docs: `docs/src/types/union.md`
  - Diagrams Required: None

- [ ] **TSY-0007**: Union Type System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Union Types" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0007.md`
  - Content: Union syntax, member resolution, field merging rules, discriminant handling
  - Source References: `parser/src/ast/union.rs` (for understanding)
  - Related Specs: RFC-0007, TSY-0008 (OneOf)
  - Existing Docs: `docs/src/types/union.md`
  - Diagrams Required:
    - Union field merging diagram showing TypeA & TypeB → merged fields

- [ ] **SPEC-0007**: Union Type Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Union Type Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0007.md`
  - Content: Describe union identification process, member validation behavior, struct generation, field merging algorithm
  - Source References: `parser/src/ctx/resolve/unions.rs` (for understanding)
  - Related Specs: TSY-0007, RFC-0007
  - Diagrams Required:
    - Union compilation flow diagram showing identification → validation → merging → struct generation
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)

### 8. OneOf Types

**Location:** `parser/src/ast/one_of.rs`
**Description:** Discriminated union types
**Existing Docs:** `docs/src/types/oneof.md`

#### Specifications Needed

- [ ] **RFC-0008**: OneOf Type Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="OneOf Type Design" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0008.md`
  - Content: Design rationale for OneOf, comparison with union types, use cases, discriminant strategy
  - Source References: `parser/src/ast/one_of.rs` (for understanding)
  - Related Specs: RFC-0007 (Union)
  - Existing Docs: `docs/src/types/oneof.md`
  - Diagrams Required: None

- [ ] **TSY-0008**: OneOf Type System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="OneOf Types" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0008.md`
  - Content: OneOf syntax, variant structure, discriminant handling, anonymous vs named
  - Source References: `parser/src/ast/one_of.rs` (for understanding)
  - Related Specs: RFC-0008, TSY-0007
  - Existing Docs: `docs/src/types/oneof.md`
  - Diagrams Required:
    - OneOf discriminated union structure diagram showing variants with discriminant field

- [ ] **SPEC-0008**: OneOf Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="OneOf Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0008.md`
  - Content: Describe OneOf registration process, variant validation behavior, anonymous OneOf handling
  - Source References: `parser/src/ctx/compile/schema_compiler.rs` (for understanding)
  - Related Specs: TSY-0008, RFC-0008
  - Diagrams Required:
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)

### 9. Operation Types

**Location:** `parser/src/ast/op.rs`
**Description:** Operation definitions with parameters and return types
**Existing Docs:** `docs/src/types/operation.md`

#### Specifications Needed

- [ ] **RFC-0009**: Operation Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Operation Design" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0009.md`
  - Content: Design motivation for operations, error handling strategy, metadata integration, RPC patterns
  - Source References: `parser/src/ast/op.rs` (for understanding)
  - Related Specs: RFC-0005 (Errors)
  - Existing Docs: `docs/src/types/operation.md`
  - Diagrams Required: None

- [ ] **TSY-0009**: Operation Type System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Operations" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0009.md`
  - Content: Operation syntax, parameter definitions, return types, error handling (!) operator
  - Source References: `parser/src/ast/op.rs` (for understanding)
  - Related Specs: RFC-0009, TSY-0005
  - Existing Docs: `docs/src/types/operation.md`
  - Diagrams Required:
    - Operation flow diagram showing parameters → processing → return type/error

- [ ] **SPEC-0009**: Operation Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Operation Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0009.md`
  - Content: Describe operation registration process, parameter resolution behavior, error type resolution
  - Source References: `parser/src/ctx/resolve/metadata.rs` (for understanding)
  - Related Specs: TSY-0009, RFC-0009, SPEC-0005
  - Diagrams Required:
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)

### 10. Namespace System

**Location:** `parser/src/ast/namespace.rs`, `parser/src/ctx/namespace.rs`
**Description:** Namespace declarations and organization
**Existing Docs:** `docs/src/types/namespace.md`

#### Specifications Needed

- [ ] **RFC-0010**: Namespace System Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Namespace System" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0010.md`
  - Content: Motivation for namespace system, file organization, module structure, comparison with other languages
  - Source References: `parser/src/ast/namespace.rs` (for understanding)
  - Existing Docs: `docs/src/types/namespace.md`
  - Diagrams Required: None

- [ ] **TSY-0010**: Namespace Type System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Namespaces" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0010.md`
  - Content: Namespace syntax, declaration rules, flat vs nested namespaces, spanned namespaces
  - Source References: `parser/src/ast/namespace.rs` (for understanding)
  - Related Specs: RFC-0010
  - Existing Docs: `docs/src/types/namespace.md`
  - Diagrams Required:
    - Namespace hierarchy diagram showing package → namespace → types organization

- [ ] **SPEC-0010**: Namespace Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Namespace Compilation" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0010.md`
  - Content: Describe namespace loading process, file resolution behavior, dependency graph, compilation order
  - Source References: `parser/src/ctx/namespace.rs`, `parser/src/ctx/schema.rs` (for understanding)
  - Related Specs: TSY-0010, RFC-0010
  - Diagrams Required:
    - Namespace compilation flow diagram showing discovery → loading → ordering → compilation
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)

### 11. Import System

**Location:** `parser/src/ast/import.rs`
**Description:** Use statements and import resolution
**Existing Docs:** `docs/src/types/use.md`

#### Specifications Needed

- [ ] **RFC-0011**: Import System Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Import System" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0011.md`
  - Content: Design motivation for import system, syntax choices, resolution strategy, cross-package imports
  - Source References: `parser/src/ast/import.rs` (for understanding)
  - Related Specs: RFC-0010 (Namespace)
  - Existing Docs: `docs/src/types/use.md`
  - Diagrams Required: None

- [ ] **TSY-0011**: Import System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Imports" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0011.md`
  - Content: Import syntax, qualified imports, wildcard imports, path resolution
  - Source References: `parser/src/ast/import.rs` (for understanding)
  - Related Specs: RFC-0011, TSY-0010
  - Existing Docs: `docs/src/types/use.md`
  - Diagrams Required:
    - Import resolution flow diagram showing use statement → path resolution → type lookup

- [ ] **SPEC-0011**: Import Resolution
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Import Resolution" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0011.md`
  - Content: Describe import resolution algorithm, namespace lookup process, cross-schema imports, error handling
  - Source References: `parser/src/ctx/namespace.rs`, `parser/src/ctx/compile/resolver.rs` (for understanding)
  - Related Specs: TSY-0011, RFC-0011, SPEC-0010
  - Diagrams Required:
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)
    - Reuse diagram from TSY-0011

### 12. Metadata System

**Location:** `parser/src/ast/meta.rs`
**Description:** Version and error metadata annotations
**Existing Docs:** `docs/src/syntax/keywords.md` (includes metadata)

#### Specifications Needed

- [ ] **RFC-0012**: Metadata System Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Metadata System" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/rfc/RFC-0012.md`
  - Content: Design motivation for metadata, version tracking rationale, error type defaults strategy
  - Source References: `parser/src/ast/meta.rs` (for understanding)
  - Existing Docs: `docs/src/syntax/keywords.md`
  - Diagrams Required: None

- [ ] **TSY-0012**: Metadata System
  - Command: `python -m docs.auto.doc new-spec --spec-kind=TSY --title="Metadata" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/tsy/TSY-0012.md`
  - Content: Metadata syntax, inner vs outer attributes, version metadata, error metadata
  - Source References: `parser/src/ast/meta.rs` (for understanding)
  - Related Specs: RFC-0012
  - Existing Docs: `docs/src/syntax/keywords.md`
  - Diagrams Required:
    - Metadata inheritance diagram showing namespace → type → field metadata flow

- [ ] **SPEC-0012**: Metadata Resolution
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Metadata Resolution" --author=joshua-auchincloss --components=compiler --components=parser`
  - Output: `docs/src/specs/spec/SPEC-0012.md`
  - Content: Describe metadata inheritance rules, resolution order, default values, validation behavior
  - Source References: `parser/src/ctx/resolve/metadata.rs` (for understanding)
  - Related Specs: TSY-0012, RFC-0012
  - Diagrams Required:
    - Entity relation diagram showing the logical AST hierarchy (ignore spans etc)

### 13. Type Resolution System

**Location:** `parser/src/ctx/resolve/`
**Description:** Multi-phase type resolution and validation
**Existing Docs:** `docs/src/compiler/instructions.md`, `docs/src/compiler/instructions-steps.md`

#### Specifications Needed

- [ ] **RFC-0013**: Type Resolution Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Type Resolution Design" --author=joshua-auchincloss --components=compiler`
  - Output: `docs/src/specs/rfc/RFC-0013.md`
  - Content: Design motivation for multi-phase resolution, rationale for phase ordering, dependency management strategy
  - Source References: `parser/src/ctx/resolve/mod.rs` (for understanding)
  - Existing Docs: `docs/src/compiler/instructions.md`, `docs/src/compiler/instructions-steps.md`
  - Diagrams Required: None

- [ ] **AD-0001**: Type Resolution Architecture
  - Command: `python -m docs.auto.doc new-spec --spec-kind=AD --title="Type Resolution Architecture" --author=joshua-auchincloss --components=compiler`
  - Output: `docs/src/specs/ad/AD-0001.md`
  - Content: High-level architecture for type resolution, phase design, dependency management, extensibility
  - Source References: `parser/src/ctx/resolve/` (for understanding)
  - Related Specs: RFC-0013
  - Existing Docs: `docs/src/compiler/instructions.md`
  - Diagrams Required:
    - Type resolution architecture diagram showing all phases and their dependencies
    - Phase ordering diagram showing sequential execution with phase numbers

- [ ] **SPEC-0013**: Type Resolution Phases
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Type Resolution Phases" --author=joshua-auchincloss --components=compiler`
  - Output: `docs/src/specs/spec/SPEC-0013.md`
  - Content: Detailed description of each resolution phase (1-8), order, dependencies, inputs/outputs
  - Source References: `parser/src/ctx/resolve/mod.rs` (for understanding)
  - Related Specs: AD-0001, RFC-0013
  - Existing Docs: `docs/src/compiler/instructions-steps.md`
  - Diagrams Required:
    - Detailed phase flow diagram for each phase showing inputs → processing → outputs; include subgraphs / follow large graph rules.

### 14. Schema Compilation System

**Location:** `parser/src/ctx/compile/`
**Description:** Multi-schema parallel compilation
**Existing Docs:** `docs/src/compiler/instructions.md`

#### Specifications Needed

- [ ] **RFC-0014**: Parallel Compilation Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Parallel Compilation Design" --author=joshua-auchincloss --components=compiler`
  - Output: `docs/src/specs/rfc/RFC-0014.md`
  - Content: Design motivation for parallel compilation, performance goals, dependency management rationale
  - Source References: `parser/src/ctx/compile/` (for understanding)
  - Existing Docs: `docs/src/compiler/instructions.md`
  - Diagrams Required: None

- [ ] **AD-0002**: Parallel Compilation Architecture
  - Command: `python -m docs.auto.doc new-spec --spec-kind=AD --title="Parallel Compilation Architecture" --author=joshua-auchincloss --components=compiler`
  - Output: `docs/src/specs/ad/AD-0002.md`
  - Content: High-level architecture for parallel compilation, dependency graphs, topological ordering, concurrency model
  - Source References: `parser/src/ctx/compile/`, `parser/src/ctx/graph/` (for understanding)
  - Related Specs: RFC-0014, AD-0001
  - Existing Docs: `docs/src/compiler/instructions.md`
  - Diagrams Required:
    - Parallel compilation architecture diagram showing scheduler → workers → results
    - Dependency graph diagram showing package dependencies and compilation order

- [ ] **SPEC-0014**: Schema Compilation
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Schema Compilation" --author=joshua-auchincloss --components=compiler`
  - Output: `docs/src/specs/spec/SPEC-0014.md`
  - Content: Describe schema-level compilation process, namespace ordering behavior, type registration
  - Source References: `parser/src/ctx/compile/schema_compiler.rs` (for understanding)
  - Related Specs: AD-0002, RFC-0014
  - Diagrams Required:
    - Schema compilation flow diagram showing loading → ordering → compilation → registration

### 15. Type Registry System

**Location:** `parser/src/ctx/registry.rs`
**Description:** Global type registry and resolution
**Existing Docs:** `docs/src/compiler/instructions.md`

#### Specifications Needed

- [ ] **RFC-0015**: Type Registry Design
  - Command: `python -m docs.auto.doc new-spec --spec-kind=RFC --title="Type Registry Design" --author=joshua-auchincloss --components=compiler`
  - Output: `docs/src/specs/rfc/RFC-0015.md`
  - Content: Design motivation for centralized type registry, lookup strategy, caching rationale
  - Source References: `parser/src/ctx/registry.rs` (for understanding)
  - Existing Docs: `docs/src/compiler/instructions.md`
  - Diagrams Required: None

- [ ] **SPEC-0015**: Type Registry
  - Command: `python -m docs.auto.doc new-spec --spec-kind=SPEC --title="Type Registry" --author=joshua-auchincloss --components=compiler`
  - Output: `docs/src/specs/spec/SPEC-0015.md`
  - Content: Describe registry structure, type lookup algorithm, caching behavior, cross-schema resolution
  - Source References: `parser/src/ctx/registry.rs` (for understanding)
  - Related Specs: RFC-0015, AD-0001, AD-0002
  - Diagrams Required:
    - Type registry structure diagram showing registry → namespaces → types hierarchy
    - Type lookup flow diagram showing query → cache check → resolution → cache update

## Documentation Workflow

For each feature, follow this workflow:

1. **Generate Specifications** (in order: RFC → TSY → AD (if applicable) → SPEC)
   - Run the command exactly as specified
   - Verify the output file was created in the correct location
   - Check that the YAML front matter is correct

2. **Review Source Code**
   - Read the referenced source files thoroughly (marked "for understanding")
   - Understand the implementation details
   - Note any edge cases or special handling
   - **Do not copy implementation code into documentation**

3. **Review Existing Documentation**
   - Read all referenced existing docs in `docs/src/`
   - Ensure consistency with current documentation
   - Note any areas that need clarification or expansion

4. **Generate Diagrams** (if required)
   - Follow `.github/prompts/diagram.md` instructions
   - Use Python `diagrams` library
   - Output to `docs/diagrams/{spec-type}/`
   - Generate subgraphs for complex diagrams
   - Run `python -m gen_diagrams.{diagram_name}` to generate PNG
   - Embed diagrams in specification using relative paths

5. **Populate Specification**
   - Fill in all required sections per the template
   - Use precise technical language
   - Describe behavior, algorithms, and contracts (not implementation)
   - Include conceptual code examples showing usage (not implementation)
   - Cross-reference related specifications
   - Embed generated diagrams where specified

6. **Validation**
   - Verify all claims against the codebase
   - Ensure consistency with related specifications
   - Check for completeness of coverage
   - Verify diagrams accurately represent the system

7. **Update Checklist**
   - Mark the specification as complete in this file
   - Add any discovered dependencies or follow-up items

## Progress Tracking

Update this section as you complete each specification. The current state reflects work completed during the builtin-types effort.

### Completed Specifications

- RFC-0001 Builtin Type System Design — created and populated (non-normative rationale and recommended transit forms).
- TSY-0001 Builtin Types — created and populated (normative type-system rules and validation semantics).
- SPEC-0001 Builtin Type Resolution — created and populated (deterministic resolution and validation rules for the compiler).

### In Progress

- None currently open for builtin types.

### Blocked / Pending Items (actionable)

- `base64` builtin: recorded in specs; compiler/runtime support pending. Action: add `base64` to `docs/src/syntax/builtin.md` (authoritative list) and then implement in parser/runtime when ready.
- Markdown linter warnings: some generated templates produced MD025/MD029 (multiple top-level headings and list-numbering issues). Run a targeted markdown-format/lint pass after populating content.

### Recommended next steps (pick one):

1. Update the authoritative builtin list: add `base64` to `docs/src/syntax/builtin.md` (small, low-risk change). This keeps docs consistent.
2. Run a markdown lint/format pass (fix MD025/MD029 in the edited spec files). Prefer minimal, manual fixes to preserve template structure.
3. Add example/test vectors for `datetime`, `complex`, and `base64` under `docs/src/specs/examples/` (these become baseline acceptance tests for code generators).
4. Sweep other spec docs to replace remaining "code-generator" phrasing with wording that the spec defines the messaging/transit protocol and that implementers (code-gen/runtime) must document their mappings.

If you want the agent to proceed autonomously, pick the desired next step and the agent will (a) update the todo, (b) make the change, and (c) run a quick validation (file exists, basic lint) before reporting back.

## Notes

- All specifications must be reviewed for accuracy.
- Cross-references must be bidirectional where applicable.
- Code examples should show usage patterns, not implementation details.
- Each specification should be self-contained but reference related specs.
- Diagrams should be reused across specifications when appropriate.
- Always describe "what" and "how it behaves"; "how it's implemented" matters only in `SPEC` documents.

## Notes / Historical issues

- Doc-generator YAML serialization: an earlier run failed when a metadata enum/status object was embedded in spec metadata; the generator's representer raised an error. Avoid non-serializable objects in front-matter. If you see a representer/serialize error, inspect the CLI call that generated the spec and ensure metadata values are plain strings or basic containers.
- The repo contains an authoritative builtin list at `docs/src/syntax/builtin.md`. The spec files were updated to include `base64` as a planned textual-first builtin; the compiler implementation is intentionally deferred to the developer.
- NaN/Infinity handling is explicitly wire/profile-dependent. Specs should not attempt to mandate a JSON-only or binary-only representation; require wire/profile docs to document their chosen representation.
