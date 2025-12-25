---
title: "oneof"
---

Represents a discriminated union value that may be one of several types. Kintsu supports two forms: anonymous oneofs with pipe-separated types, and named oneofs with explicitly named variants.

## Syntax

### Anonymous Oneof (Type Alias)

Anonymous oneofs use the pipe `|` separator to define variant types:

```kintsu
// Anonymous oneof in type alias
type Value = oneof i32 | str | bool;

// In struct field
struct Record {
    data: oneof i32 | f32 | str
};

// With arrays (requires parentheses)
type Numbers = (oneof i32 | f32)[];

// With named types
type Response = oneof Success | Error;

// Complex variants with anonymous structs
type Complex = oneof { id: i64 } | str | i32;
```

### Named Oneof (Explicit Variants)

Named oneofs declare an explicit type with named variants, similar to error types:

```kintsu
oneof ComplexOneOf {
    FormA(i32),
    FormB {
        desc: str
    }
};
```

**Variant forms:**

- **Tuple variant:** `VariantName(Type)` - wraps an existing type
- **Struct variant:** `VariantName { field: Type }` - inline anonymous struct

## Resolution Behavior

### Variant Ordering

Variants are parsed in order and preserved. The order determines the discriminant values used in generated code:

```kintsu
type Status = oneof Active | Pending | Completed;
// Variant 0: Active
// Variant 1: Pending
// Variant 2: Completed
```

### Anonymous Struct Variants

Anonymous struct definitions in oneof variants are extracted during compilation and given generated names:

```kintsu
type Response = oneof {
    success: bool,
    data: str
} | {
    error: str,
    code: i32
};
```

After extraction:

```kintsu
struct Response1 {
    success: bool,
    data: str
};

struct Response2 {
    error: str,
    code: i32
};

type Response = oneof Response1 | Response2;
```

Variants are numbered sequentially starting from 1.

### Union Variants

Oneof variants can contain union expressions. Each union is resolved into a struct before the oneof is finalized:

```kintsu
type Data = oneof (Base & Extensions) | (Alt & More);
```

Resolution steps:

1. Resolve union `(Base & Extensions)` -> generates `Data1`
2. Resolve union `(Alt & More)` -> generates `Data2`
3. Final oneof: `oneof Data1 | Data2`

### Nested Oneof

Oneof types can be nested using parentheses:

```kintsu
type Nested = oneof i32 | (oneof str | bool);
```

The inner oneof is treated as a single variant. In generated code, this typically flattens to three variants, but the structure is preserved in the type system.

### Type Reference Validation

During compilation, the compiler validates that all named types in oneof variants exist:

```kintsu del={2}
// INVALID: Unknown type
type Invalid = oneof Foo | Bar;  // ERROR: types 'Foo' and 'Bar' not found
```

All variant types must resolve to valid types in the type registry.

### Primitive vs Named Types

Oneof variants can mix primitive types and named types:

```kintsu
struct CustomData {
    value: i64,
    label: str
};

type Mixed = oneof i32 | str | CustomData;
```

Both primitives and custom types are valid variants.

## Compilation

Oneof resolution happens during compilation:

1. **Anonymous Struct Extraction:** Extracts anonymous struct variants into named structs.
2. **Union Identification:** Identifies union variants and determines their names.
3. **Union Resolution:** Resolves union variants into merged structs.
4. **Reference Validation:** Validates that all variant types exist.

## Array Combinations

When combining oneof with arrays, parentheses are required to disambiguate:

```kintsu
// Array of oneof values
type Values = (oneof i32 | str)[];

// Without parens, this would be: oneof of i32, or array of str
// INVALID syntax: oneof i32 | str[]
```

The parentheses make the precedence explicit.

## Validation Rules

The compiler enforces:

- All variant types must resolve to valid types
- Trailing pipes are not allowed: `oneof A | B |` is invalid
- At least two variants are required: `oneof A` is invalid
- Variants are preserved in declaration order
- Parentheses are required when combining with arrays or other type constructors

> [!TIP]
>
> - Variants are parsed in order and preserved; trailing pipes aren't allowed.
> - Parentheses group complex variants when combining with arrays or other constructs.
> - Anonymous structs and unions in variants are automatically extracted and named.
