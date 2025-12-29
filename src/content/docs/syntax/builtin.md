---
title: "Builtins"
---

## Primitives

| Token  | Description          |
| :----- | :------------------- | ------- |
| `bool` | A boolean type (true | false). |
| `str`  | A string type.       |

## Integers

| Token | Description              |
| :---- | :----------------------- |
| `i8`  | Signed 8-bit integer.    |
| `i16` | Signed 16-bit integer.   |
| `i32` | Signed 32-bit integer.   |
| `i64` | Signed 64-bit integer.   |
| `u8`  | Unsigned 8-bit integer.  |
| `u16` | Unsigned 16-bit integer. |
| `u32` | Unsigned 32-bit integer. |
| `u64` | Unsigned 64-bit integer. |

## Floating Point

| Token     | Description                                                             |
| :-------- | :---------------------------------------------------------------------- | -------- |
| `f16`     | A signed 16-bit floating point number.                                  |
| `f32`     | A signed 32-bit floating point number.                                  |
| `f64`     | A signed 64-bit floating point number.                                  |
| `f8`      | 8-bit minifloat (requires #[form(e4m3                                   | e5m2)]). |
| `complex` | A complex number with real and imaginary parts (requires #[form(...)]). |

## Special Types

| Token      | Description                                                                                 |
| :--------- | :------------------------------------------------------------------------------------------ |
| `datetime` | A [iso 8601](https://en.wikipedia.org/wiki/ISO_8601) compliant datetime providing timezone. |
| `date`     | ISO 8601 date (YYYY-MM-DD).                                                                 |
| `week`     | ISO 8601 week (YYYY-Www).                                                                   |
| `never`    | A unit type (0 size).                                                                       |

## Binary Data

| Token    | Description                                                                                                                                  |
| :------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `binary` | A binary stream. this is distinct from u8[], where we may have language specific types to utilize if you intend to manipulate octal streams. |

## References

- [RFC-0001](/specs/rfc/RFC-0001) - Builtin Type System Design
- [TSY-0001](/specs/tsy/TSY-0001) - Builtin Types
- [SPEC-0001](/specs/spec/SPEC-0001) - Builtin Type Resolution
