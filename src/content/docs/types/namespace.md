---
title: "namespace"
---

Declares a namespace, which serves as a logical container for type definitions and operations. Namespaces organize code and prevent name collisions.

## Syntax

**File-level namespace:**

```kintsu title="foo/bar.ks"
namespace foo;

struct Item {
    id: i64,
};

operation get_item(id: i64) -> Item;
```

**Block-scoped namespace:**

```kintsu
namespace foo {
    type Id = i64;

    struct Item {
        id: Id
    };
};
```

## Namespace Hierarchy

### Nested Namespaces

Namespaces can be nested to create hierarchical organization:

```kintsu
namespace company;

namespace api {
    struct Request {
        foo: i32
    };

    namespace v1 {
        operation handle(req: schema::api::Request) -> bool;
    };
};
```

### Namespace Resolution

During compilation, namespaces are processed in dependency order based on their import relationships. The compiler:

1. Loads all namespace files
2. Builds a dependency graph based on `use` statements
3. Processes namespaces in topological order
4. Validates that all imported namespaces exist

### Namespace Compilation Order

Within a schema, namespaces are compiled using breadth-first search by depth level. All namespaces at depth 0 (root level) are compiled first, then depth 1, and so on.

Within each depth level, namespaces are processed in parallel. This ensures dependencies are satisfied before dependents are compiled.

## Namespace Metadata

### Inner Metadata

Inner metadata attributes apply to all items within the namespace:

```kintsu
#![version(2)]
#![err(DefaultError)]
namespace api;

error DefaultError {
    Unknown
};

// All operations inherit version and error metadata
operation process() -> i64!;  // Uses DefaultError
```

Inner metadata uses `#![...]` syntax at the top of the namespace.

### Outer Metadata

Outer metadata applies to the namespace definition itself:

```kintsu
#[version(1)]
namespace legacy;
```

Outer metadata uses `#[...]` syntax before the namespace declaration.

### Metadata Inheritance

Items within a namespace inherit namespace-level metadata unless overridden:

```kintsu
#![err(DefaultError)]
#![version(1)]
namespace api;

error DefaultError {
    Unknown {
        code: i32
    }
};

error SpecificError {
    Failed {
        cause: str
    }
};

// Inherits DefaultError from namespace
operation task1() -> i64!;

// Overrides with SpecificError
#[err(SpecificError)]
operation task2() -> str!;

// Overrides version
#[version(2)]
struct NewFeature {
    id: i64,
    enabled: bool
};
```

## Type Resolution

Type resolution processes each namespace through several stages during compilation:

1. **Anonymous Struct Extraction** - Extract inline anonymous structs
2. **Union Identification** - Identify union type expressions
3. **Type Alias Resolution** - Resolve type alias chains
4. **Union Validation** - Validate union member types exist
5. **Union Resolution** - Merge union fields into structs
6. **Version Resolution** - Resolve version metadata
7. **Error Resolution** - Resolve operation error types
8. **Reference Validation** - Validate all type references

These stages run sequentially for each namespace. Namespaces at the same depth level are processed in parallel.

## Namespace Children

Namespaces contain named items (children):

- `struct` definitions
- `enum` definitions
- `error` definitions
- `oneof` definitions (if declared with names)
- `type` aliases
- `operation` definitions
- Nested `namespace` definitions

All children must have unique names within their namespace:

```kintsu del={8-11}
namespace api;

struct User {
    id: i64
};

// INVALID: duplicate name
struct User {
    name: str
};  // ERROR: 'User' already defined
```

## Import Resolution

Namespaces can import types from other namespaces using `use` statements:

```kintsu
namespace api;

use common::types::User;
use common::errors::ApiError;

operation get_user(id: i64) -> User;
```

The compiler validates that all imported namespaces and types exist during compilation.

## Validation Rules

The compiler enforces:

- Namespace names must be unique within their parent namespace
- Child item names must be unique within the namespace
- Circular namespace dependencies are not allowed (detected via import graph)
- All imported namespaces must exist
- Inner metadata must appear before any items
- Outer metadata must appear before the namespace declaration

> [!TIP]
>
> - Use nested namespaces to organize related types hierarchically
> - Inner metadata (`#![...]`) sets defaults for all items in the namespace
> - Namespaces are compiled in dependency order, with parallelism at each depth level
