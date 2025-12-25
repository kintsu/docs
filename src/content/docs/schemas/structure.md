---
title: "Project Structure"
---

Schema packages follow a conventional directory layout with `lib.ks` as the entry point and flexible namespace organization.

## Directory Layout

```txts
my-package/
 |--- schema.toml           # Package manifest
 |--- schema/               # Schema source directory
     |--- lib.ks            # Entry point (required)
     |--- types.ks          # Flat namespace file
     |--- errors.ks         # Flat namespace file
     |--- api/              # Nested namespace directory
         |--- users.ks
         |--- auth.ks
```

## The Entry Point: `lib.ks`

Every schema package **must** have a `schema/lib.ks` file. This is the entry point the compiler loads first.

> [!IMPORTANT]
> The `schema/lib.ks` file is required. Compilation will fail without it.

### Root Namespace Declaration

`lib.ks` declares the package's root namespace, which matches the package name in snake_case:

```kintsu
# abc-corp/lib.ks
// In abc-corp package
namespace abc_corp;

use types;
use errors;
use api;
```

The namespace name must match the package name converted to snake_case:

- Package: `abc-corp` -> Namespace: `abc_corp`
- Package: `my-types` -> Namespace: `my_types`

Package names are normalized to kebab-case publicly, and snake_case package names are rejected by registries.

> [!WARNING]
> The root namespace must match your package name in snake_case. Mismatches will cause compilation errors.

### Scoped Namespaces

`lib.ks` can also define scoped child namespaces inline:

```kintsu
namespace abc_corp;

namespace config {
    #![version(1)]

    struct Settings {
        api_key: str,
        timeout: i32
    };
};

namespace utils {
    #![version(1)]

    enum StatusCode {
        Ok = 200
    };
};
```

These create nested namespaces like `abc_corp::config` and `abc_corp::utils`.

## Namespace Organization

There are two ways to organize namespaces beyond `lib.ks`:

> [!TIP]
> Choose flat files for small schemas and nested directories for larger, complex projects. You can also mix both approaches.

### 1. Flat Namespace Files (`name.ks`)

Create a file named after the namespace at the root of `schema/`:

```txt
schema/
 |--- lib.ks
 |--- types.ks    # Defines "types" namespace
 |--- errors.ks   # Defines "errors" namespace
```

**`types.ks`:**

```kintsu
namespace types;

struct User {
    id: i64,
    name: str,
};

struct Message {
    id: i64,
    content: str,
};
```

**`lib.ks` imports it:**

```kintsu
namespace abc_corp;

use types;  // Imports types.ks
```

**Usage in other files:**

```kintsu
use abc_corp::types;

struct Post {
    author: types::User,
    message: types::Message,
};
```

### 2. Nested Namespace Directories (`namespace/sub.ks`)

Create a directory named after the namespace with `.ks` files inside:

```txt
schema/
 |--- lib.ks
 |--- api/              # "api" namespace directory
     |--- users.ks     # Defines types in "api" namespace
     |--- auth.ks      # More types in "api" namespace
     |--- meta.ks      # Consider adding a meta.ks to store your namespace version, error type, etc.
     |--- posts.ks

```

**`api/meta.ks`**

```kintsu
# api/meta.ks
// all items in our namespace are tagged version 1 unless overridden, and use schema::Error for return types
#![version(1)]
#![err(schema::error::Error)]
namespace api;
```

**`api/users.ks`:**

```kintsu
namespace api;

struct User {
    id: i64,
    username: str,
};

// get user by id and return a user result (error defined in meta.ks)
operation get_user(id: i64) -> User!;
```

**`api/auth.ks`:**

```kintsu
namespace api;

struct AuthToken {
    token: str,
    expires: i64,
};

operation login(code: str) -> AuthToken!;
```

**`lib.ks` imports the namespace:**

```kintsu
namespace abc_corp;

use api;  // Declares the namespace per the files within api/ directory

namespace error {  // our errors
    error Error {
        LoginError { cause: str },
        UserNotFound { id: i64 },
    };
};
```

All definitions in `api/users.ks` and `api/auth.ks` are part of the `api` namespace and accessible as `abc_corp::api::User`, `abc_corp::api::AuthToken`, etc.

## Namespace Resolution Rules

The compiler resolves namespaces in this order:

1. **Inline scoped namespaces** in `lib.ks`
2. **Flat namespace files** (`name.ks`)
3. **Nested namespace directories** (`name/`)

> [!NOTE]
> If a namespace is defined in multiple places (e.g., both `types.ks` and `types/`), the compiler will report an error.

### Example: Mixed Organization

```txt
schema/
 |--- lib.ks
 |--- types.ks          # Flat namespace
 |--- errors.ks         # Flat namespace
 |--- api/              # Nested namespace
     |--- users.ks
     |--- posts.ks
```

**`lib.ks`:**

```kintsu
namespace abc_corp;

use types;
use errors;
use api;

namespace config {
    #![version(1)]

    struct AppConfig {
        database: str,
    };
};
```

This creates:

- `abc_corp::types` (from `types.ks`)
- `abc_corp::errors` (from `errors.ks`)
- `abc_corp::api` (from `api/` directory)
- `abc_corp::config` (inline in `lib.ks`)

## Namespace Metadata

Each namespace can declare metadata:

```kintsu
#![version(1)]                          // Schema version
#![err(schema::errors::Error)]          // Default error type for operations
namespace api;

struct User {
    id: i64,
    name: str,
};
```

### `#![version(n)]`

Declares the schema version for this namespace. Used for compatibility tracking.

### `#![err(path::to::Error)]`

Sets the default error type namespace for operations in this namespace.

## Best Practices

### Small Packages

Use flat namespace files:

```txt
schema/
 |--- lib.ks
 |--- types.ks
 |--- errors.ks
```

### Medium Packages

Mix flat files and directories:

```txt
schema/
 |--- lib.ks
 |--- common.ks        # Shared types
 |--- api/              # API-specific types
     |--- v1.ks
     |--- v2.ks
```

### Large Packages

Use nested directories with clear organization:

```txt
schema/
 |--- lib.ks
 |--- types/
     |--- users.ks
     |--- posts.ks
     |--- comments.ks
 |--- api/
     |--- users.ks
     |--- posts.ks
     |--- admin.ks
 |--- errors/
     |--- auth.ks
     |--- validation.ks
```

## Imports and Visibility

All types defined in a namespace are public and accessible via imports:

```kintsu
// From external package
use abc_corp::types;

struct MyType {
    user: types::User,
};

// Or import specific types
use abc_corp::types::User;

struct MyType {
    user: User,
};
```

> [!NOTE]
> There is no concept of private types—all definitions in a namespace are part of the public API. Design your namespace structure carefully to reflect your intended API surface. Private APIs are best split into smaller packages which generate the private libraries / definitions at generation.

## Complete Example

**`schema.toml`:**

```toml
[package]
name = "abc-corp"
version = "1.0.0"
description = "ABC Corp schema definitions"
authors = []
```

**`schema/lib.ks`:**

```kintsu
namespace abc_corp;

use types;
use errors;
use api;

namespace internal {
    #![version(1)]
    type InternalId = i64;
};
```

**`schema/types.ks`:**

```kintsu
namespace types;

struct User {
    id: i64,
    name: str,
    email: str,
};
```

**`schema/errors.ks`:**

```kintsu
namespace errors;

enum ErrorCode {
    Unauthorized = 401,
    NotFound = 404,
    ServerError = 500
};

error AbcCorpError {
    UserNotFound { code: ErrorCode }
};
```

**`schema/api/users.ks`:**

```kintsu
#![version(1)]
#![err(schema::errors::AbcCorpError)]
namespace api;

use schema::types;

operation get_user(id: i64) -> types::User!;
```

This structure creates:

- Struct `abc_corp::types::User`
- Enum `abc_corp::errors::ErrorCode`
- Error `abc_corp::errors::AbcCorpError`
- Operation `abc_corp::api::get_user`
- Type alias `abc_corp::internal::InternalId`
