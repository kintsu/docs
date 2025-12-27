---
title: "Keywords"
---

## Type Declaration Keywords

| Token       | Description                                                                          |
| :---------- | :----------------------------------------------------------------------------------- |
| `namespace` | Declares a namespace scope. Should precede an identifier.                            |
| `use`       | Imports types from another namespace. Should precede a namespace path.               |
| `struct`    | Declares a struct type with named fields.                                            |
| `enum`      | Declares an enumeration with named variants and optional discriminant values.        |
| `type`      | Declares a type alias.                                                               |
| `oneof`     | Declares a tagged union - a sequence of type variants or named enumeration of types. |
| `error`     | Declares an error type with variants (struct, tuple, or unit).                       |
| `operation` | Declares an operation (RPC method) with arguments and return type.                   |

## Reference Keywords

| Token    | Description                                                                             |
| :------- | :-------------------------------------------------------------------------------------- |
| `schema` | References types within the same package. Use `schema::path::Type` for self-references. |

## Literal Keywords

| Token  | Description                                                                  |
| :----- | :--------------------------------------------------------------------------- |
| `null` | The null literal, representing absence of a value. Used with nullable types. |

## References

- [RFC-0001](/specs/rfc/RFC-0001) - Builtin Type System Design
- [TSY-0001](/specs/tsy/TSY-0001) - Builtin Types
