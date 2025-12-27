---
title: "enum"
---

Enums declare a named set of variants. Variants may be bare or have a static value.

Syntax:

```kintsu
enum Color {
	Red, // 0
	Green, // 1
	Blue, // 2
};

// explicit values
enum CookiePreference {
    OptOut = 0,
    RequiredOnly = 1,
    All = 2,
};

// string values
enum Status {
    Requested = "R",
    Pending = "P",
    Completed = "C",

    Rejected = "X"
};
```

## Resolution Behaviour

### Variant Value Inference

If no explicit values are provided, the compiler assigns sequential integer values starting from 0:

```kintsu
enum Priority {
    Low,     // 0
    Medium,  // 1
    High     // 2
};
```

### Explicit Value Types

Enums support two value types:

- **Integer enums**: Variants have integer values (`i64`)
- **String enums**: Variants have string values (`str`)

The enum's value type is inferred from its first explicitly valued variant. If no explicit values are given, the enum defaults to integer type.

```kintsu
// Integer enum (explicit)
enum HttpStatus {
    Ok = 200,
    NotFound = 404,
    ServerError = 500
};

// String enum
enum Role {
    Admin = "admin",
    User = "user",
    Guest = "guest"
};
```

### Value Type Validation

All variants in an enum must have the same value type. Mixing integers and strings is rejected:

```kintsu del={1,4}
// INVALID: mixed value types
enum Mixed {
    First = 1,
    Second = "two"  // ERROR: inconsistent value type
};
```

The compiler checks value type consistency during parsing and reports an error if mixed types are detected.

### Variant Name Uniqueness

Variant names must be unique within the enum:

```kintsu del={1,5}
// INVALID: duplicate variant name
enum Status {
    Active,
    Inactive,
    Active  // ERROR: duplicate variant 'Active'
};
```

### Explicit Value Uniqueness

Explicit values should be unique within the enum, though the compiler does not enforce this as an error (some use cases intentionally use aliases). However, duplicate values may cause issues in generated code depending on the target language.

```kintsu
// Valid but potentially problematic
enum Alias {
    Primary = 1,
    Secondary = 1  // Same value as Primary
};
```

## Compilation

Enums are registered in the type registry during compilation. They can be referenced by other types:

```kintsu
enum Status {
    Active,
    Inactive
};

struct User {
    id: i64,
    name: str,
    status: Status
};
```

The compiler validates that the enum `Status` exists when compiling the `User` struct.

## Validation Rules

The compiler enforces:

- Variant names must be unique within the enum
- All explicit values must have the same type (all integers or all strings)
- Enum names must be unique within their namespace
- Enum types can be used in struct fields, operation parameters, and return types

> [!TIP]
>
> - Variants are separated by commas, trailing comma allowed.
> - Values can be integers or strings; the enum's kind is inferred from its variants.
> - Value types must be contiguous across the same enum (i.e. all numbers or all strings).

## References

- [RFC-0004](/specs/rfc/RFC-0004) - Enum Type Design
- [TSY-0004](/specs/tsy/TSY-0004) - Enum Types
- [SPEC-0004](/specs/spec/SPEC-0004) - Enum Compilation
