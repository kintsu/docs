---
title: "type"
---

Defines a named alias for an existing type using `type Name = <type>;`. Type aliases provide semantic names for complex types and improve code readability.

## Syntax

```kintsu
type Id = i64;
type Name = str;
type Timestamp = datetime;
type MaybeError = i64!;              // result type (may raise)
type Pair = oneof i32 | str;
type Combined = User & Permissions;  // union
type Items = (oneof i32 | f32)[];    // array of oneof
```

## Resolution Behavior

### Alias Resolution

During compilation, the compiler resolves all type aliases. Resolution is recursive: if an alias references another alias, the chain is followed until a concrete type is reached.

```kintsu
type A = i64;
type B = A;
type C = B;
```

Resolution chain: `C -> B -> A -> i64`

The final resolved type for `C` is `i64`.

### Circular Alias Detection

The compiler detects circular alias chains and reports an error:

```kintsu
// INVALID: circular alias
type A = B;
type B = A;  // ERROR: circular type alias
```

Circular aliases are detected during compilation and cause it to fail.

### Target Type Validation

The target type of an alias must resolve to a valid type. During compilation, the compiler ensures all type references are valid:

```kintsu
// INVALID: unknown type
type Invalid = UnknownType;  // ERROR: type 'UnknownType' not found
```

### Union Aliases

When a union is used as an alias target, the union is resolved into a struct and the alias name becomes the struct name:

```kintsu
type UserData = User & Permissions & Metadata;
```

After union resolution:

```kintsu
struct UserData {
    // Merged fields from User, Permissions, and Metadata
};
```

The generated struct uses the alias name directly.

### Anonymous Struct Aliases

When an anonymous struct is used as an alias target, the struct is extracted and named using the alias name:

```kintsu
type Point = {
    x: i32,
    y: i32
};
```

After extraction:

```kintsu
struct Point {
    x: i32,
    y: i32
};
```

This provides a 1:1 mapping between the alias name and the generated struct name.

### Primitive Aliases

Aliases can refer to primitive types, providing semantic names:

```kintsu
type UserId = i64;
type Email = str;
type Score = f64;
```

These aliases are resolved to their primitive targets. In generated code, some targets may inline the primitive type or preserve the alias name depending on language capabilities.

## Type Forms

Type aliases can reference any valid type expression:

**Builtins:**

- Integers: `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `u64`, `usize`
- Floats: `f16`, `f32`, `f64`, `complex`
- Other: `bool`, `str`, `binary`, `base64`, `datetime`, `null`, `never`

**Named Types:**

```kintsu
type UserRef = User;
```

**Oneof:**

```kintsu
type Value = oneof i32 | str | bool;
```

**Union:**

```kintsu
type Extended = Base & Mixin;
```

**Arrays:**

```kintsu
type Numbers = i32[];
type Buffer = u8[256];  // sized array
```

**Parentheses:**

```kintsu
type Complex = (oneof i32 | f32)[];
```

**Result Types:**

```kintsu
type Fallible = i64!;
```

Result types (with `!`) indicate operations that may fail and return an error.

## Compilation

Type aliases are resolved during compilation. The resolver:

1. Identifies all type alias definitions
2. Resolves the target type for each alias
3. Detects and reports circular alias chains
4. Stores resolved aliases in the namespace resolution

Resolved aliases are used during later stages to replace alias references with their concrete types.

## Validation Rules

The compiler enforces:

- Alias names must be unique within their namespace
- Target types must resolve to valid types
- Circular alias chains are not allowed
- Alias resolution must complete before union and error resolution

> [!TIP]
>
> - Parentheses are required when combining complex types with arrays: `(oneof A | B)[]`
> - Type aliases can simplify complex type expressions and improve code documentation
> - Union and anonymous struct aliases generate actual struct definitions
