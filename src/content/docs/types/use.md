---
title: "use"
---

Declares an import of types or namespaces from other locations. Use statements enable code reuse and modular organization by making external types available in the current namespace.

## Syntax

**Namespace import:**

```kintsu
namespace api;

use abc::types;  // Import entire namespace of external package
```

**Specific type import:**

```kintsu
namespace api;

use abc::types::User;
use abc::types::Config;
```

**Multiple items:**

```kintsu
namespace api;

use abc::types::{
    User,
    Config,
    Session
};
```

## Import Visibility

### Private Imports (Namespace Files)

Imports in a namespace are private to that namespace:

```kintsu
// api/handlers.ks
namespace api::handlers;

use abc::types::User;  // Private: only visible in api::handlers

operation handle(user: User) -> bool;
```

Types imported privately are not re-exported and cannot be accessed by other namespaces that import `api::handlers`.

### Public Imports (lib.ks)

Imports in `lib.ks` are public and re-exported:

```kintsu
// lib.ks
namespace myschema;

use foo;
use bar;
```

Public imports make the imported namespaces available to consumers of `myschema`. This is typically used to define the public API surface of a schema.

## Resolution Behavior

### Import Resolution Order

During compilation, imports are resolved after the namespace is parsed but before type definitions are processed. The compiler:

1. Parses all `use` statements
2. Resolves each import path to a namespace or type
3. Validates that the imported item exists
4. Makes the imported items available for type resolution

### Namespace Paths

Import paths follow the namespace hierarchy using `::` as a separator:

```kintsu
use root::sub::nested::Type;
```

This resolves to the type `Type` in namespace `root::sub::nested`.

### Cross-Schema Imports

Imports can reference types from other schemas (dependencies):

```kintsu
namespace myapp;

use external_pkg::types::User;
use other_schema::api::Request;
```

The compiler resolves cross-schema imports by:

1. Checking if the schema is listed in dependencies
2. Loading the dependency schema
3. Resolving the type within the dependency
4. Validating that the type exists

Dependencies must be declared in the schema manifest (`schema.toml`) before they can be imported.

### Import Validation

The compiler validates all imports during compilation:

**Missing package:**

```kintsu
use nonexistent::Type;  // ERROR: package 'nonexistent' not found
```

**Missing namespace:**

```kintsu
use abc::nonexistent::Missing;  // ERROR: namespace 'nonexistent' not found in 'abc'
```

**Missing type:**

```kintsu
use abc::types::Missing;  // ERROR: type 'Missing' not found in 'abc::types'
```

**Circular imports:**

The compiler detects circular dependencies between namespaces and reports an error. Circular imports prevent proper compilation ordering.

## Multiple Item Syntax

### Brace Syntax

Multiple items from the same namespace can be imported in a single statement:

```kintsu
use schema::types::{
    User,
    Config,
    Session,
    Token
};
```

This is equivalent to four separate `use` statements but more concise.

### Single Item Forms

Single items can be imported with or without braces:

```kintsu
// Without braces (preferred, formatted this way)
use schema::types::User;

// With braces (valid but will be formatted without)
use schema::types::{User};
```

The formatter removes unnecessary braces from single-item imports.

## Import Organization

### Namespace-Level Imports

Imports appear at the top of namespace files, after metadata attributes but before type definitions:

```kintsu
#![version(1)]
namespace api;

use abc::types::User;
use abc::errors::ApiError;

struct Request {
    user: User
};
```

### Import Grouping

The formatter organizes imports into groups:

1. External schema imports (from dependencies)
2. Internal schema imports (from same schema)

Within each group, imports are sorted alphabetically.

## Compilation

Import resolution happens early in compilation:

1. Parse `use` statements during namespace loading
2. Build namespace dependency graph based on imports
3. Resolve imports to actual namespaces/types
4. Validate all imports before type resolution begins

If any import fails to resolve, compilation stops and reports the error.

## Validation Rules

The compiler enforces:

- All imported namespaces must exist
- All imported types must exist in their namespaces
- Circular namespace dependencies are not allowed
- Imports must appear before type definitions
- Import paths must use valid namespace separators (`::`)
- Dependency schemas must be declared in schema manifest

> [!TIP]
>
> - Use brace syntax for multiple imports from the same namespace
> - Private imports (in `.ks` files) are namespace-scoped
> - Public imports (in `lib.ks`) re-export namespaces
> - Cross-schema imports require dependency declarations in schema manifest
