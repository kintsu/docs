---
title: "Builtins"
---

## Primitives

| Token  | Description                                         |
| :----- | :-------------------------------------------------- |
| `bool` | A boolean type (`true` or `false`).                 |
| `str`  | A UTF-8 string type.                                |
| `null` | The null/unit value. Represents absence of a value. |

## Integers

| Token   | Description                                                            |
| :------ | :--------------------------------------------------------------------- |
| `i8`    | Signed 8-bit integer (-128 to 127).                                    |
| `i16`   | Signed 16-bit integer (-32,768 to 32,767).                             |
| `i32`   | Signed 32-bit integer (-2^31 to 2^31-1).                               |
| `i64`   | Signed 64-bit integer (-2^63 to 2^63-1).                               |
| `u8`    | Unsigned 8-bit integer (0 to 255).                                     |
| `u16`   | Unsigned 16-bit integer (0 to 65,535).                                 |
| `u32`   | Unsigned 32-bit integer (0 to 2^32-1).                                 |
| `u64`   | Unsigned 64-bit integer (0 to 2^32-1).                                 |
| `usize` | Platform-native unsigned integer. Size depends on target architecture. |

## Floating Point

| Token     | Description                                      |
| :-------- | :----------------------------------------------- |
| `f16`     | 16-bit floating point number (half precision).   |
| `f32`     | 32-bit floating point number (single precision). |
| `f64`     | 64-bit floating point number (double precision). |
| `complex` | A complex number with real and imaginary parts.  |

## Special Types

| Token      | Description                                                                                     |
| :--------- | :---------------------------------------------------------------------------------------------- |
| `datetime` | An [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) compliant datetime string with timezone.  |
| `never`    | A unit type (0 size). Indicates a function never returns or a type that cannot be instantiated. |

## Binary Data

| Token    | Description                                                                                                    |
| :------- | :------------------------------------------------------------------------------------------------------------- |
| `binary` | A raw binary stream. Distinct from `[u8]` - may use language-specific types for efficient binary manipulation. |
| `base64` | A base64-encoded binary string. Useful for serialization contexts where raw binary is not supported.           |

## References

- [RFC-0001](/specs/rfc/RFC-0001) - Builtin Type System Design
- [TSY-0001](/specs/tsy/TSY-0001) - Builtin Types
- [SPEC-0001](/specs/spec/SPEC-0001) - Builtin Type Resolution
