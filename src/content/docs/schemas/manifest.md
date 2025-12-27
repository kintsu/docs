---
title: "Schema Manifest Format"
---

The `schema.toml` manifest declares package metadata, dependencies, and configuration. It must be placed at the root of your schema package.

## Basic Structure

```toml title="schema.toml"
version = "v1"

[package]
name = "abc-corp"
version = "0.1.0"
description = "Core types for ABC Corporation"
authors = [{ name = "alice", email = "alice@example.com" }]
license = "MIT"
homepage = "https://github.com/abc-corp/schemas"

[dependencies]
bar-corp = { path = "../bar-corp" }
common-types = { git = "https://github.com/abc-corp/common.git", ref = "v1.2.3" }
```

## Manifest Versions

### `version`

The current manifest version is `v1`, and is required as a top-level field.

## Package Section

### `name`

Package name in **kebab-case** (e.g., `abc-corp`, `my-types`). Must be 2-128 characters, containing only lowercase letters, numbers\*, and hyphens.

\* numbers are only permitted after the first character

> [!IMPORTANT]
> Package names use **kebab-case** in manifests but **snake_case** in imports. The compiler handles this conversion automatically.
>
> ```kintsu title="schema.toml" "abc-corp"
> name = "abc-corp"
> ```
>
> ```kintsu title="lib.ks" "abc_corp"
> use abc_corp::types;
> ```

### `version`

Semantic version following `MAJOR.MINOR.PATCH` format (e.g., `1.2.3`).

### `description`

Human-readable package description. Can be inline text or a path to a file:

```toml title="Description Options"
# Inline
description = "Core types for ABC Corporation"

# From file
description = { path = "README.md" }
```

### `authors`

List of package maintainers with optional email addresses:

```toml title="Authors Field"
authors = [
    { name = "Alice", email = "alice@example.com" },
    { name = "Bob" }
]
```

### `homepage`

Optional URL to project homepage or documentation.

### `license`

SPDX license identifier (e.g., `MIT`, `Apache-2.0`):

```toml title="License Field"
license = "MIT"
```

### `license_text`

Optional custom license text for non-standard licenses:

```toml title="Custom License Text"
license_text = """
Custom license terms...
"""
```

### `readme`

Optional README content, either inline or from a file:

```toml title="Readme Options"
# Inline content
readme = "This package provides core types..."

# From file
readme = { path = "README.md" }
```

## Dependencies

Dependencies are declared in the `[dependencies]` section using kebab-case names:

### Path Dependencies

Local filesystem paths (relative or absolute):

```toml title="Path Dependencies"
[dependencies]
bar-corp = { path = "../bar-corp" }
local-types = { path = "./vendor/types" }
```

> [!TIP]
> Use relative paths for path dependencies to keep your project portable across different machines and environments.

### Git Dependencies

Git repositories with tags or branches:

```toml title="Git Dependencies"
[dependencies]
common-types = { git = "https://github.com/org/common.git", tag = "v1.2.3" }
experimental = { git = "https://github.com/org/exp.git", branch = "main" }
```

### Registry Dependencies (Planned)

Remote registries with version constraints:

```toml title="Registry Dependencies"
[dependencies]
std-types = { version = "^1.0.0", registry = "https://registry.example.com" }
```

## Versioning and Compatibility

> [!NOTE]
> Breaking change detection is planned but not yet implemented. The rules below describe the intended behaviour.

### Semantic Versioning Rules

The compiler will enforce compatibility guarantees based on version changes:

#### **Patch Version** (`1.0.0` -> `1.0.1`)

- **Allowed**: documentation, internal refactoring
- **Not Allowed**: Any schema changes

Examples of valid patches:

- Documentation improvements
- Performance optimizations
- Internal implementation changes

#### **Minor Version** (`1.0.0` -> `1.1.0`)

- **Allowed**: Backward-compatible additions
- **Not Allowed**: Breaking changes

Examples of valid minor updates:

```kintsu title="Valid Minor Updates" ins="email?: str" ins="Pending = 3" ins=/operation update_user.*/
// YES - Adding optional fields
struct Message {
    id: i64,
    name: str,
    email?: str,  // New optional field
};

// YES - Adding new types
enum Status {
    Active = 1,
    Inactive = 2,
    Pending = 3,  // New variant
};

// YES - Adding new operations
operation create_user(name: str) -> User;
operation update_user(id: i64, name: str) -> User;  // New operation
```

#### **Major Version** (`1.0.0` -> `2.0.0`)

- **Allowed**: Any changes, including breaking changes

Examples requiring major version bump:

```kintsu title="Breaking Changes" del=/// name.*/ del="id: str" del="email: str" del=/// Inactive.*/
// NO - Removing fields
struct Message {
    id: i64,
    // name: str,  // REMOVED - breaking change
};

// NO - Changing field types
struct Message {
    id: str,  // Was i64 - breaking change
};

// NO - Making optional fields required
struct Message {
    id: i64,
    email: str,  // Was email?: str - breaking change
};

// NO - Removing enum variants
enum Status {
    Active = 1,
    // Inactive = 2,  // REMOVED - breaking change
};
```

> [!WARNING]
> Breaking changes require a major version bump. Consumers may need to update their code when upgrading across major versions.

### Version Constraints

Dependency version constraints will follow these patterns:

```toml title="Version Constraints"
[dependencies]
# Exact version
lib-a = "1.2.3"

# Compatible updates (^)
# ^1.2.3 allows >= 1.2.3 and < 2.0.0
lib-b = "^1.2.3"

# Minor updates (~)
# ~1.2.3 allows >= 1.2.3 and < 1.3.0
lib-c = "~1.2.3"

# Range
lib-d = ">=1.2.3, <2.0.0"
```

## File Configuration

Control which schema files are included:

```toml title="File Exclusions"
[files]
exclude = [
    "tests/**",
    "examples/**",
    "*.draft.ks"
]
```

## Complete Example

```toml title="schema.toml"
version = "v1"

[package]
name = "abc-corp"
version = "1.2.3"
description = { path = "README.md" }
authors = [
    { name = "Alice Johnson", email = "alice@abc.com" },
    { name = "Bob Smith" }
]
license = "Apache-2.0"
homepage = "https://github.com/abc-corp/schemas"

[dependencies]
bar-corp = { path = "../bar-corp" }
common-types = { git = "https://github.com/org/common.git", tag = "v2.1.0" }

[files]
exclude = ["tests/**"]
```

## Validation

The manifest is validated on load:

- Package name must be valid kebab-case
- Version must be valid semantic version
- URLs must be well-formed
- Paths must exist (for path dependencies)
- All required fields must be present

Validation errors are reported with clear messages pointing to the specific issue.

## References

- [RFC-0019](/specs/rfc/RFC-0019) - Package Manifest Format
- [SPEC-0018](/specs/spec/SPEC-0018) - Package Manifest Implementation
- [ERR-0011](/specs/err/ERR-0011) - Package Errors
