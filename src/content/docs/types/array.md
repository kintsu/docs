---
title: "array"
---

Arrays represent ordered collections of homogeneous elements. Arrays can be unsized (dynamic length) or sized (fixed length with compile-time known size).

## Unsized Arrays

Unsized arrays are denoted by `[]` tokens after a type. They represent dynamically-sized collections with no compile-time length constraint.

```kintsu
type StrArr = str[];
type Numbers = i32[];

struct Data {
    items: Item[],
    tags: str[]
};
```

In generated code, unsized arrays typically map to language-specific dynamic arrays or lists (e.g., `Vec<T>` in Rust, `List<T>` in C#, `Array<T>` in TypeScript).

## Sized Arrays

Sized arrays are denoted by `[n]` tokens where `n` is a positive integer literal. They represent fixed-size collections with compile-time known length.

```kintsu
type Buffer = u8[256];
type Header = u8[16];
type Matrix = f32[9];  // 3x3 matrix flattened

struct Packet {
    header: u8[16],
    payload: u8[]
};
```

The size must be a compile-time constant integer. Variable-length expressions are not supported.

## Resolution Behaviour

### Element Type Validation

During compilation, the compiler validates that array element types resolve to valid types:

```kintsu
type Items = Item[];  // Item must exist
```

If the element type cannot be resolved, compilation fails.

### Nested Arrays

Arrays can be nested to create multi-dimensional collections:

```kintsu
type Matrix = i32[][];        // Array of arrays
type Grid = Cell[10][10];     // 10x10 fixed grid
type Mixed = Data[][100];     // Array of fixed-size arrays
```

Each `[]` or `[n]` suffix adds one dimension. The innermost type is the element type.

### Array of Complex Types

Arrays can contain any valid type, including structs, enums, unions, and oneof:

```kintsu
struct Item {
    id: i64,
    name: str
};

type Items = Item[];

type Values = (oneof i32 | str)[];

type Combined = (Base & Extensions)[];
```

When the element type is complex (union, oneof, anonymous struct), parentheses may be required to disambiguate:

```kintsu
// Correct: array of oneof
type Data = (oneof A | B)[];

// Without parens, this is: oneof of A, or array of B
// INVALID: oneof A | B[]
```

### Recursive Arrays

Arrays provide a terminating path for recursive types. A struct can contain an array of itself:

```kintsu
struct Tree {
    value: i32,
    children: Tree[]  // Valid: empty array terminates recursion
};
```

The empty array provides the base case for recursion, allowing the compiler to accept this definition.

## Array Size Semantics

### Size Validation

Array sizes must be positive integers:

```kintsu del={4-5}
type Valid = u8[128];

// INVALID: size must be positive
type Invalid = u8[0];      // ERROR: size must be > 0
type Invalid2 = u8[-5];    // ERROR: size must be positive
```

The compiler validates size values during parsing.

### Size Metadata

Sized array length information is preserved in the type system and passed to code generators. However, not all target languages support compile-time size enforcement.

**Rust:**
May use `[T; N]` arrays for exact size enforcement.

**TypeScript:**
May use tuples `[T, T, T]` for small sizes or regular arrays `T[]` with documentation.

**Python:**
Arrays are typically dynamic; size is included in documentation/validation code.

**C#:**
May use fixed-size arrays `T[N]` or regular arrays with validation.

The compiler includes size metadata in the generated type definitions, allowing code generators to make appropriate decisions for each target language.

## Compilation

Array types are processed during compilation:

1. **Anonymous Struct Extraction:** If array elements are anonymous structs, they are extracted and named.
2. **Union Resolution:** If array elements are unions, they are resolved into structs.
3. **Reference Validation:** Element types are validated to ensure they resolve to valid types.

## Validation Rules

The compiler enforces:

- Array element types must resolve to valid types
- Sized array dimensions must be positive integers
- Array syntax requires proper parentheses when combining with complex types
- Recursive array references are allowed (arrays provide termination)

> [!CAUTION]
> Some generation targets may not support exact sizing - we will pass the metadata wherever possible but due to the constraints of certain languages this is not always type-enforced
