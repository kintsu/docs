---
title: "Workspace Manifest"
---

Workspaces allow you to manage multiple related Kintsu schemas within a single development environment. They use a **virtual manifest** model where all schema definitions are centralised in a single root `schema.toml`.

## When to Use Workspaces

Workspaces are ideal when you have:

- Multiple interconnected schemas that share common types
- Schemas that reference each other during development
- A need for coordinated versioning across related packages

## Workspace vs Package Manifest

A workspace is identified by the `resolver` field in `schema.toml`:

```toml title="schema.toml (workspace)"
# resolver identifies this as a workspace manifest
resolver = "v1"

[workspace]
name = "my-workspace"

[api.package]
name = "api"
version = "1.0.0"
```

```toml title="schema.toml (package)"
# version identifies this as a package manifest
version = "v1"

[package]
name = "my-schema"
version = "1.0.0"
```

## Basic Structure

```toml title="schema.toml"
resolver = "v1"

[workspace]
name = "my-workspace"
version = "1.0.0"

# Define workspace-wide dependencies
[workspace.dependencies]
external-types = "^2.0"

# Define packages using [alias.package]
[common.package]
name = "common"
version.workspace = true

[api.package]
name = "api"
version.workspace = true
path = "packages/api"

[api.dependencies]
common.workspace = true
external-types.workspace = true
```

## Workspace Table

The `[workspace]` table contains workspace-wide configuration:

| Field              | Type               | Required | Description                                  |
| ------------------ | ------------------ | -------- | -------------------------------------------- |
| `name`             | string             | No       | Workspace name for display purposes          |
| `description`      | string             | No       | Workspace description                        |
| `version`          | string             | No       | Inheritable version for members              |
| `version-resolver` | string             | No       | Version requirement for inter-workspace deps |
| `readme`           | string or { path } | No       | Inheritable readme                           |
| `license`          | string             | No       | Inheritable license identifier               |
| `license-text`     | string or { path } | No       | Inheritable license text                     |

## Package Members

Define packages using `[alias.package]` tables. The `alias` is a unique identifier within the workspace:

```toml title="schema.toml"
# The alias "common" defaults to path "./common"
[common.package]
name = "common"
version = "1.0.0"

# The alias "my-api" has explicit path
[my-api.package]
name = "api"
version.workspace = true
path = "packages/api"
```

| Field          | Type              | Required | Description                                              |
| -------------- | ----------------- | -------- | -------------------------------------------------------- |
| `name`         | string            | Yes      | Package name (for publishing and imports)                |
| `version`      | string or inherit | Yes      | Package version (semver) or `.workspace = true`          |
| `path`         | string            | No       | Relative path to schema directory (default: `./{alias}`) |
| `description`  | string            | No       | Package description (not inheritable)                    |
| `license`      | string or inherit | No       | License identifier or `.workspace = true`                |
| `license-text` | string or inherit | No       | License text or `.workspace = true`                      |
| `readme`       | string or inherit | No       | Readme content/path or `.workspace = true`               |
| `repository`   | string            | No       | Repository URL                                           |
| `keywords`     | array             | No       | Package keywords                                         |

## Workspace Inheritance

Members can inherit fields from the workspace using `.workspace = true`:

```toml title="schema.toml"
[workspace]
version = "1.0.0"
license = "MIT"
readme = { path = "./README.md" }

[api.package]
name = "api"
version.workspace = true      # Inherits "1.0.0"
license.workspace = true      # Inherits "MIT"
readme.workspace = true       # Inherits { path = "./README.md" }
```

> **Note:** `description` is **not inheritable** and must be specified per-package.

## Package Dependencies

Each package can have dependencies declared in `[alias.dependencies]`:

```toml title="schema.toml"
[api.package]
name = "api"
version = "1.0.0"

[api.dependencies]
# Reference workspace sibling by alias
common.workspace = true

# Inherit version from workspace.dependencies
external-types.workspace = true

# Override version requirement
other-api = { workspace = true, version = ">= 1.0.0" }

# Explicit external dependency
other-lib = "^2.0"
```

## Version Resolver

The `version-resolver` field specifies the version requirement used when one workspace member depends on another:

```toml title="schema.toml"
[workspace]
version = "1.0.0"
version-resolver = ">= 1.0.0, < 2.0.0"

[api-ext.dependencies]
# Resolves to: api = { path = "../api", version = ">= 1.0.0, < 2.0.0" }
api.workspace = true
```

If `version-resolver` is not specified, inter-workspace dependencies use the exact inherited version.

## Directory Structure

```text title="Workspace structure"
my-workspace/
├── schema.toml           # Single manifest with all definitions
├── schema.lock.toml      # Unified lockfile
├── README.md
├── LICENSE
├── common/               # Default path for "common" alias
│   └── schema/
│       └── *.ks
├── packages/
│   ├── api/              # Custom path for "api" package
│   │   └── schema/
│   │       └── *.ks
│   └── internal/
│       └── schema/
│           └── *.ks
└── target/               # Build artifacts
```

> **Note:** There are no `schema.toml` files in subdirectories. The workspace manifest is the single source of truth.

## Lockfile

Workspaces use a single `schema.lock.toml` at the workspace root:

```toml title="schema.lock.toml"
version = 1

[[package]]
name = "external-types"
version = "2.1.0"
source = "registry+https://registry.kintsu.dev"
checksum = "sha256:abc123..."

# Workspace members are not locked (they're local)
```

## CLI Commands

| Command            | Workspace Behaviour                      |
| ------------------ | ---------------------------------------- |
| `kintsu check`     | Compiles all schemas in dependency order |
| `kintsu update`    | Updates unified lockfile                 |
| `kintsu add <dep>` | Adds to workspace.dependencies           |
| `kintsu publish`   | Publishes specified schema only          |
| `kintsu inspect`   | Shows all derived manifests              |

```bash title="Workspace commands"
# Compile all schemas in dependency order
kintsu check

# Compile specific schema and its dependencies
kintsu check --schema api

# View derived manifest for a package
kintsu inspect --schema api
```

## Complete Example

```toml title="schema.toml" collapse={13-26}
resolver = "v1"

[workspace]
name = "my-project"
version = "1.0.0"
version-resolver = ">= 1.0.0, < 2.0.0"
license = "MIT"
readme = { path = "./README.md" }

[workspace.dependencies]
validation = "^2.0"
uuid-types = { version = "^1.0", registry = "corp" }

[common.package]
name = "common"
version.workspace = true
description = "Shared types used across all schemas"
license.workspace = true

[api.package]
name = "api"
version.workspace = true
path = "packages/api"
description = "Public API schema definitions"
license.workspace = true

[api.dependencies]
common.workspace = true
validation.workspace = true

[internal.package]
name = "internal"
version.workspace = true
path = "packages/internal"
description = "Internal service schemas"
license.workspace = true

[internal.dependencies]
common.workspace = true
api.workspace = true
uuid-types.workspace = true
```

## Constraints

- **Nested workspaces are not allowed.** A subdirectory cannot contain another workspace.
- **Schema paths cannot escape the workspace root.** Paths like `../external` are invalid.
- **Package names must be unique.** No two packages can have the same `name` field.
- **Aliases must be unique.** No two packages can use the same alias.

## References

- [RFC-0024](/specs/rfc/RFC-0024) - Workspace Manifest Format
- [RFC-0019](/specs/rfc/RFC-0019) - Package Manifest Format
- [ERR-0015](/specs/err/ERR-0015) - Workspace Errors
