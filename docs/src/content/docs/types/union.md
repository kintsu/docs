---
title: "union (|)"
---

Unions compose multiple named types with `&`, creating a merged struct containing all fields from the component types. When field names conflict, the leftmost definition wins.

## Syntax

```kintsu
type AuthUser = User & Permissions;

// with grouping
type AuditUser = User & (Admin & Audit);

// in type alias
type FullUser = User & Permissions & Metadata;

// in struct field
struct Request {
    auth: User & Permissions
};
```

## Resolution Behavior

### Field Merging

During compilation, the compiler merges all fields from the component types into a single struct. The merge follows left-to-right precedence:

```kintsu
struct Base {
    id: i64,
    version: i32,
    name: str
};

struct Extended {
    version: i32,  // Conflicts with Base.version
    description: str,
    tags: str[]
};

type Merged = Base & Extended;
```

After resolution, `Merged` contains:

```kintsu
struct Merged {
    id: i64,
    version: i32,      // From Base (leftmost wins)
    name: str,
    description: str,
    tags: str[]
}
```

The field `version` from `Extended` is ignored because `Base.version` appears first.

### Nested Unions

Parenthesized unions are resolved recursively. The compiler merges inner unions first, then merges the result:

```kintsu

struct A {
    x: i32,
    y: str,
    z: str // Conflict with B & C union, A wins
};
struct B {
    y: str
    z: i32,
};
struct C {
    z: bool // Conflict with B (B wins)
};

type Combined = A & (B & C);
```

Resolution steps:

1. Resolve inner union `(B & C)` → merge fields from B and C
2. Merge result with A
3. Generate final struct `Combined`

**Result:**

```kintsu
struct Combined {
    x: i32,
    y: str,
    z: str
}
```

### Multi-Way Unions

Unions with multiple operands are resolved left-to-right:

```kintsu
type Multi = A & B & C & D;
```

Resolution steps:

1. Merge A and B
2. Merge result with C
3. Merge result with D
4. Generate final struct

### Union Name Generation

The generated struct name depends on context:

**In type alias:**
Uses the alias name:

```kintsu
type UserData = User & Permissions;
// Generates: struct UserData { ... }
```

**In struct field:**
Uses context-based naming (parent struct + field name):

```kintsu
struct Request {
    auth: User & Permissions
};
// Generates: struct RequestAuth { ... }
```

**In oneof variant:**
Uses context + numeric suffix:

```kintsu
type Response = oneof (A & B) | (C & D);
// Generates: struct Response1 { ... }, struct Response2 { ... }
```

### Union Member Validation

Before merging, the compiler validates that all member types exist in the type registry. If a member type cannot be resolved, the union resolution fails:

```kintsu
// INVALID: Unknown type Bar
type Invalid = Foo & Bar;  // ERROR: type 'Bar' not found
```

All struct members must be registered before union resolution begins.

### Struct-Only Restriction

Only struct types can be merged. Unions with non-struct types are rejected:

```kintsu
// INVALID: cannot merge enum with struct
enum Status { Active, Inactive }
struct User { id: i64 }
type Invalid = User & Status;  // ERROR: cannot merge enum
```

The compiler validates member types during compilation and reports an error if non-struct types are found.

## Compilation

Union resolution happens during compilation:

1. **Union Identification:** The compiler identifies unions and determines their generated names based on context.
2. **Member Validation:** The compiler validates that all member types exist and are structs.
3. **Field Merging:** The compiler merges fields and generates the final struct definition. The generated struct is registered in the type registry.

## Validation Rules

The compiler enforces:

- All union member types must exist in the type registry
- All union member types must be structs
- Field name conflicts are resolved by left-to-right precedence
- Generated struct names must be unique within their namespace

> [!TIP]
>
> - Each side is an identifier or a parenthesized union.
> - `&` binds left-to-right; use parentheses to control grouping.
> - Only ONE struct declaration is generated for the entire union expression.
